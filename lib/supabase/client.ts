import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './types';

export const createClient = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.warn('Warning: Creating Supabase client in server component without environment variables');
  }
  
  try {
    return createClientComponentClient<Database>();
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    // Return a dummy client that won't throw errors
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Auth service unavailable' } }),
        signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Auth service unavailable' } }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
            data: null,
            error: null,
          }),
          data: null,
          error: null,
        }),
      }),
    } as any;
  }
};

// Create a singleton instance
export const supabase = createClient(); 