'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, DollarSign, Image as ImageIcon, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import api, { base_url } from '@/api'

interface Expense {
    id: number
    amount: string
    invoice: boolean
    invoice_image: string | null
    payment_screen_shot: string | null
    payment_method: string
    note: string | null
    date: string
    expense_category: { id: number; name: string } | null
    account: { id: number; account_name: string; account_number: string } | null
    created_by: { id: number; username: string; first_name: string; last_name: string } | null
}

export const ExpensesList = () => {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [expandedId, setExpandedId] = useState<number | null>(null)

    useEffect(() => {
        fetchExpenses()
    }, [])

    const fetchExpenses = async () => {
        try {
            setLoading(true)
            const res = await api.get('/finance/expense/')
            setExpenses(res.data.results || res.data)
        } catch (err: any) {
            setError('Failed to load expenses')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Expenses</h3>
                <button
                    onClick={fetchExpenses}
                    disabled={loading}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="animate-spin text-blue-600" size={24} />
                </div>
            ) : error ? (
                <div className="text-center p-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    {error}
                </div>
            ) : expenses.length === 0 ? (
                <div className="text-center p-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                    No recent expenses found
                </div>
            ) : (
                <div className="space-y-3">
                    {expenses.map((expense) => {
                        const isExpanded = expandedId === expense.id
                        return (
                            <div key={expense.id} className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden shadow-sm">
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : expense.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                                            <DollarSign size={20} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {expense.expense_category?.name || 'Uncategorized'}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                <span>{new Date(expense.date).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span className="capitalize">{expense.payment_method.toLowerCase()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="font-semibold text-gray-900 dark:text-white text-right">
                                            {Number(expense.amount).toFixed(2)}
                                        </div>
                                        {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 border-t border-gray-100 dark:border-zinc-700 text-sm space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400 block mb-1">Account</span>
                                                <span className="text-gray-900 dark:text-white font-medium">{expense.account?.account_name || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400 block mb-1">Created By</span>
                                                <span className="text-gray-900 dark:text-white font-medium">{expense.created_by?.first_name || expense.created_by?.username}</span>
                                            </div>
                                        </div>

                                        {expense.note && (
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400 block mb-1">Note</span>
                                                <span className="text-gray-900 dark:text-white bg-white dark:bg-zinc-800 p-2 rounded border border-gray-200 dark:border-zinc-700 block">
                                                    {expense.note}
                                                </span>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-zinc-700">
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400 block mb-1">Invoice Image</span>
                                                {expense.invoice_image ? (
                                                    <a href={`${base_url}${expense.invoice_image}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center h-24 bg-gray-100 dark:bg-zinc-700 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-600">
                                                        <img src={`${base_url}${expense.invoice_image}`} alt="Invoice" className="h-full object-cover" />
                                                    </a>
                                                ) : (
                                                    <div className="flex items-center justify-center h-24 bg-gray-100 dark:bg-zinc-700 rounded-lg text-gray-400 border border-gray-200 dark:border-zinc-600">
                                                        <ImageIcon size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400 block mb-1">Payment Image</span>
                                                {expense.payment_screen_shot ? (
                                                    <a href={`${base_url}${expense.payment_screen_shot}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center h-24 bg-gray-100 dark:bg-zinc-700 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-600">
                                                        <img src={`${base_url}${expense.payment_screen_shot}`} alt="Payment" className="h-full object-cover" />
                                                    </a>
                                                ) : (
                                                    <div className="flex items-center justify-center h-24 bg-gray-100 dark:bg-zinc-700 rounded-lg text-gray-400 border border-gray-200 dark:border-zinc-600">
                                                        <ImageIcon size={24} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
