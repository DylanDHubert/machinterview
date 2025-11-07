import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verify Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  console.error(errorMsg)
  if (typeof window !== 'undefined') {
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
  }
  // Throw error in development to catch config issues early
  if (process.env.NODE_ENV === 'development') {
    throw new Error(errorMsg)
  }
}

// Create client - will fail gracefully if env vars are missing
// Configure with production-friendly settings
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
)

// Database types - we'll expand these as we build the schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          plan: 'free' | 'pro'
          token_count: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          subscription_current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro'
          token_count?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro'
          token_count?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      interview_sessions: {
        Row: {
          id: string
          user_id: string
          job_title: string
          company_name: string
          job_description: string
          resume_data: any
          transcript: any
          tokens_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_title: string
          company_name: string
          job_description: string
          resume_data?: any
          transcript?: any
          tokens_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_title?: string
          company_name?: string
          job_description?: string
          resume_data?: any
          transcript?: any
          tokens_used?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type InterviewSession = Database['public']['Tables']['interview_sessions']['Row'] 