import { useState, useEffect } from 'react'
import api from '@/api'
import { Wallet } from '@/types/finance'

export const useWallet = (walletId: number = 2) => {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWallet = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/finance/wallet/${walletId}/`)
      setWallet(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch wallet data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWallet()
  }, [walletId])

  return { wallet, loading, error, refetch: fetchWallet }
}