import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, MessageSquare, Trophy } from 'lucide-react'

interface InterviewSummaryProps {
  duration: number
  questionCount: number
  interviewPhase: 'introduction' | 'main' | 'conclusion' | 'ended'
}

export function InterviewSummary({ 
  duration, 
  questionCount, 
  interviewPhase 
}: InterviewSummaryProps) {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPerformanceRating = () => {
    if (questionCount >= 10) return { level: 'Excellent', color: 'bg-green-500', description: 'Complete interview' }
    if (questionCount >= 7) return { level: 'Good', color: 'bg-blue-500', description: 'Solid performance' }
    if (questionCount >= 5) return { level: 'Fair', color: 'bg-yellow-500', description: 'Good start' }
    return { level: 'Brief', color: 'bg-gray-500', description: 'Short session' }
  }

  const performance = getPerformanceRating()

  return (
    <Card className="border-l-4 border-l-indigo-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-indigo-600" />
          Interview Complete
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Performance</span>
          <Badge className={`${performance.color} text-white`}>
            {performance.level}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            <div>
              <div className="text-sm font-medium">{formatDuration(duration)}</div>
              <div className="text-xs text-gray-500">Duration</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-indigo-500" />
            <div>
              <div className="text-sm font-medium">{questionCount}</div>
              <div className="text-xs text-gray-500">Questions</div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>{performance.description}</span>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          {interviewPhase === 'ended' ? 
            'Interview completed successfully. Review your performance and consider areas for improvement.' :
            'Interview in progress...'
          }
        </div>
      </CardContent>
    </Card>
  )
} 