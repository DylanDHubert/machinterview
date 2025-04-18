"use client"

import React, { useRef, useEffect } from 'react'
import type { Conversation } from "@/lib/conversations"

interface InterviewTranscriptProps {
  messages: Conversation[]
}

export function InterviewTranscript({ messages }: InterviewTranscriptProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])
  
  return (
    <div className="space-y-4 rounded-t-lg">
      {messages.length === 0 && (
        <div className="text-center text-indigo-500 dark:text-indigo-300 py-8 rounded-t-lg">
          <p>Interview transcript will appear here.</p>
        </div>
      )}
      
      {messages.map((message) => (
        <div 
          key={message.id}
          className={`p-3 rounded-lg shadow-sm ${
            message.role === 'user' 
              ? 'bg-gradient-to-r from-blue-100/90 to-indigo-100/90 dark:from-blue-900/40 dark:to-indigo-900/40 ml-4 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/30' 
              : 'bg-gradient-to-r from-white/90 to-indigo-50/90 dark:from-indigo-950/40 dark:to-blue-950/40 mr-4 backdrop-blur-sm border border-indigo-100/50 dark:border-indigo-800/30'
          }`}
        >
          <div className="text-xs font-medium mb-1 text-indigo-700 dark:text-indigo-300">
            {message.role === 'user' ? 'You' : 'AI Interviewer'}
          </div>
          <div className="text-gray-800 dark:text-gray-100">{message.text}</div>
        </div>
      ))}
      
      {/* This empty div is used as a reference for scrolling to the bottom */}
      <div ref={messagesEndRef} />
    </div>
  )
} 