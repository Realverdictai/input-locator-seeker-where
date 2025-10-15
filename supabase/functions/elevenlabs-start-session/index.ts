import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ ok: false, error: 'sessionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Look up brief data
    const { data: briefData, error: briefError } = await supabase
      .from('briefs_one_side')
      .select('brief_text, filename, party_email, side')
      .eq('session_id', sessionId)
      .single();

    if (briefError || !briefData) {
      console.error('Brief lookup error:', briefError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Brief not found for this session' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { brief_text, filename, party_email, side } = briefData;

    // Get ElevenLabs signed URL
    const ELEVEN_LABS_API_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');
    const AGENT_ID = 'agent_3701k7aj6vrrfqera4zs07ns2x4y'; // Judge Iskander agent ID

    if (!ELEVEN_LABS_API_KEY) {
      throw new Error('ELEVEN_LABS_API_KEY not configured');
    }

    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${AGENT_ID}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVEN_LABS_API_KEY,
        },
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error('Failed to get signed URL from ElevenLabs');
    }

    const elevenLabsData = await elevenLabsResponse.json();
    const signedUrl = elevenLabsData.signed_url;

    if (!signedUrl) {
      throw new Error('No signed URL returned from ElevenLabs');
    }

    // Build firstMessage
    const firstMessage = `Session Code: ${sessionId}.
Side: ${side}.
Party Email: ${party_email}.

I have reviewed your mediation brief: ${filename}.
Please begin by summarizing it in ≤120 words, then ask up to 3 targeted questions.`;

    // Build systemPrompt with brief content
    const systemPrompt = `You are Judge Iskander, a neutral virtual mediator for one side.

BRIEF CONTENT:
${brief_text}

INSTRUCTIONS:
Use the provided brief content to guide questions.
Priority order: (1) coverage/limits, (2) liability facts, (3) objective medicals & specials, (4) venue, (5) negotiation history.
Keep a calm, settlement-oriented tone. No legal advice.
End the session when the user says "submit" or "done".`;

    return new Response(
      JSON.stringify({
        ok: true,
        signedUrl,
        firstMessage,
        systemPrompt,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});