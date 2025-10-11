/**
 * PI Question Plans - Generates targeted questions for each step
 * 
 * Returns 3-6 crisp questions based on context unknowns to guide information gathering
 */

import { PiStepId } from './pi_step_adapters';

interface StepContext {
  facts: Record<string, any>;
  unknowns: string[];
  nextBestQuestions: string[];
}

export interface QuestionPlan {
  questions: string[];
  priority: 'critical' | 'important' | 'optional';
  category: string;
}

/**
 * Get targeted questions for a specific PI step based on context
 */
export function getQuestionsForStep(step: PiStepId, ctx: StepContext): QuestionPlan[] {
  switch (step) {
    case 'upload_intake':
      return getUploadIntakeQuestions(ctx);
    case 'issues_coverage':
      return getIssuesCoverageQuestions(ctx);
    case 'liability_causation':
      return getLiabilityCausationQuestions(ctx);
    case 'damages_treatment':
      return getDamagesTreatmentQuestions(ctx);
    case 'strategy':
      return getStrategyQuestions(ctx);
    case 'proposal_brackets':
      return getProposalBracketsQuestions(ctx);
    default:
      return [];
  }
}

/**
 * Upload/Intake Step Questions
 * Focus: Missing documents and basic case info
 */
function getUploadIntakeQuestions(ctx: StepContext): QuestionPlan[] {
  const plans: QuestionPlan[] = [];
  const unknowns = ctx.unknowns;

  // Critical: Basic case identification
  if (unknowns.includes('plaintiff_name') || unknowns.includes('defendant_name') || unknowns.includes('date_of_loss')) {
    plans.push({
      questions: [
        unknowns.includes('plaintiff_name') ? "What is the plaintiff's full legal name?" : null,
        unknowns.includes('defendant_name') ? "Who is the named defendant?" : null,
        unknowns.includes('date_of_loss') ? "What is the exact date of loss?" : null,
        unknowns.includes('accident_type') ? "What type of accident occurred (rear-end, T-bone, pedestrian, etc.)?" : null,
      ].filter(Boolean) as string[],
      priority: 'critical',
      category: 'Basic Information'
    });
  }

  // Important: Documentation
  if (unknowns.includes('intake_documents') || !ctx.facts.documentsUploaded) {
    plans.push({
      questions: [
        "Do you have the police report available?",
        "Are there accident scene photos or vehicle damage photos?",
        "Do you have the initial medical bills and records?",
        "Are there any imaging reports (X-ray, MRI, CT scan)?",
      ],
      priority: 'important',
      category: 'Documentation'
    });
  }

  // Optional: Additional details
  if (plans.length < 2) {
    plans.push({
      questions: [
        "What jurisdiction/venue is this case in?",
        "Do you have a case number or claim number assigned?",
        "Was there a witness to the accident?",
      ],
      priority: 'optional',
      category: 'Case Details'
    });
  }

  return plans.slice(0, 2); // Max 2 question groups for this step
}

/**
 * Issues/Coverage Step Questions
 * Focus: Insurance coverage, policy limits, liens
 */
function getIssuesCoverageQuestions(ctx: StepContext): QuestionPlan[] {
  const plans: QuestionPlan[] = [];
  const unknowns = ctx.unknowns;

  // Critical: Policy limits
  if (unknowns.includes('policy_limits')) {
    plans.push({
      questions: [
        "What are the defendant's bodily injury (BI) policy limits?",
        "Are the policy limits per person/per occurrence (e.g., 15/30, 25/50, 100/300)?",
        "Have the policy limits been confirmed by the carrier?",
      ],
      priority: 'critical',
      category: 'Policy Limits'
    });
  }

  // Important: Coverage details
  if (unknowns.includes('carrier_name') || unknowns.includes('um_uim_coverage')) {
    plans.push({
      questions: [
        unknowns.includes('carrier_name') ? "Who is the defendant's insurance carrier?" : null,
        unknowns.includes('claim_number') ? "What is the claim number?" : null,
        unknowns.includes('um_uim_coverage') ? "Does the plaintiff have UM/UIM coverage? If so, what are the limits?" : null,
        "Is there an umbrella or excess policy in play?",
      ].filter(Boolean) as string[],
      priority: 'important',
      category: 'Coverage Details'
    });
  }

  // Important: Liens and statutory notices
  plans.push({
    questions: [
      "Are there any medical liens (hospital, Medicare, Medi-Cal, ERISA)?",
      "Has a Section 998 offer been made by either side?",
      "Are there any bad faith or Stowers demand issues?",
      "Is there a BRI (bad faith refusal to insure) claim?",
    ],
    priority: 'important',
    category: 'Liens & Notices'
  });

  return plans.slice(0, 2);
}

/**
 * Liability/Causation Step Questions
 * Focus: Fault analysis, comparative negligence, prior/subsequent injuries
 */
function getLiabilityCausationQuestions(ctx: StepContext): QuestionPlan[] {
  const plans: QuestionPlan[] = [];
  const unknowns = ctx.unknowns;

  // Critical: Liability assessment
  if (unknowns.includes('liability_percentage') || unknowns.includes('fault_theory')) {
    plans.push({
      questions: [
        "What is your assessment of defendant's liability (0-100%)?",
        "What is the primary theory of fault (negligence, recklessness, statutory violation)?",
        unknowns.includes('police_report') ? "Does the police report assign fault? Who was cited?" : null,
        "Are there any disputes about who was at fault?",
      ].filter(Boolean) as string[],
      priority: 'critical',
      category: 'Liability Assessment'
    });
  }

  // Important: Comparative fault
  if (unknowns.includes('comparative_fault') || ctx.facts.comparativeFault === undefined) {
    plans.push({
      questions: [
        "Is there any comparative fault on the plaintiff's side?",
        "If comparative fault exists, what percentage would you estimate?",
        "Are there any defenses being raised (contributory negligence, assumption of risk)?",
      ],
      priority: 'important',
      category: 'Comparative Fault'
    });
  }

  // Important: Prior/subsequent accidents
  if (unknowns.includes('prior_accidents')) {
    plans.push({
      questions: [
        "Does the plaintiff have any prior accidents or injuries to the same body parts?",
        "If yes, when did the prior accident(s) occur and what treatment was received?",
        "Has there been any subsequent accident or injury since this incident?",
        "Are there any pre-existing conditions relevant to the claimed injuries?",
      ],
      priority: 'important',
      category: 'Prior/Subsequent History'
    });
  }

  // Optional: Evidence strength
  if (plans.length < 3) {
    plans.push({
      questions: [
        "How strong is the liability evidence (photos, witnesses, admissions)?",
        "Are there any defenses that could reduce the defendant's liability?",
      ],
      priority: 'optional',
      category: 'Evidence Strength'
    });
  }

  return plans.slice(0, 3);
}

/**
 * Damages/Treatment Step Questions
 * Focus: Injuries, treatment timeline, medical expenses, wage loss
 */
function getDamagesTreatmentQuestions(ctx: StepContext): QuestionPlan[] {
  const plans: QuestionPlan[] = [];
  const unknowns = ctx.unknowns;

  // Critical: Injuries and imaging
  if (unknowns.includes('injuries') || unknowns.includes('imaging_results')) {
    plans.push({
      questions: [
        unknowns.includes('injuries') ? "What are the primary injuries sustained (e.g., cervical strain, lumbar disc herniation, TBI)?" : null,
        unknowns.includes('imaging_results') ? "What imaging studies were performed (MRI, CT, X-ray) and what were the findings?" : null,
        "Are the injuries documented as acute or chronic?",
        "Did imaging show any objective findings (herniation, fracture, soft tissue damage)?",
      ].filter(Boolean) as string[],
      priority: 'critical',
      category: 'Injuries & Imaging'
    });
  }

  // Critical: Surgery and injections
  if (unknowns.includes('surgery') || unknowns.includes('injections')) {
    plans.push({
      questions: [
        unknowns.includes('surgery') ? "Has the plaintiff undergone any surgery? If so, what type?" : null,
        "If surgery occurred, what was the date and who was the surgeon?",
        unknowns.includes('injections') ? "Were epidural or other injections administered? How many?" : null,
        "Is future surgery recommended or anticipated?",
      ].filter(Boolean) as string[],
      priority: 'critical',
      category: 'Surgery & Injections'
    });
  }

  // Important: Medical bills and treatment
  if (unknowns.includes('medical_bills') || unknowns.includes('treatment_timeline')) {
    plans.push({
      questions: [
        unknowns.includes('medical_bills') ? "What is the total amount of medical bills to date?" : null,
        "What portion of medical bills have been paid vs. outstanding?",
        unknowns.includes('treatment_timeline') ? "How many physical therapy visits? Over what time period?" : null,
        "Is the plaintiff still treating or has treatment concluded?",
      ].filter(Boolean) as string[],
      priority: 'important',
      category: 'Medical Bills & Treatment'
    });
  }

  // Important: Economic damages
  if (unknowns.includes('wage_loss')) {
    plans.push({
      questions: [
        "Did the plaintiff miss work due to the injuries?",
        "What is the wage loss amount (past and future)?",
        "Is there documentation of lost wages (pay stubs, employer letter)?",
        "What is the plaintiff's occupation and earning capacity?",
      ],
      priority: 'important',
      category: 'Economic Damages'
    });
  }

  return plans.slice(0, 3);
}

/**
 * Strategy Step Questions
 * Focus: Negotiation posture, demands/offers, venue considerations
 */
function getStrategyQuestions(ctx: StepContext): QuestionPlan[] {
  const plans: QuestionPlan[] = [];
  const unknowns = ctx.unknowns;

  // Critical: Current negotiation status
  if (unknowns.includes('plaintiff_demand') || unknowns.includes('defense_offer')) {
    plans.push({
      questions: [
        unknowns.includes('plaintiff_demand') ? "What is the plaintiff's current demand amount?" : null,
        unknowns.includes('defense_offer') ? "What is the defense's latest offer?" : null,
        "How far apart are the parties currently?",
        "What is the negotiation history (prior demands/offers)?",
      ].filter(Boolean) as string[],
      priority: 'critical',
      category: 'Negotiation Status'
    });
  }

  // Important: Venue and trial considerations
  if (unknowns.includes('venue')) {
    plans.push({
      questions: [
        "What is the venue for this case (county/court)?",
        "What are typical jury verdicts in this venue for similar cases?",
        "Is this a plaintiff-friendly or defense-friendly jurisdiction?",
      ],
      priority: 'important',
      category: 'Venue Considerations'
    });
  }

  // Important: Mediation context
  if (unknowns.includes('mediation_date') || !ctx.facts.mediationDate) {
    plans.push({
      questions: [
        "Is there a mediation scheduled? If so, when?",
        "What are the client's settlement goals and bottom line?",
        "Are there any non-monetary terms that matter (confidentiality, structured settlement)?",
        "What is the client's risk tolerance for trial vs. settlement?",
      ],
      priority: 'important',
      category: 'Mediation Planning'
    });
  }

  // Optional: Strategic considerations
  plans.push({
    questions: [
      "Are there any 998 offers outstanding or planned?",
      "What is the strength of the case at trial (1-10)?",
      "Are there any time pressures (statute of limitations, financial need)?",
    ],
    priority: 'optional',
    category: 'Strategic Factors'
  });

  return plans.slice(0, 3);
}

/**
 * Proposal/Brackets Step Questions
 * Focus: Settlement parameters, guardrails, bracketing willingness
 */
function getProposalBracketsQuestions(ctx: StepContext): QuestionPlan[] {
  const plans: QuestionPlan[] = [];

  // Critical: Settlement parameters
  plans.push({
    questions: [
      "What is your realistic settlement range (low-high)?",
      "What are the key factors driving your valuation (policy limits, injury severity, liability)?",
      "Are you willing to consider a bracketed proposal (plaintiff max / defense min)?",
    ],
    priority: 'critical',
    category: 'Settlement Parameters'
  });

  // Important: Guardrails and constraints
  plans.push({
    questions: [
      "Are there any hard floor or ceiling amounts you won't cross?",
      "Is the policy limit a practical cap on settlement?",
      "Are there lien reductions or other contingencies needed to settle?",
      "What is the client's authority to settle (board approval, co-counsel sign-off)?",
    ],
    priority: 'important',
    category: 'Guardrails & Constraints'
  });

  // Important: Comparable cases
  if (!ctx.facts.comparablesCount || ctx.facts.comparablesCount === 0) {
    plans.push({
      questions: [
        "Would you like me to search for comparable cases in this venue?",
        "Are there specific verdicts or settlements you're aware of that inform your valuation?",
        "Do you have any internal case evaluations or expert opinions on value?",
      ],
      priority: 'important',
      category: 'Comparables & Valuation'
    });
  }

  // Optional: Proposal mechanics
  plans.push({
    questions: [
      "Should the mediator proposal include a rationale/risk analysis?",
      "Do you want a single number or a bracketed range?",
      "What is your deadline for responding to a proposal?",
    ],
    priority: 'optional',
    category: 'Proposal Mechanics'
  });

  return plans.slice(0, 3);
}

/**
 * Get all questions across all steps (useful for overview)
 */
export function getAllQuestionsForCase(allStepsContext: Record<PiStepId, StepContext>): Record<PiStepId, QuestionPlan[]> {
  const allSteps: PiStepId[] = [
    'upload_intake',
    'issues_coverage',
    'liability_causation',
    'damages_treatment',
    'strategy',
    'proposal_brackets'
  ];

  return allSteps.reduce((acc, step) => {
    acc[step] = getQuestionsForStep(step, allStepsContext[step]);
    return acc;
  }, {} as Record<PiStepId, QuestionPlan[]>);
}

/**
 * Flatten all questions into a single prioritized list
 */
export function getFlattenedQuestions(plans: QuestionPlan[]): string[] {
  const allQuestions: string[] = [];
  
  // Add in priority order
  ['critical', 'important', 'optional'].forEach(priority => {
    plans
      .filter(plan => plan.priority === priority)
      .forEach(plan => allQuestions.push(...plan.questions));
  });

  return allQuestions;
}

/**
 * Get next most important question across all plans
 */
export function getNextCriticalQuestion(plans: QuestionPlan[]): string | null {
  const criticalPlan = plans.find(plan => plan.priority === 'critical');
  if (criticalPlan && criticalPlan.questions.length > 0) {
    return criticalPlan.questions[0];
  }

  const importantPlan = plans.find(plan => plan.priority === 'important');
  if (importantPlan && importantPlan.questions.length > 0) {
    return importantPlan.questions[0];
  }

  const optionalPlan = plans.find(plan => plan.priority === 'optional');
  if (optionalPlan && optionalPlan.questions.length > 0) {
    return optionalPlan.questions[0];
  }

  return null;
}

/**
 * Check if step has critical questions that need answering
 */
export function hasCriticalQuestions(plans: QuestionPlan[]): boolean {
  return plans.some(plan => plan.priority === 'critical' && plan.questions.length > 0);
}

/**
 * Get question count by priority
 */
export function getQuestionStats(plans: QuestionPlan[]): {
  critical: number;
  important: number;
  optional: number;
  total: number;
} {
  return {
    critical: plans.filter(p => p.priority === 'critical').reduce((sum, p) => sum + p.questions.length, 0),
    important: plans.filter(p => p.priority === 'important').reduce((sum, p) => sum + p.questions.length, 0),
    optional: plans.filter(p => p.priority === 'optional').reduce((sum, p) => sum + p.questions.length, 0),
    total: plans.reduce((sum, p) => sum + p.questions.length, 0)
  };
}
