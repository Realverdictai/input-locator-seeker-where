export interface CaseData {
  // New wizard fields
  caseType?: string;
  otherCaseType?: string;
  injuryTypes?: string[];
  otherInjuryType?: string;
  otherInjuryText?: string;
  liabilityDisputed?: string;
  treatmentGap?: boolean;
  numberOfPlaintiffs?: number;
  numberOfDefendants?: number;
  umbrellaCoverage?: string;
  tbiSeverity?: string;
  surgeryType?: string;
  injectionType?: string;
  howellSpecials?: number;
  
  // Existing fields
  injuryType: string;
  liabilityPercentage?: number;
  medicalSpecials?: number;
  surgeries?: number;
  surgeryTypes?: string[];
  injections?: number;
  injectionTypes?: string[];
  diagnosticTests?: string[];
  physicalTherapySessions?: number;
  chiropracticSessions?: number;
  dateOfLoss: string;
  firstTreatmentDate?: string;
  daysBetweenAccidentAndTreatment?: number;
  wageLoss?: number;
  plaintiffAge?: number;
  plaintiffGender?: 'male' | 'female';
  plaintiffOccupation?: string;
  venue: string;
  policyLimits?: number;
  additionalFactors?: string;
  
  // Existing fields continued
  howellHanifDeductions?: number;
  futureMedicals?: number;
  futureEarningsLoss?: number;
  prop213Applicable?: boolean;
  priorWorkersComp?: boolean;
  priorWorkersCompAmount?: number;
  priorAccident?: boolean;
  priorAccidentDetails?: string;
  subsequentAccident?: boolean;
  subsequentAccidentDetails?: string;
  multipleDefendants?: boolean;
  defendantPolicies?: PolicyInfo[];
  umUimCoverage?: number;
  accidentType?: string;
  impactSeverity?: number;
  annualIncome?: number;
  futureSurgeryRecommended?: boolean;
  futureSurgeryDetails?: string;
  futureSurgeryDate?: string;
  willGetFutureSurgery?: boolean;
  treatmentGaps?: number;
  priorConditions?: string;
  medicalRecordsAnalysis?: string;
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
