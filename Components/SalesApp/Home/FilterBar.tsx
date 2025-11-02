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
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last_7_days', label: 'Last 7 Days' }
  ]

  const statusOptions = [
    { value: '', label: 'All Status' },
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

  return (
    <div className="flex items-center gap-3">
      {/* Date Range Filter */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
          Date:
        </label>
        <select
          value={filters.dateRange}
          onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          className="border border-gray-300 dark:border-zinc-600 rounded px-2 py-1 bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {dateRanges.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
          Status:
        </label>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="border border-gray-300 dark:border-zinc-600 rounded px-2 py-1 bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters Button */}
      <button
        onClick={clearFilters}
        className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-zinc-600 rounded hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors whitespace-nowrap"
      >
        Clear
      </button>
    </div>
  )
}

export default FilterBar