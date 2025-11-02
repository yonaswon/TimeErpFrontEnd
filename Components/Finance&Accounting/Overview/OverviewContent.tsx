'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { usePurchases } from '@/hooks/usePurchases'
import { WalletBalance } from './WalletBalance'
import { OverviewNavigation } from './OverviewNavigation'
import { PurchaseCard } from './PurchaseCard'
import { PurchaseLine } from './PurchaseLine'
import { PurchaseDetails } from './PurchaseDetails'
import { FinishPurchase } from './FinishPurchase'
import { Purchase } from '@/types/finance'
import { ChevronLeft, ChevronRight, RefreshCw, Bell, Package, FileText, Grid, List } from 'lucide-react'

type TabType = 'purchases' | 'requests' | 'notifications'
type ViewType = 'grid' | 'list'

export const OverviewContent = () => {
  const [activeTab, setActiveTab] = useState<TabType>('purchases')
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [purchaseToFinish, setPurchaseToFinish] = useState<Purchase | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewType, setViewType] = useState<ViewType>('grid')

  const { wallet, loading: walletLoading, error: walletError, refetch: refetchWallet } = useWallet()
  const { 
    purchases, 
    loading: purchasesLoading, 
    error: purchasesError, 
    refetch: refetchPurchases 
  } = usePurchases(currentPage)

  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  const handleRefresh = () => {
    refetchWallet()
    refetchPurchases()
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    // The usePurchases hook should automatically refetch when currentPage changes
  }

  const handleViewDetails = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
  }

  const handleFinishPurchase = (purchase: Purchase) => {
    setPurchaseToFinish(purchase)
  }

  const handleFinishSuccess = () => {
    refetchPurchases() // Refresh the list after successful finish
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance */}
      <WalletBalance wallet={wallet!} loading={walletLoading} />

      {/* Refresh and View Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewType('grid')}
            className={`p-2 rounded-lg border transition-colors ${
              viewType === 'grid' 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700'
            }`}
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewType('list')}
            className={`p-2 rounded-lg border transition-colors ${
              viewType === 'list' 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700'
            }`}
          >
            <List size={16} />
          </button>
        </div>

        <button
          onClick={handleRefresh}
          disabled={purchasesLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={walletLoading || purchasesLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Navigation */}
      <OverviewNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content based on active tab */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          {/* Purchases List */}
          {purchasesLoading ? (
            // Loading skeleton based on view type
            viewType === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded mb-4"></div>
                    <div className="h-20 bg-gray-200 dark:bg-zinc-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4 animate-pulse">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/4"></div>
                      <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : purchasesError ? (
            <div className="text-center py-8 text-red-600 dark:text-red-400">
              {purchasesError}
            </div>
          ) : (
            <>
              {/* Purchases Grid/List */}
              {viewType === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {purchases?.results.map((purchase:any) => (
                    <PurchaseCard
                      key={purchase.id}
                      purchase={purchase}
                      onViewDetails={() => handleViewDetails(purchase)}
                      onFinishPurchase={handleFinishPurchase}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {purchases?.results.map((purchase:any) => (
                    <PurchaseLine
                      key={purchase.id}
                      purchase={purchase}
                      onViewDetails={() => handleViewDetails(purchase)}
                      onFinishPurchase={handleFinishPurchase}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {purchases && purchases.count > 0 && (
                <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-zinc-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, purchases.count)} of {purchases.count} purchases
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || !purchases.previous}
                      className="p-2 rounded-lg border border-gray-200 dark:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium">
                      {currentPage}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!purchases.next}
                      className="p-2 rounded-lg border border-gray-200 dark:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {purchases?.results.length === 0 && (
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No purchases found</h3>
                  <p className="text-gray-500 dark:text-gray-400">Create your first purchase to get started.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Other Tabs Placeholder */}
      {activeTab === 'requests' && (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Requests</h3>
          <p className="text-gray-500 dark:text-gray-400">Requests functionality coming soon.</p>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="text-center py-12">
          <Bell size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Notifications</h3>
          <p className="text-gray-500 dark:text-gray-400">Notifications functionality coming soon.</p>
        </div>
      )}

      {/* Overlays */}
      {selectedPurchase && (
        <PurchaseDetails
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
        />
      )}

      {purchaseToFinish && (
        <FinishPurchase
          purchase={purchaseToFinish}
          onClose={() => setPurchaseToFinish(null)}
          onSuccess={handleFinishSuccess}
        />
      )}
    </div>
  )
}