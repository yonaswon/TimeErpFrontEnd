'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import MockupForm from './MockupForm'

interface CreateMockupOverlayProps {
  leadId: number
  onClose: () => void
  onSuccess: () => void
}

export default function CreateMockupOverlay({ leadId, onClose, onSuccess }: CreateMockupOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 p-6 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Create Mockup Request</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Send a new mockup request to designers</p>
            </div>
            
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors text-gray-500 dark:text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <MockupForm
            leadId={leadId}
            onCancel={onClose}
            onSuccess={onSuccess}
          />
        </div>
      </div>
    </div>
  )
}