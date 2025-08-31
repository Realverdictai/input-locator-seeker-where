import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stepTitle, stepNumber, totalSteps, userType, formData } = await req.json();
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const parsedFormData = formData ? JSON.parse(formData) : {};
    
    const systemPrompt = `You are Judge Iskander, a retired attorney with decades of experience who has evaluated hundreds of thousands of personal injury cases throughout your career. You possess deep technical legal knowledge and speak with the authority of someone who has seen every variation of case strategy and outcome.

Your approach:
- Technically proficient with comprehensive knowledge of personal injury law
- Understanding and respectful of both plaintiff and defense positions
- Analytical and measured - you work only with the information provided
- Never speculate about future steps or jump to premature conclusions
- Provide practical, experience-based guidance grounded in legal reality
- Speak as a seasoned practitioner who understands case dynamics and settlement patterns

Current context:
- Step: ${stepTitle} (${stepNumber} of ${totalSteps})
- User type: ${userType}
- Form data: ${JSON.stringify(parsedFormData, null, 2)}

IMPORTANT: You are providing REAL-TIME commentary as the user fills out fields. If form data has been entered, comment specifically on what they've entered and provide contextual advice about those values. If fields are empty, provide general step guidance.

When form data is present, focus on:
1. Commenting on specific values they've entered (amounts, dates, selections, etc.)
2. How these values impact settlement strategy
3. Whether the values seem reasonable/concerning from a settlement perspective
4. Practical next steps based on what they've filled out

Provide specific, actionable advice for this current step "${stepTitle}". Focus on:
1. Acknowledging the user's perspective (plaintiff/defense/insurance)
2. Offering practical guidance for completing THIS SPECIFIC step effectively
3. Connecting this step to overall settlement strategy
4. Using encouraging, professional tone
5. Keeping response to 2-3 sentences maximum

Key step guidance:
- "Settlement Position": Focus on strategy, bottom lines, authority limits
- "Parties": Focus on complexity of multiple parties
- "Case Category": Focus on case type selection
- "Liability & Impact": NOW you can discuss liability percentages and fault
- Other steps: Focus on their specific content

Remember: You're guiding them toward settlement, not litigation.`;

    const userPrompt = `Please provide advice for the "${stepTitle}" step for a ${userType.replace('_', ' ')}. This is step ${stepNumber} of ${totalSteps} in the case evaluation process.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const advice = data.choices[0].message.content;

    return new Response(JSON.stringify({ advice }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-mediator-advice function:', error);
    
    // Fallback advice based on user type and step
    const fallbackAdvice = getFallbackAdvice(stepTitle, userType);
    
    return new Response(JSON.stringify({ 
      advice: fallbackAdvice,
      error: 'Using fallback advice due to API error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getFallbackAdvice(stepTitle: string, userType: string): string {
  const adviceMap: Record<string, Record<string, string>> = {
    "Upload Documents": {
      plaintiff_lawyer: "Document quality and organization significantly impact case valuation. Medical records, wage statements, and expert reports form the evidentiary foundation for settlement negotiations.",
      defense_lawyer: "Thorough document review reveals case strengths and weaknesses early. Look for gaps in causation, pre-existing conditions, and inconsistencies in medical treatment patterns.",
      insurance_company: "Document analysis drives accurate reserve setting. Focus on medical necessity, treatment duration, and objective findings to assess exposure parameters."
    },
    "Parties": {
      plaintiff_lawyer: "Multiple plaintiff cases require coordinated settlement strategies. Consider apportionment of damages and potential conflicts in settlement timing and amounts.",
      defense_lawyer: "Multi-defendant scenarios create allocation opportunities. Joint defense agreements and coordinated discovery can reduce individual client exposure.",
      insurance_company: "Complex party structures affect coverage analysis and settlement authority. Evaluate contribution claims and cross-claims when setting reserves."
    },
    "Settlement Position": {
      plaintiff_lawyer: "Settlement authority should reflect case value analysis, client objectives, and risk tolerance. Establish clear parameters for negotiation flexibility.",
      defense_lawyer: "Adequate settlement authority prevents missed resolution opportunities. Consider liability exposure, damages analysis, and litigation costs in authority calculations.",
      insurance_company: "Settlement authority must account for coverage limits, bad faith exposure, and cost of defense. Timely evaluation prevents escalating damages."
    },
    "Case Category": {
      plaintiff_lawyer: "Case categorization drives damages calculations and venue selection. Ensure your theory aligns with available evidence and applicable law.",
      defense_lawyer: "Understanding plaintiff's case theory enables targeted discovery and motion practice. Early case categorization informs settlement range analysis.",
      insurance_company: "Accurate case typing is essential for proper reserving and coverage analysis. Historical settlement data for similar cases guides evaluation."
    },
    "Liability & Impact": {
      plaintiff_lawyer: "Liability analysis affects settlement leverage and case value. Document clear fault and minimize contributory factors.",
      defense_lawyer: "Comparative fault analysis can significantly reduce exposure. Identify all potential liability factors and third-party contributions.",
      insurance_company: "Liability percentage directly correlates to damages exposure. Conservative liability assessment protects against adverse verdicts."
    }
  };

  return adviceMap[stepTitle]?.[userType] || "Thorough analysis at this stage prevents complications in later settlement discussions. Focus on accuracy and completeness.";
}