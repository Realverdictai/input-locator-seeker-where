export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
      };
      cases_master: {
        Row: {
          acc_type: string | null
          case_id: number
          case_type: string
          clean_data: Json | null
          created_at: string
          dol: string | null
          embedding: string | null
          inject: string | null
          injuries: string | null
          liab_pct: string | null
          liab_pct_num: number | null
          narrative: string | null
          pol_lim: string | null
          policy_limits_num: number | null
          settle: string | null
          settle_num: number | null
          surgery: string | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          acc_type?: string | null
          case_id: number
          case_type: string
          clean_data?: Json | null
          created_at?: string
          dol?: string | null
          embedding?: string | null
          inject?: string | null
          injuries?: string | null
          liab_pct?: string | null
          liab_pct_num?: number | null
          narrative?: string | null
          pol_lim?: string | null
          policy_limits_num?: number | null
          settle?: string | null
          settle_num?: number | null
          surgery?: string | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          acc_type?: string | null
          case_id?: number
          case_type?: string
          clean_data?: Json | null
          created_at?: string
          dol?: string | null
          embedding?: string | null
          inject?: string | null
          injuries?: string | null
          liab_pct?: string | null
          liab_pct_num?: number | null
          narrative?: string | null
          pol_lim?: string | null
          policy_limits_num?: number | null
          settle?: string | null
          settle_num?: number | null
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
      },
      uploaded_docs: {
        Row: {
          id: string;
          case_session_id: string;
          file_name: string;
          storage_path: string;
          mime_type: string;
          text_content: string | null;
          embedding: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_session_id: string;
          file_name: string;
          storage_path: string;
          mime_type: string;
          text_content?: string | null;
          embedding?: number[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_session_id?: string;
          file_name?: string;
          storage_path?: string;
          mime_type?: string;
          text_content?: string | null;
          embedding?: number[] | null;
          created_at?: string;
        };
        Relationships: []
      };
      clarify_answers: {
        Row: {
          id: string;
          case_session_id: string;
          question: string | null;
          answer: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_session_id: string;
          question?: string | null;
          answer?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_session_id?: string;
          question?: string | null;
          answer?: string | null;
          created_at?: string;
        };
        Relationships: []
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
      v_case_flat: {
        Row: {
          acc_type: string | null
          case_id: number | null
          case_type: string | null
          dol: string | null
          has_injections: boolean | null
          has_surgery: boolean | null
          injection_count: number | null
          injection_list: Json | null
          injuries: string | null
          is_outlier: boolean | null
          liab_pct: number | null
          narrative: string | null
          policy_limits: number | null
          settlement: number | null
          structured_data: Json | null
          surgery_count: number | null
          surgery_list: Json | null
          venue: string | null
        }
        Insert: {
          acc_type?: never
          case_id?: number | null
          case_type?: never
          dol?: never
          has_injections?: never
          has_surgery?: never
          injection_count?: never
          injection_list?: never
          injuries?: never
          is_outlier?: never
          liab_pct?: never
          narrative?: never
          policy_limits?: never
          settlement?: never
          structured_data?: Json | null
          surgery_count?: never
          surgery_list?: never
          venue?: never
        }
        Update: {
          acc_type?: never
          case_id?: number | null
          case_type?: never
          dol?: never
          has_injections?: never
          has_surgery?: never
          injection_count?: never
          injection_list?: never
          injuries?: never
          is_outlier?: never
          liab_pct?: never
          narrative?: never
          policy_limits?: never
          settlement?: never
          structured_data?: Json | null
          surgery_count?: never
          surgery_list?: never
          venue?: never
        }
        Relationships: []
      }
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      fn_normalize_case: {
        Args: { p_case_id: number }
        Returns: undefined
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      hybrid_case_similarity: {
        Args: {
          query_embedding: string
          query_liab_pct?: number
          query_policy_bucket?: string
          query_tbi_level?: number
          query_has_surgery?: boolean
          result_limit?: number
        }
        Returns: {
          case_id: number
          surgery: string
          inject: string
          injuries: string
          settle: string
          pol_lim: string
          venue: string
          liab_pct: string
          acc_type: string
          narrative: string
        score: number
      }[]
      }
      match_uploaded_docs: {
        Args: {
          query_embedding: number[]
          match_count?: number
          p_session: string
        }
        Returns: {
          file_name: string
          snippet: string
          similarity: number
        }[]
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      user_type: "pi_lawyer" | "insurance_defense"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
