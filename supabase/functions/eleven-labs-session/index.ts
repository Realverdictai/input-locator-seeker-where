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
    const { agentId, sessionContext } = await req.json();

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    const ELEVEN_LABS_API_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!ELEVEN_LABS_API_KEY) {
      throw new Error('ELEVEN_LABS_API_KEY not configured');
    }

    console.log('[ElevenLabs Session] Getting signed URL for agent:', agentId);
    console.log('[ElevenLabs Session] Session context:', sessionContext);

    // Build custom prompt based on whether a brief was uploaded
    const customPrompt = sessionContext?.hasBrief 
      ? `You are Judge William Iskandar, an experienced mediator. A mediation brief has been uploaded for session code "${sessionContext.sessionCode}". When the user asks about the brief, use your "get_mediation_brief" custom tool with this session code to retrieve and review its content. Guide the mediation professionally and reference the brief content from the tool when relevant.`
      : sessionContext?.instructions || 'You are Judge William Iskandar, an experienced mediator guiding this session professionally.';

    // Get signed URL from ElevenLabs API with custom prompt
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVEN_LABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ElevenLabs Session] API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();

    console.log('[ElevenLabs Session] Got signed URL');
    console.log('[ElevenLabs Session] Note: Custom context will be passed to agent via first message');

    return new Response(
      JSON.stringify({
        signedUrl: data.signed_url,
        conversationId: data.conversation_id || crypto.randomUUID(),
        customPrompt, // Return this so the client can send it as first message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ElevenLabs Session] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});