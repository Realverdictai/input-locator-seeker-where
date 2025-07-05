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
}

/**
 * Extract 16 features from case data
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

  return {
    howellSpecials: caseData.howell || caseData.howell_num || 0,
    surgeryCount: caseData.surgery_count || surgeryList.length || 0,
    surgeryComplexity,
    injectionCount: caseData.injection_count || (caseData.injection_list?.length || 0),
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
    conflictingMedicalOpinionsFlag
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
    `conflicting:${features.conflictingMedicalOpinionsFlag}`
  ].join(' | ');
}