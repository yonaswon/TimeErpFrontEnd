'use client'
import { useState, useEffect } from 'react'
import { Check, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import api from '@/api'

interface SelectionStepProps {
  leadId: number
  onSelectionComplete: (items: any[]) => void
  onClose: () => void
}

interface Mockup {
  id: number
  request_status: string
  mockup_image: string | null
  design_type: number
  bom: any[]
  price: number | null
  note: string
  width: string | null
  hieght: string | null
}

interface Modification {
  id: number
  request_status: string
  mockup_image: string | null
  design_type: number
  bom: any[]
  price: number | null
  mockup: number
  note: string
  width: string | null
  hieght: string | null
}

export default function SelectionStep({ leadId, onSelectionComplete, onClose }: SelectionStepProps) {
  const [mockups, setMockups] = useState<Mockup[]>([])
  const [modifications, setModifications] = useState<Modification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Map<number, 'mockup' | 'modification'>>(new Map())
  const [expandedMockups, setExpandedMockups] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchReturnedItems()
  }, [leadId])

  const fetchReturnedItems = async () => {
    try {
      setLoading(true)
      
      const mockupsResponse = await api.get(`/lead/mockups/?lead=${leadId}&request_status=RETURNED`)
      const mockupsData = mockupsResponse.data.results || mockupsResponse.data
      setMockups(mockupsData)

      if (mockupsData.length > 0) {
        const mockupIds = mockupsData.map((m: Mockup) => m.id)
        const modificationsResponse = await api.get(`/lead/modifications/?mockup__in=${mockupIds.join(',')}&request_status=RETURNED`)
        const modificationsData = modificationsResponse.data.results || modificationsResponse.data
        setModifications(modificationsData)

        const mockupsWithMods = new Set(modificationsData.map((m: Modification) => m.mockup))
        setExpandedMockups(mockupsWithMods)
      }

    } catch (error) {
      console.error('Error fetching returned items:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleMockupExpansion = (mockupId: number) => {
    const newExpanded = new Set(expandedMockups)
    if (newExpanded.has(mockupId)) {
      newExpanded.delete(mockupId)
    } else {
      newExpanded.add(mockupId)
    }
    setExpandedMockups(newExpanded)
  }

  const getModificationsForMockup = (mockupId: number) => {
    return modifications.filter(mod => mod.mockup === mockupId)
  }

  const toggleSelection = (mockupId: number, type: 'mockup' | 'modification', itemId: number) => {
    const newSelected = new Map(selectedItems)
    newSelected.delete(mockupId)
    newSelected.set(mockupId, type === 'mockup' ? 'mockup' : `modification-${itemId}` as any)
    setSelectedItems(newSelected)
  }

  const getSelectedItemForMockup = (mockupId: number) => {
    const selection = selectedItems.get(mockupId)
    if (!selection) return null
    
    if (selection === 'mockup') {
      return { type: 'mockup', id: mockupId }
    } else if (typeof selection === 'string' && selection.startsWith('modification-')) {
      const modId = parseInt(selection.split('-')[1])
      return { type: 'modification', id: modId }
    }
    return null
  }

  const handleContinue = () => {
    const selectedItemsList: any[] = []
    
    selectedItems.forEach((type, mockupId) => {
      if (type === 'mockup') {
        const mockup = mockups.find(m => m.id === mockupId)
        if (mockup) selectedItemsList.push({ ...mockup, type: 'mockup' })
      } else if (typeof type === 'string' && type.startsWith('modification-')) {
        const modId = parseInt(type.split('-')[1])
        const modification = modifications.find(m => m.id === modId)
        if (modification) selectedItemsList.push({ ...modification, type: 'modification' })
      }
    })
    
    onSelectionComplete(selectedItemsList)
  }

  const totalSelected = selectedItems.size

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Mockups List - Minimal Design */}
      {mockups.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
          No returned mockups found
        </div>
      ) : (
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {mockups.map((mockup) => {
            const mockupModifications = getModificationsForMockup(mockup.id)
            const hasModifications = mockupModifications.length > 0
            const isExpanded = expandedMockups.has(mockup.id)
            const selectedItem = getSelectedItemForMockup(mockup.id)
            const isMockupSelected = selectedItem?.type === 'mockup'

            return (
              <div key={mockup.id}>
                {/* Mockup Row */}
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded">
                  <button
                    onClick={() => toggleSelection(mockup.id, 'mockup', mockup.id)}
                    className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      isMockupSelected
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-400 dark:border-zinc-500'
                    }`}
                  >
                    {isMockupSelected && <Check className="w-3 h-3 text-white" />}
                  </button>

                  {/* Mockup Image */}
                  {mockup.mockup_image && (
                    <div className="w-8 h-8 bg-gray-100 dark:bg-zinc-700 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={mockup.mockup_image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-900 dark:text-white">Mockup #{mockup.id}</span>
                      {mockup.price && (
                        <span className="text-green-600 dark:text-green-400 text-xs">
                          ${mockup.price}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand Button */}
                  {hasModifications && (
                    <button
                      onClick={() => toggleMockupExpansion(mockup.id)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded text-xs"
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  )}
                </div>

                {/* Modifications List */}
                {hasModifications && isExpanded && (
                  <div className="ml-6 space-y-1">
                    {mockupModifications.map((modification) => {
                      const isModSelected = selectedItem?.type === 'modification' && selectedItem.id === modification.id

                      return (
                        <div
                          key={modification.id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded"
                        >
                          <button
                            onClick={() => toggleSelection(mockup.id, 'modification', modification.id)}
                            className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                              isModSelected
                                ? 'bg-blue-500 border-blue-500'
                                : 'border-gray-400 dark:border-zinc-500'
                            }`}
                          >
                            {isModSelected && <Check className="w-3 h-3 text-white" />}
                          </button>

                          {/* Modification Image */}
                          {modification.mockup_image && (
                            <div className="w-8 h-8 bg-gray-100 dark:bg-zinc-700 rounded overflow-hidden flex-shrink-0">
                              <img
                                src={modification.mockup_image}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-700 dark:text-gray-300">Mod #{modification.id}</span>
                              {modification.price && (
                                <span className="text-green-600 dark:text-green-400 text-xs">
                                  ${modification.price}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Minimal Actions */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200 dark:border-zinc-700">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded text-sm"
        >
          Cancel
        </button>
        
        <button
          onClick={handleContinue}
          disabled={totalSelected === 0}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded text-sm"
        >
          Continue ({totalSelected})
        </button>
      </div>
    </div>
  )
}