import { useState, useEffect } from 'react'
import api from '@/api'
import { PurchaseListResponse } from '@/types/finance'

export const usePurchases = (page: number = 1) => {
  const [purchases, setPurchases] = useState<PurchaseListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPurchases = async (pageNum: number = page) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/finance/purchase/?page=${pageNum}`)
      setPurchases(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch purchases')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchases(page)
  }, [page])

  return { 
    purchases, 
    loading, 
    error, 
    refetch: fetchPurchases,
    currentPage: page
  }
}