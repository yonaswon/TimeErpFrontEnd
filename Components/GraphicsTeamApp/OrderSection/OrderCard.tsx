'use client'
import { useState } from 'react'
import { Order } from './types'
import OrderDetailOverlay from './OrderDetailOverlay'
import BomFormOverlay from './BomFormOverlay'

interface OrderCardProps {
  order: any
  onRefresh: () => void
}

const OrderCard = ({ order, onRefresh }: OrderCardProps) => {
  const [showDetailOverlay, setShowDetailOverlay] = useState(false)
  const [showBomOverlay, setShowBomOverlay] = useState(false)
  
  // Get user data from localStorage
  const getUserData = () => {
    try {
      return JSON.parse(localStorage.getItem('user_data') || '{}')
    } catch {
      return {}
    }
  }
  
  const userData = getUserData()
  const currentUserTelegramId = userData.telegram_id
  const currentUserName = userData.telegram_user_name
  
  const isAssignedToMe = order.mockup?.designer.telegram_id === currentUserTelegramId
  const hasBom = order.boms.length > 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CNC-COMPLETED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'ASSEMBLY-COMPLETED':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'CNC-STARTED':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'DANDI-STARTED':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
      case 'REM-ACCEPTED':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300'
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
    }
  }

  const formatStatus = (status: string) => {
    return status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <>
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-semibold text-gray-900 dark:text-white">
                ORD{String(order.order_code).padStart(4, '0')}
              </div>
              <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.order_status)}`}>
                {formatStatus(order.order_status)}
              </span>
              {isAssignedToMe && (
                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded">
                  Assigned to You
                </span>
              )}
            </div>
            
            {order.mockup && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Designer: @{order.mockup.designer.telegram_user_name}
              </div>
            )}
            
            {order.price && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Price: {order.price.toLocaleString()} ETB
              </div>
            )}
          </div>
        </div>

        {/* BOM Status */}
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              BOM Status:
            </span>
            <span className={`text-sm ${hasBom ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {hasBom ? 'Completed' : 'Pending'}
            </span>
          </div>
          
          {!hasBom && isAssignedToMe && (
            <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
              You need to fill the BOM for this order
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowDetailOverlay(true)}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
          >
            View Details
          </button>
          
          
            <button
              onClick={() => setShowBomOverlay(true)}
              className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                hasBom
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/40'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/40'
              }`}
            >
              {hasBom ? 'Edit BOM' : 'Fill BOM'}
            </button>
        
        </div>
      </div>

      {/* Overlays */}
      {showDetailOverlay && (
        <OrderDetailOverlay
          order={order}
          onClose={() => setShowDetailOverlay(false)}
        />
      )}

      {showBomOverlay && (
        <BomFormOverlay
          order={order}
          onClose={() => setShowBomOverlay(false)}
          onSuccess={() => {
            setShowBomOverlay(false)
            onRefresh()
          }}
        />
      )}
    </>
  )
}

export default OrderCard