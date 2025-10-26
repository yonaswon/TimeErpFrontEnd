'use client'

import { Package, Bell, FileText } from 'lucide-react'

type TabType = 'purchases' | 'requests' | 'notifications'

interface OverviewNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs = [
  { id: 'purchases' as TabType, label: 'Purchases', icon: Package },
  { id: 'requests' as TabType, label: 'Requests', icon: FileText },
  { id: 'notifications' as TabType, label: 'Notifications', icon: Bell },
]

export const OverviewNavigation = ({ activeTab, onTabChange }: OverviewNavigationProps) => {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
      <div className="flex">
        {tabs.map((tab) => {
          const IconComponent = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700'
              }`}
            >
              <IconComponent size={20} />
              <span className="font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}