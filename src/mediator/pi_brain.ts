/**
 * PI Mediator "Brain" – System prompt, clarifying questions, output templates
 */

export const PI_SYSTEM_PROMPT = `You are VERDICT AI — a neutral virtual mediator for Personal Injury cases. You facilitate resolution; you do not provide legal advice.

Operating rules:
1) Clarify missing facts before concluding. Ask targeted questions.
2) Distinguish facts vs. assertions vs. unknowns. Mark uncertainty explicitly.
3) Cite data sources (e.g., "treatment_timeline_view shows …") when you used the DB tool.
4) Always evaluate: Liability, Causation, Damages, Coverage, Venue, Comparative Fault, Prior/Subsequent accidents, Policy limits, Offers/Demands, 998s/BRIs/UM-UIM if present.
5) Produce structured outputs with short rationales and explicit risk tradeoffs.
6) Be concise, calm, reality-testing, settlement-oriented.

When generating proposals, output a bracket with midpoint and rationale. If facts are thin, ask 2–4 high-yield follow-ups first.

Use query_cases ONLY to fetch concrete facts. Prefer the most specific filters available. Never request tables outside the allowlist. If the view is missing a datum you need, ask the user.`;

/**
 * Clarifying question buckets by topic area
 */
const QUESTION_BUCKETS = {
  coverage: [
    "What are the policy limits (per person / per occurrence)?",
    "Is there UM/UIM coverage? If so, what limits?",
    "Has a Stowers demand or 998 offer been made?",
    "Are there multiple defendants or policies in play?"
  ],
  liability: [
    "What is the fault theory (rear-end, left turn, etc.)?",
    "Is there a police report? What does it say?",
    "Are there photos of the accident scene or vehicle damage?",
    "Are there any witnesses or dash cam footage?",
    "What is the defendant's version of events?"
  ],
  medical: [
    "When did symptoms first appear after the accident?",
    "What diagnostic imaging was performed (X-ray, MRI, CT)? Results?",
    "How many treatment visits (PT, chiro, pain management)?",
    "Were injections or surgery performed? If so, which procedures?",
    "Any prior injuries or subsequent accidents involving the same body parts?",
    "Is treatment ongoing or discharged?"
  ],
  specials: [
    "Total medical bills billed vs. paid?",
    "Any liens (Medi-Cal, private insurance, hospital)?",
    "Lost wages claimed? Documentation?",
    "Future medical or wage loss asserted?"
  ],
  venue: [
    "Which venue/jurisdiction?",
    "What are the typical jury tendencies in this venue?",
    "Who is the insurer and what is their settlement posture?",
    "Are we pre-suit or in litigation? Trial date set?"
  ],
  negotiation: [
    "What is the plaintiff's current demand?",
    "What is the defense's current offer?",
    "What is the mediation date or deadline?",
    "Have there been prior negotiation rounds? What anchors were set?"
  ]
};

/**
 * Returns 3-6 high-yield clarifying questions based on missing data categories
 */
export function getPIClarifyingQuestions(missing: string[]): string[] {
  const questions: string[] = [];
  const bucketsToUse = missing.length > 0 ? missing : ['liability', 'medical', 'coverage'];
  
  bucketsToUse.forEach(bucket => {
    const bucketQuestions = QUESTION_BUCKETS[bucket as keyof typeof QUESTION_BUCKETS];
    if (bucketQuestions) {
      // Take 1-2 questions per bucket
      questions.push(...bucketQuestions.slice(0, 2));
    }
  });
  
  return questions.slice(0, 6);
}

/**
 * Output format templates (as TypeScript interfaces for documentation)
 */
export interface PIRiskSummary {
  liability_risk: 'low' | 'moderate' | 'high';
  causation_risk: 'low' | 'moderate' | 'high';
  damages_risk: 'low' | 'moderate' | 'high';
  drivers: string[];
}

export interface PISettlementBracket {
  plaintiff_anchor: number;
  defense_anchor: number;
  mediator_bracket_low: number;
  mediator_bracket_high: number;
  midpoint: number;
  rationale: string;
}

/**
 * Template strings the model can follow
 */
export const PI_OUTPUT_TEMPLATES = {
  riskSummary: `// Risk summary format:
{
  "liability_risk": "low|moderate|high",
  "causation_risk": "low|moderate|high", 
  "damages_risk": "low|moderate|high",
  "drivers": ["brief bullet phrases"]
}`,

  settlementBracket: `// Settlement bracket format:
{
  "plaintiff_anchor": 0,
  "defense_anchor": 0,
  "mediator_bracket_low": 0,
  "mediator_bracket_high": 0,
  "midpoint": 0,
  "rationale": "one short paragraph"
}`
};
