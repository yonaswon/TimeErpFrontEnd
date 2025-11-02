'use client'

import { useState } from 'react'
import { usePurchaseRequests } from '@/hooks/usePurchaseRequests'
import { Purchase } from '@/types/purchase'
import { PurchaseRequestCard } from './PurchaseRequestCard'
import { PurchaseDetails } from './PurchaseDetails'
import { ConfirmPayment } from './ConfirmPayment'
import { ChevronLeft, ChevronRight, RefreshCw,FileText } from 'lucide-react'

const RequestsContent = () => {
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [purchaseToConfirm, setPurchaseToConfirm] = useState<Purchase | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const { purchases, loading, error, refetch } = usePurchaseRequests(currentPage)

  const handleViewDetails = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
  }

  const handleConfirm = (purchase: Purchase) => {
    setPurchaseToConfirm(purchase)
  }

  const handleConfirmationSuccess = () => {
    refetch() // Refresh the list after successful confirmation
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Purchase Requests
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage purchase requests from teams
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Purchase Requests List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded mb-4"></div>
              <div className="h-20 bg-gray-200 dark:bg-zinc-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <>
          {/* Purchases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchases?.results.map((purchase) => (
              <PurchaseRequestCard
                key={purchase.id}
                purchase={purchase}
                onViewDetails={handleViewDetails}
                onConfirm={handleConfirm}
              />
            ))}
          </div>

          {/* Pagination */}
          {purchases && purchases.count > 0 && (
            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-zinc-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, purchases.count)} of {purchases.count} requests
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!purchases.previous}
                  className="p-2 rounded-lg border border-gray-200 dark:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
                  {currentPage}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!purchases.next}
                  className="p-2 rounded-lg border border-gray-200 dark:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {purchases?.results.length === 0 && (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No purchase requests</h3>
              <p className="text-gray-500 dark:text-gray-400">All requests have been processed.</p>
            </div>
          )}
        </>
      )}

      {/* Overlays */}
      {selectedPurchase && (
        <PurchaseDetails
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          onConfirm={handleConfirm}
        />
      )}

      {purchaseToConfirm && (
        <ConfirmPayment
          purchase={purchaseToConfirm}
          onClose={() => setPurchaseToConfirm(null)}
          onSuccess={handleConfirmationSuccess}
        />
      )}
    </div>
  )
}

export default RequestsContent