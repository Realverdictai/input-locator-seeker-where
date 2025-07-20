/**
 * Enhanced feature extraction for AI-first case evaluation
 */

// Venue CPI index mapping (economics-based adjustment)
const VENUE_CPI_INDEX: { [key: string]: number } = {
  'Los Angeles': 1.15,
  'San Francisco': 1.22,
  'New York': 1.18,
  'Chicago': 1.08,
  'Miami': 1.12,
  'Dallas': 1.05,
  'Atlanta': 1.03,
  'Phoenix': 1.02,
  'Denver': 1.07,
  'Seattle': 1.14,
  // Default for unknown venues
  'default': 1.00
};

// Surgery complexity scoring
const SURGERY_COMPLEXITY: { [key: string]: number } = {
  'fusion': 3,
  'discReplacement': 3,
  'acl': 2,
  'rotator': 2,
  'arthroscopy': 1,
  'default': 1.5
};

// Vehicle size index for mismatch calculations
const VEHICLE_SIZE_INDEX: Record<string, number> = {
  pedestrian: 0,
  bicycle: 1,
  motorcycle: 2,
  compact: 3,
  midsize: 4,
  fullsize: 5,
  'suv-small': 6,
  'suv-midsize': 7,
  'suv-large': 8,
  'truck-pickup': 9,
  'truck-commercial': 10,
  other: 5
};

// Risk multipliers for dangerous vehicle combinations
const VEHICLE_RISK_FACTORS: Record<string, number> = {
  'pedestrian_vs_vehicle': 1.8,
  'bicycle_vs_vehicle': 1.6,
  'motorcycle_vs_vehicle': 1.5,
  'vehicle_vs_truck-commercial': 1.3,
};

const IMPACT_PATTERN_SCORES: Record<string, number> = {
  'truck-commercial_vs_pedestrian': 2.0,
  'truck-commercial_vs_compact': 1.4,
  'truck-commercial_vs_motorcycle': 1.6,
  'suv-large_vs_motorcycle': 1.5,
};

// Injury severity scores for weighting
export const INJURY_SEVERITY_SCORES: Record<string, number> = {
  'soft-tissue': 1,
  'whiplash': 2,
  'contusion': 2,
  'strain-sprain': 2,
  'herniated-disc': 4,
  'bulging-disc': 3,
  'fracture': 5,
  'traumatic-brain-injury': 6,
  'spinal-cord-injury': 7,
  'amputation': 8,
  'other': 3
};

export interface CaseFeatures {
  howellSpecials: number;
  surgeryCount: number;
  surgeryComplexity: number;
  injectionCount: number;
  tbiSeverity: number;
  medTreatmentGapDays: number;
  totalTreatmentDuration: number;
  liabilityPct: number;
  policyLimitRatio: number;
  venueCpiIndex: number;
  caseVintageYears: number;
  priorAccidentsFlag: number;
  subsequentAccidentsFlag: number;
  preExistingConditionFlag: number;
  nonComplianceFlag: number;
  conflictingMedicalOpinionsFlag: number;
  vehicleDamageScore: number;
  primaryInjuryType: string;
  injuryTypeCount: number;
  hasSoftTissue: number;
  hasSpinalInjury: number;
  hasBrainInjury: number;
  hasFracture: number;
  injurySeverityScore: number;
  vehicleSizeDiff: number;
  vehicleRiskFactor: number;
  safetyRatingScore: number;
  impactPatternScore: number;
  caseMainCategory: string;
  accidentSubType: string;
  caseTypeComplexity: number;
  caseCategoryMultiplier: number;
}

/**
 * Extract structured features from case data, including injury types
 */
export function extractFeatures(caseData: any, narrativeText?: string): CaseFeatures {
  // Parse dates for vintage calculation
  const dolDate = caseData.dol ? new Date(caseData.dol) : new Date();
  const currentDate = new Date();
  const vintageYears = (currentDate.getTime() - dolDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

  // Calculate surgery complexity score
  const surgeryList = caseData.surgery_list || [];
  let surgeryComplexity = 0;
  surgeryList.forEach((surgery: string) => {
    const surgeryKey = Object.keys(SURGERY_COMPLEXITY).find(key => 
      surgery.toLowerCase().includes(key.toLowerCase())
    );
    surgeryComplexity += SURGERY_COMPLEXITY[surgeryKey || 'default'];
  });

  // Get venue CPI index
  const venue = caseData.venue || '';
  const venueCpiIndex = VENUE_CPI_INDEX[venue] || VENUE_CPI_INDEX['default'];

  // Calculate policy limit ratio
  const settlement = caseData.settlement || caseData.settle_num || 0;
  const policyLimits = caseData.policy_limits || caseData.policy_limits_num || 1;
  const policyLimitRatio = settlement / Math.max(policyLimits, 1);

  // Extract narrative flags (using regex patterns)
  const narrative = narrativeText || caseData.narrative || '';
  const priorAccidentsFlag = extractNarrativeFlag(narrative, [
    /prior accident/gi,
    /previous accident/gi,
    /history of accident/gi
  ]);

  const subsequentAccidentsFlag = extractNarrativeFlag(narrative, [
    /subsequent accident/gi,
    /later accident/gi,
    /additional accident.*during treatment/gi
  ]);

  const preExistingConditionFlag = extractNarrativeFlag(narrative, [
    /pre-existing/gi,
    /preexisting/gi,
    /prior condition/gi,
    /degenerative/gi
  ]);

  const nonComplianceFlag = extractNarrativeFlag(narrative, [
    /non-compliant/gi,
    /missed appointment/gi,
    /gap.*treatment.*120/gi,
    /failed to follow/gi
  ]);

  const conflictingMedicalOpinionsFlag = extractNarrativeFlag(narrative, [
    /conflicting opinion/gi,
    /medical dispute/gi,
    /disagreement.*diagnosis/gi
  ]);

  // Extract treatment gaps and duration
  const medTreatmentGapDays = extractTreatmentGaps(narrative);
  const totalTreatmentDuration = extractTreatmentDuration(narrative);

  const vehicleDamageScore = caseData.damageScore || 0;

  // ---- Injury type processing ----
  let injuryTypes: string[] = [];
  if (Array.isArray(caseData.injuryTypes)) {
    injuryTypes = caseData.injuryTypes;
  } else if (typeof caseData.injuryType === 'string') {
    injuryTypes = [caseData.injuryType];
  } else if (typeof caseData.injuries === 'string') {
    injuryTypes = caseData.injuries.split(/[;,]/).map((i: string) => i.trim()).filter(Boolean);
  }
  injuryTypes = injuryTypes.map(i => i.toLowerCase());

  let primaryInjuryType = '';
  let injurySeverityScore = 0;
  let highestScore = 0;
  injuryTypes.forEach(type => {
    const score = INJURY_SEVERITY_SCORES[type] ?? INJURY_SEVERITY_SCORES['other'];
    injurySeverityScore += score;
    if (score > highestScore) {
      highestScore = score;
      primaryInjuryType = type;
    }
  });

  const hasSoftTissue = injuryTypes.some(t => ['soft-tissue','whiplash','contusion','strain-sprain'].includes(t)) ? 1 : 0;
  const hasSpinalInjury = injuryTypes.some(t => ['herniated-disc','bulging-disc','spinal-cord-injury'].includes(t)) ? 1 : 0;
  const hasBrainInjury = injuryTypes.includes('traumatic-brain-injury') ? 1 : 0;
  const hasFracture = injuryTypes.includes('fracture') ? 1 : 0;

  // ---- Vehicle analysis ----
  const pVehicle = (caseData.plaintiffVehicleSize || '').toLowerCase();
  const dVehicle = (caseData.defendantVehicleSize || '').toLowerCase();
  const pIndex = VEHICLE_SIZE_INDEX[pVehicle as keyof typeof VEHICLE_SIZE_INDEX] ?? 5;
  const dIndex = VEHICLE_SIZE_INDEX[dVehicle as keyof typeof VEHICLE_SIZE_INDEX] ?? 5;
  const vehicleSizeDiff = Math.abs(pIndex - dIndex);

  const riskCombo = `${pVehicle}_vs_${dVehicle}`;
  const reverseCombo = `${dVehicle}_vs_${pVehicle}`;
  const vehicleRiskFactor = VEHICLE_RISK_FACTORS[riskCombo] ?? VEHICLE_RISK_FACTORS[reverseCombo] ?? 1;

  const impactPatternScore = IMPACT_PATTERN_SCORES[riskCombo] ?? IMPACT_PATTERN_SCORES[reverseCombo] ?? 1;

  const pSafety = parseFloat(caseData.plaintiffSafetyRating) || 3;
  const dSafety = parseFloat(caseData.defendantSafetyRating) || 3;
  const safetyRatingScore = 5 - ((pSafety + dSafety) / 2);

  return {
    howellSpecials: caseData.howell || caseData.howell_num || 0,
    surgeryCount: caseData.surgery_count || surgeryList.length || 0,
    surgeryComplexity,
    injectionCount: caseData.injection_count || caseData.injections || (caseData.injection_list?.length || 0),
    tbiSeverity: caseData.tbiLevel || 0,
    medTreatmentGapDays,
    totalTreatmentDuration,
    liabilityPct: caseData.liab_pct || caseData.liab_pct_num || 100,
    policyLimitRatio,
    venueCpiIndex,
    caseVintageYears: Math.max(0, vintageYears),
    priorAccidentsFlag,
    subsequentAccidentsFlag,
    preExistingConditionFlag,
    nonComplianceFlag,
    conflictingMedicalOpinionsFlag,
    vehicleDamageScore,
    primaryInjuryType,
    injuryTypeCount: injuryTypes.length,
    hasSoftTissue,
    hasSpinalInjury,
    hasBrainInjury,
    hasFracture,
    injurySeverityScore,
    vehicleSizeDiff,
    vehicleRiskFactor,
    safetyRatingScore,
    impactPatternScore,
    caseMainCategory: caseData.caseCategory || '',
    accidentSubType: caseData.accidentSubType || '',
    caseTypeComplexity: getCaseComplexity(caseData.caseCategory),
    caseCategoryMultiplier: getCategoryMultiplier(caseData.caseCategory)
  };
}

/**
 * Extract narrative flags using regex patterns
 */
function extractNarrativeFlag(narrative: string, patterns: RegExp[]): number {
  return patterns.some(pattern => pattern.test(narrative)) ? 1 : 0;
}

/**
 * Extract maximum treatment gap in days
 */
function extractTreatmentGaps(narrative: string): number {
  const gapMatches = narrative.match(/gap.*?(\d+).*?days?/gi) || [];
  const gaps = gapMatches.map(match => {
    const numbers = match.match(/\d+/g);
    return numbers ? parseInt(numbers[0]) : 0;
  });
  return Math.max(0, ...gaps);
}

/**
 * Extract total treatment duration in days
 */
function extractTreatmentDuration(narrative: string): number {
  // Look for treatment duration patterns
  const durationMatches = narrative.match(/treatment.*?(\d+).*?(months?|days?)/gi) || [];
  let totalDays = 0;
  
  durationMatches.forEach(match => {
    const isMonths = /months?/i.test(match);
    const numbers = match.match(/\d+/g);
    if (numbers) {
      const value = parseInt(numbers[0]);
      totalDays += isMonths ? value * 30 : value;
    }
  });
  
  return totalDays || 365; // Default to 1 year if no duration found
}

/**
 * Serialize features for embedding
 */
export function serializeFeaturesForEmbedding(features: CaseFeatures): string {
  return [
    `howell:${features.howellSpecials}`,
    `surgery:${features.surgeryCount}`,
    `complexity:${features.surgeryComplexity}`,
    `injections:${features.injectionCount}`,
    `tbi:${features.tbiSeverity}`,
    `gap:${features.medTreatmentGapDays}`,
    `duration:${features.totalTreatmentDuration}`,
    `liability:${features.liabilityPct}`,
    `ratio:${features.policyLimitRatio.toFixed(2)}`,
    `venue:${features.venueCpiIndex}`,
    `vintage:${features.caseVintageYears.toFixed(1)}`,
    `prior:${features.priorAccidentsFlag}`,
    `subsequent:${features.subsequentAccidentsFlag}`,
    `preexisting:${features.preExistingConditionFlag}`,
    `noncompliant:${features.nonComplianceFlag}`,
    `conflicting:${features.conflictingMedicalOpinionsFlag}`,
    `damage:${features.vehicleDamageScore}`,
    `primary:${features.primaryInjuryType}`,
    `injuryCount:${features.injuryTypeCount}`,
    `soft:${features.hasSoftTissue}`,
    `spinal:${features.hasSpinalInjury}`,
    `brain:${features.hasBrainInjury}`,
    `fracture:${features.hasFracture}`,
    `severity:${features.injurySeverityScore}`,
    `sizeDiff:${features.vehicleSizeDiff}`,
    `risk:${features.vehicleRiskFactor}`,
    `safety:${features.safetyRatingScore}`,
    `impact:${features.impactPatternScore}`,
    `category:${features.caseMainCategory}`,
    `subtype:${features.accidentSubType}`,
    `complexity:${features.caseTypeComplexity}`,
    `catmult:${features.caseCategoryMultiplier}`
  ].join(' | ');
}

function getCaseComplexity(category?: string): number {
  switch (category) {
    case 'medical-malpractice':
      return 3;
    case 'product-liability':
      return 2.5;
    case 'workers-compensation':
      return 1.5;
    default:
      return 1;
  }
}

function getCategoryMultiplier(category?: string): number {
  const multipliers: Record<string, number> = {
    'personal-injury': 1.0,
    'workers-compensation': 0.85,
    'medical-malpractice': 1.4,
    'product-liability': 1.2,
    'premises-liability': 0.9
  };
  return multipliers[category || ''] || 1.0;
}
