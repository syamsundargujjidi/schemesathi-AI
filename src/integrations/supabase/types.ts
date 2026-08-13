export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      saved_results: {
        Row: {
          created_at: string
          id: string
          label: string | null
          profile: Json
          scheme_ids: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          profile: Json
          scheme_ids?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          profile?: Json
          scheme_ids?: string[]
          user_id?: string
        }
        Relationships: []
      }
      schemes: {
        Row: {
          apply_url: string
          area_type: string
          available_states: string[]
          benefits: string
          bpl_only: boolean
          caste_categories: string[]
          category: string
          created_at: string
          department: string | null
          disability_required: boolean
          districts: string[]
          documents: string[]
          education_levels: string[]
          eligibility_rules: Json | null
          eligibility_summary: string | null
          employment_status: string | null
          farmer_required: boolean
          gender: string
          government_level: string
          id: string
          is_popular: boolean
          land_ownership_required: boolean
          last_updated: string
          last_verified: string | null
          marital_status: string | null
          max_age: number | null
          max_annual_income: number | null
          min_age: number | null
          min_annual_income: number | null
          ministry: string | null
          minority_required: boolean
          name: string
          occupations: string[]
          official_source_url: string | null
          official_website: string | null
          residency_required: boolean
          residency_years: number | null
          scheme_scope: string
          scheme_status: string
          senior_citizen_required: boolean
          short_description: string
          slug: string
          state: string | null
          student_required: boolean
          subcategories: string[]
          tags: string[]
          verification_status: string
          widow_required: boolean
        }
        Insert: {
          apply_url: string
          area_type?: string
          available_states?: string[]
          benefits: string
          bpl_only?: boolean
          caste_categories?: string[]
          category: string
          created_at?: string
          department?: string | null
          disability_required?: boolean
          districts?: string[]
          documents?: string[]
          education_levels?: string[]
          eligibility_rules?: Json | null
          eligibility_summary?: string | null
          employment_status?: string | null
          farmer_required?: boolean
          gender?: string
          government_level?: string
          id?: string
          is_popular?: boolean
          land_ownership_required?: boolean
          last_updated?: string
          last_verified?: string | null
          marital_status?: string | null
          max_age?: number | null
          max_annual_income?: number | null
          min_age?: number | null
          min_annual_income?: number | null
          ministry?: string | null
          minority_required?: boolean
          name: string
          occupations?: string[]
          official_source_url?: string | null
          official_website?: string | null
          residency_required?: boolean
          residency_years?: number | null
          scheme_scope?: string
          scheme_status?: string
          senior_citizen_required?: boolean
          short_description: string
          slug: string
          state?: string | null
          student_required?: boolean
          subcategories?: string[]
          tags?: string[]
          verification_status?: string
          widow_required?: boolean
        }
        Update: {
          apply_url?: string
          area_type?: string
          available_states?: string[]
          benefits?: string
          bpl_only?: boolean
          caste_categories?: string[]
          category?: string
          created_at?: string
          department?: string | null
          disability_required?: boolean
          districts?: string[]
          documents?: string[]
          education_levels?: string[]
          eligibility_rules?: Json | null
          eligibility_summary?: string | null
          employment_status?: string | null
          farmer_required?: boolean
          gender?: string
          government_level?: string
          id?: string
          is_popular?: boolean
          land_ownership_required?: boolean
          last_updated?: string
          last_verified?: string | null
          marital_status?: string | null
          max_age?: number | null
          max_annual_income?: number | null
          min_age?: number | null
          min_annual_income?: number | null
          ministry?: string | null
          minority_required?: boolean
          name?: string
          occupations?: string[]
          official_source_url?: string | null
          official_website?: string | null
          residency_required?: boolean
          residency_years?: number | null
          scheme_scope?: string
          scheme_status?: string
          senior_citizen_required?: boolean
          short_description?: string
          slug?: string
          state?: string | null
          student_required?: boolean
          subcategories?: string[]
          tags?: string[]
          verification_status?: string
          widow_required?: boolean
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
