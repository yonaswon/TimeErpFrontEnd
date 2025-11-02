import { useState, useEffect } from 'react'
import { Purchase } from '@/types/finance'
import { X, Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import api from '@/api'

interface FinishPurchaseProps {
  purchase: Purchase
  onClose: () => void
  onSuccess: () => void
}

interface Inventory {
  id: number
  name: string
  type: string
  admins: any[]
  created_at: string
  updated_at: string
}

export const FinishPurchase = ({ purchase, onClose, onSuccess }: FinishPurchaseProps) => {
  const [invoiceImage, setInvoiceImage] = useState<File | null>(null)
  const [selectedInventory, setSelectedInventory] = useState<number | null>(null)
  const [inventories, setInventories] = useState<Inventory[]>([])
  const [loading, setLoading] = useState(true)
  const [inventoryError, setInventoryError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch inventories on component mount
  useEffect(() => {
    const fetchInventories = async () => {
      try {
        setLoading(true)
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
        setLoading(false)
      }
    }

    fetchInventories()
  }, [])

  const handleSubmit = async () => {
    // Validate required fields
    if (purchase.invoice && !invoiceImage) {
      setError('Invoice image is required for purchases with invoice')
      return
    }

    if (!selectedInventory) {
      setError('Please select an inventory')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('inventory', selectedInventory.toString())

      // Add invoice image if required (only for invoice purchases)
      if (purchase.invoice && invoiceImage) {
        formData.append('invoice_image', invoiceImage)
      }

      // Use the 'done' action endpoint with POST method
      await api.post(`/finance/purchase/${purchase.id}/done/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error finishing purchase:', err)
      setError(err.response?.data?.message || 'Failed to finish purchase')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Finish Purchase
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Purchase #{purchase.id} • {formatAmount(purchase.total_amount)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Inventory Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Inventory *
            </label>
            {loading ? (
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

          {/* Info Message */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm">
              <CheckCircle size={16} />
              <span>
                This will mark the purchase as completed and update inventory.
                {purchase.invoice && ' Invoice image will be saved for finance records.'}
              </span>
            </div>
          </div>

          {/* Invoice Image Upload (only if purchase has invoice) */}
          {purchase.invoice && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Invoice Image *
              </label>
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-gray-500" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setInvoiceImage(e.target.files?.[0] || null)}
                  className="flex-1 text-sm"
                />
              </div>
              {invoiceImage && (
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ✓ {invoiceImage.name}
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Required for invoice-based purchases
              </p>
            </div>
          )}

          {/* No Invoice Message */}
          {!purchase.invoice && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No invoice required for this purchase. The purchase will be marked as completed directly.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-zinc-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || (purchase.invoice && !invoiceImage) || !selectedInventory || loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <Upload size={16} />
            {submitting ? 'Finishing...' : 'Finish Purchase'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper function
const formatAmount = (amount: string) => {
  return `Birr ${parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}