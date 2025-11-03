// /components/LeadDetail/MockupsTimeline/MockupCard.tsx
'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { ModificationCard, Modification } from './ModificationCard'
import { Badge } from './Badge'

export interface Mockup {
  id: number
  image?: string | null
  status: string
  modifications: Modification[]
}

interface MockupCardProps {
  mockup: Mockup
  defaultExpanded?: boolean
}

export const MockupCard = ({ mockup, defaultExpanded = false }: MockupCardProps) => {
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
    <div className="space-y-2">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {mockup.image && <img src={mockup.image} alt={`Mockup ${mockup.id}`} className="w-12 h-12 object-cover rounded" />}
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 dark:text-white">Mockup #{mockup.id}</span>
            <Badge variant={getStatusVariant(mockup.status)}>{mockup.status}</Badge>
          </div>
        </div>
        <div>{expanded ? <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />}</div>
      </div>

      {expanded && mockup.modifications.length > 0 && (
        <div className="ml-6 border-l border-gray-300 dark:border-zinc-700 pl-4 space-y-2">
          {mockup.modifications.map((mod, idx) => (
            <ModificationCard
              key={mod.id}
              modification={mod}
              defaultExpanded={idx === mockup.modifications.length - 1} // last modification expanded by default
            />
          ))}
        </div>
      )}
    </div>
  )
}
