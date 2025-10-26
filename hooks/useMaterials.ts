import { useState, useEffect } from 'react'
import api from '@/api'

export interface Material {
  id: number
  name: string
  type: string
  type_display: string
  available: string
}

export const useMaterials = () => {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const response = await api.get('/materials/')
      setMaterials(response.data.results)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch materials')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [])

  return { materials, loading, error, refetch: fetchMaterials }
}