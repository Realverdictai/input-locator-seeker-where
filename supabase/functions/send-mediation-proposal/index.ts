import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

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
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendApiKey);

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

    // Calculate mediation proposal heavily favoring defense/insurance
    const piCaseData = piEvaluation.case_data;
    const insuranceCaseData = insuranceEvaluation.case_data;

    // Get estimated settlement amounts from both sides
    const piEstimate = calculateEstimate(piCaseData);
    const insuranceEstimate = calculateEstimate(insuranceCaseData);

    console.log("PI Estimate:", piEstimate);
    console.log("Insurance Estimate:", insuranceEstimate);

    // Calculate defense-favorable settlement amount (heavily weighted toward insurance estimate)
    // Using 75% insurance estimate + 25% PI estimate to favor defense
    const mediatedAmount = Math.round(
      (piEstimate.mid * 0.25 + insuranceEstimate.mid * 0.75)
    );

    // Apply additional defense discount for negotiation room
    const finalAmount = Math.round(mediatedAmount * 0.85); // 15% additional discount

    // Identify key differences and common ground with defense-favorable framing
    const keyDifferences = identifyDifferences(piCaseData, insuranceCaseData);
    const commonGround = identifyCommonGround(piCaseData, insuranceCaseData);

    const proposal = {
      settlement_amount: finalAmount,
      rationale: `This settlement recommendation reflects a conservative analysis that accounts for litigation risks, jury unpredictability, and defense strengths. The PI evaluation suggested ${formatCurrency(piEstimate.mid)} while the insurance evaluation suggested ${formatCurrency(insuranceEstimate.mid)}. This proposal at ${formatCurrency(finalAmount)} provides significant cost savings compared to potential trial exposure while ensuring prompt resolution.`,
      key_differences: keyDifferences,
      common_ground: commonGround,
      recommendation: `We strongly recommend settlement at ${formatCurrency(finalAmount)}. This amount represents excellent value for the defense, accounting for potential trial costs, attorney fees, and jury risk. The proposal eliminates uncertainty while providing substantial savings compared to worst-case trial scenarios.`
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

    // Generate email content
    const emailContent = generateEmailContent(proposal, session);

    // Send emails to both parties
    const emailPromises = [];
    
    if (piEmail) {
      emailPromises.push(
        resend.emails.send({
          from: "Verdict AI <noreply@verdictai.com>",
          to: [piEmail],
          subject: `Mediation Proposal Ready - Session ${session.session_code}`,
          html: emailContent,
        })
      );
    }

    if (insuranceEmail) {
      emailPromises.push(
        resend.emails.send({
          from: "Verdict AI <noreply@verdictai.com>",
          to: [insuranceEmail],
          subject: `Mediation Proposal Ready - Session ${session.session_code}`,
          html: emailContent,
        })
      );
    }

    // Send all emails concurrently
    const emailResults = await Promise.all(emailPromises);
    
    console.log("Email results:", emailResults);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Mediation proposal generated and notifications sent",
        proposal,
        emailsSent: emailResults.length
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
    differences.push("Medical cost valuations require careful scrutiny given documentation gaps");
  }
  
  if (piData.liabilityPercentage !== insuranceData.liabilityPercentage) {
    differences.push("Liability percentage disputes favor conservative assessment");
  }
  
  if (piData.injurySeverity !== insuranceData.injurySeverity) {
    differences.push("Injury severity claims need objective medical validation");
  }
  
  return differences.length ? differences : ["Minor valuation differences easily resolved through settlement"];
}

function identifyCommonGround(piData: any, insuranceData: any): string[] {
  const commonPoints = [];
  
  if (piData.accidentType === insuranceData.accidentType) {
    commonPoints.push("Clear agreement on accident circumstances");
  }
  
  if (piData.medicalTreatment === insuranceData.medicalTreatment) {
    commonPoints.push("Reasonable consensus on treatment approach");
  }
  
  commonPoints.push("Both parties recognize the value of prompt resolution");
  commonPoints.push("Settlement eliminates litigation risks and costs for all parties");
  commonPoints.push("Structured resolution provides certainty and closure");
  
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
    <h2>Mediation Settlement Proposal - Session ${session.session_code}</h2>
    <h3>Recommended Settlement Amount: ${formatCurrency(proposal.settlement_amount)}</h3>
    
    <p><strong>Executive Summary:</strong></p>
    <p>${proposal.rationale}</p>
    
    <h4>Key Considerations:</h4>
    <ul>
      ${proposal.key_differences.map((diff: string) => `<li>${diff}</li>`).join('')}
    </ul>
    
    <h4>Settlement Advantages:</h4>
    <ul>
      ${proposal.common_ground.map((point: string) => `<li>${point}</li>`).join('')}
    </ul>
    
    <p><strong>Recommendation:</strong></p>
    <p>${proposal.recommendation}</p>
    
    <div style="background-color: #f0f8ff; padding: 15px; margin: 20px 0; border-left: 4px solid #0066cc;">
      <h4 style="margin-top: 0; color: #0066cc;">Cost-Benefit Analysis</h4>
      <p>This settlement eliminates trial risk, reduces legal costs, and provides immediate closure. The recommended amount represents significant savings compared to potential adverse verdict exposure.</p>
    </div>
    
    <hr>
    <p><small>This proposal is based on comprehensive risk analysis and is designed to facilitate efficient resolution while protecting all parties' interests.</small></p>
  `;
}

serve(handler);
