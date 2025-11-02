'use client'

import { useState, useEffect } from 'react'
import api from '@/api'
import { Wallet, TabType } from '@/types/finance'
import { WalletCarousel } from './WalletCarousel'
import { FinanceNavigation } from './FinanceNavigation'
import { TabContent } from './TabContent'

const FinanceContent = () => {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('payments')

  useEffect(() => {
    fetchWallets()
  }, [])

  const fetchWallets = async () => {
    try {
      setLoading(true)
      const response = await api.get('/finance/wallet/')
      setWallets(response.data.results || response.data)
    } catch (error) {
      console.error('Error fetching wallets:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-4">
      {/* Wallet Cards Carousel */}
      <WalletCarousel wallets={wallets} loading={loading} />

      {/* Bottom Navigation Tabs */}
      <FinanceNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <TabContent activeTab={activeTab} />
    </div>
  )
}

export default FinanceContent