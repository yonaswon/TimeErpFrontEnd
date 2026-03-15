import { Purchase } from '@/types/purchase'
import { User, Calendar, FileText, CheckCircle, Package, CreditCard, Clock, Check } from 'lucide-react'

interface PurchaseRequestCardProps {
  purchase: Purchase
  onViewDetails: (purchase: Purchase) => void
  onConfirm: (purchase: Purchase) => void
  showConfirm?: boolean
}

export const PurchaseRequestCard = ({ purchase, onViewDetails, onConfirm, showConfirm = true }: PurchaseRequestCardProps) => {
  const getStatusColor = () => {
    if (purchase.request_status === 'C') {
      return {
        bg: "bg-[#2563EB]/10",
        text: "text-[#2563EB] dark:text-[#3B82F6]",
        dot: "bg-[#2563EB] dark:bg-[#3B82F6]",
        label: "In Progress",
      };
    }
    return {
      bg: "bg-[#F59E0B]/10",
      text: "text-[#F59E0B]",
      dot: "bg-[#F59E0B]",
      label: "Requested",
    };
  };

  const statusInfo = getStatusColor();

  return (
    <div
      className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] overflow-hidden transition-all duration-200 active:scale-[0.99]"
      onClick={() => onViewDetails(purchase)}
    >
      {/* Header — Amount + Status */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xl font-bold text-[#111827] dark:text-[#F1F5F9]">
                {parseFloat(purchase.total_amount).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} Birr
              </span>
              <span
                className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-xs font-bold ${statusInfo.bg} ${statusInfo.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                <span>{statusInfo.label}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-[#6B7280] dark:text-[#94A3B8]">
                REQ-{purchase.id}
              </span>
              <span className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                • {new Date(purchase.date).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Invoice Badge */}
          {purchase.invoice && (
            <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
              Invoice
            </span>
          )}
        </div>

        {/* Details Section */}
        <div className="space-y-2.5">
          {/* Requested By */}
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F9FAFB] dark:bg-[#0F172A] flex items-center justify-center flex-shrink-0 border border-[#E5E7EB] dark:border-[#334155]">
              <User className="w-4 h-4 text-[#6B7280] dark:text-[#94A3B8]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mb-0.5">Requested By</p>
              <p className="text-sm font-semibold text-[#111827] dark:text-[#F1F5F9] truncate">
                {purchase.created_by.first_name || purchase.created_by.telegram_user_name}
              </p>
            </div>
          </div>

          {/* Payment To */}
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F9FAFB] dark:bg-[#0F172A] flex items-center justify-center flex-shrink-0 border border-[#E5E7EB] dark:border-[#334155]">
              <CreditCard className="w-4 h-4 text-[#6B7280] dark:text-[#94A3B8]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mb-0.5">Payment To</p>
              <p className="text-sm font-semibold text-[#111827] dark:text-[#F1F5F9] truncate">
                {purchase.to_account_name}
              </p>
            </div>
          </div>
        </div>

        {/* Materials Preview */}
        {purchase.each_material_purchase && purchase.each_material_purchase.length > 0 && (
          <div className="mt-3 bg-[#F9FAFB] dark:bg-[#0F172A] rounded-lg p-2.5 border border-[#E5E7EB] dark:border-[#334155]">
            <div className="flex items-center space-x-2 mb-2">
              <Package className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#94A3B8]" />
              <p className="text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider">
                Materials ({purchase.each_material_purchase.length})
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {purchase.each_material_purchase.slice(0, 3).map((material) => (
                <span
                  key={material.id}
                  className="px-2 py-1 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] text-[#111827] dark:text-[#F1F5F9] text-xs rounded-md shadow-sm"
                >
                  {material.material.name}
                </span>
              ))}
              {purchase.each_material_purchase.length > 3 && (
                <span className="px-2 py-1 bg-[#F3F4F6] dark:bg-[#334155] text-[#6B7280] dark:text-[#94A3B8] text-xs font-medium rounded-md">
                  +{purchase.each_material_purchase.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      {showConfirm && (
        <div className="flex items-center border-t border-[#E5E7EB] dark:border-[#334155]">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onConfirm(purchase)
            }}
            className="flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-semibold transition-colors text-[#16A34A] dark:text-[#22C55E] active:bg-green-50 dark:active:bg-green-900/10"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Confirm Purchase</span>
          </button>
        </div>
      )}
    </div>
  )
}