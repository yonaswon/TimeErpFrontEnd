// PaymentDetailOverlay.tsx
import { X, User, DollarSign, MapPin, Calendar, FileText, CreditCard, Clock, Mail, Building, Package, Box } from 'lucide-react';
import { Payment } from '@/types/finance';

interface PaymentDetailOverlayProps {
  payment: Payment;
  onClose: () => void;
  onConfirm: (paymentId: number) => void;
  isConfirming?: boolean;
}

export const PaymentDetailOverlay = ({ payment, onClose, onConfirm, isConfirming }: PaymentDetailOverlayProps) => {
  const container = payment.order_container;
  const isPending = payment.status === 'P';
  const isCashPayment = payment.method === 'CASH';
  const showConfirmButton = isPending && !isCashPayment;
  const isSalesPayment = payment.reason === 'SALES';

  const getReasonDisplay = (reason: string) => {
    const reasonMap: { [key: string]: string } = {
      'PRE': 'Pre-Payment',
      'REM': 'Remaining Payment',
      'FULL': 'Full Payment',
      'SALES': 'Product Sales'
    };
    return reasonMap[reason] || reason;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Payment Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            disabled={isConfirming}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Payment Overview */}
          <Section title="Payment Overview">
            <InfoRow 
              icon={DollarSign} 
              label="Amount" 
              value={`$${payment.amount}`} 
            />
            <InfoRow 
              icon={CreditCard} 
              label="Method" 
              value={payment.method} 
            />
            <InfoRow 
              icon={FileText} 
              label="Reason" 
              value={getReasonDisplay(payment.reason)} 
            />
            <InfoRow 
              icon={Clock} 
              label="Status" 
              value={
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  payment.status === 'P' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {payment.status === 'P' ? 'Pending' : 'Confirmed'}
                </span>
              } 
            />
            <InfoRow 
              icon={Building} 
              label="Wallet" 
              value={payment.wallet.name} 
            />
            <InfoRow 
              icon={FileText} 
              label="Invoice Required" 
              value={payment.invoice ? 'Yes' : 'No'} 
            />
          </Section>

          {/* Client Information - Only for order container payments */}
          {container && (
            <Section title="Client Information">
              <InfoRow icon={User} label="Client" value={container.client} />
              <InfoRow icon={Mail} label="Contact" value={container.contact} />
              <InfoRow icon={MapPin} label="Location" value={container.location} />
            </Section>
          )}

          {/* Order Details - Only for order container payments */}
          {container && (
            <Section title="Order Details">
              <InfoRow 
                icon={Calendar} 
                label="Delivery Date" 
                value={new Date(container.delivery_date).toLocaleDateString()} 
              />
              <InfoRow 
                icon={DollarSign} 
                label="Full Payment" 
                value={`$${container.full_payment}`} 
              />
              <InfoRow 
                icon={DollarSign} 
                label="Advance Paid" 
                value={`$${payment.amount}`} 
              />
              <InfoRow 
                icon={DollarSign} 
                label="Remaining" 
                value={`$${container.remaining_payment}`} 
              />
              <InfoRow 
                icon={FileText} 
                label="Order Difficulty" 
                value={container.order_difficulty} 
              />
            </Section>
          )}

          {/* Sales Information - Only for product sales */}
          {isSalesPayment && payment.material_sales_recored && (
            <Section title="Sales Information">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Released Materials:</span>
                </div>
                {payment.material_sales_recored.release.map((releaseItem:any, index:any) => (
                  <div key={releaseItem.id} className="bg-gray-50 dark:bg-zinc-700 rounded-lg p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Material:</span> {releaseItem.material.name}
                      </div>
                      <div>
                        <span className="font-medium">Amount:</span> {releaseItem.amount}
                      </div>
                      <div>
                        <span className="font-medium">Inventory:</span> {releaseItem.inventory.name}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {new Date(releaseItem.date).toLocaleDateString()}
                      </div>
                      {releaseItem.each_areal_material && releaseItem.each_areal_material.length > 0 && (
                        <div className="col-span-2">
                          <span className="font-medium">Areal Materials:</span>
                          <div className="mt-1 space-y-1">
                            {releaseItem.each_areal_material.map((arealMaterial:any) => (
                              <div key={arealMaterial.id} className="text-xs bg-white dark:bg-zinc-600 p-2 rounded">
                                Code: {arealMaterial.code} | 
                                Size: {arealMaterial.current_width}x{arealMaterial.current_height} | 
                                Status: {arealMaterial.started ? (arealMaterial.finished ? 'Finished' : 'Started') : 'Unstarted'}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Services - Only for order container payments */}
          {container && (
            <Section title="Services">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    container.instalation_service ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-sm">Installation Service</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    container.delivery_service ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-sm">Delivery Service</span>
                </div>
              </div>
            </Section>
          )}

          {/* Special Requirements & Notes */}
          {container?.special_requerment && (
            <Section title="Special Requirements">
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {container.special_requerment}
              </p>
            </Section>
          )}

          {container?.note && (
            <Section title="Container Note">
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {container.note}
              </p>
            </Section>
          )}

          {payment.note && (
            <Section title="Payment Note">
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {payment.note}
              </p>
            </Section>
          )}

          {/* Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {payment.invoice_image && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Invoice Image</h4>
                <img
                  src={payment.invoice_image}
                  alt="Invoice"
                  className="w-full max-w-md h-64 object-contain rounded-lg border border-gray-300 bg-gray-50"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {payment.confirmation_image && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Confirmation Image</h4>
                <img
                  src={payment.confirmation_image}
                  alt="Payment confirmation"
                  className="w-full max-w-md h-64 object-contain rounded-lg border border-gray-300 bg-gray-50"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-6 border-t border-gray-200 dark:border-zinc-700">
          <button
            onClick={onClose}
            disabled={isConfirming}
            className={`px-6 py-2 rounded-lg transition-colors ${
              isConfirming
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700'
            }`}
          >
            Close
          </button>
          {showConfirmButton && (
            <button
              onClick={() => onConfirm(payment.id)}
              disabled={isConfirming}
              className={`px-6 py-2 text-white rounded-lg transition-colors flex items-center justify-center min-w-[140px] ${
                isConfirming
                  ? 'bg-green-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isConfirming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Confirming...
                </>
              ) : (
                'Confirm Payment'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">{title}</h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: any }) => (
  <div className="flex items-start space-x-3">
    <Icon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32 flex-shrink-0">
      {label}:
    </span>
    <span className="text-sm text-gray-900 dark:text-white break-words flex-1">
      {value}
    </span>
  </div>
);