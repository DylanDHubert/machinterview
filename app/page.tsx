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
import { LandingPage } from "@/components/landing-page"
import { JobInfoSidebar } from "@/components/job-info-sidebar"

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
  
  // App state management
  const [appState, setAppState] = useState<'landing' | 'setup' | 'interview'>(
    isDevelopment ? 'interview' : 'landing'
  )
  const [showSetupModal, setShowSetupModal] = useState(false)
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
      setShowSetupModal(false);
      setIsReady(false);
      setLeftView('welcome');
      setAppState('landing');
      
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
    setAppState('interview');
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
    } else if (setupComplete && appState === 'interview') {
      setLeftView('webcam') // Start with webcam view ready, not welcome
    }
  }, [isReady, setupComplete, appState])
  
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
You are conducting a realistic job interview. I'm applying for a ${jobData.jobTitle} position at ${jobData.companyName}.

Here's my resume information: ${JSON.stringify(resumeData, null, 2)}

Here's the job description:
${jobData.jobDescription}

IMPORTANT INTERVIEW GUIDELINES:
- Ask ONE question at a time and wait for my response
- Be conversational and natural like a real interviewer
- Start with a warm greeting and one introductory question
- Follow up based on my answers before moving to the next topic
- Don't list multiple questions in a single response
- Keep questions focused and specific
- Act like you're having a real conversation, not conducting a survey

Please start by introducing yourself and asking your first question.`;
          
          setTimeout(() => {
            sendTextMessage(contextMessage);
          }, 1000);
        } else if (resumeData) {
          const contextMessage = `
You are conducting a realistic job interview. 

Here's my resume information: ${JSON.stringify(resumeData, null, 2)}

IMPORTANT INTERVIEW GUIDELINES:
- Ask ONE question at a time and wait for my response
- Be conversational and natural like a real interviewer
- Start with a warm greeting and one introductory question
- Follow up based on my answers before moving to the next topic
- Don't list multiple questions in a single response
- Keep questions focused and specific
- Act like you're having a real conversation, not conducting a survey

Please start by introducing yourself and asking your first question about my background.`;
          
          setTimeout(() => {
            sendTextMessage(contextMessage);
          }, 1000);
        } else if (jobData) {
          const contextMessage = `
You are conducting a realistic job interview. I'm applying for a ${jobData.jobTitle} position at ${jobData.companyName}.

Here's the job description:
${jobData.jobDescription}

IMPORTANT INTERVIEW GUIDELINES:
- Ask ONE question at a time and wait for my response
- Be conversational and natural like a real interviewer
- Start with a warm greeting and one introductory question
- Follow up based on my answers before moving to the next topic
- Don't list multiple questions in a single response
- Keep questions focused and specific
- Act like you're having a real conversation, not conducting a survey

Please start by introducing yourself and asking your first question about my interest in this role.`;
          
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

  // Handle get started button
  const handleGetStarted = () => {
    setAppState('setup')
    setShowSetupModal(true)
  }

  // Handle setup completion
  const handleSetupComplete = (resumeData: Record<string, unknown>, jobData: JobDetails, voice: string) => {
    setResumeData(resumeData);
    setJobData(jobData);
    setSelectedVoice(voice);
    setShowSetupModal(false);
    setSetupComplete(true);
    setAppState('interview');
  }

  // Render different content based on app state
  if (appState === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />
  }

  return (
    <div className="flex flex-col w-full h-[calc(100vh-48px)] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-indigo-950 p-4 pt-4 pb-4">
      {/* Development mode controls */}
      {isDevelopment && (
        <div className="fixed top-14 right-4 z-[100]">
          <Button 
            size="sm" 
            variant={setupComplete ? "default" : "outline"}
            className={setupComplete 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
            }
            onClick={bypassSetup}
          >
            {setupComplete ? "Dev Mode: Using Mock Data" : "Dev Mode: Skip Setup"}
          </Button>
        </div>
      )}

      <div className="flex flex-col h-full overflow-hidden">
        <div className="grid grid-rows-[1fr] grid-cols-[300px,1fr,400px] h-full gap-4">
          {/* Job Info Sidebar */}
          {jobData && (
            <JobInfoSidebar 
              jobData={jobData} 
              resumeData={resumeData}
            />
          )}

          {/* Camera Section (middle) */}
          <LeftSection 
            view={leftView}
            isReady={isReady}
            onStartInterview={handleBroadcastToggle}
            transcript=""
            mockData={resumeData}
            interviewMessages={interviewMessages}
            isPaused={webRTCIsPaused}
          />

          {/* AI Assistant (right) */}
          <div className="flex flex-col h-full rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 shadow-md overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 min-h-0 bg-gradient-to-br from-white/80 to-blue-50/80 dark:from-gray-900/60 dark:to-indigo-950/60 backdrop-blur-sm rounded-t-lg">
              <InterviewTranscript messages={interviewMessages} />
            </div>
            <div className="border-t border-blue-100 dark:border-indigo-900/50 p-4 pt-8">
              <div className="flex flex-col items-center">
                <AISpeechIndicator 
                  isSpeaking={aiSpeaking} 
                  isSessionActive={isReady}
                  isPaused={webRTCIsPaused}
                />
                
                <div className="flex justify-center items-center gap-4 w-full mt-4">
                  {/* Main broadcast button */}
                  <div className={isSessionActive ? "w-full" : "w-full"}>
                    {isSessionActive ? (
                      <div className="space-y-3">
                        <PauseButton 
                          isPaused={webRTCIsPaused} 
                          onClick={handlePauseResume}
                        />
                        <BroadcastButton 
                          isSessionActive={isSessionActive} 
                          onClick={handleBroadcastToggle}
                        />
                      </div>
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
        </div>
      </div>

      {/* Setup Modal - only show if not bypassed in development mode */}
      {(showSetupModal) && (
        <SetupModal
          open={showSetupModal}
          onComplete={handleSetupComplete}
          handleFileUpload={handleFileUpload}
          isProcessing={isProcessing}
          processingError={processingError}
          resumeData={resumeData}
          jobData={jobData}
          onJobSubmit={handleJobSubmit}
        />
      )}
    </div>
  )
}

export default App;