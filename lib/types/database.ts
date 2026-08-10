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
    }
    Views: Record<string, never>
    Functions: {
      get_user_role: {
        Args: Record<string, never>
        Returns: string
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
