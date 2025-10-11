import { supabase } from "@/integrations/supabase/client";

interface ComparableInput {
  Venue: string;
  Surgery: string;
  Injuries: string;
  LiabPct: string;
  AccType: string;
  PolLim: string;
}

interface ComparableResult {
  CaseID: number;
  CaseType: string;
  Venue: string;
  Surgery: string;
  Injuries: string;
  LiabPct: string;
  PolLim: string;
  Settle: string;
}

interface CaseRow {
  case_id: number;
  case_type: string;
  venue: string | null;
  surgery: string | null;
  injuries: string | null;
  liab_pct: string | null;
  pol_lim: string | null;
  settle: string | null;
  acc_type: string | null;
}

interface ScoredCase extends CaseRow {
  score: number;
}

/**
 * Calculate similarity score between input case and database case
 */
function calculateSimilarity(input: ComparableInput, dbCase: CaseRow): number {
  let score = 0;

  // 1. Same Venue (highest priority)
  if (input.Venue && dbCase.venue && input.Venue.toLowerCase() === dbCase.venue.toLowerCase()) {
    score += 100;
  }

  // 2. Same Surgery text
  if (input.Surgery && dbCase.surgery && input.Surgery.toLowerCase() === dbCase.surgery.toLowerCase()) {
    score += 50;
  }

  // 3. Overlapping words in Injuries
  if (input.Injuries && dbCase.injuries) {
    const inputWords = input.Injuries.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const dbWords = dbCase.injuries.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    const overlappingWords = inputWords.filter(word => 
      dbWords.some(dbWord => dbWord.includes(word) || word.includes(dbWord))
    );
    
    const overlapScore = (overlappingWords.length / Math.max(inputWords.length, 1)) * 25;
    score += overlapScore;
  }

  // 4. Liability % within ±25
  if (input.LiabPct && dbCase.liab_pct) {
    const inputLiab = parseFloat(input.LiabPct.replace('%', ''));
    const dbLiab = parseFloat(dbCase.liab_pct.replace('%', ''));
    
    if (!isNaN(inputLiab) && !isNaN(dbLiab)) {
      const difference = Math.abs(inputLiab - dbLiab);
      if (difference <= 25) {
        score += Math.max(0, 15 - (difference / 25 * 15));
      }
    }
  }

  // 5. Same Accident type
  if (input.AccType && dbCase.acc_type && input.AccType.toLowerCase() === dbCase.acc_type.toLowerCase()) {
    score += 10;
  }

  return score;
}

/**
 * Find the 5 most similar cases from the cases_master table
 */
export async function findComparables(input: ComparableInput): Promise<ComparableResult[]> {
  try {
    // Query all cases from the database (excluding narrative)
    const { data: cases, error } = await supabase
      .from('cases_master')
      .select(`
        case_id,
        case_type,
        venue,
        surgery,
        injuries,
        liab_pct,
        pol_lim,
        settle,
        acc_type
      `);

    if (error) {
      throw error;
    }

    if (!cases || cases.length === 0) {
      return [];
    }

    // Calculate similarity scores for each case
    const scoredCases: ScoredCase[] = cases.map(dbCase => ({
      ...dbCase,
      score: calculateSimilarity(input, dbCase)
    }));

    // Sort by score (highest first) and take top 5
    const topCases = scoredCases
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Transform to expected output format
    const results: ComparableResult[] = topCases.map(caseData => ({
      CaseID: caseData.case_id,
      CaseType: caseData.case_type,
      Venue: caseData.venue || '',
      Surgery: caseData.surgery || '',
      Injuries: caseData.injuries || '',
      LiabPct: caseData.liab_pct || '',
      PolLim: caseData.pol_lim || '',
      Settle: caseData.settle || ''
    }));

    return results;

  } catch (error) {
    console.error('Error finding comparables:', error);
    throw error;
  }
}