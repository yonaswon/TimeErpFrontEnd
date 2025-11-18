
// components/OrderContainerDetailOverlay.tsx
import { X, Package, User, MapPin, Phone, Calendar, FileText, Ruler, Box } from 'lucide-react';

interface OrderContainerDetailOverlayProps {
  container: any; // Using any for simplicity, you can type this properly
  onClose: () => void;
}

export const OrderContainerDetailOverlay = ({ container, onClose }: OrderContainerDetailOverlayProps) => {
  const getMaterialIcon = (type: string) => {
    return type === 'L' ? <Ruler className="w-4 h-4" /> : <Box className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'PRE-ACCEPTED': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'PRE-PAYMENT CONFIRMED': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'CNC-STARTED': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'CNC-COMPLETED': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'ASSEMBLY-STARTED': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      'ASSEMBLY-COMPLETED': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'DANDI-STARTED': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
      'REM-ACCEPTED': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'REM-CONFIRMED': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {container.client} - Container #{container.id}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {container.orders.length} order{container.orders.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Client Details</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{container.client}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Client</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{container.contact}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Contact</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{container.location}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Location</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {new Date(container.delivery_date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Delivery Date</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Value:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ETB {container.orders.reduce((sum: number, order: any) => sum + order.price, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Advance Payment:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ETB {parseFloat(container.advance_payment).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Remaining Payment:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ETB {parseFloat(container.remaining_payment).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(container.order_difficulty)}`}>
                    {container.order_difficulty}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">Orders</h3>
            {container.orders.map((order: any) => (
              <div key={order.order_code} className="border border-gray-200 dark:border-zinc-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Order #{order.order_code}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      ETB {order.price.toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.order_status)}`}>
                    {order.order_status.replace(/-/g, ' ')}
                  </span>
                </div>

                {/* BOMs */}
                {order.boms && order.boms.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Materials</h5>
                    <div className="space-y-2">
                      {order.boms.map((bom: any) => (
                        <div key={bom.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">
                            Material #{bom.material}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {bom.amount} {bom.width && bom.height ? `${bom.width}m x ${bom.height}m` : 'units'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cutting Files */}
                {order.cutting_files && order.cutting_files.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Cutting Files</h5>
                    <div className="space-y-2">
                      {order.cutting_files.map((file: any) => (
                        <div key={file.id} className="text-sm text-gray-600 dark:text-gray-400">
                          {file.status} - {new Date(file.date).toLocaleDateString()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Special Requirements & Notes */}
          {(container.special_requerment || container.note) && (
            <div className="mt-6 space-y-4">
              {container.special_requerment && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Special Requirements</h4>
                  <p className="text-gray-700 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    {container.special_requerment}
                  </p>
                </div>
              )}
              {container.note && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Notes</h4>
                  <p className="text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    {container.note}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};