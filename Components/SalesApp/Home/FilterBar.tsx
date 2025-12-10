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

  const dateRanges = [
    { value: '', label: 'Date: All' },
    { value: 'today', label: 'Date: Today' },
    { value: 'yesterday', label: 'Date: Yesterday' },
    { value: 'last_7_days', label: 'Date: Last 7 Days' }
  ]

  const statusOptions = [
    { value: '', label: 'Status: All' },
    { value: 'NEW', label: 'New' },
    { value: 'WARM', label: 'Warm' },
    { value: 'COLD', label: 'Cold' },
    { value: 'CONVERTED', label: 'Converted' }
  ]

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = { dateRange: '', status: '' }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  const hasActiveFilters = filters.dateRange !== '' || filters.status !== '';

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      {/* Date Filter Pill */}
      <div className="relative shrink-0">
        <select
          value={filters.dateRange}
          onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          className="appearance-none w-full bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 text-xs font-medium py-2 pl-3 pr-8 rounded-lg border border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
        >
          {dateRanges.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Status Filter Pill */}
      <div className="relative shrink-0">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="appearance-none w-full bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 text-xs font-medium py-2 pl-3 pr-8 rounded-lg border border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Clear Button - Only shows when needed */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg active:scale-95 transition-transform"
        >
          <span>✕</span>
          Clear
        </button>
      )}
    </div>
  )
}

export default FilterBar