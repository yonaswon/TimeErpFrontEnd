'use client'

import { Trash, Loader2, AlertCircle } from 'lucide-react'
import { MaterialSearch } from './MaterialSearch'

interface MaterialRow {
  id: string
  materialId: number | null
  amount: number
  price: number
  total: number
  creating: boolean
  error?: string | null
  eachMaterialCreatedId?: number | null
}

interface MaterialRowProps {
  row: MaterialRow
  onUpdate: (id: string, updates: Partial<MaterialRow>) => void
  onRemove: (id: string) => void
  disabled?: boolean
  showRemove: boolean
}

export const MaterialRow = ({ row, onUpdate, onRemove, disabled = false, showRemove }: MaterialRowProps) => {
  const handleAmountChange = (value: string) => {
    // Remove leading zeros and convert to number
    const numValue = value === '' ? 0 : Number(value.replace(/^0+/, ''))
    onUpdate(row.id, { amount: numValue })
  }

  const handlePriceChange = (value: string) => {
    // Remove leading zeros and convert to number
    const numValue = value === '' ? 0 : Number(value.replace(/^0+/, ''))
    onUpdate(row.id, { price: numValue })
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 items-center">
        <div className="col-span-5">
          <MaterialSearch
            value={row.materialId}
            onChange={(materialId) => onUpdate(row.id, { materialId })}
            disabled={disabled}
          />
        </div>

        <div className="col-span-2">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={row.amount || ''}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="w-full px-2 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            placeholder="0.00"
            disabled={disabled}
          />
        </div>

        <div className="col-span-2">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={row.price || ''}
            onChange={(e) => handlePriceChange(e.target.value)}
            className="w-full px-2 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            placeholder="0.00"
            disabled={disabled}
          />
        </div>

        <div className="col-span-2 text-sm font-medium text-gray-800 dark:text-white px-2">
          ${row.total.toFixed(2)}
        </div>

        <div className="col-span-1 flex justify-center">
          {showRemove && (
            <button 
              onClick={() => onRemove(row.id)} 
              className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
              disabled={disabled}
            >
              <Trash size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {row.creating && (
        <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-600 dark:text-blue-400">
          <Loader2 size={12} className="animate-spin" />
          <span>Creating material entry...</span>
        </div>
      )}

      {/* Error State */}
      {row.error && (
        <div className="flex items-center gap-2 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
          <AlertCircle size={12} />
          <span>{row.error}</span>
        </div>
      )}
    </div>
  )
}