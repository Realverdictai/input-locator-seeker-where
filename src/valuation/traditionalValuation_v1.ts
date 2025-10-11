/**
 * Traditional case valuation methods for fallback when AI confidence is low
 */

export interface TraditionalValuationResult {
  estimatedValue: number;
  method: string;
  factors: string[];
  confidence: number;
}

/**
 * Calculate case value using traditional methods when AI confidence is low
 */
export function calculateTraditionalValuation(caseData: any, narrativeText?: string): TraditionalValuationResult {
  const factors: string[] = [];
  let baseValue = 0;

  // 1. Medical Special Damages (3x multiplier baseline)
  const medicalSpecials = caseData.howell || caseData.howell_num || 0;
  if (medicalSpecials > 0) {
    baseValue = medicalSpecials * 3;
    factors.push(`Medical specials: $${medicalSpecials.toLocaleString()} × 3 = $${baseValue.toLocaleString()}`);
  } else {
    // Estimate based on injury severity if no specials provided
    baseValue = estimateBasedOnInjuries(caseData);
    factors.push(`Estimated based on injury type: $${baseValue.toLocaleString()}`);
  }

  // 2. Surgery multiplier
  const surgeryCount = caseData.surgery_count || (caseData.surgery_list?.length || 0);
  if (surgeryCount > 0) {
    const surgeryMultiplier = 1 + (surgeryCount * 0.5); // 50% increase per surgery
    baseValue *= surgeryMultiplier;
    factors.push(`Surgery adjustment: ${surgeryCount} surgeries (+${((surgeryMultiplier - 1) * 100).toFixed(0)}%)`);
  }

  // 3. Injection adjustments
  const injectionCount = caseData.injection_count || caseData.injections || 0;
  if (injectionCount > 0) {
    const injectionBonus = injectionCount * 25000; // $25k per injection
    baseValue += injectionBonus;
    factors.push(`Injections: ${injectionCount} × $25,000 = +$${injectionBonus.toLocaleString()}`);
  }

  // 4. Liability percentage adjustment
  const liabilityPct = caseData.liab_pct || caseData.liab_pct_num || 100;
  if (liabilityPct < 100) {
    baseValue *= (liabilityPct / 100);
    factors.push(`Liability adjustment: ${liabilityPct}%`);
  }

  // 5. Age and wage loss considerations
  const age = caseData.age || 35; // Default middle age
  if (age < 30) {
    baseValue *= 1.2; // Younger plaintiffs get higher awards
    factors.push(`Age factor: Under 30 (+20%)`);
  } else if (age > 65) {
    baseValue *= 0.8; // Older plaintiffs get lower awards
    factors.push(`Age factor: Over 65 (-20%)`);
  }

  // 6. Venue considerations (conservative estimates)
  const venue = caseData.venue || '';
  const venueMultiplier = getVenueMultiplier(venue);
  if (venueMultiplier !== 1.0) {
    baseValue *= venueMultiplier;
    factors.push(`Venue adjustment: ${venue} (${venueMultiplier > 1 ? '+' : ''}${((venueMultiplier - 1) * 100).toFixed(0)}%)`);
  }

  // 7. Policy limits cap
  const policyLimits = caseData.policyLimits || caseData.policy_limits_num;
  if (policyLimits && baseValue > policyLimits) {
    factors.push(`Capped at policy limits: $${policyLimits.toLocaleString()}`);
    baseValue = policyLimits;
  }

  return {
    estimatedValue: Math.round(baseValue),
    method: 'Traditional Multiplier Method',
    factors,
    confidence: 75 // Traditional methods have moderate confidence
  };
}

/**
 * Estimate value based on injury descriptions when no medical specials available
 */
function estimateBasedOnInjuries(caseData: any): number {
  const injuries = (caseData.injuries || '').toLowerCase();
  
  // TBI cases
  if (injuries.includes('tbi') || injuries.includes('brain injury')) {
    return 150000; // Higher baseline for TBI
  }
  
  // Spinal injuries
  if (injuries.includes('spinal') || injuries.includes('disc') || injuries.includes('vertebra')) {
    return 100000;
  }
  
  // Fractures
  if (injuries.includes('fracture') || injuries.includes('broken')) {
    return 75000;
  }
  
  // Soft tissue
  if (injuries.includes('strain') || injuries.includes('sprain') || injuries.includes('whiplash')) {
    return 25000;
  }
  
  // Default for unknown injuries
  return 50000;
}

/**
 * Get venue multiplier for traditional valuation
 */
function getVenueMultiplier(venue: string): number {
  const venueMultipliers: { [key: string]: number } = {
    'Los Angeles': 1.3,
    'San Francisco': 1.4,
    'New York': 1.35,
    'Chicago': 1.15,
    'Miami': 1.2,
    'Dallas': 1.1,
    'Atlanta': 1.05,
    'Phoenix': 1.0,
    'Denver': 1.1,
    'Seattle': 1.25
  };
  
  return venueMultipliers[venue] || 1.0;
}