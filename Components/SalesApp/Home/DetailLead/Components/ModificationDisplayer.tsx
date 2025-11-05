'use client'
import { useEffect, useState } from 'react'
import api from '@/api'
import { Plus, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import EachModificationDisplayer from './EachModificationDisplayer'
import CreateModificationOverlay from './CreateModificationOverlay'

// --- INTERFACES (UNCHANGED) ---
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

// --- UTILITY COMPONENTS & FUNCTIONS (UNCHANGED) ---
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

// Custom Collapsible Modification Item (NEW)
const CollapsibleModificationItem = ({ 
    modification, 
    isLast, 
    isActive, 
    onToggle 
}: { 
    modification: Modification, 
    isLast: boolean,
    isActive: boolean,
    onToggle: () => void 
}) => {
    
    // Fallback date display for better UI
    const requestedDate = new Date(modification.requested_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });

    return (
        <div className="relative">
            {/* Timeline Line */}
            {!isLast && (
                <div className="absolute top-8 left-4 w-0.5 h-full bg-gray-200 dark:bg-zinc-700 transform -translate-y-4"></div>
            )}

            <div className="flex items-start mb-4">
                {/* Timeline Dot/Icon */}
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white z-10 shrink-0 border-4 border-white dark:border-zinc-800">
                    <span className="text-xs font-bold">M{modification.id}</span>
                </div>

                {/* Content */}
                <div className="flex-1 ml-4 -mt-1">
                    {/* Header/Toggle Button */}
                    <button
                        onClick={onToggle}
                        className="w-full flex justify-between items-center text-left py-2 px-3 rounded-lg bg-gray-50 dark:bg-zinc-700/50 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors border border-transparent dark:border-zinc-700"
                    >
                        <div className="flex flex-col">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                Modification #{modification.id}
                                <Badge variant={getStatusVariant(modification.request_status)}>{modification.request_status}</Badge>
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Requested on {requestedDate}
                                {modification.is_edit && <span className="ml-2 font-medium text-yellow-600 dark:text-yellow-400">(Edit)</span>}
                            </p>
                        </div>
                        {isActive ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
                    </button>
                    
                    {/* Collapsible Body */}
                    <div 
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                            isActive ? 'max-h-[2000px] opacity-100 pt-3' : 'max-h-0 opacity-0'
                        }`}
                    >
                        <div className="pl-3 pr-1 pb-1">
                            {/* Renders the detail component when expanded */}
                            <EachModificationDisplayer modification={modification} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default function ModificationDisplayer({ mockupId, canCreateModification, leadId}: ModificationDisplayerProps) {
  const [modifications, setModifications] = useState<Modification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // State now tracks which modification is open, using its ID
  const [openModificationId, setOpenModificationId] = useState<number | null>(null) 
  const [showCreateOverlay, setShowCreateOverlay] = useState(false)

  useEffect(() => {
    fetchModifications()
  }, [mockupId])

  const fetchModifications = async () => {
    try {
      setLoading(true)
      setError(null)
      // !!! API CALL UNCHANGED
      const response = await api.get(`/lead/modifications/?mockup=${mockupId}`)
      const modificationsData = response.data.results || response.data
      setModifications(modificationsData.reverse()) // Reverse for chronological timeline display
      
      // Keep the currently open modification open if it exists, otherwise open the latest one
      if (modificationsData.length > 0) {
        if (!modificationsData.find((m: Modification) => m.id === openModificationId)) {
            setOpenModificationId(modificationsData[0].id); // Open the latest one
        }
      } else {
        setOpenModificationId(null)
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

  const handleToggle = (id: number) => {
    setOpenModificationId(openModificationId === id ? null : id);
  };
  
  // --- Loading, Error States (Functionality Unchanged) ---
  if (loading) {
    return (
      <div className="flex items-center justify-center space-x-3 py-6">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-gray-900 dark:text-white">Loading modifications...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-6">
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
    )
  }

  return (
    <div className="space-y-4">
      {/* Modification Count and Create Button */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-700 pb-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Total: **{modifications.length} modification{modifications.length !== 1 ? 's' : ''}**
        </p>
        
        {canCreateModification && (
          <button
            onClick={() => setShowCreateOverlay(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        )}
      </div>

      {/* Content */}
      {modifications.length === 0 ? (
        <div className="text-center py-4">
          <div className="text-3xl mb-2">🔄</div>
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-1">No Modifications Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {canCreateModification 
              ? "Create the first modification for this mockup."
              : "No modifications have been requested for this mockup."
            }
          </p>
        </div>
      ) : (
        <div className="relative pt-2">
            {/* The actual timeline display using the custom item */}
            {modifications.map((modification, index) => (
                <CollapsibleModificationItem
                    key={modification.id}
                    modification={modification}
                    isLast={index === modifications.length - 1}
                    isActive={openModificationId === modification.id}
                    onToggle={() => handleToggle(modification.id)}
                />
            ))}
        </div>
      )}

      {/* Create Modification Overlay (Functionality Unchanged) */}
      {showCreateOverlay && (
        <CreateModificationOverlay
          mockupId={mockupId}
          leadId={leadId}
          // Pass the ID of the latest modification (index 0) as previousModification
          previousModification={modifications.length > 0 ? modifications[0].id : null}
          onClose={() => setShowCreateOverlay(false)}
          onSuccess={handleModificationCreated}
        />
      )}
    </div>
  )
}