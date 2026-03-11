'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2, Upload, Plus } from 'lucide-react'
import api from '@/api'
import { CreateCategoryOverlay } from './CreateCategoryOverlay'

interface RecordExpenseOverlayProps {
    open: boolean
    onClose: () => void
}

export const RecordExpenseOverlay = ({ open, onClose }: RecordExpenseOverlayProps) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [amount, setAmount] = useState('')
    const [invoice, setInvoice] = useState(false)
    const [categoryId, setCategoryId] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('BANK')
    const [accountId, setAccountId] = useState('')
    const [note, setNote] = useState('')
    const [invoiceImage, setInvoiceImage] = useState<File | null>(null)
    const [paymentImage, setPaymentImage] = useState<File | null>(null)

    const [categories, setCategories] = useState<any[]>([])
    const [accounts, setAccounts] = useState<any[]>([])
    const [showCreateCategory, setShowCreateCategory] = useState(false)

    useEffect(() => {
        if (open) {
            fetchCategories()
        }
    }, [open])

    useEffect(() => {
        if (open) {
            fetchAccounts()
        }
    }, [open, invoice])

    const fetchCategories = async () => {
        try {
            const res = await api.get('/finance/expense-category/')
            setCategories(res.data.results || res.data)
        } catch (err) {
            console.error('Failed to fetch categories', err)
        }
    }

    const fetchAccounts = async () => {
        try {
            const type = invoice ? 'C' : 'P'
            const res = await api.get(`/finance/account/?account_type=${type}`)
            setAccounts(res.data.results || res.data)
            setAccountId('') // Reset selected account when accounts change
        } catch (err) {
            console.error('Failed to fetch accounts', err)
        }
    }

    const handleCategoryCreated = (newCategory: any) => {
        setCategories(prev => [...prev, newCategory])
        setCategoryId(newCategory.id.toString())
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount || !categoryId || !accountId) return

        try {
            setLoading(true)
            setError(null)

            const formData = new FormData()
            formData.append('amount', amount)
            formData.append('invoice', invoice ? 'true' : 'false')
            formData.append('expense_category', categoryId)
            formData.append('payment_method', paymentMethod)
            formData.append('account', accountId)

            if (note) formData.append('note', note)
            if (invoiceImage) formData.append('invoice_image', invoiceImage)
            if (paymentImage) formData.append('payment_screen_shot', paymentImage)

            await api.post('/finance/expense/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            alert('Expense recorded successfully!')
            setAmount('')
            setCategoryId('')
            setAccountId('')
            setNote('')
            setInvoiceImage(null)
            setPaymentImage(null)
            onClose()
        } catch (err: any) {
            setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to record expense. Make sure wallet has enough balance.')
            setLoading(false)
        }
    }

    if (!open) return null

    return (
        <>
            <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-zinc-900">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Record Expense</h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-800/50">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto pb-8">
                        {/* Essential Details */}
                        <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg pl-8 pr-4 py-3 text-gray-900 dark:text-white"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Is this an invoice expense?</label>
                                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input
                                        type="checkbox"
                                        id="invoice-toggle"
                                        checked={invoice}
                                        onChange={(e) => setInvoice(e.target.checked)}
                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                        style={{ right: invoice ? '0' : 'auto', left: invoice ? 'auto' : '0', borderColor: invoice ? '#2563EB' : '#D1D5DB' }}
                                    />
                                    <label htmlFor="invoice-toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${invoice ? 'bg-blue-600' : 'bg-gray-300'}`}></label>
                                </div>
                            </div>
                        </div>

                        {/* Category */}
                        <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                            <div className="flex gap-2">
                                <select
                                    required
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="flex-1 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateCategory(true)}
                                    className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center shrink-0"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                                <select
                                    required
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
                                >
                                    <option value="BANK">Bank</option>
                                    <option value="CHECK">Check</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Account ({invoice ? 'Current' : 'Personal'})
                                </label>
                                <select
                                    required
                                    value={accountId}
                                    onChange={(e) => setAccountId(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
                                >
                                    <option value="">Select Account</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.account_name} - {acc.account_number}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Note</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={2}
                                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white resize-none"
                                    placeholder="Optional details"
                                />
                            </div>
                        </div>

                        {/* Images */}
                        <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 space-y-4">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Attachments</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Invoice Image</label>
                                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-center min-h-[100px]">
                                        <Upload size={20} className="text-gray-400 mb-2" />
                                        <span className="text-xs text-gray-500">{invoiceImage ? invoiceImage.name : 'Upload'}</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setInvoiceImage(e.target.files?.[0] || null)} />
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Payment Proof</label>
                                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-center min-h-[100px]">
                                        <Upload size={20} className="text-gray-400 mb-2" />
                                        <span className="text-xs text-gray-500">{paymentImage ? paymentImage.name : 'Upload'}</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setPaymentImage(e.target.files?.[0] || null)} />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !amount || !categoryId || !accountId}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition sticky bottom-4 z-20 shadow-lg"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <span>Record Expense</span>}
                        </button>
                    </form>
                </div>
            </div>

            <CreateCategoryOverlay
                open={showCreateCategory}
                onClose={() => setShowCreateCategory(false)}
                onCategoryCreated={handleCategoryCreated}
            />
        </>
    )
}
