import { Purchase } from '@/types/purchase'
import {
  X,
  User,
  Calendar,
  DollarSign,
  FileText,
  Package,
  CreditCard,
  CheckCircle,
  ImageIcon,
  Download
} from 'lucide-react'
import { useState } from 'react'
import { downloadFileInTelegram } from '@/utils/telegramdownloads'

interface PurchaseDetailsProps {
  purchase: Purchase
  onClose: () => void
  onConfirm: (purchase: Purchase) => void
  showConfirm?: boolean
}

export const PurchaseDetails = ({ purchase, onClose, onConfirm, showConfirm = true }: PurchaseDetailsProps) => {
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  const handleDownload = async (url: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await downloadFileInTelegram(url, `purchase-document-${purchase.id}.jpg`)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const statusColor = purchase.request_status === 'C'
    ? "bg-[#2563EB]/10 text-[#2563EB] dark:text-[#3B82F6]"
    : "bg-[#F59E0B]/10 text-[#F59E0B]";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-[#F9FAFB] dark:bg-[#0F172A] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1E293B] border-b border-[#E5E7EB] dark:border-[#334155]">
          <div>
            <h2 className="text-lg font-bold text-[#111827] dark:text-[#F1F5F9]">
              Purchase Request
            </h2>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
              REQ-{purchase.id} · {new Date(purchase.date).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#F9FAFB] dark:bg-[#0F172A] flex items-center justify-center hover:bg-[#E5E7EB] dark:hover:bg-[#334155] transition-colors"
          >
            <X className="w-4 h-4 text-[#6B7280]" />
          </button>
        </div>

        {/* ─── Content ─── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Amount Card */}
          <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-[#E5E7EB] dark:border-[#334155]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mb-0.5">
                  Total Amount
                </p>
                <p className="text-2xl font-bold text-[#111827] dark:text-[#F1F5F9]">
                  {parseFloat(purchase.total_amount).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} Birr
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusColor}`}>
                {purchase.request_status === 'C' ? "In Progress" : "Requested"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-semibold ${purchase.invoice
                ? 'bg-[#16A34A]/10 text-[#16A34A] dark:text-[#22C55E]'
                : 'bg-[#F9FAFB] dark:bg-[#0F172A] text-[#6B7280] dark:text-[#94A3B8]'
                }`}>
                <FileText className="w-3 h-3" />
                <span>{purchase.invoice ? 'With Invoice' : 'No Invoice'}</span>
              </span>
            </div>
          </div>

          {/* ─── Details Section ─── */}
          <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-[#E5E7EB] dark:border-[#334155]">
            <div className="flex items-center space-x-2 mb-3">
              <User className="w-4 h-4 text-[#6B7280] dark:text-[#94A3B8]" />
              <h3 className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9] uppercase tracking-wider">
                Request Details
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Requested By</p>
                  <p className="text-sm font-semibold text-[#111827] dark:text-[#F1F5F9]">
                    {purchase.created_by.first_name || purchase.created_by.telegram_user_name}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Payment To</p>
                  <p className="text-sm font-semibold text-[#111827] dark:text-[#F1F5F9]">
                    {purchase.to_account_name}
                  </p>
                  <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] font-mono mt-0.5">
                    {purchase.to_account_number}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Materials ─── */}
          <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-[#E5E7EB] dark:border-[#334155]">
            <div className="flex items-center space-x-2 mb-3">
              <Package className="w-4 h-4 text-[#6B7280] dark:text-[#94A3B8]" />
              <h3 className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9] uppercase tracking-wider">
                Materials ({purchase.each_material_purchase.length})
              </h3>
            </div>

            <div className="space-y-2">
              {purchase.each_material_purchase.map((material) => (
                <div key={material.id} className="flex flex-col space-y-2 bg-[#F9FAFB] dark:bg-[#0F172A] rounded-xl p-3 border border-[#E5E7EB] dark:border-[#334155]">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-[#111827] dark:text-[#F1F5F9]">
                      {material.material.name}
                    </p>
                    <p className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9] ml-2 shrink-0">
                      {parseFloat(material.total_price).toLocaleString('en-US')} Birr
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                    <div className="flex items-center space-x-2 text-xs text-[#6B7280] dark:text-[#94A3B8]">
                      <span>{material.material.type_display}</span>
                      <span>•</span>
                      <span>Avail: {material.material.available}</span>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 bg-white dark:bg-[#1E293B] rounded-md border border-[#E5E7EB] dark:border-[#334155]">
                      {material.amount} × {parseFloat(material.price).toLocaleString()} Birr
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Documents ─── */}
          {(purchase.invoice_image || purchase.payment_screenshot) && (
            <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-[#E5E7EB] dark:border-[#334155]">
              <div className="flex items-center space-x-2 mb-3">
                <ImageIcon className="w-4 h-4 text-[#6B7280] dark:text-[#94A3B8]" />
                <h3 className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9] uppercase tracking-wider">
                  Documents
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {purchase.invoice_image && (
                  <div
                    className="space-y-1.5 cursor-pointer group relative block overflow-hidden rounded-xl border border-[#E5E7EB] dark:border-[#334155]"
                    onClick={() => setExpandedImage(purchase.invoice_image!)}
                  >
                    <img
                      src={purchase.invoice_image}
                      alt="Invoice"
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-xs text-white font-medium">Invoice</p>
                    </div>
                  </div>
                )}

                {purchase.payment_screenshot && (
                  <div
                    className="space-y-1.5 cursor-pointer group relative block overflow-hidden rounded-xl border border-[#E5E7EB] dark:border-[#334155]"
                    onClick={() => setExpandedImage(purchase.payment_screenshot!)}
                  >
                    <img
                      src={purchase.payment_screenshot}
                      alt="Payment Screenshot"
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-xs text-white font-medium">Payment</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="p-4 bg-white dark:bg-[#1E293B] border-t border-[#E5E7EB] dark:border-[#334155] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#6B7280] dark:text-[#94A3B8] bg-[#F9FAFB] dark:bg-[#0F172A] hover:bg-[#E5E7EB] dark:hover:bg-[#334155] transition-colors border border-[#E5E7EB] dark:border-[#334155]"
          >
            Close
          </button>
          {showConfirm && purchase.request_status === 'S' && (
            <button
              onClick={() => onConfirm(purchase)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center space-x-2 transition-colors bg-[#16A34A] hover:bg-[#15803D] active:bg-[#166534]"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Expanded Image Viewer ─── */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-4 transition-all"
          onClick={() => setExpandedImage(null)}
        >
          {/* Top Actions */}
          <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-end space-x-2 bg-gradient-to-b from-black/50 to-transparent">
            <button
              onClick={(e) => handleDownload(expandedImage, e)}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              title="Download Image"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setExpandedImage(null)}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <img
            src={expandedImage}
            alt="Expanded view"
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}