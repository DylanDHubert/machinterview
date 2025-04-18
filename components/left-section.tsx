"use client"

import React from 'react'
import { WebcamFeed } from '@/components/webcam-feed'
import { Button } from '@/components/ui/button'
import { ArrowRight, Info, CheckCircle, Video, AlertTriangle, User, Briefcase, Mic, Pause } from 'lucide-react'
import { motion } from 'framer-motion'

type ViewType = 'welcome' | 'webcam' | 'results'

interface LeftSectionProps {
  view: ViewType
  isReady: boolean
  onStartInterview?: () => void
  transcript?: string
  mockData?: any
  interviewMessages?: any[]
  isPaused?: boolean
}

export function LeftSection({ view, isReady, onStartInterview, transcript, mockData, interviewMessages, isPaused = false }: LeftSectionProps) {
  // Render different content based on the current view
  switch (view) {
    case 'welcome':
      return (
        <div className="flex flex-col justify-center items-center h-full rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 p-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-lg text-center space-y-6"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto w-24 h-24 bg-white/80 dark:bg-gray-800/50 rounded-full flex items-center justify-center shadow-md mb-2"
            >
              <Mic className="h-12 w-12 text-indigo-500 dark:text-indigo-400" />
            </motion.div>
            
            <h2 className="text-3xl font-bold tracking-tight">Welcome to your AI interview</h2>
            
            <p className="text-muted-foreground text-lg">
              Our AI interviewer will ask you questions based on the resume and job description you've provided. 
              Speak naturally as you would in a real interview.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mt-8">
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-lg p-4 shadow-sm flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                  <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-medium mb-1 text-center">Upload Your Resume</h3>
                <p className="text-xs text-muted-foreground text-center">We'll analyze your experience and skills</p>
              </div>
              
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-lg p-4 shadow-sm flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                  <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-medium mb-1 text-center">Provide Job Details</h3>
                <p className="text-xs text-muted-foreground text-center">We'll tailor questions to the role</p>
              </div>
              
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-lg p-4 shadow-sm flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-3">
                  <Video className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-medium mb-1 text-center">Start Broadcasting</h3>
                <p className="text-xs text-muted-foreground text-center">Begin your interview session</p>
              </div>
            </div>
            
            <div className="bg-yellow-500/10 rounded-lg p-4 flex items-start text-sm mt-8">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-500">Privacy Note</p>
                <p className="text-muted-foreground">
                  Your audio is processed to generate interview responses. We don't permanently store 
                  audio data after your session ends. Transcripts are saved to provide you with interview 
                  feedback.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )
      
    case 'webcam':
      return (
        <div className="flex flex-col h-full rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
          {/* Only show header when interview is not active */}
          {!isReady && (
            <div className="p-4">
              <h2 className="text-xl font-bold">Interview Session</h2>
              <p className="text-sm text-muted-foreground">Your webcam feed appears below</p>
            </div>
          )}
          
          <div className={`rounded-lg overflow-hidden relative ${isReady ? 'h-full' : 'flex-1 mx-4 mb-4'}`}>
            <WebcamFeed isActive={isReady} />
            
            {/* Show a pause overlay when paused */}
            {isPaused && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-20">
                <Pause className="h-16 w-16 mb-4" />
                <h3 className="text-xl font-medium">Interview Paused</h3>
                <p className="text-sm text-gray-300 mt-2">Click resume to continue</p>
              </div>
            )}
          </div>
        </div>
      )
      
    case 'results':
      return (
        <div className="flex flex-col h-full p-6 space-y-6 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Interview Results</h2>
            <p className="text-muted-foreground">Here's how you performed in your interview</p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* Results content would go here */}
            <div className="bg-white/80 dark:bg-gray-800/50 rounded-lg p-6 h-full flex items-center justify-center shadow-md">
              <p className="text-muted-foreground italic">Results will appear here after your interview</p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" className="mr-2 bg-white/80 dark:bg-gray-800/80">Download Report</Button>
            <Button className="bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700">Start New Interview</Button>
          </div>
        </div>
      )
      
    default:
      return null
  }
} 