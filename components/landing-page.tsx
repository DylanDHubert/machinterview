"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Mic, FileText, Briefcase, Play } from 'lucide-react'

interface LandingPageProps {
  onGetStarted: () => void
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-48px)] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto text-center space-y-8"
      >
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto w-24 h-24 bg-white/80 dark:bg-gray-800/50 rounded-full flex items-center justify-center shadow-lg mb-8"
        >
          <Mic className="h-12 w-12 text-indigo-500 dark:text-indigo-400" />
        </motion.div>
        
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Welcome to your AI interview
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Our AI interviewer will ask you questions based on the resume and job description you provide. 
          Speak naturally as you would in a real interview.
        </p>

        {/* Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col items-center space-y-4 p-6 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm"
          >
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold">Upload Your Resume</h3>
            <p className="text-muted-foreground text-center">
              We'll analyze your experience and skills
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col items-center space-y-4 p-6 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm"
          >
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Briefcase className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold">Provide Job Details</h3>
            <p className="text-muted-foreground text-center">
              We'll tailor questions to the role
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col items-center space-y-4 p-6 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm"
          >
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Play className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold">Start Broadcasting</h3>
            <p className="text-muted-foreground text-center">
              Begin your interview session
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12"
        >
          <Button 
            onClick={onGetStarted}
            size="lg"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Get Started
          </Button>
        </motion.div>

        {/* Privacy Note */}
        <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-lg max-w-2xl mx-auto">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">Privacy Note</p>
              <p className="mt-1">
                Your audio is processed to generate interview responses. We don't permanently store audio data after your session ends. Transcripts are saved to provide you with interview feedback.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 