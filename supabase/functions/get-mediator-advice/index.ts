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
    
    const systemPrompt = `You are Judge Iskander, a highly experienced settlement mediator in personal injury cases. You are wise, reassuring, and focused on helping parties reach fair settlements.

Your personality:
- Warm and grandfatherly, but sharp and experienced
- Speaks with authority but remains approachable
- Uses analogies and real-world examples
- Always focused on settlement and resolution
- Balances empathy with practical legal strategy
- Provides real-time commentary on form inputs as they're filled out

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
      plaintiff_lawyer: "Start strong by uploading demand letters or medical records. This helps me understand your case's foundation for better settlement guidance.",
      defense_lawyer: "Review any uploaded documents carefully - they often reveal the plaintiff's settlement expectations and case strengths.",
      insurance_company: "Use document uploads to quickly assess claim validity and potential exposure ranges."
    },
    "Parties": {
      plaintiff_lawyer: "Multiple plaintiffs can strengthen your negotiating position, but may complicate settlement discussions. Consider how to present unified demands.",
      defense_lawyer: "Multiple defendants create opportunities for allocation disputes. Use this to your advantage in settlement negotiations.",
      insurance_company: "More parties often mean more complexity - factor this into your settlement authority and strategy."
    },
    "Settlement Position": {
      plaintiff_lawyer: "Set your bottom line thoughtfully - it's your anchor point for all negotiations. Remember, you can always adjust upward.",
      defense_lawyer: "Your authority limits should reflect realistic case value. Having proper authority prevents delays and builds trust.",
      insurance_company: "Clear settlement authority streamlines negotiations and prevents missed opportunities for early resolution."
    },
    "Case Category": {
      plaintiff_lawyer: "The category drives everything - make sure it accurately reflects your strongest case theory for maximum settlement value.",
      defense_lawyer: "Understanding the case category helps predict plaintiff strategies and set appropriate settlement ranges.",
      insurance_company: "Case category directly impacts exposure levels - use historical data to inform your settlement approach."
    }
  };

  return adviceMap[stepTitle]?.[userType] || "This step is crucial for building a strong foundation for settlement negotiations. Take your time to be thorough.";
}