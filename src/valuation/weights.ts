import { supabase } from "@/integrations/supabase/client";

interface CaseRow {
  case_id: number;
  surgery: string | null;
  inject: string | null;
  injuries: string | null;
  settle: string | null;
  pol_lim: string | null;
  venue: string | null;
}

interface WeightsCache {
  surgeryWeights: Record<string, number>;
  injectionWeights: Record<string, number>;
  tbiSeverityWeights: Record<string, number>;
  medicalSpecialsSlope: number;
  howellSpecialsSlope: number;
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
 * Calculate comprehensive weights from all 313 cases
 */
function calculateWeights(cases: CaseRow[]): WeightsCache {
  const surgeryWeights: Record<string, number> = {};
  const injectionWeights: Record<string, number> = {};
  const venueWeights: Record<string, number> = {};
  
  // Group cases by surgery type and calculate average settlements
  const surgeryGroups: Record<string, number[]> = {};
  const injectionGroups: Record<string, number[]> = {};
  const venueGroups: Record<string, number[]> = {};
  const allSettlements: number[] = [];

  cases.forEach(caseRow => {
    const settlement = parseCurrency(caseRow.settle);
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

    // Group by venue
    if (caseRow.venue) {
      if (!venueGroups[caseRow.venue]) {
        venueGroups[caseRow.venue] = [];
      }
      venueGroups[caseRow.venue].push(settlement);
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

  // Calculate venue weights as percentage adjustment
  Object.keys(venueGroups).forEach(venue => {
    const venueAvg = venueGroups[venue].reduce((a, b) => a + b, 0) / venueGroups[venue].length;
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

  // TBI severity weights (defense-perspective)
  const tbiSeverityWeights: Record<string, number> = {
    'mild': 0.85,     // Reduces settlement by 15%
    'moderate': 1.15, // Increases by 15%
    'severe': 1.45    // Increases by 45%
  };

  return {
    surgeryWeights,
    injectionWeights,
    tbiSeverityWeights,
    venueWeights,
    medicalSpecialsSlope: 0.75, // Conservative: $0.75 per $1 of medical specials
    howellSpecialsSlope: 0.95,  // Howell specials more closely tracked
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
    .select('case_id, surgery, inject, injuries, settle, pol_lim, venue');

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