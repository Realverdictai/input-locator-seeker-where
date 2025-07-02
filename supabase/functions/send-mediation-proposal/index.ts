import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MediationProposalRequest {
  plaintiffEmail: string;
  defenseEmail: string;
  proposalAmount: string;
  recommendedRange: string;
  rationale: string;
  expiresOn: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      plaintiffEmail, 
      defenseEmail, 
      proposalAmount, 
      recommendedRange, 
      rationale, 
      expiresOn 
    }: MediationProposalRequest = await req.json();

    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    const resend = new Resend(resendApiKey);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Mediator's Proposal</h1>
        
        <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="font-size: 2em; font-weight: bold; margin: 0 0 15px 0; color: #28a745; text-align: center;">
            Proposal Amount: ${proposalAmount}
          </h2>
          
          <p><strong>Settlement Range:</strong> ${recommendedRange}</p>
          <p><strong>Rationale:</strong> ${rationale}</p>
          <p style="color: #dc3545; font-weight: bold;">
            This proposal expires on ${expiresOn} at 5:00 PM.
          </p>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #856404;">Confidentiality Notice</h3>
          <p style="margin: 0; font-size: 0.9em;">
            This mediation proposal is confidential and is made pursuant to applicable mediation 
            confidentiality statutes and rules. This proposal may not be disclosed to any third 
            parties and may not be used as evidence in any legal proceeding.
          </p>
        </div>
        
        <p style="text-align: center; color: #666; font-size: 0.9em;">
          This proposal represents a fair settlement based on comparable cases with similar 
          injuries and circumstances. Please respond by the expiration date above.
        </p>
      </div>
    `;

    // Send to both plaintiff and defense
    const emails = [plaintiffEmail, defenseEmail];
    
    for (const email of emails) {
      const emailResponse = await resend.emails.send({
        from: "Mediation Service <onboarding@resend.dev>",
        to: [email],
        subject: "Mediator's Proposal – Case Evaluation",
        html: emailHtml,
      });

      console.log(`Email sent to ${email}:`, emailResponse);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Proposals sent successfully" }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
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
