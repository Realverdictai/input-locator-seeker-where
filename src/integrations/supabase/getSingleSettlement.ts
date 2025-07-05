import { supabase } from "@/integrations/supabase/client";
import { getWeights } from "@/integrations/supabase/getWeights";

interface NewCase {
  Venue?: string;
  Surgery?: string;
  Injuries: string;
  LiabPct?: string;
  AccType?: string;
  PolLim: string;
  medicalSpecials?: number;
  howellSpecials?: number;
  tbiSeverity?: string;
  surgeryType?: string;
  injectionType?: string;
  surgeries?: number;
  injections?: number;
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
  proposal: string;
  rationale: string;
  sourceCaseIDs: number[];
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
 * Get single settlement amount using data-driven linear model
 */
export async function getSingleSettlement(newCase: NewCase): Promise<SingleSettlementResult> {
  try {
    // Get all cases from database
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
        acc_type,
        inject
      `);

    if (error) {
      throw error;
    }

    if (!cases || cases.length === 0) {
      return {
        proposal: "$0",
        rationale: "No comparable cases found.",
        sourceCaseIDs: []
      };
    }

    // Calculate similarity scores for each case
    const scoredCases: ScoredCase[] = cases.map(dbCase => ({
      ...dbCase,
      score: calculateSimilarity(newCase, dbCase)
    }));

    // Sort by score and take top 25
    const top25Cases = scoredCases
      .sort((a, b) => b.score - a.score)
      .slice(0, 25);

    // Get weights for linear model
    const weights = await getWeights();

    // Apply linear model to new case
    let baseSettlement = 0;
    
    // Start with average of top 25 comparable cases
    const comparableSettlements = top25Cases
      .map(c => parseCurrency(c.settle || ''))
      .filter(amount => amount > 0);
    
    if (comparableSettlements.length > 0) {
      baseSettlement = comparableSettlements.reduce((a, b) => a + b, 0) / comparableSettlements.length;
    }

    // Apply surgery weight
    if (newCase.surgeryType && newCase.surgeryType !== 'none' && weights.surgeryWeights[newCase.surgeryType]) {
      baseSettlement *= weights.surgeryWeights[newCase.surgeryType];
    }

    // Apply injection weight
    if (newCase.injectionType && newCase.injectionType !== 'none' && weights.injectionWeights[newCase.injectionType]) {
      baseSettlement *= weights.injectionWeights[newCase.injectionType];
    }

    // Apply TBI severity weight
    if (newCase.tbiSeverity && weights.tbiSeverityWeights[newCase.tbiSeverity]) {
      baseSettlement *= weights.tbiSeverityWeights[newCase.tbiSeverity];
    }

    // Add medical specials impact
    if (newCase.medicalSpecials) {
      baseSettlement += newCase.medicalSpecials * weights.medicalSpecialsSlope;
    }

    // Add Howell specials impact
    if (newCase.howellSpecials) {
      baseSettlement += newCase.howellSpecials * weights.howellSpecialsSlope;
    }

    // Round to nearest $500
    const finalSettlement = Math.round(baseSettlement / 500) * 500;

    // Get source case IDs from top 3 most similar
    const sourceCaseIDs = top25Cases.slice(0, 3).map(c => c.case_id);

    // Create rationale
    const rationale = `Based on analysis of ${top25Cases.length} comparable cases, considering ${
      newCase.surgeryType && newCase.surgeryType !== 'none' ? `${newCase.surgeryType} surgery, ` : ''
    }${
      newCase.injectionType && newCase.injectionType !== 'none' ? `${newCase.injectionType} injections, ` : ''
    }${
      newCase.tbiSeverity ? `${newCase.tbiSeverity} TBI, ` : ''
    }and medical treatment patterns.`;

    return {
      proposal: formatCurrency(finalSettlement),
      rationale,
      sourceCaseIDs
    };

  } catch (error) {
    console.error('Error getting single settlement:', error);
    throw error;
  }
}