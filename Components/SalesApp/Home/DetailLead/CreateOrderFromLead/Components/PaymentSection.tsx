'use client'
import { useState, useEffect, useRef } from 'react'
import { Upload, Plus, Trash2, Scan, Loader2, AlertCircle } from 'lucide-react'
import jsQR from 'jsqr'
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
  transaction_id: '',
  account_transaction_length: null,
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
  const debounceTimers = useRef<Record<number, NodeJS.Timeout>>({})

  // Separate local state for uniqueness check status — never touches payments state
  const [checkStatus, setCheckStatus] = useState<Record<number, { is_checking: boolean; is_unique: boolean | null }>>({})

  const [scanningIndex, setScanningIndex] = useState<number | null>(null)
  const [scanError, setScanError] = useState<Record<number, string | null>>({})

  const handleScanQR = async (index: number) => {
    const file = payments[index].screenshot
    if (!file) return

    setScanningIndex(index)
    setScanError(prev => ({ ...prev, [index]: null }))

    try {
      const codeData = await new Promise<string | null>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) {
              resolve(null)
              return
            }

            const tryDecode = (w: number, h: number) => {
              canvas.width = w
              canvas.height = h
              ctx.drawImage(img, 0, 0, w, h)
              const imageData = ctx.getImageData(0, 0, w, h)
              try {
                return jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: "attemptBoth",
                })
              } catch (err) {
                return null
              }
            }

            // Attempt 1: Full size (capped at 2500px to prevent memory crashes)
            let ratio = Math.min(1, 2500 / img.width, 2500 / img.height)
            let width1 = Math.round(img.width * ratio)
            let height1 = Math.round(img.height * ratio)
            let code = tryDecode(width1, height1)

            // Attempt 2: Half size (sometimes helps if QR is too large/pixelated)
            if (!code) {
              code = tryDecode(Math.round(width1 * 0.5), Math.round(height1 * 0.5))
            }

            // Attempt 3: Quarter size
            if (!code) {
              code = tryDecode(Math.round(width1 * 0.25), Math.round(height1 * 0.25))
            }

            resolve(code ? code.data : null)
          }
          img.onerror = () => resolve(null)
          img.src = e.target?.result as string
        }
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(file)
      })

      if (codeData) {
        updatePayment(index, 'transaction_id', codeData.trim())
      } else {
        setScanError(prev => ({ ...prev, [index]: 'No QR code found in image' }))
        setTimeout(() => {
          setScanError(prev => ({ ...prev, [index]: null }))
        }, 5000)
      }
    } catch (err) {
      setScanError(prev => ({ ...prev, [index]: 'Failed to scan image' }))
    } finally {
      setScanningIndex(null)
    }
  }

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

  // Debounced uniqueness check — only updates local checkStatus, never touches payments
  const checkTransactionUniqueness = (index: number, transactionId: string, requiredLength: number | null | undefined) => {
    // Clear any existing timer for this index
    if (debounceTimers.current[index]) {
      clearTimeout(debounceTimers.current[index])
    }

    // If empty, reset status
    if (!transactionId || transactionId.trim() === '') {
      setCheckStatus(prev => ({ ...prev, [index]: { is_checking: false, is_unique: null } }))
      return
    }

    // If there's a required length and we haven't reached it, don't check yet
    if (requiredLength && transactionId.length !== requiredLength) {
      setCheckStatus(prev => ({ ...prev, [index]: { is_checking: false, is_unique: null } }))
      return
    }

    // Set checking state immediately
    setCheckStatus(prev => ({ ...prev, [index]: { is_checking: true, is_unique: null } }))

    // Debounce the actual API call
    debounceTimers.current[index] = setTimeout(async () => {
      try {
        const res = await api.post('/finance/payment/check_transaction_id/', { transaction_id: transactionId })
        setCheckStatus(prev => ({ ...prev, [index]: { is_checking: false, is_unique: res.data.is_unique } }))
      } catch (err) {
        console.error('Failed to check transaction ID uniqueness:', err)
        setCheckStatus(prev => ({ ...prev, [index]: { is_checking: false, is_unique: null } }))
      }
    }, 500)
  }

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
      // Reset account + screenshot + transaction_id when method changes
      entry.account = null
      entry.screenshot = null
      entry.transaction_id = ''
      entry.account_transaction_length = null
      // Reset check status
      setCheckStatus(prev => ({ ...prev, [index]: { is_checking: false, is_unique: null } }))
    }

    if (field === 'account') {
      const accounts = accountsMap[index] || []
      const accountObj = accounts.find(a => a.id === value)
      entry.account_transaction_length = accountObj?.transaction_id_number_of_character || null
      // Reset check status when account changes
      setCheckStatus(prev => ({ ...prev, [index]: { is_checking: false, is_unique: null } }))
    }

    // If transaction_id changed, trigger debounced uniqueness check
    if (field === 'transaction_id' && entry.method === 'BANK') {
      updated[index] = entry
      setPayments(updated)
      checkTransactionUniqueness(index, value as string, entry.account_transaction_length)
      return
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

              {/* Transaction ID (for BANK) */}
              {payment.method === 'BANK' && (
                <div className="mt-3">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Transaction ID * {payment.account_transaction_length ? `(${payment.account_transaction_length} characters)` : ''}
                  </label>
                  <input
                    type="text"
                    value={payment.transaction_id}
                    onChange={(e) => updatePayment(index, 'transaction_id', e.target.value)}
                    className={`w-full p-2 border rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm ${(payment.account_transaction_length &&
                      payment.transaction_id.length > 0 &&
                      payment.transaction_id.length !== payment.account_transaction_length) || checkStatus[index]?.is_unique === false
                      ? 'border-red-500'
                      : (checkStatus[index]?.is_unique === true ? 'border-green-500' : 'border-gray-300 dark:border-zinc-600')
                      }`}
                    placeholder="Enter transaction ID"
                    required
                  />
                  {/* Length validation warning */}
                  {payment.account_transaction_length &&
                    payment.transaction_id.length > 0 &&
                    payment.transaction_id.length !== payment.account_transaction_length && (
                      <p className="text-xs text-red-500 mt-1">
                        Must be exactly {payment.account_transaction_length} characters.
                      </p>
                    )}
                  {/* Uniqueness feedback */}
                  {((payment.account_transaction_length === null) || (payment.account_transaction_length !== null && payment.transaction_id.length === payment.account_transaction_length)) && payment.transaction_id.length > 0 && (
                    <div className="mt-1 text-xs">
                      {checkStatus[index]?.is_checking && <span className="text-gray-500">Checking uniqueness...</span>}
                      {!checkStatus[index]?.is_checking && checkStatus[index]?.is_unique === true && <span className="text-green-500">✅ Unique</span>}
                      {!checkStatus[index]?.is_checking && checkStatus[index]?.is_unique === false && <span className="text-red-500">❌ This Transaction ID is already used</span>}
                    </div>
                  )}
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
                        <span className="text-xs text-green-600 truncate max-w-[150px]">{payment.screenshot.name}</span>
                        <button
                          type="button"
                          onClick={() => handleScanQR(index)}
                          disabled={scanningIndex === index}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs ml-2 disabled:opacity-50"
                        >
                          {scanningIndex === index ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Scan className="w-3.5 h-3.5" />
                          )}
                          Scan QR
                        </button>
                        <button
                          type="button"
                          onClick={() => updatePayment(index, 'screenshot', null)}
                          className="text-red-600 hover:text-red-800 text-xs ml-1 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                  {scanError[index] && (
                    <div className="text-xs text-red-500 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {scanError[index]}
                    </div>
                  )}
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