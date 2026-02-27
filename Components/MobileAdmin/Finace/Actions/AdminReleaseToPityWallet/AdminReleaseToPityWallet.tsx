'use client'

import { useState } from 'react'
import { Upload, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react'
import api from '@/api'
import { AdminAccountDropdown } from '../AdminInWalletTransfer/AdminAccountDropdown'

interface AdminReleaseToPityWalletProps {
    open: boolean
    onClose: () => void
}

export const AdminReleaseToPityWallet = ({ open, onClose }: AdminReleaseToPityWalletProps) => {
    const [formData, setFormData] = useState({
        fromAccount: null as number | null,
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
        if (!formData.fromAccount) {
            setError('Please select a source account')
            return false
        }
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setError('Please enter a valid amount')
            return false
        }
        if (!formData.confirmationImage) {
            setError('Payment screenshot is required for admin transfers')
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

            // Fixed values for admin release to pity wallet (from wallet 1 to wallet 3)
            submitData.append('from_wallet', '1')
            submitData.append('to_wallet', '3') // Pity Wallet ID is 3
            submitData.append('invoice', 'false')
            submitData.append('from_account', formData.fromAccount!.toString())
            submitData.append('amount', formData.amount)
            submitData.append('confirmed_at', new Date().toISOString())

            if (formData.note) {
                submitData.append('note', formData.note)
            }
            // Screenshot is required for admin
            if (formData.confirmationImage) {
                submitData.append('confirmation_image', formData.confirmationImage)
            }

            await api.post('/finance/in-wallet-transaction/', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            setSuccess(true)
            setTimeout(() => {
                handleClose()
            }, 2000)
        } catch (err: any) {
            console.error('Transfer error:', err)
            setError(err.response?.data?.message || 'Failed to process transfer. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleClose = () => {
        // Reset form after closing
        setFormData({
            fromAccount: null,
            amount: '',
            note: '',
            confirmationImage: null,
        })
        setSuccess(false)
        setError(null)
        onClose()
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={handleClose}
            />

            <div className="relative w-full max-w-md mx-4 mb-6">
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                            Release to Pity Wallet
                        </h4>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleClose}
                                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="p-4">
                        {success ? (
                            <div className="text-center py-6">
                                <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                                <div className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                                    Transfer Successful!
                                </div>
                                <div className="text-sm text-green-700 dark:text-green-300">
                                    Release to Pity Wallet has been processed successfully.
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Transfer Info */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                    <div className="text-sm text-blue-700 dark:text-blue-300">
                                        <strong>Transfer Details:</strong> From Admin Wallet (ID: 1) to Pity Wallet (ID: 3)
                                    </div>
                                </div>

                                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                    <AdminAccountDropdown
                                        value={formData.fromAccount}
                                        onChange={(accountId) => handleInputChange('fromAccount', accountId)}
                                        disabled={submitting}
                                        required
                                        invoice={false} // Pity is generally non-invoice personal account transfer source
                                    />

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
                                            Payment Screenshot *
                                        </label>
                                        <div className="border-2 border-dashed border-red-300 dark:border-red-600 rounded-lg p-4 text-center bg-red-50 dark:bg-red-900/10">
                                            <Upload size={24} className="text-red-400 mx-auto mb-2" />
                                            <div className="text-sm text-red-600 dark:text-red-400 mb-2 font-medium">
                                                Payment screenshot is required for admin transfers
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                                                disabled={submitting}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100 dark:file:bg-red-900/20 dark:file:text-red-300"
                                                required
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
                                            onClick={handleClose}
                                            disabled={submitting}
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            onClick={handleSubmit}
                                            disabled={submitting || !formData.fromAccount || !formData.amount || !formData.confirmationImage}
                                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                'Release Funds'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
