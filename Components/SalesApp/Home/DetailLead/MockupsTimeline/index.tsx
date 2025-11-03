// /components/LeadDetail/MockupsTimeline/index.tsx
'use client'
import { useState } from 'react'
import { MockupCard, Mockup } from './MockupCard'

interface MockupsTimelineProps {
  mockups: Mockup[]
}

export default function MockupsTimeline({ mockups }: MockupsTimelineProps) {
  const [activeMockup, setActiveMockup] = useState<number>(mockups.length - 1)

  return (
    <div className="space-y-4">
      {/* Horizontal navigation */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {mockups.map((mockup) => (
          <button
            key={mockup.id}
            onClick={() => setActiveMockup(mockup.id)}
            className={`shrink-0 p-2 rounded-lg border transition-colors ${
              activeMockup === mockup.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
            }`}
          >
            <img src={mockup.image || ''} alt={`Mockup ${mockup.id}`} className="w-16 h-16 object-cover rounded" />
            <div className="text-xs mt-1 text-gray-700 dark:text-gray-300 text-center">M{mockup.id}</div>
          </button>
        ))}
      </div>

      {/* Mockup cards */}
      <div className="space-y-4">
        {mockups.map((mockup) => (
          <MockupCard key={mockup.id} mockup={mockup} defaultExpanded={mockup.id === activeMockup} />
        ))}
      </div>
    </div>
  )
}
