import { createClient } from '@supabase/supabase-js'
import type { AnalyzeStockOutput } from '@/ai/flows/analyze-stock'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Create a function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Types for our database schema
export interface Database {
  public: {
    Tables: {
      analysis_history: {
        Row: {
          id: string
          user_id: string
          ticker: string
          investment_thesis: string
          investment_goal: string
          analysis_result: AnalyzeStockOutput
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ticker: string
          investment_thesis: string
          investment_goal: string
          analysis_result: AnalyzeStockOutput
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ticker?: string
          investment_thesis?: string
          investment_goal?: string
          analysis_result?: AnalyzeStockOutput
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
}
