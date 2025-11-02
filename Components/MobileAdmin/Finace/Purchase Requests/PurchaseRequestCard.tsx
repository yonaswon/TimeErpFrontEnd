import { Purchase } from '@/types/purchase'
import { User, Calendar, FileText, DollarSign, Eye, CheckCircle } from 'lucide-react'

interface PurchaseRequestCardProps {
  purchase: Purchase
  onViewDetails: (purchase: Purchase) => void
  onConfirm: (purchase: Purchase) => void
}

export const PurchaseRequestCard = ({ purchase, onViewDetails, onConfirm }: PurchaseRequestCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatAmount = (amount: string) => {
    return `Birr ${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Request #{purchase.id}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            From: {purchase.created_by.telegram_user_name}
          </p>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          purchase.invoice 
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
            : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
        }`}>
          {purchase.invoice ? 'With Invoice' : 'No Invoice'}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <User size={14} />
          <span>To: {purchase.to_account_name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <DollarSign size={14} />
          <span className="font-semibold text-green-600 dark:text-green-400">
            {formatAmount(purchase.total_amount)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar size={14} />
          <span>{formatDate(purchase.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <FileText size={14} />
          <span>{purchase.each_material_purchase.length} material(s)</span>
        </div>
      </div>

      {/* Materials Preview */}
      <div className="flex flex-wrap gap-1 mb-3">
        {purchase.each_material_purchase.slice(0, 2).map((material) => (
          <span 
            key={material.id}
            className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded"
          >
            {material.material.name}
          </span>
        ))}
        {purchase.each_material_purchase.length > 2 && (
          <span className="px-2 py-1 bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 text-xs rounded">
            +{purchase.each_material_purchase.length - 2} more
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-zinc-700">
        <button
          onClick={() => onViewDetails(purchase)}
          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
        >
          <Eye size={14} />
          Details
        </button>
        <button
          onClick={() => onConfirm(purchase)}
          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
        >
          <CheckCircle size={14} />
          Confirm
        </button>
      </div>
    </div>
  )
}