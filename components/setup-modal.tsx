"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Button } from "@/components/ui/button"
import { DocumentUpload } from "@/components/document-upload"
import { JobDescription, JobDetails } from "@/components/job-description"
import { CheckCircle2, AlertCircle, FileText, Briefcase, Mic } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// Create a custom dialog content component without close button
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-0 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      aria-describedby="dialog-description"
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
))
CustomDialogContent.displayName = "CustomDialogContent"

interface SetupModalProps {
  open: boolean
  onComplete: (resumeData: Record<string, unknown>, jobData: JobDetails, voice: string) => void
  handleFileUpload: (file: File) => Promise<void>
  isProcessing: boolean
  processingError: string | null
  resumeData: Record<string, unknown> | null
  jobData: JobDetails | null
  onJobSubmit: (details: JobDetails) => void
}

export function SetupModal({
  open,
  onComplete,
  handleFileUpload,
  isProcessing,
  processingError,
  resumeData,
  jobData,
  onJobSubmit
}: SetupModalProps) {
  const [step, setStep] = useState<'resume' | 'job' | 'voice'>('resume')
  const [canProceed, setCanProceed] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState('ash') // Default voice
  
  // Monitor resume, job data and voice to determine if we can proceed
  useEffect(() => {
    if (resumeData && jobData && selectedVoice) {
      setCanProceed(true)
    } else {
      setCanProceed(false)
    }
  }, [resumeData, jobData, selectedVoice])
  
  // Auto-switch to next step after current step is completed
  useEffect(() => {
    if (resumeData && step === 'resume') {
      setStep('job')
    } else if (jobData && step === 'job') {
      setStep('voice')
    }
  }, [resumeData, jobData, step])
  
  // Handle the proceed button click
  const handleProceed = () => {
    if (resumeData && jobData && selectedVoice) {
      onComplete(resumeData, jobData, selectedVoice)
    }
  }
  
  // Voice options
  const voiceOptions = [
    { value: 'ash', label: 'Ash - Versatile, friendly, natural' },
    { value: 'ballad', label: 'Ballad - Expressive, clear, confident' },
    { value: 'coral', label: 'Coral - Warm, conversational, supportive' },
    { value: 'sage', label: 'Sage - Authoritative, precise, formal' },
    { value: 'verse', label: 'Verse - Enthusiastic, energetic, animated' },
  ]
  
  return (
    <Dialog open={open}>
      <CustomDialogContent 
        className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-xl border-none shadow-lg" 
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Apple-style pill header */}
        <div className="rounded-t-xl bg-gray-100 dark:bg-gray-800 py-4 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Interview Setup</h2>
            
            {/* Step indicator pills */}
            <div className="flex rounded-full bg-gray-200 dark:bg-gray-700 p-1 mb-1">
              <button
                type="button"
                onClick={() => resumeData && setStep('resume')}
                className={cn(
                  "rounded-full px-3 py-2 text-xs font-medium transition-colors",
                  step === 'resume'
                    ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                )}
              >
                <div className="flex items-center">
                  <FileText className="h-3 w-3 mr-1.5" />
                  Resume
                  {resumeData && (
                    <CheckCircle2 className="h-3 w-3 ml-1.5 text-green-500" />
                  )}
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => jobData && setStep('job')}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  step === 'job'
                    ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                )}
              >
                <div className="flex items-center">
                  <Briefcase className="h-3 w-3 mr-1.5" />
                  Job Details
                  {jobData && (
                    <CheckCircle2 className="h-3 w-3 ml-1.5 text-green-500" />
                  )}
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => (resumeData && jobData) && setStep('voice')}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  step === 'voice'
                    ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                )}
              >
                <div className="flex items-center">
                  <Mic className="h-3 w-3 mr-1.5" />
                  Voice
                  {selectedVoice && step === 'voice' && (
                    <CheckCircle2 className="h-3 w-3 ml-1.5 text-green-500" />
                  )}
                </div>
              </button>
            </div>
          </div>
          
          <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
            {step === 'resume' 
              ? 'Upload your resume to personalize your interview experience' 
              : step === 'job'
                ? 'Provide job details to tailor questions to your target position'
                : 'Select the voice for your AI interviewer'}
          </p>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 'resume' ? (
              <motion.div 
                key="resume-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
                  <DocumentUpload 
                    onUpload={handleFileUpload} 
                    isProcessing={isProcessing}
                    processingError={processingError}
                    resumeData={resumeData}
                  />
                </div>
              </motion.div>
            ) : step === 'job' ? (
              <motion.div 
                key="job-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
                  <JobDescription 
                    onSubmit={onJobSubmit} 
                    isSubmitted={jobData !== null}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="voice-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 flex items-center justify-center">
                  <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Select Interviewer Voice</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Choose the voice that will guide you through your interview experience.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="voiceSelect" className="text-sm font-medium">Voice Style</Label>
                          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a voice" />
                            </SelectTrigger>
                            <SelectContent>
                              {voiceOptions.map(voice => (
                                <SelectItem key={voice.value} value={voice.value}>
                                  {voice.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="pt-4">
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <h4 className="font-medium text-sm mb-2">Voice Preview</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                              This is how your selected interviewer will sound:
                            </p>
                            <div className="flex justify-center">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  // Play voice sample functionality would go here
                                  console.log(`Playing sample for ${selectedVoice}`)
                                }}
                              >
                                Play Sample
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
          <div className="text-sm">
            {!canProceed && (
              <div className="flex items-center text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>Complete all steps to proceed</span>
              </div>
            )}
            {canProceed && (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <span>All set! You can now proceed to the interview</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {step !== 'resume' && (
              <Button 
                variant="outline"
                onClick={() => setStep(step === 'voice' ? 'job' : 'resume')}
                className="text-sm"
              >
                Back
              </Button>
            )}
            {step !== 'voice' ? (
              <Button 
                onClick={() => setStep(step === 'resume' ? 'job' : 'voice')}
                disabled={step === 'resume' ? !resumeData : !jobData}
                className="text-sm"
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleProceed} 
                disabled={!canProceed}
                className="text-sm"
              >
                Begin Interview
              </Button>
            )}
          </div>
        </div>
      </CustomDialogContent>
    </Dialog>
  )
} 