import { createClient } from '@/lib/supabase-client'
import type { Database } from './supabase'
import type { AnalyzeStockOutput } from '@/ai/flows/analyze-stock'

type AnalysisHistory = Database['public']['Tables']['analysis_history']['Row']
type AnalysisHistoryInsert = Database['public']['Tables']['analysis_history']['Insert']

export interface AnalysisHistoryItem extends AnalysisHistory {
  analysis_result: AnalyzeStockOutput
}

export interface CreateAnalysisHistoryData {
  ticker: string
  investment_thesis: string
  investment_goal: string
  analysis_result: AnalyzeStockOutput
}

export class AnalysisHistoryService {
  private supabase = createClient()

  async saveAnalysis(data: CreateAnalysisHistoryData): Promise<{ success: boolean; error?: string; data?: AnalysisHistoryItem }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const insertData: AnalysisHistoryInsert = {
        user_id: user.id,
        ticker: data.ticker.toUpperCase(),
        investment_thesis: data.investment_thesis,
        investment_goal: data.investment_goal,
        analysis_result: data.analysis_result
      }

      const { data: result, error } = await this.supabase
        .from('analysis_history')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Error saving analysis:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: result as AnalysisHistoryItem }
    } catch (error) {
      console.error('Unexpected error saving analysis:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  async getAnalysisHistory(limit = 20, offset = 0): Promise<{ success: boolean; error?: string; data?: AnalysisHistoryItem[] }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { data, error } = await this.supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching analysis history:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data as AnalysisHistoryItem[] }
    } catch (error) {
      console.error('Unexpected error fetching analysis history:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  async getAnalysisById(id: string): Promise<{ success: boolean; error?: string; data?: AnalysisHistoryItem }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { data, error } = await this.supabase
        .from('analysis_history')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching analysis:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data as AnalysisHistoryItem }
    } catch (error) {
      console.error('Unexpected error fetching analysis:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  async deleteAnalysis(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { error } = await this.supabase
        .from('analysis_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting analysis:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error deleting analysis:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  async getAnalysisCount(): Promise<{ success: boolean; error?: string; count?: number }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { count, error } = await this.supabase
        .from('analysis_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (error) {
        console.error('Error counting analyses:', error)
        return { success: false, error: error.message }
      }

      return { success: true, count: count || 0 }
    } catch (error) {
      console.error('Unexpected error counting analyses:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  async searchAnalyses(query: string, limit = 20): Promise<{ success: boolean; error?: string; data?: AnalysisHistoryItem[] }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { data, error } = await this.supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .or(`ticker.ilike.%${query}%,investment_thesis.ilike.%${query}%,investment_goal.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error searching analyses:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data as AnalysisHistoryItem[] }
    } catch (error) {
      console.error('Unexpected error searching analyses:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }
}

// Export a singleton instance
export const analysisHistoryService = new AnalysisHistoryService()
