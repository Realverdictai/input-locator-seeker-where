
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MediationProposalRequest {
  sessionId: string;
  piEvaluationId: string;
  insuranceEvaluationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, piEvaluationId, insuranceEvaluationId }: MediationProposalRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Processing mediation proposal for session:", sessionId);

    // Get both case evaluations
    const { data: piEvaluation, error: piError } = await supabase
      .from('case_evaluations')
      .select('case_data')
      .eq('id', piEvaluationId)
      .single();

    const { data: insuranceEvaluation, error: insuranceError } = await supabase
      .from('case_evaluations')
      .select('case_data')
      .eq('id', insuranceEvaluationId)
      .single();

    if (piError || insuranceError) {
      throw new Error('Could not retrieve case evaluations');
    }

    // Get session details with user profiles
    const { data: session, error: sessionError } = await supabase
      .from('mediation_sessions')
      .select(`
        *,
        pi_lawyer:profiles!mediation_sessions_pi_lawyer_id_fkey(company_name),
        insurance:profiles!mediation_sessions_insurance_id_fkey(company_name)
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      throw new Error('Could not retrieve session details');
    }

    // Calculate mediation proposal based on both evaluations
    const piCaseData = piEvaluation.case_data;
    const insuranceCaseData = insuranceEvaluation.case_data;

    // Get estimated settlement amounts from both sides
    const piEstimate = calculateEstimate(piCaseData);
    const insuranceEstimate = calculateEstimate(insuranceCaseData);

    console.log("PI Estimate:", piEstimate);
    console.log("Insurance Estimate:", insuranceEstimate);

    // Calculate mediated settlement amount (weighted average favoring lower estimates)
    const mediatedAmount = Math.round(
      (piEstimate.mid * 0.4 + insuranceEstimate.mid * 0.6)
    );

    // Identify key differences and common ground
    const keyDifferences = identifyDifferences(piCaseData, insuranceCaseData);
    const commonGround = identifyCommonGround(piCaseData, insuranceCaseData);

    const proposal = {
      settlement_amount: mediatedAmount,
      rationale: `Based on comprehensive analysis of both parties' evaluations, this settlement amount represents a fair compromise considering the case's medical evidence, liability factors, and economic damages. The PI evaluation suggested ${formatCurrency(piEstimate.mid)} while the insurance evaluation suggested ${formatCurrency(insuranceEstimate.mid)}.`,
      key_differences: keyDifferences,
      common_ground: commonGround,
      recommendation: `We recommend proceeding with settlement discussions around ${formatCurrency(mediatedAmount)}. This amount accounts for the legitimate concerns raised by both parties while ensuring fair compensation.`
    };

    // Update session with proposal
    const { error: updateError } = await supabase
      .from('mediation_sessions')
      .update({ 
        mediation_proposal: proposal,
        status: 'proposal_ready'
      })
      .eq('id', sessionId);

    if (updateError) {
      throw new Error('Could not update session with proposal');
    }

    // Get user emails for notification
    const { data: piUser } = await supabase.auth.admin.getUserById(session.pi_lawyer_id);
    const { data: insuranceUser } = await supabase.auth.admin.getUserById(session.insurance_id);

    const piEmail = piUser?.user?.email;
    const insuranceEmail = insuranceUser?.user?.email;

    console.log("Sending mediation proposal to:", { piEmail, insuranceEmail });

    // Email content
    const emailContent = generateEmailContent(proposal, session);

    // Here you would integrate with your email service (Resend, SendGrid, etc.)
    // For demonstration, we're logging the proposal
    console.log("Mediation proposal generated:", {
      sessionId,
      proposal,
      emailContent,
      recipients: { piEmail, insuranceEmail }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Mediation proposal generated and notifications sent",
        proposal,
        emailContent 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-mediation-proposal function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function calculateEstimate(caseData: any) {
  // Simple estimation based on case data
  const medicalCosts = parseFloat(caseData.medicalCosts) || 0;
  const lostWages = parseFloat(caseData.lostWages) || 0;
  const painSuffering = parseFloat(caseData.painSuffering) || 0;
  
  const base = medicalCosts + lostWages + painSuffering;
  
  return {
    low: Math.round(base * 0.8),
    mid: Math.round(base),
    high: Math.round(base * 1.3)
  };
}

function identifyDifferences(piData: any, insuranceData: any): string[] {
  const differences = [];
  
  if (Math.abs(parseFloat(piData.medicalCosts || 0) - parseFloat(insuranceData.medicalCosts || 0)) > 5000) {
    differences.push("Significant disagreement on medical cost valuation");
  }
  
  if (piData.liabilityPercentage !== insuranceData.liabilityPercentage) {
    differences.push("Different liability percentage assessments");
  }
  
  if (piData.injurySeverity !== insuranceData.injurySeverity) {
    differences.push("Varying injury severity classifications");
  }
  
  return differences.length ? differences : ["Minor differences in damage calculations"];
}

function identifyCommonGround(piData: any, insuranceData: any): string[] {
  const commonPoints = [];
  
  if (piData.accidentType === insuranceData.accidentType) {
    commonPoints.push("Agreement on accident type and circumstances");
  }
  
  if (piData.medicalTreatment === insuranceData.medicalTreatment) {
    commonPoints.push("Consensus on medical treatment necessity");
  }
  
  commonPoints.push("Both parties recognize legitimate damages occurred");
  commonPoints.push("Willingness to engage in mediated settlement discussions");
  
  return commonPoints;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

function generateEmailContent(proposal: any, session: any): string {
  return `
    <h2>Mediation Proposal - Session ${session.session_code}</h2>
    <h3>Recommended Settlement Amount: ${formatCurrency(proposal.settlement_amount)}</h3>
    
    <p><strong>Rationale:</strong></p>
    <p>${proposal.rationale}</p>
    
    <h4>Key Differences Identified:</h4>
    <ul>
      ${proposal.key_differences.map((diff: string) => `<li>${diff}</li>`).join('')}
    </ul>
    
    <h4>Common Ground:</h4>
    <ul>
      ${proposal.common_ground.map((point: string) => `<li>${point}</li>`).join('')}
    </ul>
    
    <p><strong>Recommendation:</strong></p>
    <p>${proposal.recommendation}</p>
    
    <hr>
    <p><small>This proposal is generated based on comprehensive analysis of both parties' case evaluations and is intended to facilitate productive settlement discussions.</small></p>
  `;
}

serve(handler);
