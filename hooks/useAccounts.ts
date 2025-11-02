import { useState, useEffect } from 'react'
import api from '@/api'
import { Account } from '@/types/purchase'

export const useAccounts = (accountType: 'C' | 'P') => {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/finance/account/?account_type=${accountType}&deleted=false`)
      setAccounts(response.data.results || response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [accountType])

  return { accounts, loading, error, refetch: fetchAccounts }
}