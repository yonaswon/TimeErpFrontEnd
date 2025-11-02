'use client'
import { useEffect, useState } from 'react'
import api from '@/api'
import { X } from 'lucide-react'
import LeadInfo from './Components/LeadInfo'
import MockUpDisplayer from './Components/MockUpDisplayer'

interface Lead {
  id: number
  name: string
  status: string
  customer_name: string
  customer_phonenumber: string
  customer_telegram: string
  note: string
  design_type: { id: number; name: string }
  sales: number
  created_at: string
  converted_at: string | null
  mark_cold_at: string | null
}

interface DetailLeadProps {
  leadId: number
  onClose: () => void
}

export default function DetailLead({ leadId, onClose }: DetailLeadProps) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeadDetails()
  }, [leadId])

  const fetchLeadDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/lead/leads/${leadId}/`)
      setLead(response.data)
    } catch (error: any) {
      console.error('Error fetching lead details:', error)
      setError('Failed to load lead details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-lg font-medium text-gray-900 dark:text-white">Loading lead details...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-lg font-medium mb-2">Error</div>
            <div className="text-gray-600 dark:text-gray-300 mb-4">{error}</div>
            <button
              onClick={fetchLeadDetails}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-gray-900 dark:text-white text-lg font-medium mb-2">No Lead Found</div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }
 return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-0">
      <div className="bg-white dark:bg-zinc-800 w-full h-full overflow-auto flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Lead Details</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Viewing lead information</p>
            </div>
            
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors text-gray-500 dark:text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-4">
          {/* Lead Information - Compact and Beautiful */}
          <LeadInfo lead={lead} />

          {/* Mockup Component */}
          <MockUpDisplayer leadId={leadId} />
        </div>
      </div>
    </div>
  )
}