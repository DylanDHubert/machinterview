"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AISpeechIndicator } from "@/components/ai-speech-indicator"
import { BroadcastButton } from "@/components/broadcast-button"
import { PauseButton } from "@/components/pause-button"
import { toast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function InterviewPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasResume, setHasResume] = useState(false)
  const [hasJob, setHasJob] = useState(false)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [interviewMessages, setInterviewMessages] = useState([
    { role: "ai", content: "Welcome to your interview session. I'll ask you questions based on your resume and the job description. Click 'Start Interview' when you're ready." }
  ])
  
  useEffect(() => {
    async function checkUserData() {
      try {
        setIsLoading(true)
        
        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          router.push("/login")
          return
        }
        
        // Check if user has resume
        const { data: resumes, error: resumeError } = await supabase
          .from("resumes")
          .select("id")
          .limit(1)
        
        if (resumeError) throw resumeError
        
        setHasResume(resumes && resumes.length > 0)
        
        // Check if user has job
        const { data: jobs, error: jobError } = await supabase
          .from("jobs")
          .select("id")
          .limit(1)
        
        if (jobError) throw jobError
        
        setHasJob(jobs && jobs.length > 0)
        
        // Set ready state
        setIsReady(resumes && resumes.length > 0 && jobs && jobs.length > 0)
      } catch (error) {
        console.error("Error checking user data:", error)
        toast({
          title: "Error",
          description: "Failed to load your data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    checkUserData()
    
    // Simulate microphone volume for demo
    const intervalId = setInterval(() => {
      if (isSessionActive && !isPaused) {
        // Randomly toggle AI speaking state for demo purposes
        setAiSpeaking(prev => Math.random() > 0.7 ? !prev : prev)
        
        // Add a mock message every 5 seconds for demo
        if (Math.random() > 0.9) {
          addMessage("ai", "Tell me about a challenging project you worked on. How did you handle it?")
        }
      }
    }, 1000)
    
    return () => clearInterval(intervalId)
  }, [router, supabase, isSessionActive, isPaused])
  
  const addMessage = (role: string, content: string) => {
    setInterviewMessages(prev => [...prev, { role, content }])
  }
  
  const handleBroadcastToggle = () => {
    if (isSessionActive) {
      // End session
      setIsSessionActive(false)
      setAiSpeaking(false)
      setIsPaused(false)
      addMessage("ai", "Interview session ended. Thank you for participating. You can start a new session or return to the dashboard.")
    } else {
      // Start session
      setIsSessionActive(true)
      addMessage("ai", "Let's begin the interview. I'll start by asking you a few questions about your background.")
      
      // Add a sample question after a delay
      setTimeout(() => {
        addMessage("ai", "Could you tell me about your experience with the technologies mentioned in the job description?")
      }, 2000)
    }
  }
  
  const handlePauseResume = () => {
    setIsPaused(!isPaused)
    
    if (isPaused) {
      addMessage("ai", "Interview resumed. Let's continue where we left off.")
    } else {
      addMessage("ai", "Interview paused. Take your time to think about your answers.")
    }
  }
  
  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-gray-500">Loading interview data...</p>
        </div>
      </div>
    )
  }
  
  // If user hasn't completed setup
  if (!isReady) {
    return (
      <div className="container max-w-md py-10">
        <Card>
          <CardHeader>
            <CardTitle>Setup Required</CardTitle>
            <CardDescription>
              Before you can start an interview, you need to complete the following:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={`h-4 w-4 rounded-full ${hasResume ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{hasResume ? 'Resume uploaded' : 'Upload a resume'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-4 w-4 rounded-full ${hasJob ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{hasJob ? 'Job details added' : 'Add job details'}</span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            {!hasResume && (
              <Link href="/dashboard/resume/new" className="w-full">
                <Button className="w-full">Upload Resume</Button>
              </Link>
            )}
            {!hasJob && (
              <Link href="/dashboard/job/new" className="w-full">
                <Button className="w-full" variant={hasResume ? "default" : "outline"}>
                  Add Job Details
                </Button>
              </Link>
            )}
            <Link href="/dashboard" className="w-full">
              <Button variant="outline" className="w-full">Back to Dashboard</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container py-6">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-[1fr,400px] gap-6">
        {/* Interview transcript */}
        <div className="bg-white dark:bg-gray-950 border rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
            <h2 className="text-lg font-medium">Interview Transcript</h2>
          </div>
          <div className="flex-1 p-4 overflow-y-auto h-[calc(100vh-14rem)]">
            <div className="space-y-4">
              {interviewMessages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                >
                  <div 
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === 'ai' 
                        ? 'bg-gray-100 dark:bg-gray-800' 
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    <p>{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* AI controls */}
        <div className="bg-white dark:bg-gray-950 border rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
            <h2 className="text-lg font-medium">AI Assistant</h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <AISpeechIndicator 
              isSpeaking={aiSpeaking} 
              isSessionActive={isSessionActive}
              isPaused={isPaused}
            />
            
            <div className="mt-8 w-full space-y-4">
              {isSessionActive ? (
                <>
                  <PauseButton 
                    isPaused={isPaused} 
                    onClick={handlePauseResume}
                  />
                  <BroadcastButton 
                    isSessionActive={isSessionActive} 
                    onClick={handleBroadcastToggle}
                  />
                </>
              ) : (
                <BroadcastButton 
                  isSessionActive={isSessionActive} 
                  onClick={handleBroadcastToggle}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 