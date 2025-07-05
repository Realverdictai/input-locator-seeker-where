-- Update hybrid case similarity search function to use numeric columns
CREATE OR REPLACE FUNCTION public.hybrid_case_similarity(
  query_embedding vector(1536),
  query_liab_pct numeric DEFAULT 100,
  query_policy_bucket text DEFAULT 'low',
  query_tbi_level integer DEFAULT 0,
  query_has_surgery boolean DEFAULT false,
  result_limit integer DEFAULT 25
)
RETURNS TABLE (
  case_id integer,
  surgery text,
  inject text,
  injuries text,
  settle text,
  pol_lim text,
  venue text,
  liab_pct text,
  acc_type text,
  narrative text,
  score numeric
) 
LANGUAGE sql
AS $$
  SELECT 
    c.case_id,
    c.surgery,
    c.inject,
    c.injuries,
    c.settle,
    c.pol_lim,
    c.venue,
    c.liab_pct,
    c.acc_type,
    c.narrative,
    (
      -- Cosine similarity (0.5 weight)
      0.5 * (1 - (c.embedding <=> query_embedding)) +
      
      -- Liability percentage proximity (0.2 weight) - use numeric column first
      0.2 * (100 - ABS(COALESCE(c.liab_pct_num, c.liab_pct::numeric, 100) - query_liab_pct)) / 100 +
      
      -- Policy bucket match (0.1 weight) - use numeric column first
      0.1 * CASE 
        WHEN (
          COALESCE(c.policy_limits_num, 
            CASE WHEN c.pol_lim ~ '^[0-9,.$]+$' 
                 THEN REPLACE(REPLACE(REPLACE(c.pol_lim, '$', ''), ',', ''), '.', '')::numeric
                 ELSE 0 END
          ) > 500000 AND query_policy_bucket = 'high'
        ) OR (
          COALESCE(c.policy_limits_num,
            CASE WHEN c.pol_lim ~ '^[0-9,.$]+$'
                 THEN REPLACE(REPLACE(REPLACE(c.pol_lim, '$', ''), ',', ''), '.', '')::numeric
                 ELSE 0 END
          ) BETWEEN 100000 AND 500000 AND query_policy_bucket = 'mid'
        ) OR (
          COALESCE(c.policy_limits_num,
            CASE WHEN c.pol_lim ~ '^[0-9,.$]+$'
                 THEN REPLACE(REPLACE(REPLACE(c.pol_lim, '$', ''), ',', ''), '.', '')::numeric
                 ELSE 0 END
          ) < 100000 AND query_policy_bucket = 'low'
        ) THEN 1 ELSE 0 END +
      
      -- TBI level match (0.1 weight)
      0.1 * CASE WHEN query_tbi_level > 0 AND c.injuries ILIKE '%TBI%' THEN 1 ELSE 0 END +
      
      -- Surgery match (0.1 weight)  
      0.1 * CASE WHEN query_has_surgery AND c.surgery IS NOT NULL AND c.surgery != 'None' THEN 1 ELSE 0 END
    ) AS score
  FROM cases_master c
  WHERE c.embedding IS NOT NULL 
    AND (c.settle_num IS NOT NULL OR (c.settle IS NOT NULL AND c.settle != ''))
  ORDER BY score DESC
  LIMIT result_limit;
$$;