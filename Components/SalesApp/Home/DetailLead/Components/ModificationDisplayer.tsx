'use client'
import { useEffect, useState } from 'react'
import api from '@/api'
import { Plus, RefreshCw } from 'lucide-react'
import EachModificationDisplayer from './EachModificationDisplayer'
import CreateModificationOverlay from './CreateModificationOverlay'

interface Modification {
  id: number
  reference_images: Array<{
    id: number
    image: string
    date: string
  }>
  bom: Array<{
    id: number
    material: {
      id: number
      name: string
      type: string
      code_name: string
      available: string
      parsialy_available: string
      min_threshold: number
      width: number | null
      height: number | null
      date: string
      stats: any
    }
    amount: string | null
    width: string | null
    height: string | null
    price_per_unit: string | null
    total_price: string | null
    estimated_price: string | null
    date: string
  }>
  price: number | null
  price_with_vat: boolean
  is_edit: boolean
  request_status: string
  mockup_image: string | null
  note: string | null
  width: string | null
  hieght: string | null
  telegram_message_id: number | null
  started_date: string | null
  requested_date: string
  response_date: string | null
  lead: number
  mockup: number
  prev_modification: number | null
}

interface ModificationDisplayerProps {
  mockupId: number
  canCreateModification: boolean,
  leadId:number
}

const Badge = ({ children, variant = 'gray' }: { children: React.ReactNode; variant?: string }) => {
  const map: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-200',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${map[variant] || map.gray}`}>
      {children}
    </span>
  )
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'SENT': return 'blue'
    case 'STARTED': return 'yellow'
    case 'RETURNED': return 'green'
    case 'CONVERTED': return 'purple'
    default: return 'gray'
  }
}

export default function ModificationDisplayer({ mockupId, canCreateModification,leadId}: ModificationDisplayerProps) {
  const [modifications, setModifications] = useState<Modification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeModification, setActiveModification] = useState<Modification | null>(null)
  const [showCreateOverlay, setShowCreateOverlay] = useState(false)

  useEffect(() => {
    fetchModifications()
  }, [mockupId])

  const fetchModifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/lead/modifications/?mockup=${mockupId}`)
      const modificationsData = response.data.results || response.data
      setModifications(modificationsData)
      if (modificationsData.length > 0) {
        setActiveModification(modificationsData[0])
      }
    } catch (error: any) {
      console.error('Error fetching modifications:', error)
      setError('Failed to load modifications')
    } finally {
      setLoading(false)
    }
  }

  const handleModificationCreated = () => {
    setShowCreateOverlay(false)
    fetchModifications()
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-gray-200 dark:border-zinc-700">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-900 dark:text-white">Loading modifications...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-gray-200 dark:border-zinc-700">
        <div className="text-center">
          <div className="text-red-500 font-medium mb-2">Error</div>
          <div className="text-gray-600 dark:text-gray-300 mb-4">{error}</div>
          <button
            onClick={fetchModifications}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Modifications</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {modifications.length} modification{modifications.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchModifications}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            {canCreateModification && (
              <button
                onClick={() => setShowCreateOverlay(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                <Plus className="w-4 h-4" />
                New Modification
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {modifications.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🔄</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Modifications Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {canCreateModification 
                ? "Create the first modification for this mockup"
                : "No modifications available for this mockup"
              }
            </p>
            {canCreateModification && (
              <button
                onClick={() => setShowCreateOverlay(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create First Modification
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Modification Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {modifications.map((modification) => (
                <button
                  key={modification.id}
                  onClick={() => setActiveModification(modification)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all shrink-0 ${
                    activeModification?.id === modification.id
                      ? 'bg-white dark:bg-zinc-700 border-blue-500 shadow-md'
                      : 'bg-white/70 dark:bg-zinc-700/70 border-gray-200 dark:border-zinc-600 hover:border-gray-300 dark:hover:border-zinc-500'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Mod #{modification.id}
                  </div>
                  <Badge variant={getStatusVariant(modification.request_status)}>
                    {modification.request_status}
                  </Badge>
                </button>
              ))}
            </div>

            {/* Active Modification Display */}
            {activeModification && (
              <EachModificationDisplayer modification={activeModification} />
            )}
          </div>
        )}
      </div>

      {/* Create Modification Overlay */}
   {showCreateOverlay && (
  <CreateModificationOverlay
    mockupId={mockupId}
    leadId={leadId}
    previousModification={activeModification?.id || null}
    onClose={() => setShowCreateOverlay(false)}
    onSuccess={handleModificationCreated}
  />
)}
    </div>
  )
}