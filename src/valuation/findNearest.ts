import { supabase } from '@/integrations/supabase/client';

interface NearestCase {
  case_id: number;
  surgery: string | null;
  inject: string | null;
  injuries: string | null;
  settle: string | null;
  pol_lim: string | null;
  venue: string | null;
  liab_pct: string | null;
  acc_type: string | null;
  narrative: string | null;
  score: number;
}

/**
 * Find nearest cases using hybrid similarity search
 */
export async function findNearestCases(
  embedding: number[],
  newCase: any,
  limit: number = 25,
  excludeOutliers: boolean = false
): Promise<NearestCase[]> {
  try {
    // Convert embedding array to pgvector format
    const embeddingVector = `[${embedding.join(',')}]`;
    
  // Get liability percentage as number
  const liabPct =
    typeof newCase.liab_pct_num === 'number'
      ? newCase.liab_pct_num
      : parseFloat(String(newCase.LiabPct || '100').replace(/[^0-9.]/g, '')) || 100;
  
  // Determine policy bucket (simplified)
  const policyLimitStr = newCase.policyLimits ?? newCase.PolicyLimits ?? '0';
  const policyLimits = newCase.policy_limits_num || parseInt(String(policyLimitStr).replace(/[$,]/g, '')) || 0;
    const policyBucket = policyLimits > 500000 ? 'high' : policyLimits > 100000 ? 'mid' : 'low';
    
    // TBI level mapping
    const tbiLevel = newCase.tbiLevel || 0;
    
    // Has surgery flag
    const hasSurgery = !!(newCase.Surgery && newCase.Surgery !== 'None');

    const { data, error } = await supabase.rpc('hybrid_case_similarity', {
      query_embedding: embeddingVector,
      query_liab_pct: liabPct,
      query_policy_bucket: policyBucket,
      query_tbi_level: tbiLevel,
      query_has_surgery: hasSurgery,
      result_limit: limit
    });

    if (error) {
      console.error('Error finding similar cases:', error);
      // Fallback to basic similarity if RPC fails
      return await fallbackSimilaritySearch(newCase, limit, excludeOutliers);
    }

    return (data as NearestCase[]) || [];
    
  } catch (error) {
    console.error('Error in findNearestCases:', error);
    return await fallbackSimilaritySearch(newCase, limit, excludeOutliers);
  }
}

/**
 * Fallback similarity search without embeddings
 */
async function fallbackSimilaritySearch(newCase: any, limit: number, excludeOutliers: boolean = false): Promise<NearestCase[]> {
  let query = supabase
    .from('v_case_flat')
    .select('*')
    .not('settlement', 'is', null);
  
  if (excludeOutliers) {
    query = query.eq('is_outlier', false);
  }
  
  const { data, error } = await query.limit(limit);

  if (error) {
    throw error;
  }

  // Calculate similarity scores manually, mapping to expected format
  const scoredCases = (data || []).map(caseRow => ({
    case_id: caseRow.case_id,
    surgery: caseRow.surgery_list?.[0] || null,
    inject: caseRow.injection_list?.[0] || null,
    injuries: caseRow.injuries,
    settle: String(caseRow.settlement || ''),
    pol_lim: String(caseRow.policy_limits || ''),
    venue: caseRow.venue,
    liab_pct: String(caseRow.liab_pct || ''),
    acc_type: caseRow.acc_type,
    narrative: caseRow.narrative,
    score: calculateFallbackSimilarity(caseRow, newCase)
  }));

  // Sort by score descending
  scoredCases.sort((a, b) => b.score - a.score);

  return scoredCases.slice(0, limit);
}

/**
 * Calculate similarity score without embeddings
 */
function calculateFallbackSimilarity(caseRow: any, newCase: any): number {
  let score = 0;

  // Venue match (20 points)
  if (caseRow.venue && newCase.Venue && 
      caseRow.venue.toLowerCase().trim() === newCase.Venue.toLowerCase().trim()) {
    score += 20;
  }

  // Surgery similarity (10 points)
  if (caseRow.surgery && newCase.Surgery) {
    if (caseRow.surgery.toLowerCase().includes(newCase.Surgery.toLowerCase()) ||
        newCase.Surgery.toLowerCase().includes(caseRow.surgery.toLowerCase())) {
      score += 10;
    }
  }

  // Injuries word overlap (10 points)
  if (caseRow.injuries && newCase.Injuries) {
    const words1 = caseRow.injuries.toLowerCase().split(/\s+/);
    const words2 = newCase.Injuries.toLowerCase().split(/\s+/);
    const overlap = words1.filter(word => words2.some(w2 => w2.includes(word) || word.includes(w2))).length;
    score += Math.min(10, overlap * 2);
  }

  // Liability percentage proximity (4 points max)
  const case_liab = caseRow.liab_pct || 100;
  const new_liab =
    typeof newCase.liab_pct_num === 'number'
      ? newCase.liab_pct_num
      : newCase.LiabPct
        ? parseFloat(String(newCase.LiabPct).replace(/[^0-9.]/g, '')) || 100
        : 100;
  if (case_liab && new_liab) {
    const liab_diff = Math.abs(case_liab - new_liab);
    score += Math.max(0, 4 - (liab_diff / 25));
  }

  // Accident type match (3 points)
  if (caseRow.acc_type && newCase.AccType && 
      caseRow.acc_type.toLowerCase().trim() === newCase.AccType.toLowerCase().trim()) {
    score += 3;
  }

  return score;
}