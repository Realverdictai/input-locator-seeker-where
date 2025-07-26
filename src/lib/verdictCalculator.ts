
import { CaseData, VerdictEstimate } from "@/types/verdict";

// Track usage for free model limitation
let casesEvaluated = 0;

export const evaluateCase = (caseData: CaseData): VerdictEstimate => {
  casesEvaluated++;
  const isFreeModel = casesEvaluated <= 10;

  // Base multipliers for different injury types
  const injuryMultipliers = {
    'soft-tissue': { min: 1.5, mid: 3, max: 5 },
    'fracture': { min: 2, mid: 4, max: 7 },
    'spinal-injury': { min: 3, mid: 6, max: 12 },
    'traumatic-brain-injury': { min: 5, mid: 10, max: 20 },
    'burn': { min: 3, mid: 7, max: 15 },
    'amputation': { min: 8, mid: 15, max: 25 },
    'wrongful-death': { min: 10, mid: 20, max: 40 }
  };

  // Enhanced venue multipliers for California counties
  const venueMultipliers = {
    'los-angeles': 1.2, 'san-francisco': 1.4, 'orange': 1.1, 'san-diego': 1.0,
    'santa-clara': 1.3, 'alameda': 1.25, 'riverside': 0.9, 'sacramento': 0.95,
    'san-bernardino': 0.85, 'contra-costa': 1.15, 'fresno': 0.8, 'kern': 0.75,
    'ventura': 1.1, 'san-joaquin': 0.85, 'sonoma': 1.2, 'tulare': 0.8,
    'santa-barbara': 1.15, 'solano': 0.9, 'monterey': 1.0, 'placer': 1.05,
    'san-mateo': 1.3, 'merced': 0.8, 'stanislaus': 0.85, 'santa-cruz': 1.1,
    'napa': 1.2, 'marin': 1.4
  };

  // Accident type multipliers
  const accidentTypeMultipliers = {
    'rear-end': 1.0, 'head-on': 1.3, 'broadside': 1.2, 'sideswipe': 0.9,
    'rollover': 1.5, 'pedestrian': 1.2, 'bicycle': 1.1, 'motorcycle': 1.3,
    'truck': 1.2, 'multi-vehicle': 1.1, 'hit-and-run': 1.15, 'parking-lot': 0.8
  };

  const baseMultiplier = injuryMultipliers[caseData.injuryType as keyof typeof injuryMultipliers] || injuryMultipliers['soft-tissue'];
  const venueMultiplier = venueMultipliers[caseData.venue as keyof typeof venueMultipliers] || 1.0;
  const accidentMultiplier = accidentTypeMultipliers[caseData.accidentSubType as keyof typeof accidentTypeMultipliers] || 1.0;

  // Calculate adjusted medical specials after Howell/Hanif deductions
  const medicalSpecials = caseData.medicalSpecials || 0;
  const howellHanifDeductions = caseData.howellHanifDeductions || 0;
  const adjustedMedicalSpecials = Math.max(0, medicalSpecials - howellHanifDeductions);
  
  // Calculate total economic damages
  const wageLoss = caseData.wageLoss || 0;
  const futureMedicals = caseData.futureMedicals || 0;
  const futureEarningsLoss = caseData.futureEarningsLoss || 0;
  const totalEconomicDamages = adjustedMedicalSpecials + wageLoss + futureMedicals + futureEarningsLoss;
  
  // Surgery premium calculation with specific surgery types
  const surgeries = caseData.surgeries || 0;
  let surgeryPremium = surgeries * 40000;
  // Premium adjustments for specific high-value surgery types
  if (caseData.surgeryTypes?.some(type => type.includes("Spinal Fusion"))) surgeryPremium += 75000;
  if (caseData.surgeryTypes?.some(type => type.includes("Hip Replacement"))) surgeryPremium += 60000;
  if (caseData.surgeryTypes?.some(type => type.includes("Knee Replacement"))) surgeryPremium += 50000;
  if (caseData.surgeryTypes?.some(type => type.includes("Spinal Cord Stimulator - Permanent"))) surgeryPremium += 100000;
  if (caseData.surgeryTypes?.some(type => type.includes("Spinal Cord Stimulator - Trial"))) surgeryPremium += 25000;
  
  // Injection premium calculation
  const injections = caseData.injections || 0;
  let injectionPremium = injections * 2500; // Base value per injection
  const prpInjections = caseData.injectionTypes?.filter(type => type.includes("PRP")).length || 0;
  injectionPremium += prpInjections * 3000; // Additional premium for PRP injections
  
  // Physical therapy and chiropractic factor
  const physicalTherapySessions = caseData.physicalTherapySessions || 0;
  const chiropracticSessions = caseData.chiropracticSessions || 0;
  const ptChiroFactor = Math.min(1.2, 1 + ((physicalTherapySessions + chiropracticSessions) / 100));
  
  // Treatment delay factor (gap between accident and first treatment)
  const daysBetweenAccidentAndTreatment = caseData.daysBetweenAccidentAndTreatment || 0;
  const treatmentDelayFactor = daysBetweenAccidentAndTreatment > 7 ? 
    Math.max(0.8, 1 - (daysBetweenAccidentAndTreatment / 365)) : 1.0;
  
  // Impact severity factor including vehicle damage assessment
  const impactSeverity = caseData.impactSeverity || 5;
  const damageScore = caseData.damageScore || 0;
  const combinedImpact = Math.min(10, impactSeverity + damageScore / 2);
  const impactFactor = combinedImpact / 5; // Scale to 0.2-2.0
  
  // Age factor
  const plaintiffAge = caseData.plaintiffAge || 35;
  const ageFactor = plaintiffAge < 30 ? 1.2 : 
                   plaintiffAge < 50 ? 1.0 : 0.85;

  // Gender factor
  const genderFactor = caseData.plaintiffGender === 'female' ? 1.05 : 1.0;

  // Prior conditions reduction
  const priorConditionsFactor = caseData.priorConditions ? 0.85 : 1.0;
  
  // Treatment gaps reduction
  const treatmentGaps = caseData.treatmentGaps || 0;
  const treatmentGapsFactor = treatmentGaps > 90 ? 0.9 : 
                             treatmentGaps > 30 ? 0.95 : 1.0;

  // Workers comp offset
  const workersCompOffset = caseData.priorWorkersComp ? (caseData.priorWorkersCompAmount || 0) : 0;

  // Future surgery premium
  const futureSurgeryPremium = caseData.futureSurgeryRecommended ? 75000 : 0;

  // Calculate total special damages including new medical treatments
  const totalSpecialDamages = totalEconomicDamages + surgeryPremium + injectionPremium + futureSurgeryPremium;
  
  // Apply all factors to pain and suffering multipliers
  const allFactors = venueMultiplier * accidentMultiplier * ageFactor * genderFactor * 
                    priorConditionsFactor * treatmentGapsFactor * impactFactor * 
                    ptChiroFactor * treatmentDelayFactor;

  // Calculate pain and suffering
  const lowPainSuffering = totalSpecialDamages * baseMultiplier.min * allFactors;
  const midPainSuffering = totalSpecialDamages * baseMultiplier.mid * allFactors;
  const highPainSuffering = totalSpecialDamages * baseMultiplier.max * allFactors;

  // Apply liability reduction
  const liabilityPercentage = caseData.liabilityPercentage || 100;
  const liabilityFactor = liabilityPercentage / 100;

  // Calculate gross verdicts
  let lowVerdict = (totalSpecialDamages + lowPainSuffering) * liabilityFactor;
  let midVerdict = (totalSpecialDamages + midPainSuffering) * liabilityFactor;
  let highVerdict = (totalSpecialDamages + highPainSuffering) * liabilityFactor;

  // Apply Prop 213 limitations (no non-economic damages for uninsured drivers)
  if (caseData.prop213Applicable) {
    lowVerdict = totalSpecialDamages * liabilityFactor;
    midVerdict = totalSpecialDamages * liabilityFactor;
    highVerdict = totalSpecialDamages * liabilityFactor;
  }

  // Subtract workers comp offset
  lowVerdict = Math.max(0, lowVerdict - workersCompOffset);
  midVerdict = Math.max(0, midVerdict - workersCompOffset);
  highVerdict = Math.max(0, highVerdict - workersCompOffset);

  // Calculate total available insurance
  const totalPolicyLimits = caseData.defendantPolicies?.reduce((sum, policy) => sum + (policy.policyLimit || 0), 0) || 0;
  const umUimCoverage = caseData.umUimCoverage || 0;
  const totalInsurance = totalPolicyLimits + umUimCoverage;

  // Settlement range (typically 60-80% of verdict estimates)
  let settlementRangeLow = lowVerdict * 0.6;
  let settlementRangeHigh = midVerdict * 0.8;

  if (caseData.plaintiffBottomLine) {
    settlementRangeLow = Math.max(settlementRangeLow, caseData.plaintiffBottomLine);
  }
  if (caseData.defenseAuthority) {
    settlementRangeHigh = Math.min(settlementRangeHigh, caseData.defenseAuthority);
  }
  if (caseData.defenseRangeLow) {
    settlementRangeLow = Math.max(settlementRangeLow, caseData.defenseRangeLow);
  }
  if (caseData.defenseRangeHigh) {
    settlementRangeHigh = Math.min(settlementRangeHigh, caseData.defenseRangeHigh);
  }

  // Policy exceedance calculation
  const policyExceedanceChance = totalInsurance > 0 ? 
    Math.min(95, Math.max(5, ((midVerdict - totalInsurance) / totalInsurance) * 50 + 30)) : 0;

  // Generate comprehensive rationale
  const rationale = generateEnhancedRationale(caseData, {
    lowVerdict, midVerdict, highVerdict, settlementRangeLow, settlementRangeHigh, 
    policyExceedanceChance, totalInsurance, allFactors, injectionPremium, ptChiroFactor, treatmentDelayFactor
  });

  return {
    lowVerdict: Math.round(lowVerdict),
    midVerdict: Math.round(midVerdict),
    highVerdict: Math.round(highVerdict),
    settlementRangeLow: Math.round(settlementRangeLow),
    settlementRangeHigh: Math.round(settlementRangeHigh),
    policyExceedanceChance: Math.round(policyExceedanceChance),
    rationale,
    casesEvaluated,
    isFreeModel
  };
};

const generateEnhancedRationale = (caseData: CaseData, estimates: any): string => {
  let rationale = `This comprehensive evaluation considers multiple factors affecting case value. `;

  // Injury type analysis
  const injuryImpact = {
    'soft-tissue': 'Soft tissue injuries typically result in conservative awards',
    'spinal-injury': 'Spinal injuries command significant awards due to long-term impact',
    'traumatic-brain-injury': 'TBI cases often result in substantial verdicts given cognitive impacts'
  };
  
  if (caseData.injuryType in injuryImpact) {
    rationale += `${injuryImpact[caseData.injuryType as keyof typeof injuryImpact]}. `;
  }

  // Surgery analysis
  if (caseData.surgeries > 0) {
    rationale += `The ${caseData.surgeries} surgical procedure${caseData.surgeries > 1 ? 's' : ''} `;
    if (caseData.surgeryTypes?.some(type => type.includes("Spinal Fusion"))) {
      rationale += `including spinal fusion `;
    }
    rationale += `significantly increases award potential. `;
  }

  // Economic factors
  if (caseData.howellHanifDeductions > 0) {
    rationale += `Howell/Hanif deductions of $${caseData.howellHanifDeductions.toLocaleString()} reduce medical specials. `;
  }

  // New medical treatment analysis
  if (caseData.injections > 0) {
    rationale += `The ${caseData.injections} injection${caseData.injections > 1 ? 's' : ''} `;
    const prpCount = caseData.injectionTypes?.filter(type => type.includes("PRP")).length || 0;
    if (prpCount > 0) {
      rationale += `including ${prpCount} PRP injection${prpCount > 1 ? 's' : ''} `;
    }
    rationale += `add significant treatment value. `;
  }

  if ((caseData.physicalTherapySessions + caseData.chiropracticSessions) > 50) {
    rationale += `Extensive therapy (${caseData.physicalTherapySessions + caseData.chiropracticSessions} sessions) demonstrates commitment to recovery. `;
  }

  if (caseData.daysBetweenAccidentAndTreatment > 7) {
    rationale += `${caseData.daysBetweenAccidentAndTreatment}-day delay to first treatment may impact credibility. `;
  }

  // Legal limitations
  if (caseData.prop213Applicable) {
    rationale += `Proposition 213 severely limits recovery to economic damages only due to uninsured status. `;
  }

  // Prior issues
  if (caseData.priorWorkersComp) {
    rationale += `Prior workers' compensation settlement creates offset issues. `;
  }

  if (caseData.priorConditions) {
    rationale += `Pre-existing conditions may reduce overall value. `;
  }

  // Treatment gaps
  if (caseData.treatmentGaps > 30) {
    rationale += `Treatment gaps of ${caseData.treatmentGaps} days may impact credibility. `;
  }

  // Insurance analysis
  if (estimates.totalInsurance > 0) {
    rationale += `Total available insurance of $${estimates.totalInsurance.toLocaleString()} `;
    if (estimates.policyExceedanceChance > 50) {
      rationale += `is likely insufficient to cover potential verdict. `;
    } else {
      rationale += `appears adequate for settlement range. `;
    }
  }

  if (caseData.plaintiffBottomLine) {
    rationale += `Plaintiff bottom line of $${caseData.plaintiffBottomLine.toLocaleString()} considered. `;
  }
  if (caseData.defenseAuthority) {
    rationale += `Defense authority set at $${caseData.defenseAuthority.toLocaleString()}. `;
  }

  rationale += `The evaluation reflects California jury tendencies and current legal precedents.`;

  return rationale;
};

export const resetCaseCount = () => {
  casesEvaluated = 0;
};
