import React from 'react'
import { Clock, MessageSquare, CheckCircle2 } from 'lucide-react'

interface InterviewProgressProps {
  duration: number // in seconds
  questionCount: number
  isActive: boolean
  phase: 'introduction' | 'main' | 'conclusion' | 'ended'
}

export function InterviewProgress({ 
  duration, 
  questionCount, 
  isActive, 
  phase 
}: InterviewProgressProps) {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPhaseColor = (currentPhase: string) => {
    switch (currentPhase) {
      case 'introduction':
        return 'bg-blue-500'
      case 'main':
        return 'bg-green-500'
      case 'conclusion':
        return 'bg-yellow-500'
      case 'ended':
        return 'bg-gray-500'
      default:
        return 'bg-gray-300'
    }
  }

  const getPhaseText = (currentPhase: string) => {
    switch (currentPhase) {
      case 'introduction':
        return 'Introduction'
      case 'main':
        return 'Main Interview'
      case 'conclusion':
        return 'Wrapping Up'
      case 'ended':
        return 'Completed'
      default:
        return 'Not Started'
    }
  }

  const progressPercentage = Math.min((questionCount / 10) * 100, 100)

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-indigo-100 dark:border-indigo-800/30">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Interview Progress
        </h3>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPhaseColor(phase)} text-white`}>
          {getPhaseText(phase)}
        </div>
      </div>
      
      <div className="space-y-3">
        {/* Duration */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Duration: {formatDuration(duration)}
          </span>
        </div>

        {/* Question Count */}
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Questions: {questionCount}/10
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-xs">
          {isActive ? (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Interview Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-500">
              <CheckCircle2 className="h-3 w-3" />
              <span>Interview Ended</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 