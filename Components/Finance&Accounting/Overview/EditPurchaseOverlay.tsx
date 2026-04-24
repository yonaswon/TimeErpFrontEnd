'use client'

import React, { useEffect, useState } from 'react'
import { X, Plus, Trash2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import api from '@/api'
import { Purchase } from '@/types/finance'

interface MaterialRow {
  id: string
  materialId: number | null
  materialName: string
  amount: number
  price: number
  total: number
  eachPurchaseMaterialId?: number // existing record id
}

interface MaterialOption {
  id: number
  name: string
  type: string
}

interface Props {
  purchase: Purchase
  onClose: () => void
  onSuccess: () => void
}

const emptyRow = (): MaterialRow => ({
  id: String(Date.now() + Math.random()),
  materialId: null,
  materialName: '',
  amount: 1,
  price: 0,
  total: 0,
})

export const EditPurchaseOverlay = ({ purchase, onClose, onSuccess }: Props) => {
  const [toAccountNumber, setToAccountNumber] = useState(purchase.to_account_number || '')
  const [toAccountName, setToAccountName] = useState(purchase.to_account_name || '')
  const [invoice, setInvoice] = useState(purchase.invoice)
  const [rows, setRows] = useState<MaterialRow[]>([])
  const [materials, setMaterials] = useState<MaterialOption[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Populate rows from existing purchase materials
  useEffect(() => {
    const existing: MaterialRow[] = purchase.each_material_purchase.map(m => ({
      id: String(m.id),
      materialId: m.material.id,
      materialName: m.material.name,
      amount: parseFloat(String(m.amount)),
      price: parseFloat(String(m.price)),
      total: parseFloat(String(m.total_price)),
      eachPurchaseMaterialId: m.id,
    }))
    setRows(existing.length > 0 ? existing : [emptyRow()])
  }, [purchase])

  // Fetch material options
  useEffect(() => {
    api.get('/materials/?page_size=200').then(r => {
      setMaterials(r.data.results || r.data || [])
    }).catch(() => {})
  }, [])

  const updateRow = (id: string, patch: Partial<MaterialRow>) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r
      const updated = { ...r, ...patch }
      updated.total = +(updated.amount * updated.price).toFixed(2)
      return updated
    }))
  }

  const removeRow = (id: string) => {
    if (rows.length > 1) setRows(prev => prev.filter(r => r.id !== id))
  }

  const grandTotal = rows.reduce((s, r) => s + r.total, 0)

  const handleSubmit = async () => {
    setError(null)
    if (!toAccountName || !toAccountNumber) {
      setError('Account name and number are required.')
      return
    }
    for (const r of rows) {
      if (!r.materialId) { setError('Select a material for each row.'); return }
      if (r.amount <= 0) { setError('Amount must be > 0.'); return }
      if (r.price <= 0) { setError('Price must be > 0.'); return }
    }

    setSubmitting(true)
    try {
      const payload = {
        to_account_number: toAccountNumber,
        to_account_name: toAccountName,
        invoice: invoice,
        materials: rows.map(r => ({
          material: r.materialId,
          amount: r.amount,
          price: r.price,
        })),
      }
      await api.patch(`/finance/purchase/${purchase.id}/edit/`, payload)
      setSuccess(true)
      setTimeout(() => { onSuccess(); onClose() }, 1500)
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to update purchase.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !submitting && onClose()} />
      <div className="relative w-full sm:max-w-2xl bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-xl shadow-xl border-t border-gray-200 dark:border-zinc-700 sm:border overflow-hidden max-h-[92vh] flex flex-col">
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 dark:bg-zinc-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-zinc-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Edit Purchase #{purchase.id}</h3>
          <button onClick={() => !submitting && onClose()} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm">
              <CheckCircle size={16} /> Purchase updated successfully.
            </div>
          )}

          {/* Account fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Account Name *</label>
              <input value={toAccountName} onChange={e => setToAccountName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Account name" disabled={submitting} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Account Number *</label>
              <input value={toAccountNumber} onChange={e => setToAccountNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Account number" disabled={submitting} />
            </div>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={invoice} onChange={e => setInvoice(e.target.checked)}
                className="accent-blue-500 w-4 h-4" disabled={submitting} />
              <span className="text-sm text-gray-700 dark:text-gray-300">With Invoice</span>
            </label>
          </div>

          {/* Materials */}
          <div className="border-t border-gray-100 dark:border-zinc-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Materials</span>
              <button onClick={() => setRows(prev => [...prev, emptyRow()])}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline" disabled={submitting}>
                <Plus size={13} /> Add row
              </button>
            </div>

            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 mb-2 px-1">
              <div className="col-span-5">Material</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-2">Total</div>
              <div className="col-span-1" />
            </div>

            <div className="space-y-2">
              {rows.map(row => (
                <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <select value={row.materialId || ''} onChange={e => updateRow(row.id, { materialId: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      disabled={submitting}>
                      <option value="">Select material</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="0.01" step="0.01" value={row.amount}
                      onChange={e => updateRow(row.id, { amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      disabled={submitting} />
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="0.01" step="0.01" value={row.price}
                      onChange={e => updateRow(row.id, { price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      disabled={submitting} />
                  </div>
                  <div className="col-span-2 text-xs font-medium text-gray-700 dark:text-gray-300 px-1">
                    {row.total.toFixed(2)}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {rows.length > 1 && (
                      <button onClick={() => removeRow(row.id)} disabled={submitting}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Total: {grandTotal.toFixed(2)} Birr
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
              <AlertCircle size={15} /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
          <button onClick={() => !submitting && onClose()}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            disabled={submitting}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting || success}
            className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50">
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
