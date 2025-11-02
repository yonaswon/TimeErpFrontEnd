import { Purchase } from '@/types/purchase'
import { X, User, Calendar, DollarSign, FileText, Package, CreditCard, CheckCircle } from 'lucide-react'

interface PurchaseDetailsProps {
  purchase: Purchase
  onClose: () => void
  onConfirm: (purchase: Purchase) => void
}

export const PurchaseDetails = ({ purchase, onClose, onConfirm }: PurchaseDetailsProps) => {
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
    return `Birr ${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700 sticky top-0 bg-white dark:bg-zinc-900">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Purchase Request #{purchase.id}
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
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User size={18} className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Requested By</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {purchase.created_by.telegram_user_name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <CreditCard size={18} className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Payment To</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {purchase.to_account_name} ({purchase.to_account_number})
                  </p>
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
                  {formatAmount(purchase.total_amount)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Invoice</p>
                  <p className={`font-medium ${purchase.invoice ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {purchase.invoice ? 'Yes' : 'No'}
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
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {material.material.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {material.material.type_display} • Available: {material.material.available}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatAmount(material.total_price)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {material.amount} × Birr {material.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invoice Image if available */}
          {purchase.invoice_image && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText size={20} />
                Invoice Image
              </h3>
              <img 
                src={purchase.invoice_image} 
                alt="Invoice" 
                className="rounded-lg border border-gray-200 dark:border-zinc-700 max-h-48 object-cover"
              />
            </div>
          )}
        </div>

        {/* Footer with Confirm Button */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-zinc-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onConfirm(purchase)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <CheckCircle size={16} />
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  )
}