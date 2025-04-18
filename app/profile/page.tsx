"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2 } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [email, setEmail] = useState("")
  
  useEffect(() => {
    async function getProfile() {
      try {
        setLoading(true)
        
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          throw error
        }
        
        if (!user) {
          router.push("/login")
          return
        }
        
        setUser(user)
        setEmail(user.email || "")
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast({
          title: "Error loading profile",
          description: "Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    getProfile()
  }, [router, supabase])
  
  const handleSignOut = async () => {
    try {
      setUpdating(true)
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }
  
  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-gray-500">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              value={email} 
              disabled 
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">
              To change your email, please contact support
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Account created</Label>
            <div className="text-sm text-gray-500">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
          <Button 
            variant="destructive" 
            className="w-full" 
            onClick={handleSignOut}
            disabled={updating}
          >
            {updating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing out...
              </>
            ) : (
              "Sign out"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 