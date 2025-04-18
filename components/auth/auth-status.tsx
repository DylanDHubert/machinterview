"use client"

import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"

export function AuthStatus() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
  }

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
        <Link href="/signup">
          <Button size="sm">
            Create Account
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/profile">
        <div className="flex items-center gap-2 hover:bg-primary/5 px-3 py-1.5 rounded-md transition-colors">
          <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          <div className="text-sm font-medium">{user.email?.split('@')[0]}</div>
        </div>
      </Link>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        onClick={() => signOut()}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  )
} 