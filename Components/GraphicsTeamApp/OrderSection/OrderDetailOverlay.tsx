'use client'
import { Order } from './types'

interface OrderDetailOverlayProps {
  order: Order
  onClose: () => void
}

const OrderDetailOverlay = ({ order, onClose }: OrderDetailOverlayProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Order ORD{String(order.order_code).padStart(4, '0')} Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Order Code</label>
                <p className="text-gray-900 dark:text-white">ORD{String(order.order_code).padStart(4, '0')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                <p className="text-gray-900 dark:text-white">{order.order_status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Price</label>
                <p className="text-gray-900 dark:text-white">{order.price?.toLocaleString()} ETB</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created At</label>
                <p className="text-gray-900 dark:text-white">{formatDate(order.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Mockup Information */}
          {order.mockup && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Mockup Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Designer</label>
                  <p className="text-gray-900 dark:text-white">@{order.mockup.designer.telegram_user_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                  <p className="text-gray-900 dark:text-white">{order.mockup.request_status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Note</label>
                  <p className="text-gray-900 dark:text-white">{order.mockup.note || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Requested Date</label>
                  <p className="text-gray-900 dark:text-white">{formatDate(order.mockup.requested_date)}</p>
                </div>
              </div>
              
              {order.mockup.mockup_image && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Mockup Image</label>
                  <img
                    src={order.mockup.mockup_image}
                    alt="Mockup"
                    className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-zinc-700"
                  />
                </div>
              )}
            </div>
          )}

          {/* BOM Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              BOM Items ({order.boms.length})
            </h3>
            {order.boms.length > 0 ? (
              <div className="space-y-3">
                {order.boms.map((bom, index) => (
                  <div key={bom.id} className="p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">BOM #{index + 1}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Amount: {bom.amount} | Width: {bom.width} | Height: {bom.height}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(bom.date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">No BOM items added yet</p>
            )}
          </div>

          {/* Cutting Files */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Cutting Files ({order.cutting_files.length})
            </h3>
            {order.cutting_files.length > 0 ? (
              <div className="space-y-3">
                {order.cutting_files.map((file) => (
                  <div key={file.id} className="p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">File #{file.id}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Status: {file.status} | Assigned To: {file.assigned_to}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Schedule: {formatDate(file.schedule_start_date)} - {formatDate(file.schedule_complate_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">No cutting files assigned yet</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-zinc-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailOverlay