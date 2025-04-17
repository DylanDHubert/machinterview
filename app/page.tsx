"use client"

import React, { useState } from "react"
import useWebRTCAudioSession from "@/hooks/use-webrtc"
import { tools } from "@/lib/tools"
import { BroadcastButton } from "@/components/broadcast-button"
import { DocumentUpload } from "@/components/document-upload"
import { AISpeechIndicator } from "@/components/ai-speech-indicator"

const App: React.FC = () => {
  // AI speaking state
  const [aiSpeaking, setAiSpeaking] = useState(false)
  
  // WebRTC Audio Session Hook
  const {
    isSessionActive,
    handleStartStopClick,
    currentVolume,
  } = useWebRTCAudioSession("ash", tools)

  // Determine if AI is speaking based on volume
  React.useEffect(() => {
    setAiSpeaking(currentVolume > 0.01 && isSessionActive)
  }, [currentVolume, isSessionActive])

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    console.log("Resume uploaded:", file.name)
    
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
      console.log("API response:", result)
      
      if (result.success) {
        console.log("PDF processed successfully")
      } else {
        console.error("PDF processing failed:", result.error)
      }
    } catch (error) {
      console.error("Error uploading PDF:", error)
    }
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
          <div className={`h-[calc(100%-2.25rem)] ${bgStyle} p-4`}>
            {/* Empty for now */}
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
            <DocumentUpload onUpload={handleFileUpload} />
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
                onClick={handleStartStopClick}
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