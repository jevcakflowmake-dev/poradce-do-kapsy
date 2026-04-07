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
          age: number | null
          income: string | null
          family_status: 'single' | 'partner' | 'family' | 'single_parent' | null
          risk_profile: 'conservative' | 'moderate' | 'balanced' | 'aggressive' | null
          goals: string[] | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          age?: number | null
          income?: string | null
          family_status?: 'single' | 'partner' | 'family' | 'single_parent' | null
          risk_profile?: 'conservative' | 'moderate' | 'balanced' | 'aggressive' | null
          goals?: string[] | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          age?: number | null
          income?: string | null
          family_status?: 'single' | 'partner' | 'family' | 'single_parent' | null
          risk_profile?: 'conservative' | 'moderate' | 'balanced' | 'aggressive' | null
          goals?: string[] | null
          onboarding_completed?: boolean
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
