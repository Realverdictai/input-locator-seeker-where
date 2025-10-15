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
import { CaseData } from '@/types/verdict';

export function applyDeductions(
  basePrediction: number,
  caseData: Partial<CaseData>,
  narrativeText?: string
): DeductionResult {
  const narrative = narrativeText || caseData.narrative || '';
  const deductions: Deduction[] = [];

  // 1. Subsequent accidents during treatment - CAUSAL CHAIN BREAK (25-40%, default 30%)
  const subsequentAccident = checkSubsequentAccident(narrative);
  const subsequentBeforeSurgery = checkSubsequentBeforeSurgery(narrative);
  const apportionmentPct = subsequentBeforeSurgery ? -35 : (subsequentAccident ? -30 : 0);
  deductions.push({
    name: subsequentBeforeSurgery ? 'Subsequent accident before surgery (apportionment)' : 'Subsequent accident during treatment',
    pct: apportionmentPct,
    triggered: subsequentAccident || subsequentBeforeSurgery,
    reason: subsequentBeforeSurgery 
      ? 'Subsequent accident before surgery creates significant apportionment issues'
      : (subsequentAccident ? 'Additional accident during treatment breaks causal chain' : undefined)
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

  // 6. Injury and accident type mismatch (15% deduction)
  const mismatch = checkInjuryAccidentMismatch(
    caseData.accidentSubType || '',
    caseData.injuryType || narrative
  );
  deductions.push({
    name: 'Injury inconsistent with accident type',
    pct: mismatch ? -15 : 0,
    triggered: mismatch,
    reason: mismatch ? 'Injuries not typical for reported accident type' : undefined
  });

  // 7. Early resolution discount (20-25% based on case factors)
  const earlyResolutionDiscount = calculateEarlyResolutionDiscount(caseData, narrative);
  deductions.push({
    name: 'Early resolution discount',
    pct: -earlyResolutionDiscount,
    triggered: earlyResolutionDiscount > 0,
    reason: earlyResolutionDiscount > 0 ? 'Insurance discount for early case resolution' : undefined
  });

  // Calculate total deduction (capped at 50% to account for early resolution)
  const totalDeductionPct = Math.min(50, Math.abs(deductions.reduce((sum, d) => sum + d.pct, 0)));
  
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
    /another accident.*while treating/gi,
    /intervening accident/gi,
    /new accident/gi
  ];
  
  return patterns.some(pattern => pattern.test(narrative));
}

/**
 * Check for subsequent accident BEFORE surgery (worse apportionment)
 */
function checkSubsequentBeforeSurgery(narrative: string): boolean {
  const patterns = [
    /subsequent accident.*before.*surgery/gi,
    /accident.*prior to.*surgery/gi,
    /additional accident.*pre-surgery/gi,
    /another accident.*before.*operation/gi,
    /intervening accident.*before.*procedure/gi
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

/**
 * Check if reported injuries are inconsistent with the accident type
 */
function checkInjuryAccidentMismatch(accidentSubType: string, injuries: string): boolean {
  if (!accidentSubType || !injuries) return false;

  const acc = accidentSubType.toLowerCase();
  const inj = injuries.toLowerCase();

  const patterns: Record<string, RegExp[]> = {
    'dog bite': [/bite/, /laceration/, /puncture/, /scar/],
    'slip': [/fracture/, /sprain/, /bruise/, /contusion/, /head/],
    'trip': [/fracture/, /sprain/, /bruise/, /contusion/, /head/],
    'auto': [/whiplash/, /collision/, /airbag/, /seatbelt/]
  };

  const key = Object.keys(patterns).find(k => acc.includes(k));
  if (!key) return false;

  const expected = patterns[key];
  return !expected.some(p => p.test(inj));
}

/**
 * Calculate early resolution discount (20-25% based on case factors)
 */
function calculateEarlyResolutionDiscount(caseData: Partial<CaseData>, narrative: string): number {
  let discount = 20; // Base 20% discount
  
  // Age factor - older plaintiffs get higher discount
  const age = caseData.plaintiffAge || 0;
  if (age > 65) {
    discount += 2; // +2% for elderly plaintiffs
  } else if (age > 50) {
    discount += 1; // +1% for middle-aged plaintiffs
  }
  
  // Pending surgery factor - reduces discount (case worth more)
  const hasPendingSurgery = /pending.*surgery/gi.test(narrative) || 
                           /scheduled.*surgery/gi.test(narrative) ||
                           /future.*surgery/gi.test(narrative);
  if (hasPendingSurgery) {
    discount -= 3; // -3% if pending surgery (case more valuable)
  }
  
  // Severity factor - higher severity reduces discount
  const surgeryCount = caseData.surgeries || 0;
  const injectionCount = caseData.injections || 0;
  
  if (surgeryCount >= 2 || injectionCount >= 4) {
    discount -= 2; // -2% for severe cases
  } else if (surgeryCount >= 1 || injectionCount >= 2) {
    discount -= 1; // -1% for moderate cases
  }
  
  // TBI factor - reduces discount significantly
  const hasTBI = /TBI/gi.test(narrative) || /traumatic.*brain/gi.test(narrative);
  if (hasTBI) {
    discount -= 3; // -3% for TBI cases (high value)
  }
  
  // Policy limits factor - high policy limits reduce discount
  const policyLimits = caseData.policyLimits || 0;
  if (policyLimits > 1000000) {
    discount -= 2; // -2% for high policy limits
  }
  
  // Cap discount between 15-25%
  return Math.max(15, Math.min(25, discount));
}