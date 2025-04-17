"use client"

import React, { useState } from 'react'
import { Building, Briefcase, Check } from 'lucide-react'

interface JobDescriptionProps {
  onSubmit: (jobDetails: JobDetails) => void
  isSubmitted: boolean
}

export interface JobDetails {
  companyName: string
  jobTitle: string
  jobDescription: string
}

export function JobDescription({ onSubmit, isSubmitted }: JobDescriptionProps) {
  const [formData, setFormData] = useState<JobDetails>({
    companyName: '',
    jobTitle: '',
    jobDescription: ''
  })
  
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormSubmitted(true)
    setIsEditing(false)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  // Show submitted view if form was submitted or isSubmitted prop is true
  const showSubmittedView = formSubmitted || isSubmitted
  
  // Check if form is valid (all fields have values)
  const isFormValid = formData.companyName.trim() !== '' && 
                     formData.jobTitle.trim() !== '' && 
                     formData.jobDescription.trim() !== ''

  return (
    <div className="h-full w-full flex flex-col p-4 overflow-y-auto">
      {!showSubmittedView || isEditing ? (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="space-y-3 flex-grow overflow-y-auto pr-1">
            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                Company Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Building className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Enter company name"
                  className="bg-white dark:bg-gray-800 pl-9 pr-4 py-2 w-full text-sm rounded-md border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none"
                />
              </div>
            </div>
            
            {/* Job Title */}
            <div>
              <label htmlFor="jobTitle" className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                Job Title
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Briefcase className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  type="text"
                  id="jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="Enter job title"
                  className="bg-white dark:bg-gray-800 pl-9 pr-4 py-2 w-full text-sm rounded-md border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none"
                />
              </div>
            </div>
            
            {/* Job Description */}
            <div>
              <label htmlFor="jobDescription" className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                Job Description
              </label>
              <textarea
                id="jobDescription"
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleChange}
                placeholder="Paste the job description here..."
                className="bg-white dark:bg-gray-800 p-3 w-full text-sm rounded-md border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none h-24 resize-none"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!isFormValid}
            className={`mt-4 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors sticky bottom-0 ${
              isFormValid
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700'
                : 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            Save Job Details
          </button>
        </form>
      ) : (
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Job Details Summary */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 mb-3 flex-grow">
            <div className="flex items-center mb-2">
              <div className="p-1.5 bg-white dark:bg-gray-800 rounded shadow-sm mr-2">
                <Building className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {formData.companyName}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {formData.jobTitle}
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-md p-2 text-xs text-gray-700 dark:text-gray-300 max-h-[120px] overflow-y-auto mb-2">
              <p className="whitespace-pre-line">{formData.jobDescription}</p>
            </div>
            
            <div className="flex items-center">
              <div className="p-0.5 rounded-full bg-green-200 dark:bg-green-700 mr-1.5">
                <Check className="h-3 w-3 text-green-700 dark:text-green-300" />
              </div>
              <p className="text-xs text-green-800 dark:text-green-300">
                Job details saved successfully
              </p>
            </div>
          </div>
          
          <div className="mt-3 sticky bottom-0 pt-1 bg-gradient-to-t from-indigo-50 dark:from-indigo-950 to-transparent">
            <button
              onClick={handleEdit}
              className="w-full py-2 px-4 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 rounded-md text-sm font-medium transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
            >
              Edit Details
            </button>
          </div>
        </div>
      )}
    </div>
  )
}