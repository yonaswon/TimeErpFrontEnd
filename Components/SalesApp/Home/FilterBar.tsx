'use client'
import { useState } from 'react'

interface FilterBarProps {
  onFilterChange: (filters: any) => void
}

const FilterBar = ({ onFilterChange }: FilterBarProps) => {
  const [filters, setFilters] = useState({
    dateRange: '',
    status: ''
  })

  // Tabs for Status
  const statusTabs = [
    { value: '', label: 'All' },
    { value: 'NEW', label: 'New' },
    { value: 'WARM', label: 'Warm' },
    { value: 'COLD', label: 'Cold' },
    { value: 'CONVERTED', label: 'Converted' }
  ]

  const dateRanges = [
    { value: '', label: 'Any Date' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last_7_days', label: 'Last 7 Days' }
  ]

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="flex flex-col gap-2 pt-2">
      {/* Top Row: Date Filter (Clean & Minimal) */}
      <div className="flex justify-end px-1">
        <div className="relative">
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="appearance-none bg-transparent text-xs font-semibold text-gray-500 dark:text-gray-400 py-1 pr-6 cursor-pointer focus:outline-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {dateRanges.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-400">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Status Tabs (Formal Design) */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-gray-200 dark:border-gray-800">
        {statusTabs.map((tab) => {
          const isActive = filters.status === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => handleFilterChange('status', tab.value)}
              className={`
                relative px-4 py-3 text-sm font-medium transition-all whitespace-nowrap
                ${isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}
              `}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  )
}

export default FilterBar