"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { MicOff, Pause } from 'lucide-react'

interface AISpeechIndicatorProps {
  isSpeaking: boolean
  isSessionActive: boolean
  isPaused?: boolean
}

export function AISpeechIndicator({ isSpeaking, isSessionActive, isPaused = false }: AISpeechIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        {/* Outer ripple effect - only visible when speaking and not paused */}
        {isSpeaking && !isPaused && (
          <>
            <motion.div
              className="absolute -inset-4 rounded-full bg-indigo-300 dark:bg-indigo-700/30 z-0"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.1, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute -inset-8 rounded-full bg-indigo-200 dark:bg-indigo-800/20 z-0"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.1, 0.2]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </>
        )}

        {/* Main circle that changes color */}
        <motion.div
          className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-md ${
            !isSessionActive
              ? "bg-gray-200 dark:bg-gray-700"
              : isPaused
                ? "bg-gray-300 dark:bg-gray-600"
                : isSpeaking 
                  ? "bg-indigo-500 dark:bg-indigo-500" 
                  : "bg-indigo-100 dark:bg-indigo-900/70"
          }`}
          animate={{
            scale: isSpeaking && !isPaused ? [1, 1.05, 1] : 1
          }}
          transition={{
            duration: 1.5,
            repeat: isSpeaking && !isPaused ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          <motion.div 
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              !isSessionActive
                ? "bg-gray-100 dark:bg-gray-600" 
                : isPaused
                  ? "bg-gray-200 dark:bg-gray-500"
                  : isSpeaking 
                    ? "bg-indigo-400 dark:bg-indigo-400" 
                    : "bg-white dark:bg-gray-800"
            }`}
          >
            {!isSessionActive ? (
              <MicOff className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            ) : isPaused ? (
              <Pause className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            ) : (
              <div 
                className={`w-2 h-8 ${
                  isSpeaking ? "bg-white" : "bg-indigo-300 dark:bg-indigo-700"
                }`}
              />
            )}
          </motion.div>
        </motion.div>
      </div>
      
      {isSessionActive && (
        <p className={`mt-6 font-medium ${
          isPaused
            ? "text-gray-500 dark:text-gray-400"
            : isSpeaking 
              ? "text-indigo-600 dark:text-indigo-400" 
              : "text-indigo-500 dark:text-indigo-400"
        }`}>
          {isPaused
            ? "Interview paused"
            : isSpeaking 
              ? "AI is speaking..." 
              : "AI is listening..."}
        </p>
      )}
    </div>
  )
} 