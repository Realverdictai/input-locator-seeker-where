import { supabase } from "@/integrations/supabase/client";

interface CaseRow {
  case_id: number;
  surgery: string | null;
  inject: string | null;
  injuries: string | null;
  settle: string | null;
  pol_lim: string | null;
}

interface WeightsCache {
  surgeryWeights: Record<string, number>;
  injectionWeights: Record<string, number>;
  tbiSeverityWeights: Record<string, number>;
  medicalSpecialsSlope: number;
  howellSpecialsSlope: number;
  lastUpdated: number;
}

let weightsCache: WeightsCache | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Parse a currency string to a number
 */
function parseCurrency(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(/[$,]/g, '')) || 0;
}

/**
 * Calculate average settlement uplift for each category
 */
function calculateWeights(cases: CaseRow[]): WeightsCache {
  const surgeryWeights: Record<string, number> = {};
  const injectionWeights: Record<string, number> = {};
  const tbiSeverityWeights: Record<string, number> = {};

  // Group cases by surgery type and calculate average settlements
  const surgeryGroups: Record<string, number[]> = {};
  const injectionGroups: Record<string, number[]> = {};
  const allSettlements: number[] = [];

  cases.forEach(caseRow => {
    const settlement = parseCurrency(caseRow.settle || '');
    if (settlement <= 0) return;

    allSettlements.push(settlement);

    // Group by surgery
    if (caseRow.surgery && caseRow.surgery.toLowerCase() !== 'none') {
      if (!surgeryGroups[caseRow.surgery]) {
        surgeryGroups[caseRow.surgery] = [];
      }
      surgeryGroups[caseRow.surgery].push(settlement);
    }

    // Group by injection
    if (caseRow.inject && caseRow.inject.toLowerCase() !== 'none') {
      if (!injectionGroups[caseRow.inject]) {
        injectionGroups[caseRow.inject] = [];
      }
      injectionGroups[caseRow.inject].push(settlement);
    }
  });

  const avgSettlement = allSettlements.reduce((a, b) => a + b, 0) / allSettlements.length;

  // Calculate surgery weights as ratio vs average
  Object.keys(surgeryGroups).forEach(surgery => {
    const surgeryAvg = surgeryGroups[surgery].reduce((a, b) => a + b, 0) / surgeryGroups[surgery].length;
    surgeryWeights[surgery] = surgeryAvg / avgSettlement;
  });

  // Calculate injection weights as ratio vs average
  Object.keys(injectionGroups).forEach(injection => {
    const injectionAvg = injectionGroups[injection].reduce((a, b) => a + b, 0) / injectionGroups[injection].length;
    injectionWeights[injection] = injectionAvg / avgSettlement;
  });

  // TBI severity weights (conservative, defense-perspective)
  tbiSeverityWeights['mild'] = 0.8;    // Reduces settlement by 20%
  tbiSeverityWeights['moderate'] = 1.1; // Increases by 10%
  tbiSeverityWeights['severe'] = 1.4;   // Increases by 40%

  return {
    surgeryWeights,
    injectionWeights,
    tbiSeverityWeights,
    medicalSpecialsSlope: 0.7, // Conservative: $0.70 per $1 of medical specials
    howellSpecialsSlope: 0.9,  // Howell specials more closely tracked
    lastUpdated: Date.now()
  };
}

/**
 * Get cached weights or compute them from database
 */
export async function getWeights(): Promise<WeightsCache> {
  // Return cached weights if still valid
  if (weightsCache && (Date.now() - weightsCache.lastUpdated) < CACHE_DURATION) {
    return weightsCache;
  }

  // Fetch all cases from database
  const { data: cases, error } = await supabase
    .from('cases_master')
    .select('case_id, surgery, inject, injuries, settle, pol_lim');

  if (error) {
    console.error('Error fetching cases for weights calculation:', error);
    throw error;
  }

  if (!cases || cases.length === 0) {
    throw new Error('No cases available for weights calculation');
  }

  // Calculate and cache weights
  weightsCache = calculateWeights(cases);
  return weightsCache;
}

/**
 * Get distinct values from database for dropdowns
 */
export async function getDistinctValues(): Promise<{
  surgeries: string[];
  injections: string[];
}> {
  const { data: cases, error } = await supabase
    .from('cases_master')
    .select('surgery, inject');

  if (error) {
    console.error('Error fetching distinct values:', error);
    return { surgeries: [], injections: [] };
  }

  const surgeries = [...new Set(
    cases?.map(c => c.surgery).filter(s => s && s.toLowerCase() !== 'none') || []
  )].sort();

  const injections = [...new Set(
    cases?.map(c => c.inject).filter(i => i && i.toLowerCase() !== 'none') || []
  )].sort();

  return { surgeries, injections };
}