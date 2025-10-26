import { Purchase } from '@/types/finance'
import { X, User, Calendar, DollarSign, FileText, Package, CreditCard, CheckCircle, Clock } from 'lucide-react'

interface PurchaseDetailsProps {
  purchase: Purchase | null
  onClose: () => void
}

export const PurchaseDetails = ({ purchase, onClose }: PurchaseDetailsProps) => {
  if (!purchase) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(parseFloat(amount))
  }

  const getStatusInfo = (status: string, requestStatus: string) => {
    if (status === 'D') {
      return { text: 'Completed', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle }
    }
    if (status === 'P' && requestStatus === 'S') {
      return { text: 'Pending Admin Approval', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: Clock }
    }
    return { text: 'In Progress', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: Clock }
  }

  const statusInfo = getStatusInfo(purchase.status, purchase.request_status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700 sticky top-0 bg-white dark:bg-zinc-900">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Purchase Details #{purchase.id}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Created on {formatDate(purchase.date)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className={`flex items-center gap-2 p-3 rounded-lg ${statusInfo.bg}`}>
                <StatusIcon size={20} className={statusInfo.color} />
                <span className={`font-medium ${statusInfo.color}`}>
                  {statusInfo.text}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User size={18} className="text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Created By</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {purchase.created_by.telegram_user_name}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <CreditCard size={18} className="text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Account Details</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {purchase.to_account_name} ({purchase.to_account_number})
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={20} className="text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-blue-700 dark:text-blue-300">Total Amount</span>
                </div>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  ${formatAmount(purchase.total_amount)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Invoice</p>
                  <p className={`font-medium ${purchase.invoice ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {purchase.invoice ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Payment Code</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {purchase.payment_code || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Materials List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package size={20} />
              Materials ({purchase.each_material_purchase.length})
            </h3>
            <div className="space-y-3">
              {purchase.each_material_purchase.map((material) => (
                <div key={material.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {material.material.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {material.material.type_display} • Available: {material.material.available}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ${formatAmount(material.total_price)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {material.amount} × ${material.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Images if available */}
          {(purchase.invoice_image || purchase.payment_screenshot) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText size={20} />
                Attachments
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {purchase.invoice_image && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Invoice Image</p>
                    <img 
                      src={purchase.invoice_image} 
                      alt="Invoice" 
                      className="rounded-lg border border-gray-200 dark:border-zinc-700 max-h-48 object-cover"
                    />
                  </div>
                )}
                {purchase.payment_screenshot && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Payment Screenshot</p>
                    <img 
                      src={purchase.payment_screenshot} 
                      alt="Payment confirmation" 
                      className="rounded-lg border border-gray-200 dark:border-zinc-700 max-h-48 object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}