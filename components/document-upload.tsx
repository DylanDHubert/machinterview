"use client"

import React, { useState, useRef } from 'react'
import { UploadCloud, FileText, X, Upload, File, Check } from 'lucide-react'

interface DocumentUploadProps {
  onUpload?: (file: File) => void
}

export function DocumentUpload({ onUpload }: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const validateFile = (file: File): boolean => {
    // Check if file is a PDF
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed")
      return false
    }
    
    // File size validation (optional) - limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB")
      return false
    }
    
    return true
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setError(null)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      
      if (validateFile(file)) {
        setUploadedFile(file)
        
        if (onUpload) {
          onUpload(file)
        }
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setError(null)
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      if (validateFile(file)) {
        setUploadedFile(file)
        
        if (onUpload) {
          onUpload(file)
        }
      }
    }
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const clearFile = () => {
    setUploadedFile(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  return (
    <div className="h-full w-full flex flex-col justify-center p-4">
      {!uploadedFile ? (
        <div 
          className={`w-full h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-4 transition-all ${
            dragActive 
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg scale-102" 
              : "border-indigo-300 dark:border-indigo-700 bg-white/30 dark:bg-gray-800/20 shadow-md"
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleChange}
          />
          
          <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/50 p-3 mb-3">
            <File className="h-7 w-7 text-indigo-500 dark:text-indigo-400" />
          </div>
          
          <p className="text-center font-medium text-base mb-2 text-gray-800 dark:text-gray-200">
            <span className="text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            PDF resumes only (max 10MB)
          </p>
          
          {error && (
            <p className="mt-3 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">{error}</p>
          )}
        </div>
      ) : (
        <div className="w-full h-full flex flex-col justify-between overflow-hidden bg-white/50 dark:bg-gray-800/30 rounded-lg shadow-md p-3">
          {/* Document icon and details */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-2.5 flex items-center mb-2 relative">
            <div className="p-1.5 bg-white dark:bg-gray-800 rounded shadow-sm mr-2">
              <FileText className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div className="flex-1 truncate pr-7">
              <p className="text-xs font-medium text-gray-800 dark:text-gray-300 truncate" title={uploadedFile.name}>
                {uploadedFile.name}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center">
                <span className="inline-block rounded-sm bg-indigo-100 dark:bg-indigo-800/50 px-1 py-0.5 mr-1.5 text-indigo-800 dark:text-indigo-300">PDF</span>
                {formatFileSize(uploadedFile.size)}
              </p>
            </div>
            
            {/* Remove button positioned absolutely and vertically centered */}
            <button 
              onClick={clearFile}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors absolute top-1/2 right-2 transform -translate-y-1/2"
              aria-label="Remove file"
            >
              <X className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Status */}
          <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-2.5 border border-green-100 dark:border-green-900/30">
            <div className="flex items-center mb-0.5">
              <div className="p-0.5 rounded-full bg-green-200 dark:bg-green-700 mr-1.5">
                <Check className="h-3 w-3 text-green-700 dark:text-green-300" />
              </div>
              <p className="text-xs font-medium text-green-800 dark:text-green-300">
                Resume ready for analysis
              </p>
            </div>
            <ul className="text-[10px] text-gray-600 dark:text-gray-400 ml-4 list-disc">
              <li className="mb-0.5">File will be processed to extract skills and experience</li>
              <li>Personalized interview questions will be generated</li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Developer note - only show during development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 right-4 px-3 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-md text-xs max-w-md">
          <p className="font-medium text-amber-800 dark:text-amber-200">Developer Note:</p>
          <p className="text-amber-700 dark:text-amber-300 mt-0.5">
            Implement API endpoint at <code className="bg-amber-200 dark:bg-amber-800/50 px-1 py-0.5 rounded">/api/upload-pdf</code> to handle the resume upload.
          </p>
        </div>
      )}
    </div>
  )
} 