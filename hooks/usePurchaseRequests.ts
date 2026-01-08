import { useState, useEffect } from 'react'
import api from '@/api'
import { PurchaseListResponse } from '@/types/purchase'

export const usePurchaseRequests = (page: number = 1) => {
  const [purchases, setPurchases] = useState<PurchaseListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPurchaseRequests = async (pageNum: number = page) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/finance/purchase/?request_status=S&status=P&is_deleted=false&p=${pageNum}`)
      setPurchases(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch purchase requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchaseRequests(page)
  }, [page])

  return { 
    purchases, 
    loading, 
    error, 
    refetch: fetchPurchaseRequests,
    currentPage: page
  }
}