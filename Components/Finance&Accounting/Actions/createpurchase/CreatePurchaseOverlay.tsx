'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { X, Plus, AlertCircle, CheckCircle } from 'lucide-react'
import api from '@/api'
import type { AxiosResponse } from 'axios'
import { MaterialRow } from './MaterialRow'
import { FileUpload } from './FileUpload'
import { AccountInfo } from './AccountInfo'

type MaterialOption = {
  id: number
  name: string
  type: string
  type_display: string
  available: string
}

type Inventory = {
  id: number
  name: string
  type: string
  admins: any[]
  created_at: string
  updated_at: string
}

type Row = {
  id: string
  materialId: number | null
  amount: number
  price: number
  total: number
  creating: boolean
  error?: string | null
  eachMaterialCreatedId?: number | null
}

type UserData = {
  id: number
  telegram_id: number
  telegram_user_name: string
  role: Array<{
    id: number
    Name: string
    date: string
  }>
  first_name: string
}

const emptyRow = (id: string): Row => ({
  id,
  materialId: null,
  amount: 1,
  price: 0,
  total: 0,
  creating: false,
  error: null,
  eachMaterialCreatedId: null,
})

interface CreatePurchaseProps {
  open: boolean
  onClose: () => void
}

export default function CreatePurchase({ open, onClose }: CreatePurchaseProps) {
  const [rows, setRows] = useState<Row[]>(() => [emptyRow('r1')])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [invoice, setInvoice] = useState(false)
  const [payer, setPayer] = useState<'FINANCE' | 'ADMIN'>('ADMIN') // Default to ADMIN
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [paymentConfirmationFile, setPaymentConfirmationFile] = useState<File | null>(null)
  const [paymentCode, setPaymentCode] = useState('')
  const [toAccountNumber, setToAccountNumber] = useState('')
  const [toAccountName, setToAccountName] = useState('')
  const [selectedInventory, setSelectedInventory] = useState<number | null>(null)
  const [inventories, setInventories] = useState<Inventory[]>([])
  const [loadingInventories, setLoadingInventories] = useState(false)
  const [inventoryError, setInventoryError] = useState<string | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Get user data from localStorage and fetch inventories
  useEffect(() => {
    if (!open) return
    
    try {
      const storedUserData = localStorage.getItem('user_data')
      if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData)
        setUserData(parsedUserData)
      } else {
        setGlobalError('User data not found. Please log in again.')
      }
    } catch (error) {
      console.error('Error parsing user data:', error)
      setGlobalError('Failed to load user data. Please log in again.')
    }

    // Reset form when opening
    setRows([emptyRow('r1')])
    setInvoice(false)
    setPayer('ADMIN') // Reset to ADMIN
    setInvoiceFile(null)
    setPaymentConfirmationFile(null)
    setPaymentCode('')
    setToAccountNumber('')
    setToAccountName('')
    setSelectedInventory(null)
    setGlobalError(null)
    setSuccessMessage(null)
  }, [open])

  // Fetch inventories when payer is FINANCE and modal is open
  useEffect(() => {
    if (open && payer === 'FINANCE') {
      fetchInventories()
    }
  }, [open, payer])

  const fetchInventories = async () => {
    try {
      setLoadingInventories(true)
      setInventoryError(null)
      const response = await api.get('/inventories/?type=SM')
      setInventories(response.data)
      
      // Set default to second result if available, otherwise first
      if (response.data.length > 0) {
        const defaultInventory = response.data.length > 1 ? response.data[1].id : response.data[0].id
        setSelectedInventory(defaultInventory)
      }
    } catch (err: any) {
      console.error('Error fetching inventories:', err)
      setInventoryError('Failed to load inventories')
    } finally {
      setLoadingInventories(false)
    }
  }

  useEffect(() => {
    // Recalculate totals whenever rows change
    setRows((prev) => prev.map(r => ({ 
      ...r, 
      total: +(r.amount * r.price).toFixed(2) 
    })))
  }, [rows.length])

  const grandTotal = useMemo(() => {
    return rows.reduce((s, r) => s + (r.total || 0), 0)
  }, [rows])

  const addRow = () => setRows(prev => [...prev, emptyRow(`r${Date.now()}`)])
  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(prev => prev.filter(r => r.id !== id))
    }
  }

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows(prev => prev.map(r => 
      r.id === id ? { 
        ...r, 
        ...patch, 
        total: +(((patch.amount ?? r.amount) * (patch.price ?? r.price)).toFixed(2)) 
      } : r
    ))
  }

  const validateBeforeSubmit = () => {
    if (!userData) {
      setGlobalError('User data not available. Please log in again.')
      return false
    }

    if (rows.length === 0) {
      setGlobalError('Add at least one material row.')
      return false
    }
    
    for (const r of rows) {
      if (!r.materialId) {
        setGlobalError('Select material for each row.')
        return false
      }
      if (r.amount <= 0) {
        setGlobalError('Amount must be greater than 0.')
        return false
      }
      if (r.price <= 0) {
        setGlobalError('Price must be greater than 0.')
        return false
      }
    }

    // ADMIN payment validations
    if (payer === 'ADMIN') {
      if (!toAccountName || !toAccountNumber) {
        setGlobalError('Please provide account name and account number to pay to.')
        return false
      }
    }

    // Finance payment validations
    if (payer === 'FINANCE') {
      if (invoice && !invoiceFile) {
        setGlobalError('Invoice image is required when invoice is selected and paid by Finance.')
        return false
      }
      if (!selectedInventory) {
        setGlobalError('Please select an inventory for the materials.')
        return false
      }
      // Finance fields are optional as per requirements
    }

    setGlobalError(null)
    return true
  }

  const submit = async () => {
    if (isSubmitting) return
    if (!validateBeforeSubmit()) return

    setIsSubmitting(true)
    setGlobalError(null)
    setSuccessMessage(null)

    try {
      // 1) Create each material entries
      const eachIds: number[] = []
      for (const r of rows) {
        updateRow(r.id, { creating: true, error: null })
        try {
          const payload = {
            material: r.materialId,
            amount: r.amount,
            price: r.price,
          }
          const res = await api.post('/finance/each-purchase-material/', payload)
          const created = res.data
          eachIds.push(created.id)
          updateRow(r.id, { creating: false, eachMaterialCreatedId: created.id })
        } catch (error: any) {
          console.error(`Error creating material ${r.id}:`, error)
          updateRow(r.id, { 
            creating: false, 
            error: error.response?.data?.message || 'Failed to create material entry' 
          })
          throw new Error(`Failed to create material: ${error.response?.data?.message || 'Unknown error'}`)
        }
      }

      // 2) Create Purchase with FormData for file uploads
      const formData = new FormData()
      formData.append('total_amount', String(+grandTotal.toFixed(2)))
      formData.append('to_account_number', toAccountNumber)
      formData.append('to_account_name', toAccountName)
      formData.append('invoice', String(invoice))
      formData.append('created_by', String(userData?.id))
      formData.append('from_wallet', payer === 'ADMIN' ? 'A' : 'F')

      // Add inventory for Finance payments
      if (payer === 'FINANCE' && selectedInventory) {
        formData.append('inventory', selectedInventory.toString())
      }

      // Append each material ID individually for Django to recognize as list
      eachIds.forEach(id => {
        formData.append('each_material_purchase', String(id))
      })

      // Set status and request_status based on payer
      if (payer === 'FINANCE') {
        formData.append('status', 'D') // DONE PURCHASED
        formData.append('request_status', 'NS') // NOT SENT
        
        if (paymentCode) {
          formData.append('payment_code', paymentCode)
        }
        
        // Add files for Finance payment
        if (invoice && invoiceFile) {
          formData.append('invoice_image', invoiceFile)
        }
        if (paymentConfirmationFile) {
          formData.append('payment_screenshot', paymentConfirmationFile)
        }
      } else {
        // ADMIN payment
        formData.append('status', 'P') // IN PROGRESS
        formData.append('request_status', 'S') // SENT
      }

      const response = await api.post('/finance/purchase/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // Success - show confirmation and close after delay
      setSuccessMessage(`Purchase created successfully! ${payer === 'FINANCE' ? 'Payment processed.' : 'Request sent to admin for approval.'}`)
      
      // Close after 2 seconds
      setTimeout(() => {
        setIsSubmitting(false)
        onClose()
      }, 2000)
      
    } catch (err: any) {
      console.error('Create purchase error:', err)
      
      let errorMessage = 'Failed to create purchase. Please try again.'
      
      if (err.response?.data) {
        // Handle Django validation errors
        if (typeof err.response.data === 'object') {
          const errorFields = Object.keys(err.response.data)
          if (errorFields.length > 0) {
            errorMessage = `Validation error: ${errorFields.map(field => 
              `${field}: ${Array.isArray(err.response.data[field]) ? err.response.data[field].join(', ') : err.response.data[field]}`
            ).join('; ')}`
          } else {
            errorMessage = err.response.data.detail || err.response.data.message || errorMessage
          }
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setGlobalError(errorMessage)
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !isSubmitting && onClose()}
      />

      <div className="relative w-full max-w-2xl mx-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-700">
            <h4 className="font-semibold text-gray-900 dark:text-white">Create Purchase</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => !isSubmitting && onClose()}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Success Message */}
            {successMessage && (
              <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">{successMessage}</span>
                </div>
              </div>
            )}

            {/* User Info */}
            {userData && !successMessage && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Creating as: <span className="font-semibold">{userData.telegram_user_name}</span>
                </div>
              </div>
            )}

            {!successMessage && (
              <>
                {/* Invoice + Payer Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input 
                        type="checkbox" 
                        checked={invoice} 
                        onChange={(e) => setInvoice(e.target.checked)} 
                        className="accent-blue-500" 
                        disabled={isSubmitting}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">With Invoice</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Paid By
                    </label>
                    <div className="flex gap-2">
                      <label className={`flex-1 text-center px-3 py-2 rounded-md cursor-pointer transition-colors ${
                        payer === 'ADMIN' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                      } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <input 
                          type="radio" 
                          name="payer" 
                          value="ADMIN" 
                          checked={payer === 'ADMIN'} 
                          onChange={() => setPayer('ADMIN')} 
                          className="hidden" 
                          disabled={isSubmitting}
                        />
                        Admin Wallet
                      </label>
                      <label className={`flex-1 text-center px-3 py-2 rounded-md cursor-pointer transition-colors ${
                        payer === 'FINANCE' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                      } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <input 
                          type="radio" 
                          name="payer" 
                          value="FINANCE" 
                          checked={payer === 'FINANCE'} 
                          onChange={() => setPayer('FINANCE')} 
                          className="hidden" 
                          disabled={isSubmitting}
                        />
                        Finance
                      </label>
                    </div>
                  </div>
                </div>

                {/* Inventory Selection - Only for Finance payments */}
                {payer === 'FINANCE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Inventory *
                    </label>
                    {loadingInventories ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Loading inventories...
                      </div>
                    ) : inventoryError ? (
                      <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm">
                        <AlertCircle size={16} />
                        {inventoryError}
                      </div>
                    ) : (
                      <select
                        value={selectedInventory || ''}
                        onChange={(e) => setSelectedInventory(Number(e.target.value))}
                        className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                        disabled={isSubmitting}
                      >
                        <option value="">Select an inventory</option>
                        {inventories.map((inventory) => (
                          <option key={inventory.id} value={inventory.id}>
                            {inventory.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Choose where to store the purchased materials
                    </p>
                  </div>
                )}

                {/* Account Information - Required for ADMIN, Optional for Finance */}
                <AccountInfo
                  toAccountNumber={toAccountNumber}
                  toAccountName={toAccountName}
                  onAccountNumberChange={setToAccountNumber}
                  onAccountNameChange={setToAccountName}
                  disabled={isSubmitting}
                  required={payer === 'ADMIN'}
                />

                {/* Finance Payment Specific Fields */}
                {payer === 'FINANCE' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Payment Code (Optional)
                      </label>
                      <input
                        value={paymentCode}
                        onChange={(e) => setPaymentCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        placeholder="Payment reference code"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Invoice Upload - Only show if invoice is true */}
                    {invoice && (
                      <FileUpload
                        label="Invoice Image"
                        required={invoice}
                        value={invoiceFile}
                        onChange={setInvoiceFile}
                        disabled={isSubmitting}
                      />
                    )}

                    {/* Payment Confirmation - Optional */}
                    <FileUpload
                      label="Payment Confirmation (Optional)"
                      value={paymentConfirmationFile}
                      onChange={setPaymentConfirmationFile}
                      disabled={isSubmitting}
                    />
                  </>
                )}

                {/* Materials Section */}
                <div className="border-t border-gray-200 dark:border-zinc-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Materials *
                    </h5>
                  </div>

                  {/* Materials Table Header */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-1">
                    <div className="col-span-5">Material</div>
                    <div className="col-span-2">Amount</div>
                    <div className="col-span-2">Price</div>
                    <div className="col-span-2">Total</div>
                    <div className="col-span-1"></div>
                  </div>

                  {/* Materials Rows */}
                  <div className="space-y-2">
                    {rows.map((row, index) => (
                      <MaterialRow
                        key={row.id}
                        row={row}
                        onUpdate={updateRow}
                        onRemove={removeRow}
                        disabled={isSubmitting}
                        showRemove={rows.length > 1}
                      />
                    ))}
                  </div>

                  {/* Add Material Button at Bottom */}
                  <button
                    onClick={addRow}
                    className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    <Plus size={16} />
                    Add Material
                  </button>
                </div>

                {/* Grand Total */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-zinc-700">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount</div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    ${grandTotal.toFixed(2)}
                  </div>
                </div>

                {/* Global Error */}
                {globalError && (
                  <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                      <AlertCircle size={16} />
                      <span className="text-sm font-medium">{globalError}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          {!successMessage && (
            <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
              <button
                onClick={() => !isSubmitting && onClose()}
                className="px-6 py-2 rounded-md bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={isSubmitting || !userData || (payer === 'FINANCE' && !selectedInventory)}
                className={`px-6 py-2 rounded-md text-white transition-colors ${
                  isSubmitting || !userData || (payer === 'FINANCE' && !selectedInventory)
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Creating...' : 'Create Purchase'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}