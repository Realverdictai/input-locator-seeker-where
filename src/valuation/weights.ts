import { supabase } from "@/integrations/supabase/client";

// Static multipliers for injury types and categories
export const INJURY_TYPE_MULTIPLIERS: Record<string, number> = {
  'soft-tissue': 1.0,
  'whiplash': 1.2,
  'herniated-disc': 1.8,
  'fracture': 2.0,
  'traumatic-brain-injury': 2.5,
  'spinal-cord-injury': 3.0,
  'amputation': 4.0
};

export const INJURY_CATEGORY_WEIGHTS: Record<string, number> = {
  spinal: 1.5,
  neurological: 2.0,
  orthopedic: 1.3,
  soft_tissue: 1.0
};

interface CaseRow {
  case_id: number;
  surgery: string | null;
  inject: string | null;
  injuries: string | null;
  settle: string | null;
  pol_lim: string | null;
  venue: string | null;
  liab_pct: string | null;
  acc_type: string | null;
}

interface WeightsCache {
  surgeryWeights: Record<string, number>;
  injectionWeights: Record<string, number>;
  tbiSeverityWeights: Record<string, number>;
  olsSlope: number;
  venueWeights: Record<string, number>;
  lastUpdated: number;
}

let weightsCache: WeightsCache | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Parse a currency string to a number
 */
function parseCurrency(value: string | null): number {
  if (!value) return 0;
  return parseFloat(value.replace(/[$,]/g, '')) || 0;
}

/**
 * Parse liability percentage string to number
 */
function parseLiabilityPct(value: string | null): number {
  if (!value) return 100;
  return parseFloat(value) || 100;
}

/**
 * Calculate comprehensive weights from all cases in database
 */
function calculateWeights(cases: CaseRow[]): WeightsCache {
  const surgeryWeights: Record<string, number> = {};
  const injectionWeights: Record<string, number> = {};
  const venueWeights: Record<string, number> = {};
  
  // Group cases and calculate averages
  const surgeryGroups: Record<string, number[]> = {};
  const injectionGroups: Record<string, number[]> = {};
  const venueGroups: Record<string, number[]> = {};
  const allSettlements: number[] = [];
  const howellSlope: { howell: number; settle: number }[] = [];

  cases.forEach(caseRow => {
    const settlement = (caseRow as any).settle_num || parseCurrency(caseRow.settle);
    if (settlement <= 0) return;

    allSettlements.push(settlement);

    // Estimate Howell from medical specials (70% reduction) for OLS slope
    const estimatedHowell = settlement * 0.4; // Rough estimate for slope calculation
    howellSlope.push({ howell: estimatedHowell, settle: settlement });

    // Group by surgery (clean and normalize)
    if (caseRow.surgery && caseRow.surgery.toLowerCase() !== 'none') {
      const surgeryKey = caseRow.surgery.trim();
      if (!surgeryGroups[surgeryKey]) {
        surgeryGroups[surgeryKey] = [];
      }
      surgeryGroups[surgeryKey].push(settlement);
    }

    // Group by injection (clean and normalize)
    if (caseRow.inject && caseRow.inject.toLowerCase() !== 'none') {
      const injectionKey = caseRow.inject.trim();
      if (!injectionGroups[injectionKey]) {
        injectionGroups[injectionKey] = [];
      }
      injectionGroups[injectionKey].push(settlement);
    }

    // Group by venue
    if (caseRow.venue) {
      const venueKey = caseRow.venue.trim();
      if (!venueGroups[venueKey]) {
        venueGroups[venueKey] = [];
      }
      venueGroups[venueKey].push(settlement);
    }
  });

  const avgSettlement = allSettlements.reduce((a, b) => a + b, 0) / allSettlements.length;

  // Calculate surgery weights (uplift from average)
  Object.keys(surgeryGroups).forEach(surgery => {
    const surgeryAvg = surgeryGroups[surgery].reduce((a, b) => a + b, 0) / surgeryGroups[surgery].length;
    surgeryWeights[surgery] = surgeryAvg - avgSettlement; // Absolute uplift
  });

  // Calculate injection weights (uplift from average)
  Object.keys(injectionGroups).forEach(injection => {
    const injectionAvg = injectionGroups[injection].reduce((a, b) => a + b, 0) / injectionGroups[injection].length;
    injectionWeights[injection] = injectionAvg - avgSettlement; // Absolute uplift
  });

  // Calculate venue weights (percentage adjustment)
  Object.keys(venueGroups).forEach(venue => {
    const venueName = venue.toLowerCase();
    
    // Liberal venues get +3%, conservative get -3%, others 0%
    if (venueName.includes('los angeles') || venueName.includes('san francisco') || venueName.includes('alameda')) {
      venueWeights[venue] = 0.03;
    } else if (venueName.includes('orange') || venueName.includes('kern') || venueName.includes('placer')) {
      venueWeights[venue] = -0.03;
    } else {
      venueWeights[venue] = 0;
    }
  });

  // Calculate OLS slope for Howell -> Settlement
  let sumXY = 0, sumX = 0, sumY = 0, sumX2 = 0;
  const n = howellSlope.length;
  
  howellSlope.forEach(point => {
    sumXY += point.howell * point.settle;
    sumX += point.howell;
    sumY += point.settle;
    sumX2 += point.howell * point.howell;
  });

  const olsSlope = n > 0 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 1.8;

  // TBI severity weights (defense-perspective multipliers)
  const tbiSeverityWeights: Record<string, number> = {
    '0': 0,        // No TBI
    '1': 15000,    // Mild TBI - modest uplift
    '2': 45000,    // Moderate TBI - significant uplift
    '3': 125000    // Severe TBI - major uplift
  };

  return {
    surgeryWeights,
    injectionWeights,
    tbiSeverityWeights,
    olsSlope: Math.max(1.2, Math.min(2.5, olsSlope)), // Constrain between 1.2-2.5
    venueWeights,
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
    .select('case_id, surgery, inject, injuries, settle, pol_lim, venue, liab_pct, acc_type');

  if (error) {
    console.error('Error fetching cases for weights calculation:', error);
    throw error;
  }

  if (!cases || cases.length === 0) {
    throw new Error('No cases available for weights calculation');
  }

  console.log(`Calculating weights from ${cases.length} cases`);
  
  // Calculate and cache weights
  weightsCache = calculateWeights(cases);
  return weightsCache;
}