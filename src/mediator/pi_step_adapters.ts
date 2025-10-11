/**
 * PI Step Adapters - Integration layer between voice agents and existing PI forms/stores
 * 
 * This module provides a clean interface for agents to read and update PI case data
 * without directly coupling to form implementation details.
 */

export type PiStepId = 
  | 'upload_intake'
  | 'issues_coverage'
  | 'liability_causation'
  | 'damages_treatment'
  | 'strategy'
  | 'proposal_brackets';

export type AgentAction =
  | { type: 'update_field'; path: string; value: any }
  | { type: 'add_note'; text: string }
  | { type: 'advance_step' }
  | { type: 'attach_document_summary'; docId: string; summary: string };

interface StepContext {
  facts: Record<string, any>;
  unknowns: string[];
  nextBestQuestions: string[];
}

// Singleton store for adapter state
// In production, this would connect to your actual state management (Redux, Zustand, etc.)
class PiStepAdapterStore {
  private currentStep: PiStepId = 'upload_intake';
  private formData: Record<string, any> = {};
  private notes: string[] = [];
  private documentSummaries: Map<string, string> = new Map();
  private listeners: Set<() => void> = new Set();

  // Hook into existing router/state - IMPLEMENT THIS
  // Example: read from React Router params, or your form wizard state
  getCurrentStepFromRouter(): PiStepId {
    // TODO: Connect to your actual router/form wizard
    // For now, return stored step
    return this.currentStep;
  }

  setCurrentStep(step: PiStepId) {
    this.currentStep = step;
    this.notifyListeners();
  }

  getFormData(): Record<string, any> {
    // TODO: Connect to your actual form state (FormWizard, CaseInputForm, etc.)
    return { ...this.formData };
  }

  setFormValue(path: string, value: any) {
    const keys = path.split('.');
    let current = this.formData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    this.notifyListeners();
  }

  addNote(text: string) {
    this.notes.push(text);
    this.notifyListeners();
  }

  addDocumentSummary(docId: string, summary: string) {
    this.documentSummaries.set(docId, summary);
    this.notifyListeners();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

const adapterStore = new PiStepAdapterStore();

/**
 * Get the current PI step ID from the router/form state
 */
export function getCurrentPiStepId(): PiStepId {
  return adapterStore.getCurrentStepFromRouter();
}

/**
 * Map your existing form step names to PiStepId
 * TODO: Update this mapping based on your actual step names
 */
function mapFormStepToPiStepId(formStep: string): PiStepId {
  const stepMap: Record<string, PiStepId> = {
    'basic': 'upload_intake',
    'document': 'upload_intake',
    'upload': 'upload_intake',
    'case': 'issues_coverage',
    'insurance': 'issues_coverage',
    'coverage': 'issues_coverage',
    'liability': 'liability_causation',
    'causation': 'liability_causation',
    'injury': 'damages_treatment',
    'medical': 'damages_treatment',
    'treatment': 'damages_treatment',
    'damages': 'damages_treatment',
    'settlement': 'strategy',
    'strategy': 'strategy',
    'proposal': 'proposal_brackets',
    'brackets': 'proposal_brackets'
  };

  return stepMap[formStep.toLowerCase()] || 'upload_intake';
}

/**
 * Get context for a specific PI step - reads from your actual form fields
 */
export function getContextForStep(step: PiStepId): StepContext {
  const formData = adapterStore.getFormData();
  
  switch (step) {
    case 'upload_intake':
      return getUploadIntakeContext(formData);
    case 'issues_coverage':
      return getIssuesCoverageContext(formData);
    case 'liability_causation':
      return getLiabilityCausationContext(formData);
    case 'damages_treatment':
      return getDamagesTreatmentContext(formData);
    case 'strategy':
      return getStrategyContext(formData);
    case 'proposal_brackets':
      return getProposalBracketsContext(formData);
    default:
      return { facts: {}, unknowns: [], nextBestQuestions: [] };
  }
}

// Context extractors for each step
function getUploadIntakeContext(formData: Record<string, any>): StepContext {
  const facts: Record<string, any> = {};
  const unknowns: string[] = [];

  // Basic info
  if (formData.caseNumber) facts.caseNumber = formData.caseNumber;
  else unknowns.push('case_number');

  if (formData.plaintiffName) facts.plaintiffName = formData.plaintiffName;
  else unknowns.push('plaintiff_name');

  if (formData.defendantName) facts.defendantName = formData.defendantName;
  else unknowns.push('defendant_name');

  if (formData.dateOfLoss) facts.dateOfLoss = formData.dateOfLoss;
  else unknowns.push('date_of_loss');

  if (formData.accidentType) facts.accidentType = formData.accidentType;
  else unknowns.push('accident_type');

  // Documents
  if (formData.uploadedDocs?.length > 0) {
    facts.documentsUploaded = formData.uploadedDocs.length;
  } else {
    unknowns.push('intake_documents');
  }

  const nextBestQuestions = [];
  if (unknowns.includes('plaintiff_name')) {
    nextBestQuestions.push("What is the plaintiff's full name?");
  }
  if (unknowns.includes('date_of_loss')) {
    nextBestQuestions.push("What is the date of loss?");
  }
  if (unknowns.includes('accident_type')) {
    nextBestQuestions.push("What type of accident occurred?");
  }

  return { facts, unknowns, nextBestQuestions };
}

function getIssuesCoverageContext(formData: Record<string, any>): StepContext {
  const facts: Record<string, any> = {};
  const unknowns: string[] = [];

  if (formData.policyLimits) facts.policyLimits = formData.policyLimits;
  else unknowns.push('policy_limits');

  if (formData.carrierName) facts.carrierName = formData.carrierName;
  else unknowns.push('carrier_name');

  if (formData.claimNumber) facts.claimNumber = formData.claimNumber;
  else unknowns.push('claim_number');

  if (formData.umUimCoverage) facts.umUimCoverage = formData.umUimCoverage;
  else unknowns.push('um_uim_coverage');

  const nextBestQuestions = [];
  if (unknowns.includes('policy_limits')) {
    nextBestQuestions.push("What are the defendant's policy limits?");
  }
  if (unknowns.includes('um_uim_coverage')) {
    nextBestQuestions.push("Does the plaintiff have UM/UIM coverage?");
  }

  return { facts, unknowns, nextBestQuestions };
}

function getLiabilityCausationContext(formData: Record<string, any>): StepContext {
  const facts: Record<string, any> = {};
  const unknowns: string[] = [];

  if (formData.liabilityPct !== undefined) facts.liabilityPct = formData.liabilityPct;
  else unknowns.push('liability_percentage');

  if (formData.faultTheory) facts.faultTheory = formData.faultTheory;
  else unknowns.push('fault_theory');

  if (formData.comparativeFault) facts.comparativeFault = formData.comparativeFault;
  else unknowns.push('comparative_fault');

  if (formData.priorAccidents) facts.priorAccidents = formData.priorAccidents;
  else unknowns.push('prior_accidents');

  if (formData.policeReport) facts.policeReport = formData.policeReport;
  else unknowns.push('police_report');

  const nextBestQuestions = [];
  if (unknowns.includes('liability_percentage')) {
    nextBestQuestions.push("What percentage of liability does the defendant have?");
  }
  if (unknowns.includes('comparative_fault')) {
    nextBestQuestions.push("Is there any comparative fault on the plaintiff's side?");
  }
  if (unknowns.includes('prior_accidents')) {
    nextBestQuestions.push("Does the plaintiff have any prior accidents or injuries?");
  }

  return { facts, unknowns, nextBestQuestions };
}

function getDamagesTreatmentContext(formData: Record<string, any>): StepContext {
  const facts: Record<string, any> = {};
  const unknowns: string[] = [];

  if (formData.injuries) facts.injuries = formData.injuries;
  else unknowns.push('injuries');

  if (formData.surgery) facts.surgery = formData.surgery;
  else unknowns.push('surgery');

  if (formData.injections) facts.injections = formData.injections;
  else unknowns.push('injections');

  if (formData.medicalBills) facts.medicalBills = formData.medicalBills;
  else unknowns.push('medical_bills');

  if (formData.treatmentTimeline) facts.treatmentTimeline = formData.treatmentTimeline;
  else unknowns.push('treatment_timeline');

  if (formData.imaging) facts.imaging = formData.imaging;
  else unknowns.push('imaging_results');

  if (formData.wageLoss) facts.wageLoss = formData.wageLoss;
  else unknowns.push('wage_loss');

  const nextBestQuestions = [];
  if (unknowns.includes('injuries')) {
    nextBestQuestions.push("What are the primary injuries sustained?");
  }
  if (unknowns.includes('surgery')) {
    nextBestQuestions.push("Did the plaintiff undergo any surgeries?");
  }
  if (unknowns.includes('imaging_results')) {
    nextBestQuestions.push("What imaging studies were performed (MRI, CT, X-ray)?");
  }
  if (unknowns.includes('medical_bills')) {
    nextBestQuestions.push("What are the total medical bills to date?");
  }

  return { facts, unknowns, nextBestQuestions };
}

function getStrategyContext(formData: Record<string, any>): StepContext {
  const facts: Record<string, any> = {};
  const unknowns: string[] = [];

  if (formData.demand) facts.demand = formData.demand;
  else unknowns.push('plaintiff_demand');

  if (formData.offer) facts.offer = formData.offer;
  else unknowns.push('defense_offer');

  if (formData.venue) facts.venue = formData.venue;
  else unknowns.push('venue');

  if (formData.mediationDate) facts.mediationDate = formData.mediationDate;
  else unknowns.push('mediation_date');

  if (formData.section998) facts.section998 = formData.section998;
  else unknowns.push('998_offers');

  const nextBestQuestions = [];
  if (unknowns.includes('plaintiff_demand')) {
    nextBestQuestions.push("What is the plaintiff's current demand?");
  }
  if (unknowns.includes('defense_offer')) {
    nextBestQuestions.push("What is the defense's latest offer?");
  }
  if (unknowns.includes('venue')) {
    nextBestQuestions.push("What is the venue for this case?");
  }

  return { facts, unknowns, nextBestQuestions };
}

function getProposalBracketsContext(formData: Record<string, any>): StepContext {
  const facts: Record<string, any> = {};
  const unknowns: string[] = [];

  // Gather all previously collected facts
  if (formData.policyLimits) facts.policyLimits = formData.policyLimits;
  if (formData.liabilityPct) facts.liabilityPct = formData.liabilityPct;
  if (formData.medicalBills) facts.medicalBills = formData.medicalBills;
  if (formData.surgery) facts.hasSurgery = true;
  if (formData.venue) facts.venue = formData.venue;
  if (formData.demand) facts.plaintiffDemand = formData.demand;
  if (formData.offer) facts.defenseOffer = formData.offer;

  // Check what's needed for proposal
  if (!formData.comparables || formData.comparables.length === 0) {
    unknowns.push('comparable_cases');
  } else {
    facts.comparablesCount = formData.comparables.length;
  }

  const nextBestQuestions = [];
  if (unknowns.includes('comparable_cases')) {
    nextBestQuestions.push("Would you like me to search for comparable cases?");
  }
  if (!formData.riskAnalysis) {
    nextBestQuestions.push("Would you like a risk analysis before proposing a settlement bracket?");
  }

  return { facts, unknowns, nextBestQuestions };
}

/**
 * Apply an agent action to update the form state
 */
export function applyAgentAction(action: AgentAction): { ok: boolean; error?: string } {
  try {
    switch (action.type) {
      case 'update_field':
        if (!action.path) {
          return { ok: false, error: 'Field path is required' };
        }
        adapterStore.setFormValue(action.path, action.value);
        console.log(`Agent updated field: ${action.path} = ${action.value}`);
        return { ok: true };

      case 'add_note':
        if (!action.text) {
          return { ok: false, error: 'Note text is required' };
        }
        adapterStore.addNote(action.text);
        console.log(`Agent added note: ${action.text.substring(0, 50)}...`);
        return { ok: true };

      case 'advance_step':
        const currentStep = getCurrentPiStepId();
        const stepOrder: PiStepId[] = [
          'upload_intake',
          'issues_coverage',
          'liability_causation',
          'damages_treatment',
          'strategy',
          'proposal_brackets'
        ];
        const currentIndex = stepOrder.indexOf(currentStep);
        if (currentIndex >= 0 && currentIndex < stepOrder.length - 1) {
          const nextStep = stepOrder[currentIndex + 1];
          adapterStore.setCurrentStep(nextStep);
          console.log(`Agent advanced step: ${currentStep} → ${nextStep}`);
          return { ok: true };
        } else {
          return { ok: false, error: 'Cannot advance beyond final step' };
        }

      case 'attach_document_summary':
        if (!action.docId || !action.summary) {
          return { ok: false, error: 'Document ID and summary are required' };
        }
        adapterStore.addDocumentSummary(action.docId, action.summary);
        console.log(`Agent attached summary for doc: ${action.docId}`);
        return { ok: true };

      default:
        return { ok: false, error: `Unknown action type: ${(action as any).type}` };
    }
  } catch (error) {
    console.error('Error applying agent action:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get all context for all steps (useful for agent overview)
 */
export function getAllStepsContext(): Record<PiStepId, StepContext> {
  const allSteps: PiStepId[] = [
    'upload_intake',
    'issues_coverage',
    'liability_causation',
    'damages_treatment',
    'strategy',
    'proposal_brackets'
  ];

  return allSteps.reduce((acc, step) => {
    acc[step] = getContextForStep(step);
    return acc;
  }, {} as Record<PiStepId, StepContext>);
}

/**
 * Subscribe to adapter state changes (useful for React components)
 */
export function subscribeToAdapterChanges(callback: () => void): () => void {
  return adapterStore.subscribe(callback);
}

/**
 * Helper to check if a step is complete (all critical fields filled)
 */
export function isStepComplete(step: PiStepId): boolean {
  const context = getContextForStep(step);
  
  // Critical unknowns that block progression
  const criticalUnknowns: Record<PiStepId, string[]> = {
    'upload_intake': ['plaintiff_name', 'date_of_loss'],
    'issues_coverage': ['policy_limits'],
    'liability_causation': ['liability_percentage'],
    'damages_treatment': ['injuries', 'medical_bills'],
    'strategy': ['plaintiff_demand', 'venue'],
    'proposal_brackets': []
  };

  const critical = criticalUnknowns[step] || [];
  return !critical.some(field => context.unknowns.includes(field));
}
