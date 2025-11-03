// utils/statusUtils.tsx
import React from 'react'
import { Clock, Play, AlertCircle, CheckCircle } from 'lucide-react'

export const getStatusIcon = (status: string) => {
  const normalized = status?.toUpperCase?.() || ''

  switch (normalized) {
    case 'SENT':
      return <Clock size={16} className="text-yellow-500" />
    case 'STARTED':
      return <Play size={16} className="text-blue-500" />
    case 'RETURNED':
      return <AlertCircle size={16} className="text-orange-500" />
    case 'COMPLETED':
      return <CheckCircle size={16} className="text-green-500" />
    default:
      return <Clock size={16} className="text-gray-500" />
  }
}

export const getStatusColor = (status: string): string => {
  const normalized = status?.toUpperCase?.() || ''

  switch (normalized) {
    case 'SENT':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    case 'STARTED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'RETURNED':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
}
