'use client'

import React, { useState } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import api from '@/api'

interface CreateCategoryOverlayProps {
    open: boolean
    onClose: () => void
    onCategoryCreated: (category: any) => void
}

export const CreateCategoryOverlay = ({ open, onClose, onCategoryCreated }: CreateCategoryOverlayProps) => {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!open) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        try {
            setLoading(true)
            setError(null)
            const res = await api.post('/finance/expense-category/', { name })
            onCategoryCreated(res.data)
            setName('')
            onClose()
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create category')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-800 rounded-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">New Category</h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800/50">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Category Name
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
                                placeholder="e.g. Office Supplies"
                            />
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !name.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <span>Create Category</span>}
                    </button>
                </div>
            </div>
        </div>
    )
}
