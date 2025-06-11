
export interface CaseData {
  injuryType: string;
  liabilityPercentage: number;
  medicalSpecials: number;
  surgeries: number;
  surgeryTypes: string[];
  injections: number;
  injectionTypes: string[];
  physicalTherapySessions: number;
  chiropracticSessions: number;
  dateOfLoss: string;
  firstTreatmentDate: string;
  daysBetweenAccidentAndTreatment: number;
  wageLoss: number;
  plaintiffAge: number;
  plaintiffGender: 'male' | 'female';
  plaintiffOccupation: string;
  venue: string;
  policyLimits: number;
  additionalFactors: string;
  
  // New fields
  howellHanifDeductions: number;
  futureMedicals: number;
  futureEarningsLoss: number;
  prop213Applicable: boolean;
  priorWorkersComp: boolean;
  priorWorkersCompAmount: number;
  priorAccident: boolean;
  priorAccidentDetails: string;
  subsequentAccident: boolean;
  subsequentAccidentDetails: string;
  multipleDefendants: boolean;
  defendantPolicies: PolicyInfo[];
  umUimCoverage: number;
  accidentType: string;
  impactSeverity: number;
  annualIncome: number;
  futureSurgeryRecommended: boolean;
  futureSurgeryDetails: string;
  treatmentGaps: number;
  priorConditions: string;
  medicalRecordsAnalysis: string;
}

export interface PolicyInfo {
  defendantName: string;
  policyLimit: number;
}

export interface VerdictEstimate {
  lowVerdict: number;
  midVerdict: number;
  highVerdict: number;
  settlementRangeLow: number;
  settlementRangeHigh: number;
  policyExceedanceChance: number;
  rationale: string;
  casesEvaluated: number;
  isFreeModel: boolean;
}
