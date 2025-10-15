import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    console.log('[Get Session Brief] Fetching brief for session:', sessionId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: brief, error } = await supabase
      .from('briefs_one_side')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      console.error('[Get Session Brief] Error fetching brief:', error);
      throw error;
    }

    if (!brief) {
      return new Response(
        JSON.stringify({ 
          error: 'No brief found for this session',
          briefText: 'No mediation brief has been uploaded yet for this session.'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[Get Session Brief] Brief found:', brief.filename);

    return new Response(
      JSON.stringify({
        sessionId: brief.session_id,
        side: brief.side,
        filename: brief.filename,
        briefText: brief.brief_text || 'Brief text not extracted',
        partyEmail: brief.party_email
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[Get Session Brief] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
