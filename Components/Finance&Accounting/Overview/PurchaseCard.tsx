import { Purchase } from '@/types/finance'
import { User, FileText, Calendar, DollarSign, Eye } from 'lucide-react'

interface PurchaseCardProps {
  purchase: Purchase
  onClick: () => void
}

export const PurchaseCard = ({ purchase, onClick }: PurchaseCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const getStatusBadge = (status: string, requestStatus: string) => {
    if (status === 'D') {
      return <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full">Completed</span>
    }
    if (status === 'P' && requestStatus === 'S') {
      return <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded-full">Pending Admin</span>
    }
    if (status === 'P') {
      return <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">In Progress</span>
    }
    return <span className="px-2 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 text-xs rounded-full">Unknown</span>
  }

  const getInvoiceBadge = (invoice: boolean) => {
    return invoice 
      ? <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs rounded-full">With Invoice</span>
      : <span className="px-2 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 text-xs rounded-full">No Invoice</span>
  }

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4 hover:shadow-md transition-all cursor-pointer hover:border-blue-300 dark:hover:border-blue-600"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Purchase #{purchase.id}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            To: {purchase.to_account_name}
          </p>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(purchase.status, purchase.request_status)}
          {getInvoiceBadge(purchase.invoice)}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <User size={16} />
          <span>By: {purchase.created_by.telegram_user_name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <DollarSign size={16} />
          <span className="font-semibold text-green-600 dark:text-green-400">
            ${formatAmount(purchase.total_amount)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar size={16} />
          <span>{formatDate(purchase.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <FileText size={16} />
          <span>{purchase.each_material_purchase.length} material(s)</span>
        </div>
      </div>

      {/* Materials Preview */}
      <div className="flex flex-wrap gap-1 mb-3">
        {purchase.each_material_purchase.slice(0, 3).map((material) => (
          <span 
            key={material.id}
            className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded"
          >
            {material.material.name}
          </span>
        ))}
        {purchase.each_material_purchase.length > 3 && (
          <span className="px-2 py-1 bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 text-xs rounded">
            +{purchase.each_material_purchase.length - 3} more
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-zinc-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Account: {purchase.to_account_number}
        </div>
        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm">
          <Eye size={14} />
          <span>View Details</span>
        </div>
      </div>
    </div>
  )
}