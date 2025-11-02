'use client'

import { Upload, FileText, X } from 'lucide-react'
import { useState } from 'react'

interface FileUploadProps {
  label: string
  required?: boolean
  value: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
  accept?: string
}

export const FileUpload = ({ 
  label, 
  required = false, 
  value, 
  onChange, 
  disabled = false,
  accept = "image/*" 
}: FileUploadProps) => {
  const [dragOver, setDragOver] = useState(false)

  const handleFileChange = (file: File | null) => {
    onChange(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFileChange(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {!value ? (
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            dragOver 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-zinc-600 hover:border-gray-400 dark:hover:border-zinc-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && document.getElementById(`file-upload-${label}`)?.click()}
        >
          <Upload size={24} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drop your file here or click to browse
          </p>
          <input
            id={`file-upload-${label}`}
            type="file"
            accept={accept}
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            className="hidden"
            disabled={disabled}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">
              {value.name}
            </span>
          </div>
          <button
            onClick={() => handleFileChange(null)}
            className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors disabled:opacity-50"
            disabled={disabled}
          >
            <X size={16} className="text-green-600 dark:text-green-400" />
          </button>
        </div>
      )}
    </div>
  )
}