
import { CaseData } from './verdict';

export type MediationStatus =
  | 'pending'
  | 'in-progress'
  | 'awaiting_evaluation'
  | 'proposal_sent'
  | 'completed'
  | 'cancelled';

export interface MediationSession {
  id: string;
  session_code: string;
  pi_lawyer_id?: string;
  insurance_id?: string;
  pi_evaluation_id?: string;
  insurance_evaluation_id?: string;
  mediation_proposal?: any;
  status: MediationStatus;
  created_at: string;
  updated_at: string;
}

export interface MediationProposal {
  settlement_amount: number;
  rationale: string;
  key_differences: string[];
  common_ground: string[];
  recommendation: string;
}
