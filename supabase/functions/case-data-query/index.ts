/**
 * Case Data Query Tool for ElevenLabs Agent
 * 
 * This edge function allows the ElevenLabs agent to query case data
 * from the database during voice mediation sessions
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionCode, userId, queryType, filters } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let result: any = {};

    switch (queryType) {
      case 'session_data':
        // Get mediation session data
        if (sessionCode) {
          const { data: session, error } = await supabase
            .from('mediation_sessions')
            .select('*')
            .eq('session_code', sessionCode)
            .single();

          if (error) throw error;
          result = { session };
        }
        break;

      case 'case_evaluation':
        // Get latest case evaluation for user
        if (userId) {
          const { data: evaluation, error } = await supabase
            .from('case_evaluations')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (error && error.code !== 'PGRST116') throw error;
          result = { evaluation };
        }
        break;

      case 'uploaded_docs':
        // Get uploaded documents for session
        const sessionId = sessionCode || `individual-${userId}`;
        const { data: docs, error: docsError } = await supabase
          .from('uploaded_docs')
          .select('file_name, text_content, created_at')
          .eq('case_session_id', sessionId)
          .order('created_at', { ascending: false });

        if (docsError) throw docsError;
        result = { docs };
        break;

      case 'similar_cases':
        // Query similar cases from database
        const { data: cases, error: casesError } = await supabase
          .from('cases_master')
          .select('case_id, case_type, venue, injuries, settle, pol_lim, liab_pct, acc_type, narrative')
          .limit(5);

        if (casesError) throw casesError;
        result = { cases };
        break;

      case 'clarify_answers':
        // Get clarification answers for session
        const clarifySessionId = sessionCode || `individual-${userId}`;
        const { data: answers, error: answersError } = await supabase
          .from('clarify_answers')
          .select('question, answer, created_at')
          .eq('case_session_id', clarifySessionId)
          .order('created_at', { ascending: false });

        if (answersError) throw answersError;
        result = { answers };
        break;

      default:
        throw new Error(`Unknown query type: ${queryType}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Case data query error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
