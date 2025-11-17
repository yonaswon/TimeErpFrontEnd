'use client'

import { Purchase } from '@/types/finance'
import { User, FileText, Calendar, DollarSign, Eye, CheckCircle, XCircle, Clock, Upload } from 'lucide-react'

interface PurchaseLineProps {
  purchase: Purchase
  onViewDetails: () => void
  onFinishPurchase: (purchase: Purchase) => void
}

export const PurchaseLine = ({ purchase, onViewDetails, onFinishPurchase }: PurchaseLineProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatAmount = (amount: string) => {
    return `Birr ${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'D': return 'bg-green-500'
      case 'P': return 'bg-blue-500'
      case 'C': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getRequestStatusColor = (requestStatus: string) => {
    switch (requestStatus) {
      case 'C': return 'bg-green-500'
      case 'R': return 'bg-red-500'
      case 'S': return 'bg-yellow-500'
      case 'NS': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'D': return 'Completed'
      case 'P': return 'In Progress'
      case 'C': return 'Cancelled'
      default: return 'Unknown'
    }
  }

  const canFinishPurchase = () => {
    return purchase.status === 'P' && (purchase.request_status === 'C' || purchase.payment_screenshot)
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4 hover:shadow-md transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left Section - Status Indicators and Basic Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Status Indicators */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex flex-col gap-1">
              <div 
                className={`w-3 h-3 rounded-full ${getStatusColor(purchase.status)}`} 
                title={`Status: ${getStatusText(purchase.status)}`}
              />
              <div 
                className={`w-3 h-3 rounded-full ${getRequestStatusColor(purchase.request_status)}`} 
                title={`Request: ${purchase.request_status === 'C' ? 'Confirmed' : purchase.request_status === 'R' ? 'Rejected' : purchase.request_status === 'S' ? 'Sent' : 'Not Sent'}`}
              />
            </div>
          </div>

          {/* Scrollable Purchase Info */}
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide flex-1 min-w-0">
            <div className="shrink-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                #{purchase.id}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Purchase
              </div>
            </div>

            <div className="shrink-0">
              <div className="text-sm font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                {formatAmount(purchase.total_amount)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Amount
              </div>
            </div>

            <div className="shrink-0 min-w-0 max-w-[120px]">
              <div className="text-sm text-gray-900 dark:text-white truncate whitespace-nowrap" title={purchase?.to_account_name ?? undefined}>
                {purchase.to_account_name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                To Account
              </div>
            </div>

            <div className="shrink-0">
              <div className="text-sm text-gray-900 dark:text-white whitespace-nowrap">
                {purchase.each_material_purchase.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Materials
              </div>
            </div>

            <div className="shrink-0">
              <div className="text-sm text-gray-900 dark:text-white whitespace-nowrap">
                {formatDate(purchase.date)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Date
              </div>
            </div>

            <div className="shrink-0 min-w-0 max-w-[100px]">
              <div className="text-sm text-gray-900 dark:text-white truncate whitespace-nowrap" title={purchase.created_by.telegram_user_name}>
                {purchase.created_by.telegram_user_name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Created By
              </div>
            </div>

            <div className="shrink-0">
              <div className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                purchase.invoice 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' 
                  : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
              }`}>
                {purchase.invoice ? 'Invoice' : 'No Invoice'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">
                Type
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onViewDetails}
            className="flex items-center gap-1 px-3 py-2 text-blue-600 dark:text-blue-400 text-sm hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors whitespace-nowrap"
          >
            <Eye size={14} />
            <span>Details</span>
          </button>

          {canFinishPurchase() && (
            <button
              onClick={() => onFinishPurchase(purchase)}
              className="flex items-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
            >
              <Upload size={14} />
              <span>Finish</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}