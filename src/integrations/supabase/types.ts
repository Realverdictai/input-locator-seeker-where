export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      case_evaluations: {
        Row: {
          case_data: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_data: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_data?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cases_master: {
        Row: {
          acc_type: string | null
          case_id: number
          case_type: string
          created_at: string
          dol: string | null
          inject: string | null
          injuries: string | null
          liab_pct: string | null
          narrative: string | null
          pol_lim: string | null
          settle: string | null
          surgery: string | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          acc_type?: string | null
          case_id: number
          case_type: string
          created_at?: string
          dol?: string | null
          inject?: string | null
          injuries?: string | null
          liab_pct?: string | null
          narrative?: string | null
          pol_lim?: string | null
          settle?: string | null
          surgery?: string | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          acc_type?: string | null
          case_id?: number
          case_type?: string
          created_at?: string
          dol?: string | null
          inject?: string | null
          injuries?: string | null
          liab_pct?: string | null
          narrative?: string | null
          pol_lim?: string | null
          settle?: string | null
          surgery?: string | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      mediation_sessions: {
        Row: {
          created_at: string
          id: string
          insurance_evaluation_id: string | null
          insurance_id: string | null
          mediation_proposal: Json | null
          pi_evaluation_id: string | null
          pi_lawyer_id: string | null
          session_code: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          insurance_evaluation_id?: string | null
          insurance_id?: string | null
          mediation_proposal?: Json | null
          pi_evaluation_id?: string | null
          pi_lawyer_id?: string | null
          session_code: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          insurance_evaluation_id?: string | null
          insurance_id?: string | null
          mediation_proposal?: Json | null
          pi_evaluation_id?: string | null
          pi_lawyer_id?: string | null
          session_code?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mediation_sessions_insurance_evaluation_id_fkey"
            columns: ["insurance_evaluation_id"]
            isOneToOne: false
            referencedRelation: "case_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mediation_sessions_pi_evaluation_id_fkey"
            columns: ["pi_evaluation_id"]
            isOneToOne: false
            referencedRelation: "case_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bar_number: string | null
          company_name: string | null
          created_at: string
          id: string
          phone: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          bar_number?: string | null
          company_name?: string | null
          created_at?: string
          id: string
          phone?: string | null
          updated_at?: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          bar_number?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_type: "pi_lawyer" | "insurance_defense"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_type: ["pi_lawyer", "insurance_defense"],
    },
  },
} as const
