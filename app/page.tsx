"use client"

import React, { useState, useEffect, useRef } from "react"
import useWebRTCAudioSession from "@/hooks/use-webrtc"
import { tools } from "@/lib/tools"
import { BroadcastButton } from "@/components/broadcast-button"
import { AISpeechIndicator } from "@/components/ai-speech-indicator"
import { JobDetails } from "@/components/job-description"
import { SetupModal } from "@/components/setup-modal"
import { Button } from "@/components/ui/button"
import { InterviewTranscript } from "@/components/interview-transcript"
import { LeftSection } from "@/components/left-section"
import { PauseButton } from "@/components/pause-button"
import { ArrowRight, FileText, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Import Conversation type from the same place the hook is using it
import type { Conversation } from "@/lib/conversations"
import { registerResetCallback } from "@/lib/reset-utils"

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Mock data for development testing
const mockResumeData = {
  fullName: "John Developer",
  email: "john@example.com",
  phone: "555-123-4567",
  skills: ["React", "TypeScript", "Node.js", "UI/UX Design"],
  experience: [
    {
      title: "Frontend Developer",
      company: "Tech Solutions Inc.",
      dates: "2020-2023",
      description: "Developed modern web applications using React and TypeScript."
    }
  ],
  education: [
    {
      degree: "B.S. Computer Science",
      school: "University of Technology",
      year: "2020"
    }
  ]
};

const mockJobData: JobDetails = {
  jobTitle: "Senior Frontend Developer",
  companyName: "Innovation Labs",
  jobDescription: "We're looking for an experienced frontend developer with expertise in React and TypeScript to join our team. The ideal candidate will have 3+ years of experience building modern web applications and a strong eye for UI/UX design."
};

const App: React.FC = () => {
  // AI speaking state
  const [aiSpeaking, setAiSpeaking] = useState(false)
  
  // Setup modal state
  const [showSetupModal, setShowSetupModal] = useState(!isDevelopment)
  const [setupComplete, setSetupComplete] = useState(isDevelopment)
  
  // View state for left section
  const [leftView, setLeftView] = useState<'welcome' | 'webcam' | 'results'>('welcome')
  
  // Add isReady state to track if interview is ready
  const [isReady, setIsReady] = useState(false)
  
  // Add voice selection state
  const [selectedVoice, setSelectedVoice] = useState("ash")
  
  // Add interview messages state
  const [interviewMessages, setInterviewMessages] = useState<Conversation[]>([])

  // Add audio stream reference
  const audioStreamRef = useRef<MediaStream | null>(null)

  // State for resume data - moved up to fix linter error
  const [resumeData, setResumeData] = useState<Record<string, unknown> | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingError, setProcessingError] = useState<string | null>(null)
  
  // State for job details - moved up to fix linter error
  const [jobData, setJobData] = useState<JobDetails | null>(null)

  // WebRTC Audio Session Hook - use selectedVoice instead of hardcoded "ash"
  const {
    isSessionActive,
    handleStartStopClick,
    currentVolume,
    startSession,
    sendTextMessage,
    conversation,
    pauseSession,
    resumeSession,
    isPaused: webRTCIsPaused
  } = useWebRTCAudioSession(selectedVoice, tools)

  // Register global reset callback
  useEffect(() => {
    // Define the reset function
    const resetFunction = () => {
      // Reset all state
      setResumeData(null);
      setJobData(null);
      setSetupComplete(false);
      setShowSetupModal(true);
      setIsReady(false);
      setLeftView('welcome');
      
      // If session is active, stop it
      if (isSessionActive) {
        handleStartStopClick();
      }
    };
    
    // Register with our utility
    const cleanupCallback = registerResetCallback(resetFunction);
    
    // Return cleanup function
    return cleanupCallback;
  }, [isSessionActive, handleStartStopClick]);

  // Load mock data in development mode
  useEffect(() => {
    if (isDevelopment && !resumeData && !jobData) {
      setResumeData(mockResumeData);
      setJobData(mockJobData);
    }
  }, [resumeData, jobData]);
  
  // Helper function to bypass setup in development mode
  const bypassSetup = () => {
    setResumeData(mockResumeData);
    setJobData(mockJobData);
    setShowSetupModal(false);
    setSetupComplete(true);
  };

  // Use WebRTC hook's built-in pause/resume functionality instead of our manual implementation
  const handlePauseResume = () => {
    if (webRTCIsPaused) {
      resumeSession();
      console.log("Interview resumed using WebRTC hook");
    } else {
      pauseSession();
      // Ensure AI speaking indicator is turned off when paused
      setAiSpeaking(false);
      console.log("Interview paused using WebRTC hook");
    }
  };

  // Determine if AI is speaking based on volume, session state, and pause state
  React.useEffect(() => {
    // Only update AI speaking state if not paused
    if (!webRTCIsPaused) {
      setAiSpeaking(currentVolume > 0.01 && isSessionActive);
    }
  }, [currentVolume, isSessionActive, webRTCIsPaused]);
  
  // Update interview messages when conversation changes
  React.useEffect(() => {
    if (conversation) {
      setInterviewMessages(conversation)
    }
  }, [conversation])
  
  // Access and store the audio stream when the interview starts
  useEffect(() => {
    if (isReady && !audioStreamRef.current) {
      navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(stream => {
          audioStreamRef.current = stream;
        })
        .catch(err => {
          console.error("Error accessing media devices:", err);
        });
    }
  }, [isReady]);

  // Update the left view when interview starts or ends
  React.useEffect(() => {
    if (isReady) {
      setLeftView('webcam')
    } else if (setupComplete) {
      setLeftView('welcome')
    }
  }, [isReady, setupComplete])
  
  // Cleanup audio stream on unmount
  useEffect(() => {
    return () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        audioStreamRef.current = null;
      }
    };
  }, []);
  
  // Combined function to handle broadcast toggling and interview start/stop
  const handleBroadcastToggle = async () => {
    if (isSessionActive) {
      // If session is active, stop it
      try {
        // Stop the WebRTC audio session (voice recognition and AI stream)
        handleStartStopClick();
        
        // Update UI state to show interview is not active
        setIsReady(false);
        
        // Reset AI speaking state
        setAiSpeaking(false);
        
        console.log("Interview paused: camera, voice recognition, and AI stream stopped");
      } catch (error) {
        console.error("Error stopping interview:", error);
      }
    } else {
      // If session is not active, ensure setup is complete then start
      if (!setupComplete) {
        setShowSetupModal(true);
        return;
      }
      
      try {
        // Start the session
        await startSession();
        setIsReady(true);
        setLeftView('webcam');
        
        console.log("Interview started: camera, voice recognition, and AI stream activated");
        
        // Send context message if available
        if (resumeData && jobData) {
          const contextMessage = `
I'm applying for a ${jobData.jobTitle} position at ${jobData.companyName}.
Here's my resume information: ${JSON.stringify(resumeData, null, 2)}

Here's the job description:
${jobData.jobDescription}

Based on my resume and this job description, please conduct an interview with me focusing on relevant skills and experience.`;
          
          setTimeout(() => {
            sendTextMessage(contextMessage);
          }, 1000);
        } else if (resumeData) {
          const contextMessage = `
Here's my resume information: ${JSON.stringify(resumeData, null, 2)}

Based on my resume, please conduct a general interview with me focusing on my skills and experience.`;
          
          setTimeout(() => {
            sendTextMessage(contextMessage);
          }, 1000);
        } else if (jobData) {
          const contextMessage = `
I'm applying for a ${jobData.jobTitle} position at ${jobData.companyName}.

Here's the job description:
${jobData.jobDescription}

Based on this job description, please conduct an interview with me focusing on skills needed for this role.`;
          
          setTimeout(() => {
            sendTextMessage(contextMessage);
          }, 1000);
        }
      } catch (error) {
        console.error("Error starting interview:", error);
      }
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (file: File) => {
    console.log("Resume uploaded:", file.name)
    setIsProcessing(true)
    setProcessingError(null)
    
    try {
      // Create FormData and append the file
      const formData = new FormData()
      formData.append('file', file)
      
      // Send the file to our API endpoint
      console.log("Sending file to API...")
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      console.log("Upload API response:", result)
      
      if (result.success && result.threadId && result.runId) {
        console.log("PDF upload successful, starting polling...")
        pollForResults(result.threadId, result.runId)
      } else {
        console.error("PDF upload failed:", result.error)
        setProcessingError(result.error || "Upload failed")
        setIsProcessing(false)
      }
    } catch (error) {
      console.error("Error uploading PDF:", error)
      setProcessingError("An error occurred during upload")
      setIsProcessing(false)
    }
  }
  
  // Handle job details submission  
  const handleJobSubmit = (details: JobDetails) => {
    console.log("Job details submitted:", details)
    setJobData(details)
    
    // Here you would typically send the job data to your backend
    // or store it for later use with the interviewer model
  }
  
  // Poll for results with backoff strategy
  const pollForResults = async (threadId: string, runId: string) => {
    let pollCount = 0
    const maxPolls = 30 // Maximum number of polling attempts
    const baseInterval = 2000 // Start with 2 seconds
    const maxInterval = 10000 // Max 10 seconds between polls
    
    const poll = async () => {
      if (pollCount >= maxPolls) {
        console.error("Polling timeout - max attempts reached")
        setProcessingError("Processing timeout - please try again")
        setIsProcessing(false)
        return
      }
      
      // Calculate backoff interval (increases with each poll)
      const interval = Math.min(baseInterval * Math.pow(1.2, pollCount), maxInterval)
      pollCount++
      
      try {
        const response = await fetch(`/api/check-run?threadId=${threadId}&runId=${runId}`)
        const result = await response.json()
        console.log(`Poll ${pollCount} result:`, result)
        
        if (result.success) {
          if (result.done) {
            console.log("Processing complete!")
            setResumeData(result.parsed)
            setIsProcessing(false)
            return
          } else {
            console.log(`Still processing (status: ${result.status}), polling again in ${interval}ms...`)
            setTimeout(poll, interval)
          }
        } else {
          console.error("Error in polling:", result.error)
          setProcessingError(result.error || "Processing failed")
          setIsProcessing(false)
        }
      } catch (error) {
        console.error("Error polling for results:", error)
        setProcessingError("Error checking processing status")
        setIsProcessing(false)
      }
    }
    
    // Start polling
    poll()
  }

  // Handle setup completion
  const handleSetupComplete = (resumeData: Record<string, unknown>, jobData: JobDetails, voice: string) => {
    setResumeData(resumeData);
    setJobData(jobData);
    setSelectedVoice(voice);
    setShowSetupModal(false);
    setSetupComplete(true);
  }

  return (
    <div className="h-screen w-screen flex flex-col allow-scroll">
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-2 right-2 z-50 bg-black/70 text-white p-2 rounded text-xs">
          {setupComplete ? 'Setup Complete' : 'Setup Incomplete'} | 
          Session: {isSessionActive ? 'Active' : 'Inactive'}
        </div>
      )}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI-Powered Interview Preparation</span>
                  </div>
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Practice your interview skills with our AI assistant
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Upload your resume, provide job details, and get personalized interview questions. Our AI will help you prepare for your next job interview.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href="/signup">
                    <Button className="gap-1">
                      Create Account
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" className="gap-1">
                      Sign In
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="mx-auto w-full max-w-[500px] relative aspect-square lg:aspect-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-20 blur-2xl animate-pulse" />
                <div className="relative bg-white dark:bg-gray-900 border rounded-xl shadow-lg overflow-hidden p-4 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-red-500" />
                      <div className="h-4 w-4 rounded-full bg-yellow-500" />
                      <div className="h-4 w-4 rounded-full bg-green-500" />
                    </div>
                    <div className="text-xs font-medium">Interview Session</div>
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg max-w-[80%]">
                      <p className="text-sm">Tell me about your experience with React</p>
                    </div>
                    <div className="bg-primary/10 text-primary p-3 rounded-lg max-w-[80%] self-end">
                      <p className="text-sm">I have 3 years of experience building React applications...</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg max-w-[80%]">
                      <p className="text-sm">Can you describe a challenging project you worked on?</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    <span>How It Works</span>
                  </div>
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Simple 3-Step Process</h2>
                <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Our platform makes interview preparation easy and effective
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 mt-8">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-4 dark:border-gray-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Upload Resume</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Add your resume and let our AI analyze your experience and skills
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-4 dark:border-gray-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <rect width="8" height="14" x="8" y="5" rx="1" />
                    <path d="M4 5h4" />
                    <path d="M4 10h4" />
                    <path d="M4 15h4" />
                    <path d="M16 5h4" />
                    <path d="M16 10h4" />
                    <path d="M16 15h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Provide Job Details</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Enter information about the position you're applying for
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-4 dark:border-gray-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Practice Interview</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Engage in a simulated interview with tailored questions and feedback
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm leading-loose text-gray-500 md:text-left">
            © 2023 Interview AI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="#"
              className="text-sm font-medium hover:underline underline-offset-4"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-sm font-medium hover:underline underline-offset-4"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App;