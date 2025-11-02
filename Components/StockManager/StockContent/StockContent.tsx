'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Loader2, RefreshCw } from 'lucide-react'
import { Material, MaterialsResponse } from './types'
import { MaterialRow } from './MaterialRow'
import { MaterialDetails } from './MaterialDetails'
import api from '@/api'

export const StockContent = () => {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchMaterials = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      setError(null)
      const response = await api.get<MaterialsResponse>('/materials/')
      setMaterials(response.data.results)
    } catch (err) {
      console.error('Error fetching materials:', err)
      setError('Failed to load materials. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [])

  const filteredMaterials = materials.filter(material =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.code_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRefresh = () => {
    fetchMaterials(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 dark:text-red-400 mb-4">{error}</div>
        <button
          onClick={() => fetchMaterials()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Stock Management
          </h2>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredMaterials.length} of {materials.length} materials
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Materials List */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No materials found matching your search.' : 'No materials available.'}
            </div>
          ) : (
            filteredMaterials.map((material) => (
              <MaterialRow
                key={material.id}
                material={material}
                onClick={setSelectedMaterial}
              />
            ))
          )}
        </div>
      </div>

      {/* Material Details Overlay */}
      <MaterialDetails
        material={selectedMaterial!}
        isOpen={!!selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
      />
    </div>
  )
}

export default StockContent