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
import { useAuth } from "@/contexts/auth-context"
import { AuthModal } from "@/components/auth/auth-modal"
import { UpgradeModal } from "@/components/subscription/upgrade-modal"
import { InterviewNotification } from "@/components/interview-notification"


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
  // Auth Context
  const { 
    user, 
    dbUser, 
    loading: authLoading,
    canUseTokens,
    updateTokenCount,
    canStartInterview,
    completeInterview,
    getRemainingInterviews
  } = useAuth();
  
  // AI speaking state
  const [aiSpeaking, setAiSpeaking] = useState(false)
  
  // App state management
  const [appState, setAppState] = useState<'landing' | 'setup' | 'interview'>(
    isDevelopment ? 'interview' : 'landing'
  )
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [setupComplete, setSetupComplete] = useState(isDevelopment)
  
  // View state for left section
  const [leftView, setLeftView] = useState<'welcome' | 'webcam' | 'results'>('welcome')
  
  // Add isReady state to track if interview is ready
  const [isReady, setIsReady] = useState(false)
  
  // Add voice selection state
  const [selectedVoice, setSelectedVoice] = useState("ash")
  
  // Add interview messages state
  const [interviewMessages, setInterviewMessages] = useState<Conversation[]>([])

  // Add interview tracking states
  const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(null)
  const [interviewDuration, setInterviewDuration] = useState(0)
  const [conversationCount, setConversationCount] = useState(0)
  const interviewTimerRef = useRef<NodeJS.Timeout | null>(null)

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
    sendSystemMessage,
    conversation,
    pauseSession,
    resumeSession,
    isPaused: webRTCIsPaused
  } = useWebRTCAudioSession(selectedVoice, tools)

  // Interview duration timer
  useEffect(() => {
    if (isSessionActive && interviewStartTime) {
      interviewTimerRef.current = setInterval(() => {
        setInterviewDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (interviewTimerRef.current) {
        clearInterval(interviewTimerRef.current)
        interviewTimerRef.current = null
      }
    }

    return () => {
      if (interviewTimerRef.current) {
        clearInterval(interviewTimerRef.current)
      }
    }
  }, [isSessionActive, interviewStartTime])

  // Track conversation length and auto-conclude if needed
  useEffect(() => {
    if (conversation) {
      const userMessages = conversation.filter(msg => msg.role === 'user' && msg.isFinal)
      const assistantMessages = conversation.filter(msg => msg.role === 'assistant' && msg.isFinal)
      
      setConversationCount(userMessages.length + assistantMessages.length)
      
      // Auto-conclude interview after 10 questions or 30 minutes
      const shouldAutoEnd = userMessages.length >= 10 || interviewDuration >= 1800 // 30 minutes
      
      // Warning when approaching limits
      const isApproachingEnd = userMessages.length >= 8 || interviewDuration >= 1500 // 25 minutes
      
      if (shouldAutoEnd && isSessionActive && userMessages.length > 0) {
        // Send conclusion message to AI
        const conclusionMessage = `
        INTERVIEW CONCLUSION INSTRUCTION:
        This interview has been running for ${Math.floor(interviewDuration / 60)} minutes with ${userMessages.length} questions asked.
        
        Please naturally conclude the interview by:
        1. Thanking the candidate for their time
        2. Briefly summarizing their key strengths you noticed
        3. Letting them know the next steps (e.g., "We'll be in touch soon within a few days")
        4. Ending with a professional closing like "Thank you again for your time today"
        
        Keep your conclusion concise and professional. This should be your final message.
        `
        
        setTimeout(() => {
          sendSystemMessage(conclusionMessage)
        }, 1000)
        
        // Auto-end the interview after conclusion
        setTimeout(() => {
          if (isSessionActive) {
            handleStartStopClick()
          }
        }, 10000) // Give 10 seconds for AI to conclude
      } else if (isApproachingEnd && isSessionActive && userMessages.length > 0) {
        // Send a subtle signal to wrap up soon
        const wrapUpMessage = `
        INTERVIEW WRAP-UP SIGNAL:
        You've asked ${userMessages.length} questions and the interview has been running for ${Math.floor(interviewDuration / 60)} minutes.
        
        Ask 1-2 more meaningful questions, then begin naturally wrapping up the interview.
        Don't mention time limits to the candidate.
        `
        
        setTimeout(() => {
          sendSystemMessage(wrapUpMessage)
        }, 1000)
      }
    }
  }, [conversation, interviewDuration, isSessionActive, sendSystemMessage, handleStartStopClick])

  // Register global reset callback
  useEffect(() => {
    // Define the reset function
    const resetFunction = () => {
      // Reset all state including interview tracking
      setResumeData(null);
      setJobData(null);
      setSetupComplete(false);
      setShowSetupModal(false);
      setIsReady(false);
      setLeftView('welcome');
      setAppState('landing');
      setInterviewStartTime(null);
      setInterviewDuration(0);
      setConversationCount(0);
      
      // Clear timer
      if (interviewTimerRef.current) {
        clearInterval(interviewTimerRef.current);
        interviewTimerRef.current = null;
      }
      
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

  // Reset app state when user signs out
  useEffect(() => {
    if (!authLoading && !user) {
      // User has signed out, reset to landing page
      setAppState('landing');
      setShowSetupModal(false);
      setShowAuthModal(false);
      setSetupComplete(false);
      setIsReady(false);
      setLeftView('welcome');
      setResumeData(null);
      setJobData(null);
      
      // If session is active, stop it
      if (isSessionActive) {
        handleStartStopClick();
      }
    }
  }, [user, authLoading, isSessionActive, handleStartStopClick]);
  
  // Helper function to bypass setup in development mode
  const bypassSetup = () => {
    setResumeData(mockResumeData);
    setJobData(mockJobData);
    setShowSetupModal(false);
    setSetupComplete(true);
    setAppState('interview');
  };

  // Map voice codes to interviewer names
  const getInterviewerName = (voiceCode: string): string => {
    const voiceNames = {
      'ash': 'Dwayne "The Rock" Johnson and I am the worst, most demonic fucker you have ever seen',
      'ballad': 'Jordan',
      'coral': 'Morgan',
      'sage': 'Taylor',
      'verse': 'Casey'
    };
    return voiceNames[voiceCode as keyof typeof voiceNames] || 'Alex';
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
        
        // Reset interview tracking
        setInterviewStartTime(null);
        setInterviewDuration(0);
        setConversationCount(0);
        
        // Clear timer
        if (interviewTimerRef.current) {
          clearInterval(interviewTimerRef.current);
          interviewTimerRef.current = null;
        }
        
        // Update UI state to show interview is not active
        setIsReady(false);
        
        // Reset AI speaking state
        setAiSpeaking(false);

        // Mark interview as completed (deduct 1 interview for free users)
        if (user) {
          await completeInterview();
          const remaining = getRemainingInterviews();
          console.log(`Interview completed. ${remaining === Infinity ? 'Unlimited' : remaining} interviews remaining.`);
        }
        
        console.log("Interview ended: camera, voice recognition, and AI stream stopped");
      } catch (error) {
        console.error("Error stopping interview:", error);
      }
    } else {
      // Check authentication first
      if (!user) {
        setShowAuthModal(true);
        return;
      }

      // Check interview limits
      if (!canStartInterview()) {
        // Show upgrade modal instead of alert
        setShowUpgradeModal(true);
        return;
      }

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
        
        // Start interview tracking
        setInterviewStartTime(new Date());
        setInterviewDuration(0);
        setConversationCount(0);
        
        console.log("Interview started: camera, voice recognition, and AI stream activated");
        
        // Enhanced context messages with interview structure
        if (resumeData && jobData) {
          const interviewerName = getInterviewerName(selectedVoice);
          const contextMessage = `
You are conducting a realistic job interview for a ${jobData.jobTitle} position at ${jobData.companyName}.

YOUR INTERVIEWER IDENTITY:
- Your name is ${interviewerName}
- You are a professional interviewer at ${jobData.companyName}
- Use your name when introducing yourself

CANDIDATE INFORMATION:
${JSON.stringify(resumeData, null, 2)}

JOB DESCRIPTION:
${jobData.jobDescription}

INTERVIEW STRUCTURE AND GUIDELINES:
1. INTRODUCTION PHASE (2-3 minutes):
   - Warm greeting and brief self-introduction using your name ${interviewerName}
   - Thank them for their interest
   - Ask one opening question about their interest in the role

2. MAIN INTERVIEW PHASE (8-12 questions):
   - Ask relevant questions based on their background and the job requirements
   - Follow up on their answers naturally
   - Cover key areas: experience, skills, problem-solving, cultural fit
   - Ask ONE question at a time and wait for their response

3. CONCLUSION PHASE (after 10 questions or 45 minutes):
   - Thank them for their time
   - Summarize 2-3 key strengths you noticed
   - Mention next steps ("We'll be in touch soon")
   - Professional closing

CONVERSATION RULES:
- Be conversational and natural like a real human interviewer
- Ask follow-up questions based on their specific answers
- Don't list multiple questions in a single response
- Keep questions focused and relevant to the role
- Show genuine interest in their responses
- Maintain a professional but friendly tone

INTERVIEW CONCLUSION:
- After 10 meaningful questions or if the conversation naturally reaches a good stopping point, begin wrapping up
- Don't continue asking questions indefinitely
- End with a clear, professional conclusion

Begin with a warm greeting, introduce yourself as ${interviewerName}, and ask your first question.`;
          
          setTimeout(() => {
            sendSystemMessage(contextMessage);
          }, 1000);
        } else if (resumeData) {
          const interviewerName = getInterviewerName(selectedVoice);
          const contextMessage = `
You are conducting a realistic job interview.

YOUR INTERVIEWER IDENTITY:
- Your name is ${interviewerName}
- You are a professional interviewer
- Use your name when introducing yourself

CANDIDATE INFORMATION:
${JSON.stringify(resumeData, null, 2)}

INTERVIEW STRUCTURE AND GUIDELINES:
1. INTRODUCTION PHASE (2-3 minutes):
   - Warm greeting and brief self-introduction using your name ${interviewerName}
   - Ask one opening question about their background

2. MAIN INTERVIEW PHASE (8-12 questions):
   - Ask relevant questions based on their background
   - Follow up on their answers naturally
   - Cover key areas: experience, skills, problem-solving
   - Ask ONE question at a time and wait for their response

3. CONCLUSION PHASE (after 10 questions or 45 minutes):
   - Thank them for their time
   - Summarize 2-3 key strengths you noticed
   - Mention next steps ("We'll be in touch soon")
   - Professional closing

CONVERSATION RULES:
- Be conversational and natural like a real human interviewer
- Ask follow-up questions based on their specific answers
- Don't list multiple questions in a single response
- Keep questions focused and relevant
- Show genuine interest in their responses
- Maintain a professional but friendly tone

INTERVIEW CONCLUSION:
- After 10 meaningful questions or if the conversation naturally reaches a good stopping point, begin wrapping up
- Don't continue asking questions indefinitely
- End with a clear, professional conclusion

Begin with a warm greeting, introduce yourself as ${interviewerName}, and ask your first question about their background.`;
          
          setTimeout(() => {
            sendSystemMessage(contextMessage);
          }, 1000);
        } else if (jobData) {
          const interviewerName = getInterviewerName(selectedVoice);
          const contextMessage = `
You are conducting a realistic job interview for a ${jobData.jobTitle} position at ${jobData.companyName}.

YOUR INTERVIEWER IDENTITY:
- Your name is ${interviewerName}
- You are a professional interviewer at ${jobData.companyName}
- Use your name when introducing yourself

JOB DESCRIPTION:
${jobData.jobDescription}

INTERVIEW STRUCTURE AND GUIDELINES:
1. INTRODUCTION PHASE (2-3 minutes):
   - Warm greeting and brief self-introduction using your name ${interviewerName}
   - Thank them for their interest
   - Ask one opening question about their interest in this role

2. MAIN INTERVIEW PHASE (8-12 questions):
   - Ask relevant questions based on the job requirements
   - Follow up on their answers naturally
   - Cover key areas: experience, skills, problem-solving, cultural fit
   - Ask ONE question at a time and wait for their response

3. CONCLUSION PHASE (after 10 questions or 45 minutes):
   - Thank them for their time
   - Summarize 2-3 key strengths you noticed
   - Mention next steps ("We'll be in touch soon")
   - Professional closing

CONVERSATION RULES:
- Be conversational and natural like a real human interviewer
- Ask follow-up questions based on their specific answers
- Don't list multiple questions in a single response
- Keep questions focused and relevant to the role
- Show genuine interest in their responses
- Maintain a professional but friendly tone

INTERVIEW CONCLUSION:
- After 10 meaningful questions or if the conversation naturally reaches a good stopping point, begin wrapping up
- Don't continue asking questions indefinitely
- End with a clear, professional conclusion

Begin with a warm greeting, introduce yourself as ${interviewerName}, and ask your first question about their interest in this role.`;
          
          setTimeout(() => {
            sendSystemMessage(contextMessage);
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
    if (!user) {
      setShowAuthModal(true)
      return
    }
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

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Initializing authentication...</p>
            <p className="text-xs text-gray-400">
              User: {user ? '✓ Authenticated' : '⏳ Checking...'}
            </p>
            <p className="text-xs text-gray-400">
              Profile: {dbUser ? '✓ Loaded' : '⏳ Loading...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Render different content based on app state
  if (appState === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />
  }

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-indigo-950 p-4 pt-2">
      {/* Development mode controls */}
      {isDevelopment && (
        <div className="fixed top-16 right-4 z-[100]">
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

      <div className="w-full">
        <div className="grid grid-cols-[300px,1fr,400px] gap-4">
          {/* Job Info Sidebar */}
          {jobData && (
            <div className="space-y-4">
              <JobInfoSidebar 
                jobData={jobData} 
                resumeData={resumeData}
                interviewDuration={interviewDuration}
                questionCount={Math.floor(conversationCount / 2)}
                isInterviewActive={isSessionActive}
                interviewPhase={
                  !isSessionActive && interviewDuration > 0 ? 'ended' :
                  Math.floor(conversationCount / 2) >= 8 ? 'conclusion' :
                  Math.floor(conversationCount / 2) >= 2 ? 'main' : 'introduction'
                }
              />
            </div>
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
          <div className="flex flex-col min-h-[600px] max-h-[calc(100vh-100px)] rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 shadow-md">
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-white/80 to-blue-50/80 dark:from-gray-900/60 dark:to-indigo-950/60 backdrop-blur-sm rounded-t-lg">
              {/* Interview Notifications */}
              <InterviewNotification 
                show={isSessionActive && Math.floor(conversationCount / 2) >= 8 && Math.floor(conversationCount / 2) < 10}
                type="approaching-end"
                questionCount={Math.floor(conversationCount / 2)}
                duration={interviewDuration}
              />
              <InterviewNotification 
                show={isSessionActive && Math.floor(conversationCount / 2) >= 10}
                type="concluding"
                questionCount={Math.floor(conversationCount / 2)}
                duration={interviewDuration}
              />
              
              <InterviewTranscript messages={interviewMessages} />
            </div>
            <div className="border-t border-blue-100 dark:border-indigo-900/50 p-4 pt-8 bg-white/80 dark:bg-gray-900/80 rounded-b-lg">
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

      {/* Auth Modal */}
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal} 
      />

      {/* Upgrade Modal */}
      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal} 
      />
    </div>
  )
}

export default App;