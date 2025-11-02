import { Purchase } from '@/types/finance'
import { User, FileText, Calendar, DollarSign, Eye, CheckCircle, XCircle, Clock, Upload } from 'lucide-react'

interface PurchaseCardProps {
  purchase: Purchase
  onViewDetails: () => void
  onFinishPurchase: (purchase: Purchase) => void
}

export const PurchaseCard = ({ purchase, onViewDetails, onFinishPurchase }: PurchaseCardProps) => {
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
    return `Birr ${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  const getPaymentCondition = () => {
    // If created by Finance and has payment screenshot, it's paid
    if (purchase.payment_screenshot) {
      return {
        text: 'Paid',
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-100 dark:bg-green-900/30',
        icon: CheckCircle
      }
    }

    // Check request_status for different states
    switch (purchase.request_status) {
      case 'C':
        return {
          text: 'Confirmed',
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-100 dark:bg-green-900/30',
          icon: CheckCircle
        }
      case 'R':
        return {
          text: 'Rejected',
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-100 dark:bg-red-900/30',
          icon: XCircle
        }
      case 'S':
        return {
          text: 'Payment Request Sent',
          color: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          icon: Clock
        }
      case 'NS':
      default:
        return {
          text: 'Not Sent',
          color: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gray-100 dark:bg-gray-900/30',
          icon: Clock
        }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'D':
        return <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full">Completed</span>
      case 'P':
        return <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">In Progress</span>
      case 'C':
        return <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs rounded-full">Cancelled</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 text-xs rounded-full">Unknown</span>
    }
  }

  const getInvoiceBadge = (invoice: boolean) => {
    return invoice 
      ? <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs rounded-full">With Invoice</span>
      : <span className="px-2 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 text-xs rounded-full">No Invoice</span>
  }

  const canFinishPurchase = () => {
    // Can finish if status is 'P' (In Progress) and payment is confirmed/paid
    return purchase.status === 'P' && (purchase.request_status === 'C' || purchase.payment_screenshot)
  }

  const paymentCondition = getPaymentCondition()
  const PaymentIcon = paymentCondition.icon

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4 hover:shadow-md transition-all">
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
          {getStatusBadge(purchase.status)}
          {getInvoiceBadge(purchase.invoice)}
        </div>
      </div>

      {/* Payment Condition */}
      <div className={`flex items-center gap-2 p-2 rounded-lg mb-3 ${paymentCondition.bg}`}>
        <PaymentIcon size={14} className={paymentCondition.color} />
        <span className={`text-xs font-medium ${paymentCondition.color}`}>
          {paymentCondition.text}
        </span>
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
            {formatAmount(purchase.total_amount)}
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
        
        <div className="flex items-center gap-2">
          <button
            onClick={onViewDetails}
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm hover:text-blue-700 dark:hover:text-blue-300"
          >
            <Eye size={14} />
            <span>Details</span>
          </button>

          {canFinishPurchase() && (
            <button
              onClick={() => onFinishPurchase(purchase)}
              className="flex items-center gap-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
            >
              <Upload size={14} />
              <span>Finish</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}