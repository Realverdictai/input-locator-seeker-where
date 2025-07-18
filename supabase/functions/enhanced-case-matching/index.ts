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
  injuryTypes?: string[];
  liabPct: string;
  accType: string;
  polLim: string;
  medicalSpecials?: number;
  age?: number;
  narrative?: string;
  tbiSeverity?: number; // 1-10 scale, side with defense scoring
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

    // Step 2: Get data-driven case matches using all 313 cases
    const dataMatches = getDataDrivenMatches(caseInput, cases || []);
    
    // Step 3: Use AI to analyze the matched cases and provide specific settlement prediction
    const aiMatchingPrompt = `
You are a conservative insurance defense attorney analyzing personal injury cases based on ACTUAL settlement data from 313 real cases.

CRITICAL INSTRUCTIONS:
1. Be REALISTIC about TBI claims - most are overblown by plaintiffs. Side with defense perspective on TBI severity.
2. Cases rarely settle OVER policy limits unless there are extreme circumstances.
3. For $250,000 policies with TBI + 3 injections - typical settlements are $180,000-$220,000, NOT over policy limits.
4. Give a SPECIFIC settlement number with a narrow range of $25,000-$50,000.
5. Focus on MEDICAL TREATMENT PATTERNS from the data, not just claimed injuries.

NEW CASE:
- Policy Limits: ${caseInput.polLim}
- Surgery: ${caseInput.surgery}
- Injuries: ${caseInput.injuries}
- Liability: ${caseInput.liabPct}%
- TBI Severity (if claimed): ${caseInput.tbiSeverity || 'Not specified'}/10 (defense perspective)
- Medical Specials: $${caseInput.medicalSpecials || 'Not specified'}
- Treatment Summary: ${caseInput.narrative || 'Not provided'}

MOST SIMILAR HISTORICAL CASES:
${dataMatches.slice(0, 10).map(c => 
`Case ${c.case_id}: ${c.injuries} | Surgery: ${c.surgery} | Settlement: ${c.settle} | Policy: ${c.pol_lim}
Treatment Details: ${c.narrative?.substring(0, 300)}...
`).join('\n')}

ANALYZE THE PATTERN FROM THESE ACTUAL CASES:
1. What do similar cases with comparable treatment actually settle for?
2. How does injury severity affect settlements in the data?
3. What's the relationship between medical specials and actual settlements?
4. Are there policy limit considerations?

Provide SPECIFIC settlement prediction with narrow range based on the ACTUAL data patterns above.

JSON Response Format:
{
  "specific_settlement": number,
  "settlement_range_low": number,
  "settlement_range_high": number,
  "confidence": number,
  "exceeds_policy_risk": number,
  "key_case_matches": [
    {
      "case_id": number,
      "settlement_amount": number,
      "similarity_reason": "string"
    }
  ],
  "value_factors": {
    "increasing": ["factor1", "factor2"],
    "decreasing": ["factor1", "factor2"]
  },
  "reasoning": "data-driven explanation based on actual settlement patterns"
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
            content: 'You are a conservative insurance defense attorney with 20+ years of experience. You know that most plaintiff TBI claims are exaggerated and that cases rarely exceed policy limits. Be realistic and data-driven based on actual settlement patterns.' 
          },
          { role: 'user', content: aiMatchingPrompt }
        ],
        temperature: 0.2, // Very low temperature for consistent, conservative analysis
      }),
    });

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    // Step 4: Calculate policy exceedance risk
    const policyLimit = extractPolicyLimit(caseInput.polLim);
    const exceedanceRisk = calculatePolicyRisk(analysis.specific_settlement, policyLimit);
    
    // Step 5: Generate final recommendation
    const finalRecommendation = {
      settlement_recommendation: analysis.specific_settlement,
      settlement_range_low: analysis.settlement_range_low,
      settlement_range_high: analysis.settlement_range_high,
      confidence_score: analysis.confidence,
      policy_exceedance_risk: exceedanceRisk,
      top_comparable_cases: analysis.key_case_matches,
      value_factors: analysis.value_factors,
      reasoning: analysis.reasoning,
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

function getDataDrivenMatches(input: CaseInput, cases: DatabaseCase[]): DatabaseCase[] {
  // Smart matching based on actual case patterns
  const scoredCases = cases.map(dbCase => {
    let score = 0;

    // Surgery match (high weight - surgery is a major factor)
    if (input.surgery && dbCase.surgery) {
      if (input.surgery.toLowerCase() === dbCase.surgery.toLowerCase()) {
        score += 200;
      } else if (input.surgery.toLowerCase() !== 'none' && dbCase.surgery.toLowerCase() !== 'none') {
        score += 100; // Both have surgery, different types
      }
    }

    // Injury pattern matching (high weight)
    if (input.injuries && dbCase.injuries) {
      const inputTypes = (input.injuryTypes && input.injuryTypes.length > 0)
        ? input.injuryTypes.map(i => i.toLowerCase())
        : input.injuries.toLowerCase().split(/[,;]/).map(w => w.trim());
      const dbTypes = dbCase.injuries.toLowerCase().split(/[,;]/).map(w => w.trim());

      // Direct injury type matches
      const directOverlap = inputTypes.filter(t => dbTypes.includes(t));
      score += directOverlap.length * 200;

      const inputWords = input.injuries.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const dbWords = dbCase.injuries.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      
      // TBI/brain injury special handling
      const inputHasTBI = /tbi|brain|concussion|head|traumatic/i.test(input.injuries);
      const dbHasTBI = /tbi|brain|concussion|head|traumatic/i.test(dbCase.injuries || '');
      if (inputHasTBI && dbHasTBI) {
        score += 150;
      }
      
      // Injection pattern matching
      const inputInjections = extractInjectionCount(input.narrative || '');
      const dbInjections = extractInjectionCount(dbCase.narrative || '');
      if (inputInjections > 0 && dbInjections > 0) {
        score += Math.min(inputInjections, dbInjections) * 30;
      }
      
      // General injury overlap
      const overlap = inputWords.filter(w => dbWords.some(dw => dw.includes(w) || w.includes(dw)));
      score += (overlap.length / Math.max(inputWords.length, 1)) * 75;
    }

    // Policy limit matching (moderate weight)
    if (input.polLim && dbCase.pol_lim) {
      const inputLimit = extractPolicyLimit(input.polLim);
      const dbLimit = extractPolicyLimit(dbCase.pol_lim);
      if (inputLimit && dbLimit && Math.abs(inputLimit - dbLimit) < 50000) {
        score += 75;
      }
    }

    // Liability percentage (low weight - as user specified venue doesn't matter much)
    if (input.liabPct && dbCase.liab_pct) {
      const inputLiab = parseInt(input.liabPct);
      const dbLiab = parseInt(dbCase.liab_pct);
      if (!isNaN(inputLiab) && !isNaN(dbLiab) && Math.abs(inputLiab - dbLiab) < 20) {
        score += 25;
      }
    }

    return { ...dbCase, score };
  }).sort((a, b) => b.score - a.score);

  return scoredCases.slice(0, 15);
}

function extractInjectionCount(narrative: string): number {
  if (!narrative) return 0;
  const injectionMatches = narrative.match(/(\d+)\s*(injection|ESI|epidural|steroid)/gi);
  if (injectionMatches) {
    return injectionMatches.reduce((total, match) => {
      const num = parseInt(match.match(/\d+/)?.[0] || '0');
      return total + num;
    }, 0);
  }
  return 0;
}

function extractPolicyLimit(polLim: string): number {
  if (!polLim) return 0;
  const match = polLim.match(/\$?([\d,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''));
  }
  return 0;
}

function calculatePolicyRisk(settlementAmount: number, policyLimit: number): number {
  if (!policyLimit || policyLimit === 0) return 0;
  
  const ratio = settlementAmount / policyLimit;
  
  if (ratio < 0.5) return 5;  // Very low risk
  if (ratio < 0.7) return 15; // Low risk
  if (ratio < 0.85) return 35; // Moderate risk
  if (ratio < 0.95) return 60; // High risk
  if (ratio < 1.0) return 85;  // Very high risk
  return 95; // Exceeds policy limits
}