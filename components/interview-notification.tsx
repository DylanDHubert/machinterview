import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, AlertTriangle } from 'lucide-react'

interface InterviewNotificationProps {
  show: boolean
  type: 'approaching-end' | 'concluding'
  questionCount: number
  duration: number
}

export function InterviewNotification({ 
  show, 
  type, 
  questionCount, 
  duration 
}: InterviewNotificationProps) {
  if (!show) return null

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    return `${mins} minute${mins !== 1 ? 's' : ''}`
  }

  const getNotificationContent = () => {
    switch (type) {
      case 'approaching-end':
        return {
          icon: <Clock className="h-4 w-4" />,
          title: 'Interview nearing completion',
          description: `You've answered ${questionCount} questions in ${formatDuration(duration)}. The interviewer will wrap up soon.`,
          className: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
        }
      case 'concluding':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          title: 'Interview concluding',
          description: 'The interviewer is wrapping up the interview. Listen for final remarks.',
          className: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
        }
      default:
        return null
    }
  }

  const content = getNotificationContent()
  if (!content) return null

  return (
    <Alert className={`${content.className} mb-4`}>
      {content.icon}
      <AlertDescription className="font-medium">
        <span className="font-semibold">{content.title}</span>
        <br />
        <span className="text-sm">{content.description}</span>
      </AlertDescription>
    </Alert>
  )
} 