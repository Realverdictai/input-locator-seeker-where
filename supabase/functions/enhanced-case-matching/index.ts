import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CaseInput {
  venue: string;
  surgery: string;
  injuries: string;
  liabPct: string;
  accType: string;
  polLim: string;
  medicalSpecials?: number;
  age?: number;
  narrative?: string;
}

interface DatabaseCase {
  case_id: number;
  venue: string | null;
  surgery: string | null;
  injuries: string | null;
  liab_pct: string | null;
  acc_type: string | null;
  settle: string | null;
  narrative: string | null;
  pol_lim: string | null;
}

interface EnhancedCaseMatch {
  case_id: number;
  settlement_amount: number;
  similarity_score: number;
  ai_confidence: number;
  reasoning: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const caseInput: CaseInput = await req.json();

    // Step 1: Get all cases from database
    const { data: cases, error } = await supabase
      .from('cases_master')
      .select(`
        case_id,
        venue,
        surgery,
        injuries,
        liab_pct,
        acc_type,
        settle,
        narrative,
        pol_lim
      `);

    if (error) throw error;

    // Step 2: Use AI to enhance case matching
    const aiMatchingPrompt = `
You are an expert legal case analyst. I need you to analyze a new personal injury case against a database of 313 historical cases and provide intelligent matching with settlement predictions.

NEW CASE:
- Venue: ${caseInput.venue}
- Surgery: ${caseInput.surgery}
- Injuries: ${caseInput.injuries}
- Liability: ${caseInput.liabPct}
- Accident Type: ${caseInput.accType}
- Policy Limits: ${caseInput.polLim}
- Medical Specials: $${caseInput.medicalSpecials || 'Not specified'}
- Plaintiff Age: ${caseInput.age || 'Not specified'}
- Case Narrative: ${caseInput.narrative || 'Not provided'}

HISTORICAL CASES (Top 25 most relevant):
${cases?.slice(0, 25).map(c => `
Case ${c.case_id}: Venue: ${c.venue}, Surgery: ${c.surgery}, Injuries: ${c.injuries}, 
Liability: ${c.liab_pct}, Accident: ${c.acc_type}, Settlement: ${c.settle}
Narrative: ${c.narrative?.substring(0, 200)}...`).join('\n')}

Please provide:
1. The 5 most similar cases with similarity scores (0-100)
2. A predicted settlement range based on these cases
3. Key factors that increase/decrease value
4. Confidence level in your analysis (0-100)
5. Any adjustments needed for current market conditions

Format your response as JSON with this structure:
{
  "top_matches": [
    {
      "case_id": number,
      "similarity_score": number,
      "settlement_amount": number,
      "key_similarities": ["reason1", "reason2"]
    }
  ],
  "predicted_settlement": {
    "amount": number,
    "range_low": number,
    "range_high": number
  },
  "value_factors": {
    "increasing": ["factor1", "factor2"],
    "decreasing": ["factor1", "factor2"]
  },
  "confidence": number,
  "reasoning": "detailed explanation"
}`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert personal injury case analyst with deep knowledge of settlement patterns, jury verdicts, and valuation factors. Provide precise, data-driven analysis.' 
          },
          { role: 'user', content: aiMatchingPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
      }),
    });

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    // Step 3: Combine AI analysis with traditional scoring
    const traditionalScore = calculateTraditionalScore(caseInput, cases || []);
    
    // Step 4: Generate final recommendation
    const finalRecommendation = {
      settlement_recommendation: analysis.predicted_settlement.amount,
      confidence_score: analysis.confidence,
      top_comparable_cases: analysis.top_matches,
      value_factors: analysis.value_factors,
      reasoning: analysis.reasoning,
      traditional_score_validation: traditionalScore,
      source_case_count: cases?.length || 0
    };

    return new Response(JSON.stringify(finalRecommendation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enhanced case matching:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      settlement_recommendation: 0,
      confidence_score: 0 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateTraditionalScore(input: CaseInput, cases: DatabaseCase[]): any {
  // Keep the traditional scoring as a validation/fallback
  const scoredCases = cases.map(dbCase => {
    let score = 0;

    // Venue match
    if (input.venue && dbCase.venue && input.venue.toLowerCase() === dbCase.venue.toLowerCase()) {
      score += 100;
    }

    // Surgery match
    if (input.surgery && dbCase.surgery && input.surgery.toLowerCase() === dbCase.surgery.toLowerCase()) {
      score += 50;
    }

    // Injury overlap
    if (input.injuries && dbCase.injuries) {
      const inputWords = input.injuries.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const dbWords = dbCase.injuries.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const overlap = inputWords.filter(w => dbWords.some(dw => dw.includes(w) || w.includes(dw)));
      score += (overlap.length / Math.max(inputWords.length, 1)) * 25;
    }

    return { ...dbCase, score };
  }).sort((a, b) => b.score - a.score).slice(0, 5);

  return {
    top_traditional_matches: scoredCases.map(c => ({
      case_id: c.case_id,
      score: c.score,
      settlement: c.settle
    }))
  };
}
