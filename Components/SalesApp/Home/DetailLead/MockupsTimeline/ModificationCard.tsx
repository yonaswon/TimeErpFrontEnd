// /components/LeadDetail/MockupsTimeline/ModificationCard.tsx
'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Image as ImageIcon, DollarSign, FileText } from 'lucide-react'
import { Badge } from './Badge'

export interface Modification {
  id: number
  note?: string | null
  price?: number | null
  price_with_vat?: boolean
  request_status: string
  mockup_image?: string | null
  prev_modification?: number | null
}

interface ModificationCardProps {
  modification: Modification
  defaultExpanded?: boolean
}

export const ModificationCard = ({ modification, defaultExpanded = false }: ModificationCardProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'SENT': return 'blue'
      case 'STARTED': return 'yellow'
      case 'RETURNED': return 'green'
      case 'CONVERTED': return 'purple'
      default: return 'gray'
    }
  }

  return (
    <div className="space-y-1">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white">Mod #{modification.id}</span>
          <Badge variant={getStatusVariant(modification.request_status)}>{modification.request_status}</Badge>
        </div>
        <div>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />}
        </div>
      </div>

      {expanded && (
        <div className="ml-4 space-y-2">
          {modification.mockup_image && (
            <img src={modification.mockup_image} alt={`Modification ${modification.id}`} className="w-full max-h-48 object-contain rounded" />
          )}
          {modification.note && (
            <div className="p-2 bg-gray-50 dark:bg-zinc-900 rounded border border-gray-200 dark:border-zinc-700 text-sm text-gray-700 dark:text-gray-300">
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              {modification.note}
            </div>
          )}
          <div className="flex gap-2 items-center text-sm">
            {modification.price && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>${modification.price}</span>
              </div>
            )}
            {modification.price_with_vat && <span className="text-xs text-blue-600 dark:text-blue-400">with VAT</span>}
          </div>
          {modification.prev_modification && (
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Based on Mod #{modification.prev_modification}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
