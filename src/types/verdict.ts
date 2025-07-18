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
  willNotGetFutureSurgery?: boolean;
  treatmentGaps?: number;
  priorConditions?: string;
  medicalRecordsAnalysis?: string;
  /**
   * Uploaded damage photos or videos as data URLs
   */
  damageMedia?: string[];
  /**
   * AI-assessed vehicle damage score (0-10)
   */
  damageScore?: number;
  /**
   * Narrative text extracted from uploaded documents
   */
  narrative?: string;
  clarifyMode?: 'ask' | 'skip';
  caseSessionId?: string;

  // Settlement positioning
  plaintiffBottomLine?: number;
  defenseAuthority?: number;
  defenseRangeLow?: number;
  defenseRangeHigh?: number;

  // Vehicle information
  plaintiffVehicle?: string;
  defendantVehicle?: string;
  plaintiffVehicleSize?: string;
  defendantVehicleSize?: string;
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

export interface VerdictResult {
  evaluator: string;
  deductions: Array<{ name: string; pct: number }>;
  evaluatorNet: string;
  mediatorProposal: string;
  expiresOn: string;
  settlementRangeLow: string;
  settlementRangeHigh: string;
  confidence: number;
  nearestCases: number[];
  rationale: string;
  isNovelCase?: boolean;
  traditionalValuation?: {
    estimatedValue: number;
    method: string;
    factors: string[];
  };
  method?: 'ai' | 'traditional' | 'hybrid';
  manualOverride?: {
    estimate: number;
    rationale: string;
    overriddenBy: string;
  };
}
