"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Building2, FileText } from 'lucide-react'
import { JobDetails } from './job-description'
import { InterviewProgress } from './interview-progress'
import { InterviewSummary } from './interview-summary'

interface JobInfoSidebarProps {
  jobData: JobDetails
  resumeData?: Record<string, unknown> | null
  // Interview progress props
  interviewDuration?: number
  questionCount?: number
  isInterviewActive?: boolean
  interviewPhase?: 'introduction' | 'main' | 'conclusion' | 'ended'
}

export function JobInfoSidebar({ 
  jobData, 
  resumeData, 
  interviewDuration = 0, 
  questionCount = 0, 
  isInterviewActive = false, 
  interviewPhase = 'introduction' 
}: JobInfoSidebarProps) {
  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      {/* Interview Progress */}
      {isInterviewActive && (
        <InterviewProgress 
          duration={interviewDuration}
          questionCount={questionCount}
          isActive={isInterviewActive}
          phase={interviewPhase}
        />
      )}
      
      {/* Interview Summary */}
      {!isInterviewActive && interviewDuration > 0 && (
        <InterviewSummary 
          duration={interviewDuration}
          questionCount={questionCount}
          interviewPhase={interviewPhase}
        />
      )}
      {/* Job Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-indigo-600" />
            Position Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">
              {jobData.jobTitle}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Building2 className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-300">
                {jobData.companyName}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Description */}
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Job Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-h-60 overflow-y-auto">
            {jobData.jobDescription}
          </div>
        </CardContent>
      </Card>

      {/* Resume Status */}
      {resumeData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Resume Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Resume Analyzed
              </Badge>
              {(() => {
                const fullName = resumeData.fullName;
                return fullName && typeof fullName === 'string' ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Interview tailored for {fullName}
                  </p>
                ) : null;
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 