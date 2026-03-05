'use client'
import { useState, useEffect } from 'react'
import { Upload, Plus, Trash2 } from 'lucide-react'
import api from '@/api'
import { Account, Wallet, PaymentEntry } from '../types'

interface PaymentSectionProps {
  withInvoice: boolean
  setWithInvoice: (value: boolean) => void
  invoiceImage: File | null
  setInvoiceImage: (value: File | null) => void
  payments: PaymentEntry[]
  setPayments: (payments: PaymentEntry[]) => void
  wallets: Wallet[]
  advancePayment: number
}

const EMPTY_PAYMENT: PaymentEntry = {
  method: '',
  amount: 0,
  wallet: null,
  account: null,
  screenshot: null,
  note: '',
}

export default function PaymentSection({
  withInvoice,
  setWithInvoice,
  invoiceImage,
  setInvoiceImage,
  payments,
  setPayments,
  wallets,
  advancePayment,
}: PaymentSectionProps) {
  const [accountsMap, setAccountsMap] = useState<Record<number, Account[]>>({})

  // Fetch accounts per payment entry when method or invoice changes
  useEffect(() => {
    const fetchAccountsForPayments = async () => {
      const newMap: Record<number, Account[]> = {}
      for (let i = 0; i < payments.length; i++) {
        const p = payments[i]
        if (p.method === 'BANK' || p.method === 'CHECK') {
          try {
            const accountType = withInvoice ? 'C' : 'P'
            const response = await api.get(`/finance/account/?account_type=${accountType}&deleted=false`)
            newMap[i] = response.data.results || response.data
          } catch {
            newMap[i] = []
          }
        }
      }
      setAccountsMap(newMap)
    }
    fetchAccountsForPayments()
  }, [payments.map(p => p.method).join(','), withInvoice])

  const updatePayment = (index: number, field: keyof PaymentEntry, value: any) => {
    const updated = [...payments]
    const entry = { ...updated[index], [field]: value }
    // Auto-set wallet based on method
    if (field === 'method') {
      if (value === 'BANK' || value === 'CHECK') {
        entry.wallet = 1
      } else if (value === 'CASH') {
        entry.wallet = 2
      } else {
        entry.wallet = null
      }
      // Reset account + screenshot when method changes
      entry.account = null
      entry.screenshot = null
    }
    updated[index] = entry
    setPayments(updated)
  }

  const addPayment = () => {
    const remaining = advancePayment - payments.reduce((s, p) => s + p.amount, 0)
    setPayments([...payments, { ...EMPTY_PAYMENT, amount: Math.max(0, Math.round(remaining)) }])
  }

  const removePayment = (index: number) => {
    if (payments.length <= 1) return
    setPayments(payments.filter((_, i) => i !== index))
  }

  const handleInvoiceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInvoiceImage(e.target.files?.[0] || null)
  }

  const totalAllocated = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payment Information</h3>

      {/* Invoice Toggle */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-zinc-900/50 rounded-lg">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={withInvoice}
            onChange={(e) => setWithInvoice(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          With Invoice
        </label>

        {withInvoice && (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-blue-600 dark:text-blue-400 border border-blue-600 rounded-lg px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs">
              <Upload className="w-3.5 h-3.5" />
              {invoiceImage ? 'Change Invoice' : 'Upload Invoice'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInvoiceImageChange}
              />
            </label>
            {invoiceImage && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-green-600">{invoiceImage.name}</span>
                <button
                  type="button"
                  onClick={() => setInvoiceImage(null)}
                  className="text-red-600 hover:text-red-800 text-xs"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Allocated vs Required */}
      <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${Math.round(totalAllocated) === Math.round(advancePayment)
          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
          : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
        }`}>
        Allocated: {totalAllocated.toLocaleString()} / {advancePayment.toLocaleString()} ETB
        {Math.round(totalAllocated) !== Math.round(advancePayment) && (
          <span className="ml-2 text-xs">(Remaining: {(advancePayment - totalAllocated).toLocaleString()})</span>
        )}
      </div>

      {/* Payment Entries */}
      <div className="space-y-4">
        {payments.map((payment, index) => {
          const currentWallet = wallets.find(w => w.id === payment.wallet)
          const accounts = accountsMap[index] || []

          return (
            <div key={index} className="border border-gray-200 dark:border-zinc-700 rounded-lg p-3 relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Payment #{index + 1}
                </span>
                {payments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePayment(index)}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Amount */}
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Amount *</label>
                  <input
                    type="number"
                    value={payment.amount || ''}
                    onChange={(e) => updatePayment(index, 'amount', Math.round(parseFloat(e.target.value) || 0))}
                    className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm"
                    placeholder="Payment amount"
                    min={0}
                  />
                </div>

                {/* Method */}
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Payment Method *</label>
                  <select
                    value={payment.method}
                    onChange={(e) => updatePayment(index, 'method', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm"
                    required
                  >
                    <option value="">Select method</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CHECK">Check</option>
                  </select>
                </div>
              </div>

              {/* Wallet (auto-determined, shown as read-only) */}
              {payment.method && (
                <div className="mt-3">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Wallet</label>
                  <div className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-gray-50 dark:bg-zinc-700/50 text-gray-700 dark:text-gray-300 text-sm">
                    {currentWallet ? `${currentWallet.name} #${currentWallet.id}` : 'Auto-assigned'}
                  </div>
                </div>
              )}

              {/* Account (for BANK/CHECK) */}
              {(payment.method === 'BANK' || payment.method === 'CHECK') && (
                <div className="mt-3">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Select Account *</label>
                  <select
                    value={payment.account || ''}
                    onChange={(e) => updatePayment(index, 'account', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm"
                    required
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.bank} - {account.account_number} ({account.account_name})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Screenshot (for BANK/CHECK) */}
              {(payment.method === 'BANK' || payment.method === 'CHECK') && (
                <div className="mt-3">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Payment Screenshot *</label>
                  <div className="flex items-center gap-2 mt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer text-blue-600 dark:text-blue-400 border border-blue-600 rounded-lg px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs">
                      <Upload className="w-3.5 h-3.5" />
                      {payment.screenshot ? 'Change' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => updatePayment(index, 'screenshot', e.target.files?.[0] || null)}
                      />
                    </label>
                    {payment.screenshot && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-green-600">{payment.screenshot.name}</span>
                        <button
                          type="button"
                          onClick={() => updatePayment(index, 'screenshot', null)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Note */}
              <div className="mt-3">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Payment Note</label>
                <input
                  type="text"
                  value={payment.note}
                  onChange={(e) => updatePayment(index, 'note', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Optional note..."
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Payment Button */}
      <button
        type="button"
        onClick={addPayment}
        className="mt-4 flex items-center gap-1.5 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors w-full justify-center"
      >
        <Plus className="w-4 h-4" />
        Add Another Payment Method
      </button>
    </div>
  )
}