import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionCode, partyEmail } = await req.json();

    if (!sessionCode) {
      throw new Error('Session code is required');
    }

    console.log('[Request Valuation] Request received for session:', sessionCode);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    // Call the generation function
    console.log('[Request Valuation] Calling generation function...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-valuation-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ sessionCode, partyEmail })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Request Valuation] Generation failed:', response.status, errorText);
      throw new Error(`Report generation failed: ${response.status}`);
    }

    const result = await response.json();

    console.log('[Request Valuation] Report generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Valuation report will be emailed within 72 hours',
        reportUrl: result.downloadUrl,
        fileName: result.fileName
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Request Valuation] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
