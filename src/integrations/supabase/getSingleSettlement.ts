import { supabase } from "@/integrations/supabase/client";

interface NewCase {
  Venue: string;
  Surgery: string;
  Injuries: string;
  LiabPct: string;
  AccType: string;
  PolLim: string;
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

interface SingleSettlementResult {
  amount: string;
  sourceCaseID: number;
}

/**
 * Parse a currency string to a number
 */
function parseCurrency(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(/[$,]/g, '')) || 0;
}

/**
 * Format a number as currency with commas
 */
function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`;
}

/**
 * Calculate similarity score between input case and database case
 */
function calculateSimilarity(input: NewCase, dbCase: CaseRow): number {
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
 * Get single settlement amount from the 25 most similar cases
 */
export async function getSingleSettlement(newCase: NewCase): Promise<SingleSettlementResult> {
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
      return {
        amount: "$0",
        sourceCaseID: 0
      };
    }

    // Calculate similarity scores for each case
    const scoredCases: ScoredCase[] = cases.map(dbCase => ({
      ...dbCase,
      score: calculateSimilarity(newCase, dbCase)
    }));

    // Sort by score (highest first) and take top 25
    const top25Cases = scoredCases
      .sort((a, b) => b.score - a.score)
      .slice(0, 25);

    // Parse settle values into numbers for the top 25
    const settleValues = top25Cases
      .map(c => ({ 
        amount: parseCurrency(c.settle || ''), 
        caseId: c.case_id 
      }))
      .filter(item => item.amount > 0);

    if (settleValues.length === 0) {
      return {
        amount: "$0",
        sourceCaseID: 0
      };
    }

    // Calculate midpoint of the top 25 cases
    const amounts = settleValues.map(item => item.amount);
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    const midpoint = (min + max) / 2;

    // Find the settlement closest to the midpoint
    let closestAmount = settleValues[0].amount;
    let closestCaseId = settleValues[0].caseId;
    let minDistance = Math.abs(settleValues[0].amount - midpoint);
    
    for (const item of settleValues) {
      const distance = Math.abs(item.amount - midpoint);
      if (distance < minDistance || (distance === minDistance && item.amount < closestAmount)) {
        closestAmount = item.amount;
        closestCaseId = item.caseId;
        minDistance = distance;
      }
    }

    return {
      amount: formatCurrency(closestAmount),
      sourceCaseID: closestCaseId
    };

  } catch (error) {
    console.error('Error getting single settlement:', error);
    throw error;
  }
}