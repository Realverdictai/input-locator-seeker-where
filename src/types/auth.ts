
export type UserType = 'pi_lawyer' | 'insurance_defense';

export interface UserProfile {
  id: string;
  user_type: UserType;
  company_name?: string;
  bar_number?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface SignUpData {
  email: string;
  password: string;
  user_type: UserType;
  company_name: string;
  bar_number?: string;
  phone?: string;
}
