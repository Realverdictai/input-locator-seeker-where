import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SimilarityRequest {
  embedding: number[];
  newCase: any;
  limit?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { embedding, newCase, limit = 25 }: SimilarityRequest = await req.json();

    // Convert embedding to pgvector format
    const embeddingVector = `[${embedding.join(',')}]`;
    
    // Get parameters for hybrid search
    const liabPct = parseFloat(newCase.LiabPct || '100') || 100;
    const policyLimitStr = newCase.policyLimits ?? newCase.PolicyLimits ?? '0';
    const policyLimits = newCase.policy_limits_num || parseInt(String(policyLimitStr).replace(/[$,]/g, '')) || 0;
    const policyBucket = policyLimits > 500000 ? 'high' : policyLimits > 100000 ? 'mid' : 'low';
    const tbiLevel = newCase.tbiLevel || 0;
    const hasSurgery = !!(newCase.Surgery && newCase.Surgery !== 'None');

    // Hybrid similarity search query
    const { data, error } = await supabase.rpc('hybrid_case_similarity', {
      query_embedding: embeddingVector,
      query_liab_pct: liabPct,
      query_policy_bucket: policyBucket,
      query_tbi_level: tbiLevel,
      query_has_surgery: hasSurgery,
      query_case_type: Array.isArray(newCase.caseType) ? newCase.caseType[0] : newCase.caseType || null,
      result_limit: limit
    });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in find-similar-cases function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);