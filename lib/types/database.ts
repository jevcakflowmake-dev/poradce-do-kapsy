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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          age: number | null
          income: string | null
          family_status: 'single' | 'partner' | 'family' | 'single_parent' | null
          risk_profile: 'conservative' | 'moderate' | 'balanced' | 'aggressive' | null
          goals: string[] | null
          onboarding_completed: boolean
          status: 'novy' | 'financni_plan' | 'podepsano' | 'servis' | 'zmena'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          age?: number | null
          income?: string | null
          family_status?: 'single' | 'partner' | 'family' | 'single_parent' | null
          risk_profile?: 'conservative' | 'moderate' | 'balanced' | 'aggressive' | null
          goals?: string[] | null
          onboarding_completed?: boolean
          status?: 'novy' | 'financni_plan' | 'podepsano' | 'servis' | 'zmena'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          age?: number | null
          income?: string | null
          family_status?: 'single' | 'partner' | 'family' | 'single_parent' | null
          risk_profile?: 'conservative' | 'moderate' | 'balanced' | 'aggressive' | null
          goals?: string[] | null
          onboarding_completed?: boolean
          status?: 'novy' | 'financni_plan' | 'podepsano' | 'servis' | 'zmena'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          id: string
          client_id: string
          type: 'insurance' | 'pension' | 'invest'
          title: string
          content: string | null
          file_url: string | null
          link_url: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          type: 'insurance' | 'pension' | 'invest'
          title: string
          content?: string | null
          file_url?: string | null
          link_url?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          type?: 'insurance' | 'pension' | 'invest'
          title?: string
          content?: string | null
          file_url?: string | null
          link_url?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'proposals_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      messages: {
        Row: {
          id: string
          client_id: string
          sender_role: 'client' | 'advisor'
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          sender_role: 'client' | 'advisor'
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          sender_role?: 'client' | 'advisor'
          content?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      analysis_responses: {
        Row: {
          id: string
          client_id: string
          section: string
          question_id: string
          value: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          section: string
          question_id: string
          value: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          section?: string
          question_id?: string
          value?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      analysis_files: {
        Row: {
          id: string
          client_id: string
          section: string
          file_name: string
          /** Cesta ve storage, ne URL – odkaz se generuje přes createSignedUrl. */
          file_url: string
          file_size: number
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          section: string
          file_name: string
          file_url: string
          file_size?: number
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          section?: string
          file_name?: string
          file_url?: string
          file_size?: number
          created_at?: string
        }
        Relationships: []
      }
      public_submissions: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          responses: Json
          files: Json
          matched_client_id: string | null
          status: 'pending' | 'applied' | 'discarded'
          has_password: boolean
          applied_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          phone?: string | null
          responses?: Json
          files?: Json
          matched_client_id?: string | null
          status?: 'pending' | 'applied' | 'discarded'
          has_password?: boolean
          applied_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          responses?: Json
          files?: Json
          matched_client_id?: string | null
          status?: 'pending' | 'applied' | 'discarded'
          has_password?: boolean
          applied_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      /** Rozepsaná veřejná analýza. Zapisuje jen serverová routa pod service role. */
      analysis_drafts: {
        Row: {
          id: string
          draft_key: string
          responses: Json
          step: number
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          draft_key: string
          responses?: Json
          step?: number
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          draft_key?: string
          responses?: Json
          step?: number
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      /** Varianty pojistek/produktů, které poradce staví klientovi v editoru plánu. */
      plan_variants: {
        Row: {
          id: string
          client_id: string
          section: string
          company: string
          /** Zkratka nebo písmeno, ne obrázek – ať web nenese cizí ochranné známky. */
          logo: string
          /** Text, ne číslo: poradce píše i rozpětí („1 200 – 1 450 Kč“). */
          monthly_payment: string
          sort_order: number | null
          created_at: string
          details: Json | null
        }
        Insert: {
          id?: string
          client_id: string
          section: string
          company: string
          logo?: string
          monthly_payment: string
          sort_order?: number | null
          created_at?: string
          details?: Json | null
        }
        Update: {
          id?: string
          client_id?: string
          section?: string
          company?: string
          logo?: string
          monthly_payment?: string
          sort_order?: number | null
          created_at?: string
          details?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'plan_variants_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      /** Řádky parametrů uvnitř varianty (krytí, výluky, čekací doby). */
      plan_params: {
        Row: {
          id: string
          variant_id: string
          param_key: string
          param_label: string
          value: string
          note: string | null
          sort_order: number | null
        }
        Insert: {
          id?: string
          variant_id: string
          param_key: string
          param_label: string
          value: string
          note?: string | null
          sort_order?: number | null
        }
        Update: {
          id?: string
          variant_id?: string
          param_key?: string
          param_label?: string
          value?: string
          note?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'plan_params_variant_id_fkey'
            columns: ['variant_id']
            isOneToOne: false
            referencedRelation: 'plan_variants'
            referencedColumns: ['id']
          }
        ]
      }
      /** Slovní doporučení poradce k jednotlivým oblastem plánu. */
      plan_recommendations: {
        Row: {
          id: string
          client_id: string
          section: string
          status: 'ok' | 'recommendation' | 'action' | null
          items: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          section: string
          status?: 'ok' | 'recommendation' | 'action' | null
          items?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          section?: string
          status?: 'ok' | 'recommendation' | 'action' | null
          items?: string[] | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'plan_recommendations_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      /** Vstupní čísla pro graf života – jeden řádek na klienta. */
      client_financials: {
        Row: {
          id: string
          client_id: string
          age: number | null
          retirement_age: number | null
          monthly_income_net: number | null
          dependents_count: number | null
          has_mortgage: boolean | null
          mortgage_remaining_amount: number | null
          mortgage_remaining_years: number | null
          property_value_real_estate: number | null
          property_value_movables: number | null
          notes: string | null
          possible_savings: number | null
          reserve: number | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          age?: number | null
          retirement_age?: number | null
          monthly_income_net?: number | null
          dependents_count?: number | null
          has_mortgage?: boolean | null
          mortgage_remaining_amount?: number | null
          mortgage_remaining_years?: number | null
          property_value_real_estate?: number | null
          property_value_movables?: number | null
          notes?: string | null
          possible_savings?: number | null
          reserve?: number | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          age?: number | null
          retirement_age?: number | null
          monthly_income_net?: number | null
          dependents_count?: number | null
          has_mortgage?: boolean | null
          mortgage_remaining_amount?: number | null
          mortgage_remaining_years?: number | null
          property_value_real_estate?: number | null
          property_value_movables?: number | null
          notes?: string | null
          possible_savings?: number | null
          reserve?: number | null
          updated_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'client_financials_client_id_fkey'
            columns: ['client_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      /** Reakce klienta na oblast plánu – jedna volba na (client_id, section). */
      plan_section_interest: {
        Row: {
          id: string
          client_id: string
          section: string
          status: 'interested' | 'question' | 'not_now'
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          section: string
          status: 'interested' | 'question' | 'not_now'
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          section?: string
          status?: 'interested' | 'question' | 'not_now'
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'plan_section_interest_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      /** Varianta, kterou si klient označil jako preferovanou (poradce ji dojedná mimo aplikaci). */
      plan_variant_selection: {
        Row: {
          id: string
          client_id: string
          variant_id: string
          selected_at: string
        }
        Insert: {
          id?: string
          client_id: string
          variant_id: string
          selected_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          variant_id?: string
          selected_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'plan_variant_selection_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'plan_variant_selection_variant_id_fkey'
            columns: ['variant_id']
            isOneToOne: false
            referencedRelation: 'plan_variants'
            referencedColumns: ['id']
          }
        ]
      }
      questionnaire_definitions: {
        Row: {
          id: string
          key: string
          version: number
          title: string
          definition: Json
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          key: string
          version: number
          title: string
          definition: Json
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          key?: string
          version?: number
          title?: string
          definition?: Json
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      questionnaires: {
        Row: {
          id: string
          client_id: string
          areas: string[]
          answers: Json
          status: 'draft' | 'submitted' | 'reviewed'
          submitted_at: string | null
          definition_key: string
          definition_version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          areas?: string[]
          answers?: Json
          status?: 'draft' | 'submitted' | 'reviewed'
          submitted_at?: string | null
          definition_key?: string
          definition_version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          areas?: string[]
          answers?: Json
          status?: 'draft' | 'submitted' | 'reviewed'
          submitted_at?: string | null
          definition_key?: string
          definition_version?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'questionnaires_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'questionnaires_definition_fk'
            columns: ['definition_key', 'definition_version']
            isOneToOne: false
            referencedRelation: 'questionnaire_definitions'
            referencedColumns: ['key', 'version']
          }
        ]
      }
      questionnaire_reviews: {
        Row: {
          questionnaire_id: string
          recommendation: Json | null
          flags: string[]
          computed_at: string | null
          advisor_note: string | null
          updated_at: string
        }
        Insert: {
          questionnaire_id: string
          recommendation?: Json | null
          flags?: string[]
          computed_at?: string | null
          advisor_note?: string | null
          updated_at?: string
        }
        Update: {
          questionnaire_id?: string
          recommendation?: Json | null
          flags?: string[]
          computed_at?: string | null
          advisor_note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'questionnaire_reviews_questionnaire_id_fkey'
            columns: ['questionnaire_id']
            isOneToOne: true
            referencedRelation: 'questionnaires'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      get_user_role: {
        Args: Record<string, never>
        Returns: string
      }
      is_advisor: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Proposal = Database['public']['Tables']['proposals']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type FamilyStatus = NonNullable<Profile['family_status']>
export type RiskProfile = NonNullable<Profile['risk_profile']>
export type ProposalType = Proposal['type']
export type ClientStatus = Profile['status']
export type PublicSubmission = Database['public']['Tables']['public_submissions']['Row']
export type SubmissionStatus = PublicSubmission['status']
export type AnalysisDraft = Database['public']['Tables']['analysis_drafts']['Row']
export type PlanVariant = Database['public']['Tables']['plan_variants']['Row']
export type PlanParam = Database['public']['Tables']['plan_params']['Row']
export type PlanRecommendation = Database['public']['Tables']['plan_recommendations']['Row']
export type RecommendationStatus = NonNullable<PlanRecommendation['status']>
export type ClientFinancials = Database['public']['Tables']['client_financials']['Row']
export type PlanSectionInterest = Database['public']['Tables']['plan_section_interest']['Row']
export type InterestStatus = PlanSectionInterest['status']
export type PlanVariantSelection = Database['public']['Tables']['plan_variant_selection']['Row']
