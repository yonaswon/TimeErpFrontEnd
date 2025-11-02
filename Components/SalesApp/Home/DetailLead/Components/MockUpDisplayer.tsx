'use client'
import { useEffect, useState } from 'react'
import api from '@/api'
import { Plus } from 'lucide-react'
import EachMockupDisplayer from './EachMockupDisplayer'
import CreateMockupOverlay from './CreateMockupOverlay'

interface ImageObj {
  id: number
  image: string
  date: string
}

interface BomItem {
  id: number
  amount: number | null
  width: string | null
  height: string | null
  price_per_unit: string | null
  total_price: string | null
  estimated_price: string | null
  date: string
  material: number
}

interface Designer {
  id: number
  telegram_id: number
  telegram_user_name: string | null
  role: Array<{
    id: number
    Name: string
    date: string
  }>
  first_name: string
}

interface Mockup {
  id: number
  reference_images: ImageObj[]
  bom: BomItem[]
  designer: Designer
  request_status: string
  note: string
  price: number | null
  price_with_vat: boolean
  mockup_image: string | null
  width: string | null
  hieght: string | null
  telegram_message_id: number | null
  requested_date: string
  first_response_date: string | null
  date: string
  lead: number
}

interface MockUpDisplayerProps {
  leadId: number
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

export default function MockUpDisplayer({ leadId }: MockUpDisplayerProps) {
  const [mockups, setMockups] = useState<Mockup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeMockup, setActiveMockup] = useState<Mockup | null>(null)
  const [showCreateOverlay, setShowCreateOverlay] = useState(false)

  useEffect(() => {
    fetchMockups()
  }, [leadId])

  const fetchMockups = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/lead/mockups/?lead=${leadId}`)
      const mockupsData = response.data.results || response.data
      setMockups(mockupsData)
      if (mockupsData.length > 0) {
        setActiveMockup(mockupsData[0])
      }
    } catch (error: any) {
      console.error('Error fetching mockups:', error)
      setError('Failed to load mockups')
    } finally {
      setLoading(false)
    }
  }

  const handleMockupCreated = () => {
    setShowCreateOverlay(false)
    fetchMockups() // Refresh the mockups list
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-gray-200 dark:border-zinc-700">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-900 dark:text-white">Loading mockups...</div>
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
            onClick={fetchMockups}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (mockups.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-gray-200 dark:border-zinc-700">
        <div className="text-center">
          <div className="text-4xl mb-2">🎨</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Mockups Yet</h3>
          <p className="text-gray-500 dark:text-gray-400">Create your first mockup to get started</p>
          <button 
            onClick={() => setShowCreateOverlay(true)}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Create First Mockup
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
      {/* Horizontal Navigation Bar */}
      <div className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50">
        <div className="flex items-center gap-2 p-4 overflow-x-auto">
          {mockups.map((mockup) => (
            <button
              key={mockup.id}
              onClick={() => setActiveMockup(mockup)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all shrink-0 ${
                activeMockup?.id === mockup.id
                  ? 'bg-white dark:bg-zinc-700 border-blue-500 shadow-md'
                  : 'bg-white/70 dark:bg-zinc-700/70 border-gray-200 dark:border-zinc-600 hover:border-gray-300 dark:hover:border-zinc-500'
              }`}
            >
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Mockup #{mockup.id}
              </div>
              <Badge variant={getStatusVariant(mockup.request_status)}>
                {mockup.request_status}
              </Badge>
            </button>
          ))}
          
          {/* Add Button */}
          <button 
            onClick={() => setShowCreateOverlay(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Mockup
          </button>
        </div>
      </div>

      {/* Active Mockup Display */}
      <div className="p-4">
        {activeMockup ? (
          <EachMockupDisplayer mockup={activeMockup} />
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Select a mockup to view details
          </div>
        )}
      </div>

      {/* Create Mockup Overlay */}
      {showCreateOverlay && (
        <CreateMockupOverlay
          leadId={leadId}
          onClose={() => setShowCreateOverlay(false)}
          onSuccess={handleMockupCreated}
        />
      )}
    </div>
  )
}