"use client"

import React, { useState } from "react"
import useWebRTCAudioSession from "@/hooks/use-webrtc"
import { tools } from "@/lib/tools"
import { BroadcastButton } from "@/components/broadcast-button"
import { DocumentUpload } from "@/components/document-upload"
import { AISpeechIndicator } from "@/components/ai-speech-indicator"
import { JobDescription, JobDetails } from "@/components/job-description"

const App: React.FC = () => {
  // AI speaking state
  const [aiSpeaking, setAiSpeaking] = useState(false)
  
  // WebRTC Audio Session Hook
  const {
    isSessionActive,
    handleStartStopClick,
    currentVolume,
    startSession,
    sendTextMessage,
  } = useWebRTCAudioSession("ash", tools)

  // Determine if AI is speaking based on volume
  React.useEffect(() => {
    setAiSpeaking(currentVolume > 0.01 && isSessionActive)
  }, [currentVolume, isSessionActive])
  
  // Custom handler for starting session with resume and job data
  const handleStartInterview = async () => {
    // First start the WebRTC session
    await startSession()
    
    // Different scenarios based on what data we have
    if (resumeData && jobData) {
      // Both resume and job data available - ideal scenario
      const contextMessage = `
I'm applying for a ${jobData.jobTitle} position at ${jobData.companyName}.
Here's my resume information: ${JSON.stringify(resumeData, null, 2)}

Here's the job description:
${jobData.jobDescription}

Based on my resume and this job description, please conduct an interview with me focusing on relevant skills and experience.
`
      // Send the context message to the AI
      setTimeout(() => {
        sendTextMessage(contextMessage)
      }, 1000) // Small delay to ensure session is fully established
    } 
    else if (resumeData) {
      // Only resume data available
      const contextMessage = `
Here's my resume information: ${JSON.stringify(resumeData, null, 2)}

Based on my resume, please conduct a general interview with me focusing on my skills and experience.
`
      setTimeout(() => {
        sendTextMessage(contextMessage)
      }, 1000)
    }
    else if (jobData) {
      // Only job data available
      const contextMessage = `
I'm applying for a ${jobData.jobTitle} position at ${jobData.companyName}.

Here's the job description:
${jobData.jobDescription}

Based on this job description, please conduct an interview with me focusing on skills needed for this role.
`
      setTimeout(() => {
        sendTextMessage(contextMessage)
      }, 1000)
    }
    // If no data is available, just start a general interview (no context needed)
  }

  // State for resume data
  const [resumeData, setResumeData] = useState<Record<string, unknown> | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingError, setProcessingError] = useState<string | null>(null)
  
  // State for job details
  const [jobData, setJobData] = useState<JobDetails | null>(null)
  
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

  // Common background style for all sections
  const bgStyle = "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950"

  return (
    <div className="w-screen max-w-full h-[calc(100vh-3rem)] pt-4 px-4 pb-4 bg-gray-100 dark:bg-gray-950 overflow-x-hidden">
      {/* Top row - 1/3 height with two equal sections */}
      <div className="flex h-1/3 w-full gap-4 mb-4">
        {/* Top left section - Job/Interviewer Details */}
        <div className="w-1/2 rounded-xl overflow-hidden shadow-md">
          {/* Tab header */}
          <div className="h-9 bg-gray-200 dark:bg-gray-800 px-4 flex items-center rounded-t-xl">
            <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-600 mr-2"></div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Job / Interviewer Details</h3>
          </div>
          
          {/* Content area */}
          <div className={`h-[calc(100%-2.25rem)] ${bgStyle}`}>
            <JobDescription 
              onSubmit={handleJobSubmit} 
              isSubmitted={jobData !== null}
            />
          </div>
        </div>
        
        {/* Top right section - Resume upload component */}
        <div className="w-1/2 rounded-xl overflow-hidden shadow-md">
          {/* Tab header */}
          <div className="h-9 bg-gray-200 dark:bg-gray-800 px-4 flex items-center rounded-t-xl">
            <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-600 mr-2"></div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Resume Upload</h3>
          </div>
          
          {/* Content area */}
          <div className={`h-[calc(100%-2.25rem)] ${bgStyle}`}>
            <DocumentUpload 
              onUpload={handleFileUpload} 
              isProcessing={isProcessing}
              processingError={processingError}
              resumeData={resumeData}
            />
          </div>
        </div>
      </div>
      
      {/* Bottom row - 2/3 height with two equal sections */}
      <div className="flex h-[calc(2/3*100%-1rem)] w-full gap-4">
        {/* Bottom left section - Webcam Feed */}
        <div className="w-1/2 rounded-xl overflow-hidden shadow-md">
          {/* Tab header */}
          <div className="h-9 bg-gray-200 dark:bg-gray-800 px-4 flex items-center rounded-t-xl">
            <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-600 mr-2"></div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Webcam Feed</h3>
          </div>
          
          {/* Content area */}
          <div className={`h-[calc(100%-2.25rem)] ${bgStyle} p-4`}>
            {/* Empty for now */}
          </div>
        </div>
        
        {/* Bottom right section - AI Assistant */}
        <div className="w-1/2 rounded-xl overflow-hidden shadow-md">
          {/* Tab header */}
          <div className="h-9 bg-gray-200 dark:bg-gray-800 px-4 flex items-center rounded-t-xl">
            <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-600 mr-2"></div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Assistant</h3>
          </div>
          
          {/* Content area */}
          <div className={`h-[calc(100%-2.25rem)] ${bgStyle} flex flex-col`}>
            {/* Broadcast button at the top */}
            <div className="p-4 border-b border-indigo-100 dark:border-indigo-900/50">
              <BroadcastButton 
                isSessionActive={isSessionActive} 
                onClick={isSessionActive ? handleStartStopClick : handleStartInterview}
              />
            </div>
            
            {/* AI speech indicator */}
            <div className="flex-1 flex items-center justify-center">
              <AISpeechIndicator 
                isSpeaking={aiSpeaking} 
                isSessionActive={isSessionActive}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App;