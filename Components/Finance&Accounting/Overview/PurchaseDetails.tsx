'use client'

import { Purchase } from '@/types/finance'
import { X, User, Calendar, DollarSign, FileText, CheckCircle, XCircle, Clock, Building, CreditCard } from 'lucide-react'

interface PurchaseDetailsProps {
  purchase: Purchase
  onClose: () => void
}

export const PurchaseDetails = ({ purchase, onClose }: PurchaseDetailsProps) => {
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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'D':
        return { text: 'Completed', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' }
      case 'P':
        return { text: 'In Progress', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' }
      case 'C':
        return { text: 'Cancelled', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' }
      default:
        return { text: 'Unknown', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/30' }
    }
  }

  const getRequestStatusInfo = (requestStatus: string) => {
    switch (requestStatus) {
      case 'C':
        return { text: 'Confirmed', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle }
      case 'R':
        return { text: 'Rejected', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: XCircle }
      case 'S':
        return { text: 'Payment Request Sent', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: Clock }
      case 'NS':
        return { text: 'Not Sent', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/30', icon: Clock }
      default:
        return { text: 'Unknown', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/30', icon: Clock }
    }
  }

  const statusInfo = getStatusInfo(purchase.status)
  const requestStatusInfo = getRequestStatusInfo(purchase.request_status)
  const RequestStatusIcon = requestStatusInfo.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700 sticky top-0 bg-white dark:bg-zinc-900 z-10">
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
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${statusInfo.bg}`}>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${statusInfo.color.replace('text-', 'bg-')}`} />
                <span className={`font-medium ${statusInfo.color}`}>Status</span>
              </div>
              <div className={`text-lg font-semibold mt-1 ${statusInfo.color}`}>
                {statusInfo.text}
              </div>
            </div>

            <div className={`p-4 rounded-lg ${requestStatusInfo.bg}`}>
              <div className="flex items-center gap-2">
                <RequestStatusIcon size={16} className={requestStatusInfo.color} />
                <span className={`font-medium ${requestStatusInfo.color}`}>Request Status</span>
              </div>
              <div className={`text-lg font-semibold mt-1 ${requestStatusInfo.color}`}>
                {requestStatusInfo.text}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <DollarSign size={16} />
                <span className="font-medium">Total Amount</span>
              </div>
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400 mt-1">
                {formatAmount(purchase.total_amount)}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Purchase Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User size={16} className="text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Created By</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {purchase.created_by.telegram_user_name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building size={16} className="text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">From Wallet</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {purchase.from_wallet === 'A' ? 'Admin' : 'Finance'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Invoice</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {purchase.invoice ? 'With Invoice' : 'No Invoice'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CreditCard size={16} className="text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">To Account Name</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {purchase.to_account_name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CreditCard size={16} className="text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">To Account Number</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {purchase.to_account_number}
                    </div>
                  </div>
                </div>

                {purchase.from_account && (
                  <div className="flex items-center gap-3">
                    <Building size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">From Account</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {purchase.from_account.account_name} ({purchase.from_account.bank})
                      </div>
                    </div>
                  </div>
                )}

                {purchase.payment_code && (
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Payment Code</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {purchase.payment_code}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Materials List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Materials ({purchase.each_material_purchase.length})
            </h3>
            
            <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Material
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Price
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  {purchase.each_material_purchase.map((material) => (
                    <tr key={material.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div>
                          <div className="font-medium">{material.material.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {material.material.type_display}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {material.amount} units
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        Birr {parseFloat(material.price).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                        Birr {parseFloat(material.total_price).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Images Section */}
          {(purchase.invoice_image || purchase.payment_screenshot) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Attachments</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {purchase.invoice_image && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Invoice Image</h4>
                    <img 
                      src={purchase.invoice_image} 
                      alt="Invoice" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-zinc-700"
                    />
                  </div>
                )}
                
                {purchase.payment_screenshot && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Screenshot</h4>
                    <img 
                      src={purchase.payment_screenshot} 
                      alt="Payment Screenshot" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-zinc-700"
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