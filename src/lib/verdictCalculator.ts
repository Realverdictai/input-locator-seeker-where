
import { CaseData, VerdictEstimate } from "@/types/verdict";

export const evaluateCase = (caseData: CaseData): VerdictEstimate => {
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

  // Venue multipliers (California counties)
  const venueMultipliers = {
    'los-angeles': 1.2,
    'san-francisco': 1.4,
    'orange': 1.1,
    'san-diego': 1.0,
    'santa-clara': 1.3,
    'alameda': 1.25,
    'riverside': 0.9,
    'sacramento': 0.95,
    'other': 0.85
  };

  const baseMultiplier = injuryMultipliers[caseData.injuryType as keyof typeof injuryMultipliers] || injuryMultipliers['soft-tissue'];
  const venueMultiplier = venueMultipliers[caseData.venue as keyof typeof venueMultipliers] || 1.0;

  // Calculate base damages
  const baseDamages = caseData.medicalSpecials + caseData.wageLoss;
  
  // Surgery premium
  const surgeryPremium = caseData.surgeries * 50000;
  
  // Age factor (younger plaintiffs typically get higher awards)
  const ageFactor = caseData.plaintiffAge < 30 ? 1.2 : 
                   caseData.plaintiffAge < 50 ? 1.0 : 0.85;

  // Gender factor (historical data shows variations)
  const genderFactor = caseData.plaintiffGender === 'female' ? 1.05 : 1.0;

  // Calculate pain and suffering multipliers
  const totalSpecialDamages = baseDamages + surgeryPremium;
  
  // Apply liability reduction
  const liabilityFactor = caseData.liabilityPercentage / 100;

  // Calculate verdict estimates
  const lowPainSuffering = totalSpecialDamages * baseMultiplier.min * venueMultiplier * ageFactor * genderFactor;
  const midPainSuffering = totalSpecialDamages * baseMultiplier.mid * venueMultiplier * ageFactor * genderFactor;
  const highPainSuffering = totalSpecialDamages * baseMultiplier.max * venueMultiplier * ageFactor * genderFactor;

  const lowVerdict = (totalSpecialDamages + lowPainSuffering) * liabilityFactor;
  const midVerdict = (totalSpecialDamages + midPainSuffering) * liabilityFactor;
  const highVerdict = (totalSpecialDamages + highPainSuffering) * liabilityFactor;

  // Settlement range (typically 60-80% of verdict estimates)
  const settlementRangeLow = lowVerdict * 0.6;
  const settlementRangeHigh = midVerdict * 0.8;

  // Policy exceedance calculation
  const policyExceedanceChance = caseData.policyLimits > 0 ? 
    Math.min(95, Math.max(5, ((midVerdict - caseData.policyLimits) / caseData.policyLimits) * 50 + 30)) : 0;

  // Generate rationale
  const rationale = generateRationale(caseData, {
    lowVerdict,
    midVerdict,
    highVerdict,
    settlementRangeLow,
    settlementRangeHigh,
    policyExceedanceChance
  });

  return {
    lowVerdict: Math.round(lowVerdict),
    midVerdict: Math.round(midVerdict),
    highVerdict: Math.round(highVerdict),
    settlementRangeLow: Math.round(settlementRangeLow),
    settlementRangeHigh: Math.round(settlementRangeHigh),
    policyExceedanceChance: Math.round(policyExceedanceChance),
    rationale
  };
};

const generateRationale = (caseData: CaseData, estimates: any): string => {
  const injuryDescriptions = {
    'soft-tissue': 'soft tissue injuries typically result in lower awards',
    'fracture': 'fracture cases show moderate to high jury sympathy',
    'spinal-injury': 'spinal injuries command significant awards due to long-term impact',
    'traumatic-brain-injury': 'TBI cases often result in substantial verdicts given cognitive impacts',
    'burn': 'burn injuries generate high awards due to visible scarring and pain',
    'amputation': 'amputation cases consistently produce high verdicts',
    'wrongful-death': 'wrongful death cases vary widely based on decedent demographics'
  };

  const venueDescriptions = {
    'los-angeles': 'LA County juries tend to be plaintiff-friendly',
    'san-francisco': 'San Francisco consistently produces high awards',
    'orange': 'Orange County shows moderate jury tendencies',
    'san-diego': 'San Diego reflects average California verdict patterns',
    'santa-clara': 'Silicon Valley demographics support higher awards',
    'alameda': 'Alameda County juries are generally favorable to plaintiffs'
  };

  let rationale = `This evaluation considers that ${injuryDescriptions[caseData.injuryType as keyof typeof injuryDescriptions] || 'the injury type suggests moderate damages'}. `;
  
  if (caseData.venue in venueDescriptions) {
    rationale += `${venueDescriptions[caseData.venue as keyof typeof venueDescriptions]}. `;
  }

  if (caseData.surgeries > 0) {
    rationale += `The ${caseData.surgeries} surgical procedure${caseData.surgeries > 1 ? 's' : ''} significantly increases the award potential. `;
  }

  if (caseData.liabilityPercentage < 100) {
    rationale += `Liability allocation of ${caseData.liabilityPercentage}% reduces the overall exposure. `;
  }

  rationale += `Given the plaintiff's age (${caseData.plaintiffAge}) and economic profile, the settlement range reflects realistic negotiation parameters while the verdict estimates account for jury unpredictability in California courts.`;

  return rationale;
};
