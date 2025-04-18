"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

type User = {
  id: string
  email?: string
  created_at?: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log("Initializing auth provider...")
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Error getting session:", error.message)
          setUser(null)
        } else if (session) {
          console.log("Session found for user:", session.user.email)
          setUser(session.user || null)
        } else {
          console.log("No session found")
          setUser(null)
        }
      } catch (error) {
        console.error("Unexpected auth error:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    
    initAuth()
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change:", event, session?.user?.email)
        setUser(session?.user || null)
        router.refresh()
      }
    )
    
    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase, router])
  
  const refreshUser = async () => {
    try {
      console.log("Refreshing user session...")
      const { data: { user: userData }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error("Error getting user:", error.message)
        throw error
      }
      
      if (userData) {
        console.log("User session refreshed successfully:", userData.email)
        setUser(userData)
      } else {
        console.log("No user found during refresh")
        setUser(null)
      }
    } catch (error: any) {
      console.error("Error refreshing user:", error.message)
      toast({
        title: "Error refreshing session",
        description: error.message || "Please try signing in again",
        variant: "destructive",
      })
    }
  }
  
  const signOut = async () => {
    try {
      console.log("Signing out...")
      await supabase.auth.signOut()
      setUser(null)
      router.push("/")
      router.refresh()
    } catch (error: any) {
      console.error("Error signing out:", error.message)
      toast({
        title: "Error signing out",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }
  
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 