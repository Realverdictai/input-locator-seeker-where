/**
 * Smart deduction layer for case evaluation
 */

export interface Deduction {
  name: string;
  pct: number;
  triggered: boolean;
  reason?: string;
}

export interface DeductionResult {
  deductions: Deduction[];
  totalDeductionPct: number;
  evaluatorAfterDeductions: number;
}

/**
 * Apply smart deductions to base prediction
 */
export function applyDeductions(
  basePrediction: number, 
  caseData: any, 
  narrativeText?: string
): DeductionResult {
  const narrative = narrativeText || caseData.narrative || '';
  const deductions: Deduction[] = [];

  // 1. Subsequent accidents during treatment (15-25%, default 20%)
  const subsequentAccident = checkSubsequentAccident(narrative);
  deductions.push({
    name: 'Subsequent accident during treatment',
    pct: subsequentAccident ? -20 : 0,
    triggered: subsequentAccident,
    reason: subsequentAccident ? 'Additional accident occurred during treatment period' : undefined
  });

  // 2. Treatment gap > 90 days (10-15%, default 12%)
  const treatmentGap = checkTreatmentGap(narrative);
  deductions.push({
    name: 'Treatment gap >90 days',
    pct: treatmentGap ? -12 : 0,
    triggered: treatmentGap,
    reason: treatmentGap ? 'Significant gap in medical treatment' : undefined
  });

  // 3. Pre-existing conditions (5-20%, default 10%)
  const preExisting = checkPreExistingConditions(narrative);
  deductions.push({
    name: 'Pre-existing conditions',
    pct: preExisting ? -10 : 0,
    triggered: preExisting,
    reason: preExisting ? 'Pre-existing medical conditions affect causation' : undefined
  });

  // 4. Non-compliance (>120-day gap) (10-15%, default 12%)
  const nonCompliance = checkNonCompliance(narrative);
  deductions.push({
    name: 'Non-compliance with treatment',
    pct: nonCompliance ? -12 : 0,
    triggered: nonCompliance,
    reason: nonCompliance ? 'Patient failed to follow prescribed treatment' : undefined
  });

  // 5. Conflicting medical opinions (5-10%, default 7%)
  const conflictingOpinions = checkConflictingMedicalOpinions(narrative);
  deductions.push({
    name: 'Conflicting medical opinions',
    pct: conflictingOpinions ? -7 : 0,
    triggered: conflictingOpinions,
    reason: conflictingOpinions ? 'Medical experts disagree on diagnosis/causation' : undefined
  });

  // Calculate total deduction (capped at 40%)
  const totalDeductionPct = Math.min(40, Math.abs(deductions.reduce((sum, d) => sum + d.pct, 0)));
  
  // Apply deductions
  const evaluatorAfterDeductions = Math.round(basePrediction * (1 - totalDeductionPct / 100) / 500) * 500;

  return {
    deductions: deductions.filter(d => d.triggered),
    totalDeductionPct,
    evaluatorAfterDeductions
  };
}

/**
 * Check for subsequent accidents during treatment
 */
function checkSubsequentAccident(narrative: string): boolean {
  const patterns = [
    /subsequent accident/gi,
    /later accident/gi,
    /additional accident.*during treatment/gi,
    /second accident.*treatment/gi,
    /another accident.*while treating/gi
  ];
  
  return patterns.some(pattern => pattern.test(narrative));
}

/**
 * Check for treatment gaps > 90 days
 */
function checkTreatmentGap(narrative: string): boolean {
  // Look for specific gap mentions
  const gapMatches = narrative.match(/gap.*?(\d+).*?days?/gi) || [];
  const hasLargeGap = gapMatches.some(match => {
    const numbers = match.match(/\d+/g);
    return numbers && parseInt(numbers[0]) > 90;
  });
  
  // Also check for general gap language
  const gapPatterns = [
    /significant gap in treatment/gi,
    /stopped treatment.*months/gi,
    /discontinued.*treatment/gi,
    /long break.*treatment/gi
  ];
  
  return hasLargeGap || gapPatterns.some(pattern => pattern.test(narrative));
}

/**
 * Check for pre-existing conditions
 */
function checkPreExistingConditions(narrative: string): boolean {
  const patterns = [
    /pre-existing/gi,
    /preexisting/gi,
    /prior condition/gi,
    /degenerative.*prior/gi,
    /history of.*condition/gi,
    /pre-accident.*symptoms/gi,
    /existing.*condition.*before/gi
  ];
  
  return patterns.some(pattern => pattern.test(narrative));
}

/**
 * Check for non-compliance (>120-day gap or explicit mentions)
 */
function checkNonCompliance(narrative: string): boolean {
  // Check for gaps > 120 days
  const gapMatches = narrative.match(/gap.*?(\d+).*?days?/gi) || [];
  const hasNonComplianceGap = gapMatches.some(match => {
    const numbers = match.match(/\d+/g);
    return numbers && parseInt(numbers[0]) > 120;
  });
  
  // Check for explicit non-compliance language
  const nonCompliancePatterns = [
    /non-compliant/gi,
    /missed.*appointments/gi,
    /failed to follow/gi,
    /did not attend/gi,
    /refused.*treatment/gi,
    /non-adherent/gi,
    /poor compliance/gi
  ];
  
  return hasNonComplianceGap || nonCompliancePatterns.some(pattern => pattern.test(narrative));
}

/**
 * Check for conflicting medical opinions
 */
function checkConflictingMedicalOpinions(narrative: string): boolean {
  const patterns = [
    /conflicting.*opinion/gi,
    /medical.*dispute/gi,
    /disagreement.*diagnosis/gi,
    /doctors.*disagree/gi,
    /conflicting.*medical.*evidence/gi,
    /disputed.*causation/gi,
    /medical.*controversy/gi
  ];
  
  return patterns.some(pattern => pattern.test(narrative));
}