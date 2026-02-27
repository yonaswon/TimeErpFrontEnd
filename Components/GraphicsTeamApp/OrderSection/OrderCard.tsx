'use client'
import { useState } from 'react'
import { Order } from './types'
import OrderDetailOverlay from './OrderDetailOverlay'
import BomFormOverlay from './BomFormOverlay'
import { FileUp, Download, Trash2, CheckCircle, XCircle } from 'lucide-react'
import api from '../../../api'

interface OrderCardProps {
  order: any
  onRefresh: () => void
}

const OrderCard = ({ order: initialOrder, onRefresh }: OrderCardProps) => {
  const [order, setOrder] = useState(initialOrder)
  const [showDetailOverlay, setShowDetailOverlay] = useState(false)
  const [showBomOverlay, setShowBomOverlay] = useState(false)
  const [togglingDxfReady, setTogglingDxfReady] = useState(false)
  const [deletingDxfId, setDeletingDxfId] = useState<number | null>(null)

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

  const toggleDxfReady = async () => {
    try {
      setTogglingDxfReady(true)
      const response = await api.post(`/api/orders/${order.order_code}/toggle_dxf_ready/`)
      if (response.status === 200) {
        setOrder({ ...order, dxf_file_ready: response.data.dxf_file_ready })
      }
    } catch (error) {
      console.error('Error toggling DXF ready:', error)
    } finally {
      setTogglingDxfReady(false)
    }
  }

  const deleteDxfFile = async (dxfId: number) => {
    try {
      setDeletingDxfId(dxfId)
      await api.delete(`/api/orders/${order.order_code}/delete_dxf/${dxfId}/`)
      // Re-fetch order to get updated dxf_files
      const orderResponse = await api.get(`/api/orders/${order.order_code}/`)
      setOrder(orderResponse.data)
      onRefresh()
    } catch (error) {
      console.error('Error deleting DXF file:', error)
    } finally {
      setDeletingDxfId(null)
    }
  }

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
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <div className="font-semibold text-gray-900 dark:text-white">
                #ORD-{order.order_code}
              </div>
              <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.order_status)}`}>
                {formatStatus(order.order_status)}
              </span>
              {(order.dxf_files?.flatMap((d: any) => d.dxf_file).length || 0) > 0 && (
                <>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded flex items-center gap-1">
                    <FileUp className="w-3 h-3" />
                    {order.dxf_files?.flatMap((d: any) => d.dxf_file).length} DXF
                  </span>
                  {order.dxf_file_ready ? (
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Ready
                    </span>
                  ) : (
                    <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-1 rounded flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Not Ready
                    </span>
                  )}
                </>
              )}
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
            className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${hasBom
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/40'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/40'
              }`}
          >
            {hasBom ? 'Edit BOM' : 'Fill BOM'}
          </button>

          {/* DXF Ready Toggle - only show when DXF files exist */}
          {(order.dxf_files?.flatMap((d: any) => d.dxf_file).length || 0) > 0 && (
            <button
              onClick={toggleDxfReady}
              disabled={togglingDxfReady}
              title={order.dxf_file_ready ? 'DXF Ready — click to unmark' : 'Mark DXF as Ready'}
              className={`px-2.5 py-2 rounded-lg transition-colors flex items-center justify-center ${order.dxf_file_ready
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/40'
                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800/40'
                } disabled:opacity-50`}
            >
              {togglingDxfReady ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : order.dxf_file_ready ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* DXF Files List at Bottom */}
        {(order.dxf_files?.flatMap((d: any) => d.dxf_file).length || 0) > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-700 space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <FileUp className="w-3.5 h-3.5" /> DXF Files
            </h4>
            <div className="grid gap-2">
              {order.dxf_files?.flatMap((orderDxf: any) => orderDxf.dxf_file).map((file: any, idx: number) => {
                const fileName = file.dxf.split('/').pop() || `file-${idx}.dxf`
                const baseUrl = api.defaults.baseURL || ''
                const url = file.dxf.startsWith('http') ? file.dxf : `${baseUrl}${file.dxf}`

                return (
                  <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-zinc-700/50 border border-gray-100 dark:border-zinc-700">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate mr-2">
                      {fileName}
                    </span>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Download */}
                      <a
                        href={url}
                        download={fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
                        title="Download DXF"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {/* Delete */}
                      <button
                        onClick={() => deleteDxfFile(file.id)}
                        disabled={deletingDxfId === file.id}
                        className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-800/40 transition-colors disabled:opacity-50"
                        title="Delete DXF"
                      >
                        {deletingDxfId === file.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Overlays */}
      {showDetailOverlay && (
        <OrderDetailOverlay
          order={order}
          onClose={() => setShowDetailOverlay(false)}
          onOrderUpdate={(updatedOrder) => setOrder(updatedOrder)}
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