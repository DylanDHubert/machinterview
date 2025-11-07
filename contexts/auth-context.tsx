"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, type User as DBUser } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  dbUser: DBUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateTokenCount: (tokensUsed: number) => Promise<void>
  canUseTokens: (tokensNeeded: number) => boolean
  getRemainingTokens: () => number
  // New interview-based methods
  canStartInterview: () => boolean
  completeInterview: () => Promise<void>
  getRemainingInterviews: () => number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const FREE_TIER_TOKEN_LIMIT = 2000 // Keep for backwards compatibility and pro users
const FREE_TIER_INTERVIEW_LIMIT = 2 // Users get exactly 2 free interviews

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [dbUser, setDbUser] = useState<DBUser | null>(null)
  const [loading, setLoading] = useState(true)
  const fetchingUserRef = useRef<string | null>(null) // Track which user is being fetched

  useEffect(() => {
    // Verify Supabase configuration
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables')
    }

    // Add debug functions to window for manual testing
    if (typeof window !== 'undefined') {
      (window as any).clearAuthData = () => {
        console.log('Manually clearing all auth data...')
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('sb-')) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
        setUser(null)
        setDbUser(null)
        window.location.reload()
      }
    }

    // Get initial user
    const getUser = async () => {
      try {
        console.log('Getting initial user...')
        
        // Use getSession() instead of getUser() - it reads from localStorage first
        // and doesn't require a network call, making it faster and more reliable
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('auth.getSession() timeout - Supabase auth hanging')), 5000)
        })

        console.log('Executing auth.getSession() with timeout...')
        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise.then(result => result),
          timeoutPromise.then(() => ({ data: { session: null }, error: { message: 'timeout' } }))
        ]) as any
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setUser(null)
          setDbUser(null)
          return
        }
        
        const user = session?.user || null
        console.log('Initial user result:', user ? `User found: ${user.id}` : 'No user')
        setUser(user)
        
        if (user) {
          console.log('User detected, fetching database profile...')
          await fetchDbUser(user.id)
        } else {
          console.log('No user detected, skipping database fetch')
        }
      } catch (error) {
        console.error('Error getting initial user:', error)
        // If auth.getSession() fails/times out, assume no user and continue
        console.log('Assuming no user due to auth timeout, continuing with app load')
        setUser(null)
        setDbUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        console.log('Auth state change:', event, session?.user ? `User: ${session.user.id}` : 'No user')
        setUser(session?.user || null)
        
        if (session?.user) {
          console.log('Auth state change - fetching user profile...')
          await fetchDbUser(session.user.id)
        } else {
          console.log('Auth state change - no user, clearing profile')
          setDbUser(null)
        }
      } catch (error) {
        console.error('Error in auth state change:', error)
        // Don't let auth state change errors break the app
        if (session?.user) {
          setUser(session.user)
          setDbUser(null) // Clear dbUser on error to prevent inconsistent state
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Helper function to ensure we have a valid session
  const ensureValidSession = async () => {
    try {
      console.log('Ensuring valid session...')
      
      // Try to get the current session first with timeout
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('getSession timeout')), 5000)
      })
      
      const { data: { session: currentSession }, error: sessionError } = await Promise.race([
        sessionPromise.then(result => result),
        timeoutPromise.then(() => ({ data: { session: null }, error: { message: 'timeout' } }))
      ]) as any
      
      if (sessionError || !currentSession) {
        console.log('No current session found or timeout')
        return false
      }
      
      // Check if the session is close to expiring (within 60 seconds)
      const expiresAt = currentSession.expires_at
      const now = Math.floor(Date.now() / 1000)
      const timeToExpiry = expiresAt ? expiresAt - now : 0
      
      if (timeToExpiry < 60) {
        console.log('Session is close to expiring, refreshing...')
        
        // Add timeout to refreshSession as well
        const refreshPromise = supabase.auth.refreshSession()
        const refreshTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('refreshSession timeout')), 5000)
        })
        
        const { data: { session: refreshedSession }, error } = await Promise.race([
          refreshPromise.then(result => result),
          refreshTimeoutPromise.then(() => ({ data: { session: null }, error: { message: 'timeout' } }))
        ]) as any
        
        if (error) {
          console.error('Failed to refresh session:', error)
          return false
        }
        
        if (!refreshedSession) {
          console.error('No refreshed session returned')
          return false
        }
        
        console.log('Session refreshed successfully')
        return true
      }
      
      console.log('Current session is valid')
      return true
    } catch (error) {
      console.error('Error ensuring valid session:', error)
      return false
    }
  }

  const fetchDbUser = async (userId: string) => {
    // Prevent concurrent fetches for the same user
    if (fetchingUserRef.current === userId) {
      console.log('fetchDbUser: Already fetching user, skipping duplicate request')
      return
    }
    
    try {
      fetchingUserRef.current = userId
      console.log('fetchDbUser: Starting fetch for user:', userId)
      
      // Ensure we have a valid session before making database queries
      const hasValidSession = await ensureValidSession()
      
      if (!hasValidSession) {
        console.error('No valid session available - user needs to re-authenticate')
        setDbUser(null)
        fetchingUserRef.current = null // Clear flag before returning
        return
      }
      
      console.log('fetchDbUser: Valid session confirmed')
      
      // Increase timeout for development and add better error handling
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout - RLS/JWT issue')), 10000) // Increased to 10 seconds
      })

      console.log('fetchDbUser: Executing database query with timeout...')
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any

      console.log('fetchDbUser: Database query result:', { data, error })

      if (error) {
        // Handle specific error types
        if (error.message === 'Database query timeout - RLS/JWT issue') {
          console.error('Database query timed out - likely JWT/RLS issue')
          // Try to refresh session and retry once
          console.log('Attempting to refresh session and retry...')
          const retrySessionValid = await ensureValidSession()
          if (retrySessionValid) {
            console.log('Session refreshed, retrying query...')
            const { data: retryData, error: retryError } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single()
            
            if (!retryError && retryData) {
              console.log('Retry successful!')
              setDbUser(retryData)
              return
            }
          }
        }
        
        // PGRST116 is "not found" - if user doesn't exist, we'll create it below
        // PGRST301 is "permission denied" or RLS blocking - try to fetch anyway
        if (error.code === 'PGRST301' || error.code === '42501') {
          console.warn('RLS policy blocked query, but user might exist. Trying upsert...')
          // Continue to upsert logic below - will handle if user exists
        } else if (error.code !== 'PGRST116') {
          console.error('Error fetching user data:', error)
          return
        }
      }

      if (data) {
        console.log('fetchDbUser: Found existing user')
        // MIGRATION: Reset free users to new interview-based system
        // If a free user has token_count >= FREE_TIER_TOKEN_LIMIT, they're from the old system
        // Reset them to 0 to give them 2 fresh interviews
        if (data.plan === 'free' && data.token_count >= FREE_TIER_TOKEN_LIMIT) {
          console.log('Migrating user to new interview-based system...')
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              token_count: 0, // Reset to 0 = 2 fresh interviews
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)
          
          if (updateError) {
            console.error('Error migrating user to new system:', updateError)
            setDbUser(data)
          } else {
            // Set the updated user data
            setDbUser({ ...data, token_count: 0 })
            console.log('User successfully migrated to interview-based system with 2 fresh interviews')
          }
        } else {
          setDbUser(data)
          console.log('Existing user loaded:', {
            id: data.id,
            email: data.email,
            plan: data.plan,
            token_count: data.token_count,
            created_at: data.created_at
          })
        }
      } else {
        console.log('fetchDbUser: No user found, creating new user')
        // Get the current user's email from auth session (faster than getUser)
        const { data: { session } } = await supabase.auth.getSession()
        const authUser = session?.user
        
        console.log('Creating new user record for:', authUser?.email)
        
        // Use upsert to handle case where user already exists (e.g., from trigger)
        // This prevents duplicate key errors if the trigger already created the user
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            email: authUser?.email || '',
            plan: 'free',
            token_count: 0 // New users start with 0 tokens used, so they have full allowance
          }, {
            onConflict: 'id'
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating user record:', insertError)
          // If upsert fails, try to fetch the user again (might have been created by trigger)
          const { data: retryData, error: retryError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()
          
          if (!retryError && retryData) {
            console.log('User found after upsert error, using existing record')
            setDbUser(retryData)
          }
        } else {
          console.log('New user created successfully:', newUser)
          setDbUser(newUser)
        }
      }
    } catch (error) {
      console.error('Error in fetchDbUser:', error)
      
      // If it's a timeout error, provide helpful guidance
      if (error instanceof Error && error.message === 'Database query timeout - RLS/JWT issue') {
        console.error('Database timeout occurred. This usually means:')
        console.error('1. JWT token is expired or invalid')
        console.error('2. RLS policies are preventing access')
        console.error('3. Database connection issues')
        console.error('Try refreshing the page or signing out and back in.')
      }
    } finally {
      // Clear the fetching flag when done
      if (fetchingUserRef.current === userId) {
        fetchingUserRef.current = null
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { error }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })
    return { error }
  }

  const signOut = async () => {
    try {
      console.log('Starting sign out process...')
      
      // Clear all auth-related data from localStorage first
      if (typeof window !== 'undefined') {
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('sb-')) {
            keysToRemove.push(key)
          }
        }
        console.log('Clearing localStorage keys:', keysToRemove)
        keysToRemove.forEach(key => localStorage.removeItem(key))
      }
      
      // Explicitly clear user state first
      setUser(null)
      setDbUser(null)
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        // Don't throw error - we've already cleared local state
      }
      
      console.log('Sign out completed successfully')
    } catch (error) {
      console.error('Sign out error:', error)
      // Still clear local state even if Supabase signOut fails
      setUser(null)
      setDbUser(null)
    }
  }

  const updateTokenCount = async (tokensUsed: number) => {
    if (!dbUser) return

    // Ensure we have a valid session before making database queries
    const hasValidSession = await ensureValidSession()
    
    if (!hasValidSession) {
      console.error('No valid session available for token count update')
      return
    }

    const newTokenCount = dbUser.token_count + tokensUsed

    const { error } = await supabase
      .from('users')
      .update({ 
        token_count: newTokenCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', dbUser.id)

    if (error) {
      console.error('Error updating token count:', error)
    } else {
      setDbUser({ ...dbUser, token_count: newTokenCount })
    }
  }

  const canUseTokens = (tokensNeeded: number) => {
    if (!dbUser) return false
    if (dbUser.plan === 'pro') return true
    return (dbUser.token_count + tokensNeeded) <= FREE_TIER_TOKEN_LIMIT
  }

  const getRemainingTokens = () => {
    if (!dbUser) return 0
    if (dbUser.plan === 'pro') return Infinity
    return Math.max(0, FREE_TIER_TOKEN_LIMIT - dbUser.token_count)
  }

  // New interview-based methods
  const canStartInterview = () => {
    if (!dbUser) return false
    if (dbUser.plan === 'pro') return true
    
    // For free users, check if they have interviews remaining
    const interviewsUsed = getInterviewsUsed()
    return interviewsUsed < FREE_TIER_INTERVIEW_LIMIT
  }

  const completeInterview = async () => {
    if (!dbUser) return
    if (dbUser.plan === 'pro') {
      // Pro users: just track token usage for stats, no limits
      return
    }

    // Ensure we have a valid session before making database queries
    const hasValidSession = await ensureValidSession()
    
    if (!hasValidSession) {
      console.error('No valid session available for interview completion')
      return
    }

    // For free users: mark one interview as completed
    // We'll use a simple approach: increment token_count by a fixed amount to represent 1 interview
    const TOKENS_PER_INTERVIEW = 1000 // Each interview = 1000 tokens for tracking purposes
    const newTokenCount = dbUser.token_count + TOKENS_PER_INTERVIEW

    const { error } = await supabase
      .from('users')
      .update({ 
        token_count: newTokenCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', dbUser.id)

    if (error) {
      console.error('Error completing interview:', error)
    } else {
      setDbUser({ ...dbUser, token_count: newTokenCount })
      console.log('Interview completed successfully. Interviews used:', getInterviewsUsed() + 1)
    }
  }

  const getRemainingInterviews = () => {
    if (!dbUser) {
      return 0
    }
    if (dbUser.plan === 'pro') {
      return Infinity
    }
    
    const interviewsUsed = getInterviewsUsed()
    const remaining = Math.max(0, FREE_TIER_INTERVIEW_LIMIT - interviewsUsed)
    return remaining
  }

  const getInterviewsUsed = () => {
    if (!dbUser) return 0
    // Each interview = 1000 tokens for tracking purposes
    const TOKENS_PER_INTERVIEW = 1000
    const used = Math.floor(dbUser.token_count / TOKENS_PER_INTERVIEW)
    return used
  }

  const value = {
    user,
    dbUser,
    loading,
    signIn,
    signUp,
    signOut,
    updateTokenCount,
    canUseTokens,
    getRemainingTokens,
    // New interview-based methods
    canStartInterview,
    completeInterview,
    getRemainingInterviews
  }

  return (
    <AuthContext.Provider value={value}>
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