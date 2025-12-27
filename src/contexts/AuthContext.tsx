import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

type User = {
  id: string
  email: string
  name: string
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on mount
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          await loadUserProfile(session.user)
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await loadUserProfile(session.user)
        } else {
          setUser(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      // Try to get user metadata (name from signup)
      const name = supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User'
      
      // Try to get from profiles table if it exists (with timeout to prevent hanging)
      let profile = null
      try {
        // Add timeout to prevent hanging
        const profileQueryPromise = supabase
          .from('profiles')
          .select('name')
          .eq('id', supabaseUser.id)
          .single()
        
        const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => 
          setTimeout(() => resolve({ data: null, error: { message: 'Profile query timeout' } }), 5000)
        )
        
        const result = await Promise.race([
          profileQueryPromise,
          timeoutPromise
        ])
        
        const { data, error } = result
        
        if (error) {
          // Check if it's a "not found" error (PGRST116) - this is expected if profile doesn't exist
          if (error.code === 'PGRST116') {
            // Profile doesn't exist yet - that's okay, use metadata
            profile = null
          } else {
            // Other database error - log but continue (might be RLS policy issue or table doesn't exist)
            console.warn('Profile query error (non-fatal):', error.message, error.code)
            profile = null
          }
        } else {
          profile = data
        }
      } catch (error: any) {
        // Network error, timeout, or other exception - that's okay, use metadata
        console.warn('Profile query exception (non-fatal):', error?.message || error)
        profile = null
      }

      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: profile?.name || name,
      })
    } catch (error) {
      console.error('Error loading user profile:', error)
      // Fallback to basic user info
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.email?.split('@')[0] || 'User',
      })
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Add timeout to login request to prevent hanging
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => 
        setTimeout(() => resolve({ data: null, error: { message: 'Login request timeout' } }), 10000)
      )
      
      const result = await Promise.race([loginPromise, timeoutPromise])
      const { data, error } = result

      if (error) {
        console.error('Login error:', error)
        if (error.message === 'Login request timeout') {
          console.error('Login request timed out - check your internet connection and Supabase configuration')
        }
        return false
      }

      if (data?.user) {
        // Set user immediately with available data from auth response
        const userName = data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User'
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name: userName,
        })
        
        // Load profile in background - it will update the name if profile exists
        loadUserProfile(data.user).catch(err => {
          console.warn('Profile loading failed (non-blocking):', err)
        })
        
        return true
      }
      return false
    } catch (error: any) {
      console.error('Login error:', error)
      return false
    }
  }

  const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            full_name: name,
          },
        },
      })

      if (error) {
        console.error('Signup error:', error)
        return { success: false, error: error.message }
      }

      if (data.user) {
        // The trigger should automatically create the profile, but we'll also try to upsert
        // This ensures the profile is created even if the trigger fails or is delayed
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            name,
            email,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id'
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Continue anyway - the trigger might have created it, or we can retry later
        }

        await loadUserProfile(data.user)
        return { success: true }
      }
      return { success: false, error: 'Failed to create user account' }
    } catch (error: any) {
      console.error('Signup error:', error)
      return { success: false, error: error?.message || 'An unexpected error occurred' }
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
