import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    // Verify webhook if secret is provided
    if (hookSecret) {
      const wh = new Webhook(hookSecret);
      wh.verify(payload, headers);
    }

    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = JSON.parse(payload) as {
      user: {
        email: string;
        user_metadata?: {
          user_type?: string;
          company_name?: string;
        };
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
      };
    };

    const isSignup = email_action_type === 'signup';
    const userType = user.user_metadata?.user_type || 'user';
    const companyName = user.user_metadata?.company_name || '';

    // Create confirmation URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    // Email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${isSignup ? 'Welcome to Verdict AI' : 'Sign In to Verdict AI'}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
                ⚖️ Verdict AI
              </h1>
              <p style="color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px;">
                Legal Intelligence Platform
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">
                ${isSignup ? `Welcome${companyName ? ` to ${companyName}` : ''}!` : 'Sign In to Your Account'}
              </h2>
              
              <p style="color: #475569; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
                ${isSignup 
                  ? `Thank you for joining Verdict AI! Click the button below to confirm your email address and complete your registration.`
                  : `Click the button below to securely sign in to your Verdict AI account.`
                }
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmationUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);">
                  ${isSignup ? 'Confirm Email & Get Started' : 'Sign In to Verdict AI'}
                </a>
              </div>

              ${isSignup ? `
                <!-- Features -->
                <div style="background-color: #f8fafc; padding: 25px; border-radius: 6px; margin: 30px 0;">
                  <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">What you can do with Verdict AI:</h3>
                  <ul style="color: #475569; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">📊 Evaluate case values using AI and comparable settlements</li>
                    <li style="margin-bottom: 8px;">⚖️ Generate mediation proposals backed by data</li>
                    <li style="margin-bottom: 8px;">🔍 Access comprehensive settlement databases</li>
                    <li style="margin-bottom: 8px;">📈 Track and analyze case outcomes</li>
                  </ul>
                </div>
              ` : ''}

              <!-- Alternative Access -->
              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin: 25px 0;">
                <p style="color: #64748b; margin: 0; font-size: 14px; text-align: center;">
                  <strong>Alternative:</strong> Copy and paste this code in the app:<br>
                  <code style="background-color: white; padding: 8px 12px; border-radius: 4px; font-family: monospace; color: #1e293b; margin-top: 8px; display: inline-block;">
                    ${token}
                  </code>
                </p>
              </div>

              <!-- Security Note -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
                <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0;">
                  🔒 This link is secure and will expire in 1 hour. If you didn't request this ${isSignup ? 'account creation' : 'sign in'}, you can safely ignore this email.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 20px 30px; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; margin: 0; font-size: 13px;">
                © 2025 Verdict AI • Legal Intelligence Platform<br>
                Professional case evaluation and mediation tools
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: isSignup ? 'Verdict AI <welcome@resend.dev>' : 'Verdict AI <login@resend.dev>',
      to: [user.email],
      subject: isSignup ? 'Welcome to Verdict AI - Confirm Your Account' : 'Sign In to Verdict AI',
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw emailError;
    }

    console.log(`${isSignup ? 'Welcome' : 'Sign in'} email sent successfully to:`, user.email);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-welcome-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});