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
    
    // Check if form data is empty (user hasn't started entering info yet)
    const isFormDataEmpty = !parsedFormData || Object.keys(parsedFormData).length === 0 || 
      Object.values(parsedFormData).every(value => {
        if (value === null || value === undefined || value === '') return true;
        if (Array.isArray(value) && value.length === 0) return true;
        if (typeof value === 'object' && Object.keys(value).length === 0) return true;
        return false;
      });
    
    // If no user input yet, return waiting message
    if (isFormDataEmpty) {
      const waitingAdvice = getWaitingAdvice(stepTitle, userType);
      return new Response(JSON.stringify({ advice: waitingAdvice }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const systemPrompt = `You are Judge Iskander, a retired attorney with decades of experience who has evaluated hundreds of thousands of personal injury cases throughout your career. You possess deep technical legal knowledge and speak with the authority of someone who has seen every variation of case strategy and outcome.

Your approach:
- Technically proficient with comprehensive knowledge of personal injury law
- Understanding and respectful of both plaintiff and defense positions
- Analytical and measured - you work only with the information provided
- Never speculate about future steps or jump to premature conclusions
- Provide practical, experience-based guidance grounded in legal reality
- Speak as a seasoned practitioner who understands case dynamics and settlement patterns

CRITICAL: Stay strictly focused on the current step. Do NOT discuss liability percentages, fault analysis, or settlement valuations until the user reaches those specific steps later in the process.

Current context:
- Step: ${stepTitle} (${stepNumber} of ${totalSteps})
- User type: ${userType}
- Form data: ${JSON.stringify(parsedFormData, null, 2)}

Step-specific focus rules:
- Steps 1-2 (Parties, Basic Info): Focus ONLY on party identification, complexity, representation
- Step 3 (Case Category): Focus ONLY on case type selection and categorization  
- Steps 4-5 (Medical, Documents): Focus ONLY on medical treatment and documentation
- Step 6 (Liability & Impact): NOW you can discuss liability percentages and fault
- Later steps: Focus on their specific content without jumping ahead

IMPORTANT: You are providing REAL-TIME commentary as the user fills out fields. If form data has been entered, comment specifically on what they've entered and provide contextual advice about those values. If fields are empty, provide general step guidance.

When form data is present, focus on:
1. Commenting on specific values they've entered (amounts, dates, selections, etc.)
2. How these values impact the CURRENT step's objectives
3. Whether the values seem reasonable/concerning from a completion perspective
4. Practical next steps for completing THIS SPECIFIC step

Provide specific, actionable advice for this current step "${stepTitle}". Focus on:
1. Acknowledging the user's perspective (plaintiff/defense/insurance)
2. Offering practical guidance for completing THIS SPECIFIC step effectively
3. Connecting this step to overall case preparation (NOT settlement strategy until later)
4. Using encouraging, professional tone
5. Keeping response to 2-3 sentences maximum

Remember: You're guiding them toward thorough case preparation. Settlement discussions come later.`;

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

function getWaitingAdvice(stepTitle: string, userType: string): string {
  const waitingMessages: Record<string, Record<string, string>> = {
    "Upload Documents": {
      plaintiff_lawyer: "I'm ready to review your document strategy once you begin uploading. Please start with your medical records and key evidence.",
      defense_lawyer: "Waiting for document uploads to analyze potential case weaknesses and discovery opportunities.",
      insurance_company: "Ready to assess documentation quality for reserve setting once you begin the upload process."
    },
    "Parties": {
      plaintiff_lawyer: "Please begin entering plaintiff and defendant information. I'll focus on party complexity and representation issues as you proceed.",
      defense_lawyer: "Start by identifying all parties. I'll analyze multi-party dynamics and coordination opportunities.",
      insurance_company: "Waiting for party information to assess coverage implications and potential contribution issues."
    },
    "Settlement Position": {
      plaintiff_lawyer: "Ready to review your settlement strategy once you enter your authority limits and objectives.",
      defense_lawyer: "Please input your settlement parameters. I'll provide guidance on negotiation positioning.",
      insurance_company: "Waiting for settlement authority information to advise on reserve adequacy and bad faith considerations."
    },
    "Case Category": {
      plaintiff_lawyer: "Please select your case type and theory. I'll provide strategic guidance based on your categorization.",
      defense_lawyer: "Start by identifying the case category. I'll analyze defense strategies specific to that case type.",
      insurance_company: "Waiting for case type selection to provide historical settlement data and coverage analysis."
    },
    "Liability & Impact": {
      plaintiff_lawyer: "Ready to analyze liability factors once you begin entering fault assessments and impact details.",
      defense_lawyer: "Please start with liability analysis. I'll identify comparative fault opportunities and mitigation strategies.",
      insurance_company: "Waiting for liability information to assess exposure percentages and settlement recommendations."
    }
  };

  return waitingMessages[stepTitle]?.[userType] || "Please begin entering information for this step. I'm ready to provide experienced guidance as you proceed.";
}

function getFallbackAdvice(stepTitle: string, userType: string): string {
  const adviceMap: Record<string, Record<string, string>> = {
    "Upload Documents": {
      plaintiff_lawyer: "Document quality and organization significantly impact case valuation. Medical records, wage statements, and expert reports form the evidentiary foundation for settlement negotiations.",
      defense_lawyer: "Thorough document review reveals case strengths and weaknesses early. Look for gaps in causation, pre-existing conditions, and inconsistencies in medical treatment patterns.",
      insurance_company: "Document analysis drives accurate reserve setting. Focus on medical necessity, treatment duration, and objective findings to assess exposure parameters."
    },
    "Parties": {
      plaintiff_lawyer: "Multiple plaintiff cases require coordinated case management. Consider representation complexities and potential conflicts between parties.",
      defense_lawyer: "Multi-defendant scenarios create coordination opportunities. Joint defense agreements and shared discovery can be beneficial.",
      insurance_company: "Complex party structures affect coverage analysis. Evaluate primary vs. excess coverage and contribution potential."
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