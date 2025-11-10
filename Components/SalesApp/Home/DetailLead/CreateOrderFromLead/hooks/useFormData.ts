import { useState, useEffect } from 'react'
import api from '@/api'

interface DesignType {
  id: number
  name: string
}

interface Material {
  id: number
  name: string
  type: string
  code_name: string
  available: number
}

interface Wallet {
  id: number
  name: string
  invoice_balance: string
  non_invoice_balance: string
  date: string
}

export function useFormData() {
  const [designTypes, setDesignTypes] = useState<DesignType[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [designRes, materialsRes, walletsRes] = await Promise.all([
          api.get('/lead/design-types/'),
          api.get('/materials/'),
          api.get('/finance/wallet/')
        ])
        
        setDesignTypes(designRes.data.results || designRes.data)
        setMaterials(materialsRes.data.results || materialsRes.data)
        setWallets(walletsRes.data.results || walletsRes.data)
      } catch (err) {
        console.error('Failed to fetch data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return {
    designTypes,
    materials,
    wallets,
    loading
  }
}