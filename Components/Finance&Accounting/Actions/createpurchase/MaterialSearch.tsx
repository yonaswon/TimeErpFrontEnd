'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown, Check, Loader2, AlertCircle } from 'lucide-react'
import api from '@/api'

interface Material {
  id: number
  name: string
  type: string
  type_display: string
  available: string
}

interface MaterialSearchProps {
  value: number | null
  onChange: (materialId: number | null) => void
  disabled?: boolean
}

export const MaterialSearch = ({ value, onChange, disabled = false }: MaterialSearchProps) => {
  const [materials, setMaterials] = useState<Material[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedMaterial = materials.find(m => m.id === value)

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!searchTerm && !isOpen) return // Don't fetch when dropdown is closed and no search term
      
      setLoading(true)
      setError(null)
      try {
        const url = searchTerm ? `/materials/?search=${encodeURIComponent(searchTerm)}` : '/materials/'
        const response = await api.get(url)
        setMaterials(response.data.results || [])
      } catch (err: any) {
        console.error('Error fetching materials:', err)
        setError(err.response?.data?.message || 'Failed to load materials')
        setMaterials([])
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchMaterials, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (material: Material) => {
    onChange(material.id)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleFocus = () => {
    setIsOpen(true)
    // Fetch initial materials when opening
    if (materials.length === 0 && !searchTerm) {
      setLoading(true)
      api.get('/materials/')
        .then((response) => {
          setMaterials(response.data.results || [])
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to load materials')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={isOpen ? searchTerm : selectedMaterial?.name || ''}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            if (!isOpen) setIsOpen(true)
          }}
          onFocus={handleFocus}
          placeholder="Search material..."
          disabled={disabled}
          className="w-full px-3 py-2 pr-10 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          {loading ? (
            <Loader2 size={16} className="text-blue-500 animate-spin" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center px-3 py-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 size={16} className="animate-spin text-blue-500" />
                <span>Searching materials...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20">
              <AlertCircle size={16} />
              <div>
                <div className="font-medium">Failed to load</div>
                <div className="text-xs opacity-75">{error}</div>
              </div>
            </div>
          ) : materials.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-1">
                <Search size={24} className="mx-auto mb-2" />
                <div className="text-sm font-medium">No materials found</div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Try a different search term' : 'No materials available'}
              </div>
            </div>
          ) : (
            <>
              {searchTerm && (
                <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-zinc-700">
                  Found {materials.length} material{materials.length !== 1 ? 's' : ''}
                  {searchTerm && ` for "${searchTerm}"`}
                </div>
              )}
              {materials.map((material) => (
                <button
                  key={material.id}
                  onClick={() => handleSelect(material)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center justify-between transition-colors ${
                    value === material.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{material.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                      <span className="bg-gray-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-xs">
                        {material.type_display}
                      </span>
                      <span>Available: {material.available}</span>
                    </div>
                  </div>
                  {value === material.id && (
                    <Check size={16} className="text-blue-500 shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}