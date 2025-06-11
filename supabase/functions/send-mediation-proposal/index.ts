
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MediationProposalRequest {
  sessionId: string;
  piLawyerEmail: string;
  insuranceEmail: string;
  proposal: {
    settlement_amount: number;
    rationale: string;
    key_differences: string[];
    common_ground: string[];
    recommendation: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, piLawyerEmail, insuranceEmail, proposal }: MediationProposalRequest = await req.json();

    // Here you would integrate with your email service (Resend, SendGrid, etc.)
    // For now, we'll just log the proposal and return success
    
    console.log("Sending mediation proposal:", {
      sessionId,
      piLawyerEmail,
      insuranceEmail,
      proposal
    });

    // Email content would be formatted here
    const emailContent = `
      <h2>Mediation Proposal - Session ${sessionId}</h2>
      <h3>Recommended Settlement Amount: $${proposal.settlement_amount.toLocaleString()}</h3>
      <p><strong>Rationale:</strong> ${proposal.rationale}</p>
      
      <h4>Key Differences Identified:</h4>
      <ul>
        ${proposal.key_differences.map(diff => `<li>${diff}</li>`).join('')}
      </ul>
      
      <h4>Common Ground:</h4>
      <ul>
        ${proposal.common_ground.map(point => `<li>${point}</li>`).join('')}
      </ul>
      
      <p><strong>Recommendation:</strong> ${proposal.recommendation}</p>
    `;

    // Return success for now - in production you'd actually send emails
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Mediation proposal prepared successfully",
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

serve(handler);
