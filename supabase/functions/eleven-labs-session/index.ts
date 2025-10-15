import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, sessionId, sessionContext } = await req.json();

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    const ELEVEN_LABS_API_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!ELEVEN_LABS_API_KEY) {
      throw new Error('ELEVEN_LABS_API_KEY not configured');
    }

    console.log('[ElevenLabs Session] Getting signed URL for agent:', agentId);
    console.log('[ElevenLabs Session] Session ID:', sessionId);
    console.log('[ElevenLabs Session] Session context:', sessionContext);

    // If there's a brief, retrieve it from the database first
    let briefContent = '';
    if (sessionContext?.hasBrief && sessionContext?.sessionCode) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('[ElevenLabs Session] Retrieving brief for session:', sessionContext.sessionCode);

        const { data: docs, error } = await supabase
          .from('uploaded_docs')
          .select('file_name, text_content')
          .eq('case_session_id', sessionContext.sessionCode)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && docs && docs.length > 0) {
          briefContent = docs[0].text_content || '';
          console.log('[ElevenLabs Session] Retrieved brief:', docs[0].file_name, 'Length:', briefContent.length);
        } else {
          console.log('[ElevenLabs Session] No brief found or error:', error);
        }
      } catch (e) {
        console.error('[ElevenLabs Session] Error retrieving brief:', e);
      }
    }

    // Build custom prompt with the actual brief content
    const customPrompt = briefContent 
      ? `You are Judge William Iskandar, an experienced mediator. I have reviewed the mediation brief submitted for this session. Here is the content:\n\n${briefContent}\n\nBegin by acknowledging you've reviewed the brief and provide a brief summary of the key points. Then guide the mediation professionally, referencing specific details from the brief as relevant.`
      : sessionContext?.instructions || 'You are Judge William Iskandar, an experienced mediator. No brief was uploaded for this session. Begin by introducing yourself and asking about the case details.';

    // Get signed URL from ElevenLabs API with dynamic variables
    const requestBody: any = {};
    
    // If we have a sessionId, pass it as a dynamic variable
    if (sessionId) {
      requestBody.variables = {
        sessionId: sessionId
      };
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: requestBody.variables ? 'POST' : 'GET',
        headers: {
          'xi-api-key': ELEVEN_LABS_API_KEY,
          ...(requestBody.variables ? { 'Content-Type': 'application/json' } : {})
        },
        ...(requestBody.variables ? { body: JSON.stringify(requestBody) } : {})
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