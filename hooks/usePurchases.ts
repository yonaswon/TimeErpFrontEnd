'use client'

import { useState, useEffect } from 'react'
import api from '@/api'
import { Purchase, PurchaseResponse } from '@/types/finance'

export const usePurchases = (page: number = 1) => {
  const [purchases, setPurchases] = useState<PurchaseResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPurchases = async (pageNum: number = page) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/finance/purchase/?p=${pageNum}`)
      setPurchases(response.data)
    } catch (err: any) {
      console.error('Error fetching purchases:', err)
      setError(err.response?.data?.message || 'Failed to fetch purchases')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchases(page)
  }, [page]) // This will refetch when page changes

  const refetch = () => {
    fetchPurchases(page)
  }

  return {
    purchases,
    loading,
    error,
    refetch
  }
}