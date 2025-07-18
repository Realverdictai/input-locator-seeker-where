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
  mediatorProposal: string;
  evaluator: string;
  rationale: string;
  expiresOn: string;
  attachReport?: boolean;
  caseData?: any;
  sourceRows?: number[];
}

// Simple HTML report generation
function generateHtmlReport(data: {
  mediatorProposal: string;
  evaluator: string;
  rationale: string;
  expiresOn: string;
  caseData?: any;
  sourceRows?: number[];
}): string {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #28a745; text-align: center; }
          h2 { color: #333; border-bottom: 2px solid #dee2e6; }
          .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .factor { margin: 10px 0; }
          .confidential { text-align: center; margin-top: 40px; font-weight: bold; color: #666; }
        </style>
      </head>
      <body>
        <h1>MEDIATOR'S CASE EVALUATION REPORT</h1>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Case Type:</strong> ${Array.isArray(data.caseData?.caseType) ? data.caseData.caseType.join(', ') : (data.caseData?.caseType || 'Personal Injury')}</p>
        <p><strong>Venue:</strong> ${data.caseData?.venue || 'Not specified'}</p>
        
        <div class="summary">
          <h2>VALUATION SUMMARY</h2>
          <p><strong>Evaluator Number:</strong> ${data.evaluator}</p>
          <p><strong>Mediator's Proposal:</strong> ${data.mediatorProposal}</p>
          <p><strong>Source Cases:</strong> #${data.sourceRows?.join(', #') || 'N/A'}</p>
          <p><strong>Expires:</strong> ${data.expiresOn} at 5:00 PM</p>
        </div>
        
        <h2>RATIONALE</h2>
        <p>${data.rationale}</p>
        
        ${data.caseData ? `
        <h2>CASE FACTORS</h2>
        ${data.caseData.medicalSpecials ? `<div class="factor">Medical Specials: $${data.caseData.medicalSpecials.toLocaleString()}</div>` : ''}
        ${data.caseData.howellHanifDeductions ? `<div class="factor">Howell Specials: $${data.caseData.howellHanifDeductions.toLocaleString()}</div>` : ''}
        ${data.caseData.surgeries ? `<div class="factor">Surgeries: ${data.caseData.surgeries} (${data.caseData.surgeryType || 'Type not specified'})</div>` : ''}
        ${data.caseData.injections ? `<div class="factor">Injections: ${data.caseData.injections} (${data.caseData.injectionType || 'Type not specified'})</div>` : ''}
        ${data.caseData.liabilityPercentage ? `<div class="factor">Liability: ${data.caseData.liabilityPercentage}%</div>` : ''}
        ` : ''}
        
        <h2>DEFENSE CONSIDERATIONS</h2>
        <ul>
          <li>Medical specials may include inflated or unnecessary treatments</li>
          <li>Pre-existing conditions could contribute to current symptoms</li>
          <li>Gaps in treatment may indicate non-severity of injuries</li>
          <li>Comparative negligence factors may reduce plaintiff's recovery</li>
          <li>Policy limits create natural ceiling for settlement negotiations</li>
          <li>Howell deductions reflect reasonable value of medical services</li>
        </ul>
        
        <div class="confidential">
          <p>CONFIDENTIAL - FOR MEDIATION PURPOSES ONLY</p>
          <p>This report contains confidential settlement communications protected under Evidence Code Section 1119.</p>
        </div>
      </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      plaintiffEmail, 
      defenseEmail, 
      mediatorProposal,
      evaluator,
      rationale, 
      expiresOn,
      attachReport,
      caseData,
      sourceRows
    }: MediationProposalRequest = await req.json();

    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    const resend = new Resend(resendApiKey);

    const emailSubject = `Mediator's Settlement Proposal: ${mediatorProposal}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Mediator's Proposal</h1>
        
        <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="font-size: 2em; font-weight: bold; margin: 0 0 15px 0; color: #28a745; text-align: center;">
            ${mediatorProposal}
          </h2>
          
          <p><strong>Evaluator Number:</strong> ${evaluator}</p>
          <p><strong>Source Cases:</strong> #${sourceRows?.join(', #') || 'N/A'}</p>
          <p><strong>Rationale:</strong> ${rationale}</p>
          <p style="color: #dc3545; font-weight: bold;">
            This proposal expires on ${expiresOn} at 5:00 PM.
          </p>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #856404;">Confidentiality Notice</h3>
          <p style="margin: 0; font-size: 0.9em;">
            This mediation proposal is confidential and protected under Evidence Code Section 1119.
          </p>
        </div>
      </div>
    `;

    const attachments = [];
    
    if (attachReport && caseData) {
      const htmlReport = generateHtmlReport({
        mediatorProposal,
        evaluator,
        rationale,
        expiresOn,
        caseData,
        sourceRows
      });
      
      attachments.push({
        filename: 'MediatorReport.html',
        content: btoa(unescape(encodeURIComponent(htmlReport))),
        type: 'text/html',
        disposition: 'attachment'
      });
    }

    // Send to both plaintiff and defense with customized messages
    await Promise.all([
      resend.emails.send({
        from: "Mediator <mediation@resend.dev>",
        to: [plaintiffEmail],
        subject: emailSubject,
        html: `<h3>To Plaintiff's Counsel</h3>${emailBody}<p>This proposal represents a fair settlement based on comparable cases. Accepting ensures certainty and avoids the risks of continued litigation.</p>`,
        attachments: attachments
      }),
      resend.emails.send({
        from: "Mediator <mediation@resend.dev>",
        to: [defenseEmail], 
        subject: emailSubject,
        html: `<h3>To Defense Counsel</h3>${emailBody}<p>This proposal is based on actual settlement data from similar cases. It provides predictable resolution and eliminates trial uncertainty.</p>`,
        attachments: attachments
      })
    ]);

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