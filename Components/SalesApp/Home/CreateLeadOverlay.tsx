'use client'
import { useState } from 'react'
import { X, User, Phone, MessageSquare, FileText, Loader2 } from 'lucide-react'
import api from '@/api'

interface CreateLeadOverlayProps {
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  name: string
  customer_name: string
  customer_phonenumber: string
  customer_telegram: string
  note: string
}

export default function CreateLeadOverlay({ onClose, onSuccess }: CreateLeadOverlayProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    customer_name: '',
    customer_phonenumber: '',
    customer_telegram: '',
    note: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get user data from localStorage
      const userData = localStorage.getItem('user_data')
      if (!userData) {
        throw new Error('User data not found. Please log in again.')
      }

      const parsedUser = JSON.parse(userData)
      
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Lead name is required')
      }
      if (!formData.customer_phonenumber.trim()) {
        throw new Error('Phone number is required')
      }

      const payload = {
        name: formData.name.trim(),
        sales: parsedUser.id, // Get sales ID from localStorage
        customer_name: formData.customer_name.trim() || null,
        customer_phonenumber: formData.customer_phonenumber.trim(),
        customer_telegram: formData.customer_telegram.trim() || null,
        note: formData.note.trim() || null,
        status: 'NEW' // Default status
      }

      await api.post('/lead/leads/', payload)
      onSuccess()
      
    } catch (err: any) {
      console.error('Error creating lead:', err)
      setError(err.response?.data?.message || err.message || 'Failed to create lead')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Lead</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Add a new customer to your pipeline
            </p>
          </div>
          
          <button
            onClick={onClose}
            disabled={loading}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors text-gray-500 dark:text-gray-400 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200 text-sm">
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">!</div>
                  {error}
                </div>
              </div>
            )}

            {/* Lead Name - Required */}
            <div className="space-y-2">
              <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <User className="w-4 h-4 text-blue-500" />
                Lead Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter lead name..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {/* Customer Name - Optional */}
            <div className="space-y-2">
              <label htmlFor="customer_name" className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <User className="w-4 h-4 text-green-500" />
                Customer Name
                <span className="text-xs text-gray-500 dark:text-gray-400">(Optional)</span>
              </label>
              <input
                id="customer_name"
                type="text"
                value={formData.customer_name}
                onChange={(e) => handleChange('customer_name', e.target.value)}
                placeholder="Enter customer name..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {/* Phone Number - Required */}
            <div className="space-y-2">
              <label htmlFor="customer_phonenumber" className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <Phone className="w-4 h-4 text-purple-500" />
                Phone Number *
              </label>
              <input
                id="customer_phonenumber"
                type="tel"
                required
                value={formData.customer_phonenumber}
                onChange={(e) => handleChange('customer_phonenumber', e.target.value)}
                placeholder="Enter phone number..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {/* Telegram - Optional */}
            <div className="space-y-2">
              <label htmlFor="customer_telegram" className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Telegram Username
                <span className="text-xs text-gray-500 dark:text-gray-400">(Optional)</span>
              </label>
              <input
                id="customer_telegram"
                type="text"
                value={formData.customer_telegram}
                onChange={(e) => handleChange('customer_telegram', e.target.value)}
                placeholder="@username"
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {/* Notes - Optional */}
            <div className="space-y-2">
              <label htmlFor="note" className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <FileText className="w-4 h-4 text-orange-500" />
                Notes
                <span className="text-xs text-gray-500 dark:text-gray-400">(Optional)</span>
              </label>
              <textarea
                id="note"
                rows={4}
                value={formData.note}
                onChange={(e) => handleChange('note', e.target.value)}
                placeholder="Add any notes about this lead..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                disabled={loading}
              />
            </div>

            {/* Action Buttons - Inside the form */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Lead'
                )}
              </button>
            </div>

            {/* Extra spacing at the bottom for better scroll */}
            <div className="pb-4">
              {/* This empty div creates space at the bottom when scrolling */}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}