import { createClient } from '@/lib/supabase-client'
import { isSupabaseConfigured } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface CreateProfileData {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
}

export interface UpdateProfileData {
  full_name?: string | null
  avatar_url?: string | null
}

class ProfileService {
  private supabase = createClient()

  async getProfile(userId: string): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
    try {
      if (!isSupabaseConfigured()) {
        return { success: false, error: 'Database not configured' }
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist
          return { success: false, error: 'Profile not found' }
        }
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error getting profile:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async createProfile(profileData: CreateProfileData): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
    try {
      if (!isSupabaseConfigured()) {
        return { success: false, error: 'Database not configured' }
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error creating profile:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async updateProfile(userId: string, updates: UpdateProfileData): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
    try {
      if (!isSupabaseConfigured()) {
        return { success: false, error: 'Database not configured' }
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async ensureProfile(user: User): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
    try {
      // First, try to get existing profile
      const existingProfile = await this.getProfile(user.id)
      
      if (existingProfile.success && existingProfile.data) {
        // Profile exists, check if we need to update it with latest OAuth data
        const needsUpdate = 
          existingProfile.data.full_name !== (user.user_metadata?.full_name || null) ||
          existingProfile.data.avatar_url !== (user.user_metadata?.avatar_url || null)

        if (needsUpdate) {
          console.log('Updating profile with latest OAuth data')
          return await this.updateProfile(user.id, {
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null
          })
        }

        return existingProfile
      }

      // Profile doesn't exist, create it
      console.log('Creating new profile for user:', user.email)
      return await this.createProfile({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null
      })
    } catch (error) {
      console.error('Error ensuring profile:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async deleteProfile(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseConfigured()) {
        return { success: false, error: 'Database not configured' }
      }

      const { error } = await this.supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error deleting profile:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

export const profileService = new ProfileService()
