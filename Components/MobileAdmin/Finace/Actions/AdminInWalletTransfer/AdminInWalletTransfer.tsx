'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { AdminInvoiceTransfer } from './AdminInvoiceTransfer'
import { AdminNonInvoiceTransfer } from './AdminNon-InvoiceTransfer'

interface AdminInWalletTransferProps {
  open: boolean
  onClose: () => void
}

type TransferType = 'invoice' | 'non-invoice' | null

export const AdminInWalletTransfer = ({ open, onClose }: AdminInWalletTransferProps) => {
  const [transferType, setTransferType] = useState<TransferType>(null)

  // Reset transfer type when overlay closes
  useEffect(() => {
    if (!open) {
      setTransferType(null)
    }
  }, [open])

  const handleBack = () => {
    setTransferType(null)
  }

  const handleClose = () => {
    setTransferType(null)
    onClose()
  }

  const handleTransferComplete = () => {
    setTransferType(null)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={transferType ? handleBack : handleClose}
      />

      <div className="relative w-full max-w-md mx-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-700">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {transferType ? 
                `Wallet Transfer - ${transferType === 'invoice' ? 'Invoice' : 'Non-Invoice'}` : 
                'Wallet Transfer'
              }
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={transferType ? handleBack : handleClose}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-4">
            {!transferType ? (
              <AdminTransferTypeSelector onSelect={setTransferType} />
            ) : transferType === 'invoice' ? (
              <AdminInvoiceTransfer onClose={handleTransferComplete} onBack={handleBack} />
            ) : (
              <AdminNonInvoiceTransfer onClose={handleTransferComplete} onBack={handleBack} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Transfer Type Selection Component for Admin
interface AdminTransferTypeSelectorProps {
  onSelect: (type: TransferType) => void
}

const AdminTransferTypeSelector = ({ onSelect }: AdminTransferTypeSelectorProps) => {
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
        Select transfer type from Admin Wallet (ID: 1) to Finance Wallet (ID: 2)
      </div>

      <button
        onClick={() => onSelect('invoice')}
        className="w-full p-4 text-left border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
      >
        <div className="font-semibold text-blue-900 dark:text-blue-100">Invoice Transfer</div>
        <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
          Transfer invoice funds to finance department
        </div>
      </button>

      <button
        onClick={() => onSelect('non-invoice')}
        className="w-full p-4 text-left border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg hover:border-green-300 dark:hover:border-green-700 transition-colors"
      >
        <div className="font-semibold text-green-900 dark:text-green-100">Non-Invoice Transfer</div>
        <div className="text-sm text-green-700 dark:text-green-300 mt-1">
          Transfer non-invoice funds to finance department
        </div>
      </button>
    </div>
  )
}