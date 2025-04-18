"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useAuth } from "@/components/auth-provider"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Please enter your password.",
  }),
})

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  const { user, loading, refreshUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  // Redirect if already logged in - important to check both user and loading
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Only redirect when we're sure about the auth state
      if (!loading) {
        if (user) {
          console.log("User already logged in as", user.email, "redirecting to:", redirectTo)
          router.push(redirectTo)
        } else {
          console.log("User not logged in, showing login form")
        }
      }
    }
    
    checkAuthAndRedirect()
  }, [user, loading, router, redirectTo])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    
    try {
      console.log("Attempting login for:", values.email)
      
      // Clear any existing session first to avoid conflicts
      await supabase.auth.signOut()
      
      // Sign in with password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        throw error
      }

      if (data?.session) {
        console.log("Login successful, session established")
        
        // Explicitly refresh the user state
        await refreshUser()

        // Show success message
        toast({
          title: "Success",
          description: "You have been logged in successfully.",
        })
        
        console.log("Redirecting to:", redirectTo)
        
        // Force refresh and navigation
        router.push(redirectTo)
        router.refresh()
      } else {
        throw new Error("Failed to establish session")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: error.message || "Invalid login credentials. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Only show loading indicator while authentication state is being determined
  if (loading) {
    return (
      <div className="container flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // If user is already logged in, useEffect will handle redirect
  if (user) {
    return (
      <div className="container flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Already logged in as {user.email}</p>
          <p className="text-sm text-gray-500">Redirecting to {redirectTo}...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex flex-col items-center justify-center h-screen max-w-md">
      <div className="w-full space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Enter your credentials to sign in to your account
          </p>
          {redirectTo && redirectTo !== '/dashboard' && (
            <p className="text-sm text-primary">You'll be redirected to {redirectTo} after login</p>
          )}
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>
        
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{" "}
            <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 