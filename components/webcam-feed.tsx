"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, Camera, Mic, VideoIcon, VideoOff } from 'lucide-react'

interface WebcamFeedProps {
  isActive: boolean
  className?: string
}

export function WebcamFeed({ isActive, className }: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false)
  const [microphonePermissionDenied, setMicrophonePermissionDenied] = useState(false)
  const [loading, setLoading] = useState(false)

  // Monitor isActive prop changes
  useEffect(() => {
    if (isActive && !cameraEnabled && !cameraPermissionDenied) {
      startWebcam();
    } else if (!isActive && cameraEnabled) {
      stopWebcam();
    }
  }, [isActive, cameraEnabled, cameraPermissionDenied]);

  // Start webcam when component becomes active
  useEffect(() => {
    if (isActive && !cameraEnabled && !cameraPermissionDenied) {
      startWebcam()
    }
  }, [isActive, cameraEnabled, cameraPermissionDenied])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam()
    }
  }, [])

  // Start the webcam
  const startWebcam = async () => {
    setLoading(true)
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      setCameraEnabled(true)
      setCameraPermissionDenied(false)
      setMicrophonePermissionDenied(false)
    } catch (error) {
      console.error('Error accessing media devices:', error)
      
      // Handle specific permission errors
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          if (error.message.includes('audio')) {
            setMicrophonePermissionDenied(true)
          } else {
            setCameraPermissionDenied(true)
          }
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // Stop the webcam
  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setCameraEnabled(false)
    }
  }

  // Toggle webcam
  const toggleWebcam = () => {
    if (cameraEnabled) {
      stopWebcam()
    } else {
      startWebcam()
    }
  }

  // Ready state screen
  if (!isActive) {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 w-full h-full flex flex-col items-center justify-center rounded-lg ${className}`}>
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-white/70 dark:bg-gray-800/50 rounded-full mx-auto mb-6 flex items-center justify-center shadow-md">
            <Camera className="h-10 w-10 text-indigo-500 dark:text-indigo-400" />
          </div>
          <h3 className="text-xl font-medium mb-2">Camera Preview</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Your camera will activate when you start the interview. Make sure you're in a well-lit, quiet environment.
          </p>
        </div>
      </div>
    )
  }

  // Camera permission denied view
  if (cameraPermissionDenied) {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 w-full h-full flex flex-col items-center justify-center rounded-lg ${className}`}>
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-6 flex items-center justify-center shadow-md">
            <VideoOff className="h-8 w-8 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-medium mb-2">Camera Access Required</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Please enable camera access in your browser settings to continue with the interview.
          </p>
          <Button onClick={startWebcam} variant="outline" className="bg-white/80 dark:bg-gray-800/80 shadow-sm">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Main webcam view
  return (
    <div className={`relative bg-black w-full h-full rounded-lg overflow-hidden ${className}`}>
      <video 
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transform scale-x-[-1]"
      />
      
      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="animate-pulse text-white">
            <Camera className="h-10 w-10 mb-2 mx-auto animate-pulse" />
            <p>Starting camera...</p>
          </div>
        </div>
      )}
      
      {/* Controls overlay */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        {/* Camera toggle button */}
        <Button 
          size="sm" 
          variant={cameraEnabled ? "default" : "secondary"}
          onClick={toggleWebcam}
          className="rounded-full w-10 h-10 p-0 bg-black/40 hover:bg-black/60 text-white border-white/20"
        >
          {cameraEnabled ? (
            <VideoIcon className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
          <span className="sr-only">
            {cameraEnabled ? "Turn off camera" : "Turn on camera"}
          </span>
        </Button>
      </div>
      
      {/* Microphone permission error */}
      {microphonePermissionDenied && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-800 text-white p-3 text-sm">
          <div className="flex items-center">
            <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />
            <span>Microphone access denied. Please enable your microphone in browser settings.</span>
          </div>
        </div>
      )}
    </div>
  )
} 