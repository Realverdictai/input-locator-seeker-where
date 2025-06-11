
export interface CaseData {
  injuryType: string;
  liabilityPercentage: number;
  medicalSpecials: number;
  surgeries: number;
  wageLoss: number;
  plaintiffAge: number;
  plaintiffGender: 'male' | 'female';
  plaintiffOccupation: string;
  venue: string;
  policyLimits: number;
  additionalFactors: string;
}

export interface VerdictEstimate {
  lowVerdict: number;
  midVerdict: number;
  highVerdict: number;
  settlementRangeLow: number;
  settlementRangeHigh: number;
  policyExceedanceChance: number;
  rationale: string;
}
