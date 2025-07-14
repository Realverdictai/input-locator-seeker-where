import { supabase } from "@/integrations/supabase/client";

interface NewCase {
  Venue?: string;
  Surgery?: string;
  Injuries?: string;
  LiabPct?: string;
  AccType?: string;
  [key: string]: any;
}

interface ComparableCase {
  case_id: number;
  surgery: string | null;
  inject: string | null;
  injuries: string | null;
  settle: string | null;
  pol_lim: string | null;
  venue: string | null;
  liab_pct: string | null;
  acc_type: string | null;
  similarity_score?: number;
}

/**
 * Calculate word overlap between two strings
 */
function wordOverlap(str1: string | null, str2: string | null): number {
  if (!str1 || !str2) return 0;
  
  const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  const overlap = words1.filter(word => words2.includes(word)).length;
  const total = Math.max(words1.length, words2.length);
  
  return total > 0 ? (overlap / total) * 10 : 0;
}

/**
 * Calculate simple text similarity (0-10 scale)
 */
function textSimilarity(str1: string | null, str2: string | null): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 10;
  if (s1.includes(s2) || s2.includes(s1)) return 7;
  
  // Simple character overlap
  const chars1 = s1.split('');
  const chars2 = s2.split('');
  const common = chars1.filter(char => chars2.includes(char)).length;
  const total = Math.max(chars1.length, chars2.length);
  
  return total > 0 ? (common / total) * 5 : 0;
}

/**
 * Calculate similarity score for a case vs new case
 */
function calculateSimilarityScore(caseRow: ComparableCase, newCase: NewCase): number {
  let score = 0;
  
  // Venue match (20 points)
  if (caseRow.venue && newCase.Venue && 
      caseRow.venue.toLowerCase().trim() === newCase.Venue.toLowerCase().trim()) {
    score += 20;
  }
  
  // Surgery similarity (10 points)
  if (caseRow.surgery && newCase.Surgery) {
    score += textSimilarity(caseRow.surgery, newCase.Surgery);
  }
  
  // Injuries word overlap (10 points)  
  if (caseRow.injuries && newCase.Injuries) {
    score += wordOverlap(caseRow.injuries, newCase.Injuries);
  }
  
  // Liability percentage proximity (4 points max) - use structured data
  const case_liab = caseRow.liab_pct ? parseFloat(caseRow.liab_pct) : 100;
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

/**
 * Fetch top comparable cases using similarity scoring
 */
export async function getComparables(newCase: NewCase, limit: number = 25, excludeOutliers: boolean = false): Promise<ComparableCase[]> {
  try {
    // Fetch cases using the clean structured view with optional outlier filtering
    let query = supabase
      .from('v_case_flat')
      .select('*')
      .not('settlement', 'is', null);
    
    if (excludeOutliers) {
      query = query.eq('is_outlier', false);
    }
    
    const { data: allCases, error } = await query.limit(500); // Get larger sample for better matching
    
    if (error) {
      console.error('Error fetching cases for comparison:', error);
      throw error;
    }
    
    if (!allCases || allCases.length === 0) {
      throw new Error('No cases available for comparison');
    }
    
    // Calculate similarity scores for all cases - map to expected format
    const scoredCases = allCases.map(caseRow => ({
      case_id: caseRow.case_id,
      surgery: caseRow.surgery_list?.[0] || null,
      inject: caseRow.injection_list?.[0] || null,
      injuries: caseRow.injuries,
      settle: String(caseRow.settlement || ''),
      pol_lim: String(caseRow.policy_limits || ''),
      venue: caseRow.venue,
      liab_pct: String(caseRow.liab_pct || ''),
      acc_type: caseRow.acc_type,
      similarity_score: calculateSimilarityScore({
        case_id: caseRow.case_id,
        surgery: caseRow.surgery_list?.[0] || null,
        inject: caseRow.injection_list?.[0] || null,
        injuries: caseRow.injuries,
        settle: String(caseRow.settlement || ''),
        pol_lim: String(caseRow.policy_limits || ''),
        venue: caseRow.venue,
        liab_pct: String(caseRow.liab_pct || ''),
        acc_type: caseRow.acc_type
      }, newCase)
    }));
    
    // Sort by similarity score (highest first) and return top matches
    const topComparables = scoredCases
      .sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0))
      .slice(0, limit);
    
    console.log(`Found ${topComparables.length} comparable cases. Top score: ${topComparables[0]?.similarity_score || 0}`);
    
    return topComparables;
    
  } catch (error) {
    console.error('Error getting comparable cases:', error);
    throw error;
  }
}