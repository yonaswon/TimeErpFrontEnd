'use client'

import { useState } from 'react'
import { Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import api from '@/api'
import { AccountDropdown } from './AccountDropdown'

interface InvoiceTransferProps {
  onClose: () => void
  onBack: () => void
}

export const InvoiceTransfer = ({ onClose, onBack }: InvoiceTransferProps) => {
  const [formData, setFormData] = useState({
    toAccount: null as number | null,
    amount: '',
    note: '',
    confirmationImage: null as File | null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleFileChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, confirmationImage: file }))
  }

  const validateForm = () => {
    if (!formData.toAccount) {
      setError('Please select a destination account')
      return false
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    setError(null)

    try {
      const submitData = new FormData()
      
      // Fixed values for invoice transfer from wallet 2 to wallet 1
      submitData.append('from_wallet', '2')
      submitData.append('to_wallet', '1')
      submitData.append('invoice', 'true')
      submitData.append('to_account', formData.toAccount!.toString())
      submitData.append('amount', formData.amount)
      submitData.append('confirmed_at', new Date().toISOString())
      
      if (formData.note) {
        submitData.append('note', formData.note)
      }
      if (formData.confirmationImage) {
        submitData.append('confirmation_image', formData.confirmationImage)
      }

      await api.post('/finance/in-wallet-transaction/', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err: any) {
      console.error('Transfer error:', err)
      setError(err.response?.data?.message || 'Failed to process transfer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
        <div className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
          Transfer Successful!
        </div>
        <div className="text-sm text-green-700 dark:text-green-300">
          Invoice transfer has been processed successfully.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
          <div className="text-sm text-yellow-700 dark:text-yellow-300">
            <strong>Important:</strong> All transactions without payment screenshot/image will be considered as cash transactions.
          </div>
        </div>
      </div>

      {/* Transfer Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Transfer Details:</strong> From Finance Wallet (ID: 2) to Admin Wallet (ID: 1) - Invoice Funds
        </div>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <AccountDropdown
          value={formData.toAccount}
          onChange={(accountId) => handleInputChange('toAccount', accountId)}
          disabled={submitting}
          required
          invoice={true} // Pass invoice=true for CURRENT accounts
        />

        {/* Rest of the component remains the same */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount (ETB) *
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            disabled={submitting}
            className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirmation Image (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-4 text-center">
            <Upload size={24} className="text-gray-400 mx-auto mb-2" />
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Drop payment confirmation image here or click to browse
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              disabled={submitting}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-300"
            />
            {formData.confirmationImage && (
              <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                ✓ {formData.confirmationImage.name}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Note (Optional)
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => handleInputChange('note', e.target.value)}
            disabled={submitting}
            rows={3}
            className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            placeholder="Add any notes about this transfer..."
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting || !formData.toAccount || !formData.amount}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              'Transfer Funds'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}