'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Loader2, RefreshCw, List, Table2 } from 'lucide-react'
import { Material, MaterialsResponse } from './types'
import { MaterialRow } from './MaterialRow'
import { MaterialTable } from './MaterialTable'
import { MaterialDetails } from './MaterialDetails'
import api from '@/api'

export const StockContent = () => {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set())

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

  const toggleTypeFilter = (type: string) => {
    setTypeFilters(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.code_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilters.size === 0 || typeFilters.has(material.type)
    return matchesSearch && matchesType
  })

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

          <div className="flex items-center gap-1">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-zinc-700 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                title="Table view"
              >
                <Table2 className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 border rounded-lg transition-colors relative ${showFilters || typeFilters.size > 0
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700'
              }`}
          >
            <Filter className="w-4 h-4" />
            {typeFilters.size > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {typeFilters.size}
              </span>
            )}
          </button>
        </div>

        {/* Type Filter Chips */}
        {showFilters && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {[
              { value: 'L', label: 'Length', color: 'indigo' },
              { value: 'A', label: 'Areal', color: 'teal' },
              { value: 'P', label: 'Piece', color: 'orange' },
            ].map(t => (
              <button
                key={t.value}
                onClick={() => toggleTypeFilter(t.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${typeFilters.has(t.value)
                    ? t.color === 'indigo'
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                      : t.color === 'teal'
                        ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700'
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700'
                    : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700'
                  }`}
              >
                {t.label}
              </button>
            ))}
            {typeFilters.size > 0 && (
              <button
                onClick={() => setTypeFilters(new Set())}
                className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline ml-1"
              >
                Clear
              </button>
            )}
          </div>
        )}

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

        {/* Materials List or Table */}
        {viewMode === 'list' ? (
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
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <MaterialTable
              materials={filteredMaterials}
              onClick={setSelectedMaterial}
            />
          </div>
        )}
      </div>

      {/* Material Details Overlay */}
      <MaterialDetails
        material={selectedMaterial!}
        isOpen={!!selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
        onRefresh={() => fetchMaterials(true)}
      />
    </div>
  )
}

export default StockContent