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
    const { conversationId, sessionCode } = await req.json();
    
    console.log('[Get Brief] ==== CUSTOM TOOL CALLED ====');
    console.log('[Get Brief] Conversation ID:', conversationId);
    console.log('[Get Brief] Session Code:', sessionCode);
    console.log('[Get Brief] Full request body:', JSON.stringify(await req.clone().json(), null, 2));

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the most recent uploaded document for this session
    const { data: docs, error } = await supabase
      .from('uploaded_docs')
      .select('file_name, text_content')
      .eq('case_session_id', sessionCode || 'unknown')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[Get Brief] Database error:', error);
      throw error;
    }

    if (!docs || docs.length === 0) {
      return new Response(
        JSON.stringify({ 
          briefAvailable: false,
          message: 'No brief has been uploaded for this session yet.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const doc = docs[0];
    console.log('[Get Brief] Found document:', doc.file_name);

    return new Response(
      JSON.stringify({
        briefAvailable: true,
        fileName: doc.file_name,
        content: doc.text_content?.substring(0, 4000) || 'No content extracted', // Limit to 4000 chars
        message: `I have reviewed the brief titled "${doc.file_name}". Here's a summary of the key information...`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Get Brief] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        briefAvailable: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
