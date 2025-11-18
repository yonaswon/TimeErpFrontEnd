// components/OrderContainerCard.tsx
import { useState } from 'react';
import { Package, User, MapPin, Phone, Calendar, FileText, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { OrderContainerDetailOverlay } from  './OrderContainerDetailOverlay'

interface Bom {
  id: number;
  material: number;
  amount: string;
  width: string | null;
  height: string | null;
  released: boolean;
  release_date: string | null;
  date: string;
}

interface Order {
  order_code: number;
  boms: Bom[];
  order_status: string;
  price: number;
  created_at: string;
  design_type: number;
  mockup?: any;
  cutting_files?: any[];
  releases?: any[];
  // Date fields for timeline
  pre_accepted_date: string;
  pre_confirmed_date: string | null;
  cnc_started_date: string | null;
  cnc_completed_date: string | null;
  assembly_started_date: string | null;
  assembly_completed_date: string | null;
  dandi_date: string | null;
  rem_accepted_date: string | null;
  rem_confirmed_date: string | null;
}

interface OrderContainer {
  id: number;
  orders: Order[];
  posted_by: {
    id: number;
    telegram_user_name: string;
    first_name: string;
  };
  client: string;
  contact: string;
  location: string;
  delivery_date: string;
  invoice: boolean;
  full_payment: number;
  special_requerment: string;
  advance_payment: string;
  remaining_payment: string;
  instalation_service: boolean;
  order_difficulty: string;
  note: string;
  delivery_service: boolean;
  created_at: string;
}

interface OrderContainerCardProps {
  container: OrderContainer;
}

const ORDER_STATUS_FLOW = [
  'PRE-ACCEPTED',
  'PRE-PAYMENT CONFIRMED', 
  'CNC-STARTED',
  'CNC-COMPLETED',
  'ASSEMBLY-STARTED',
  'ASSEMBLY-COMPLETED',
  'DANDI-STARTED',
  'REM-ACCEPTED',
  'REM-CONFIRMED'
];

export const OrderContainerCard = ({ container }: OrderContainerCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const totalOrders = container.orders.length;
  const totalPrice = container.orders.reduce((sum, order) => sum + order.price, 0);
  
  // Calculate overall progress based on all orders
  const getOverallProgress = () => {
    if (totalOrders === 0) return 0;
    
    const totalProgress = container.orders.reduce((sum, order) => {
      const statusIndex = ORDER_STATUS_FLOW.indexOf(order.order_status);
      return sum + (statusIndex >= 0 ? statusIndex : 0);
    }, 0);
    
    return Math.round((totalProgress / (ORDER_STATUS_FLOW.length - 1)) / totalOrders * 100);
  };

  const handleSendPDF = () => {
    console.log(`Generating PDF for Order Container ${container.id}`);
    console.log('Container data:', container);
    // TODO: Implement PDF generation
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

  const progress = getOverallProgress();

  return (
    <>
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-700 overflow-hidden hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Package className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {container.client}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Container #{container.id} • {totalOrders} order{totalOrders !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                ETB {totalPrice.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Value
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">@{container.posted_by.telegram_user_name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">{container.contact}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300 truncate">{container.location}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">
                {new Date(container.delivery_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Overall Progress
              </span>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Order Progress</h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {container.orders.filter(o => o.order_status === 'REM-CONFIRMED').length}/{totalOrders} completed
              </span>
            </div>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-3 w-0.5 h-full bg-gray-300 dark:bg-zinc-600"></div>
              
              {/* Status indicators */}
              <div className="space-y-4">
                {ORDER_STATUS_FLOW.map((status, index) => {
                  const ordersWithStatus = container.orders.filter(order => order.order_status === status);
                  const isActive = ordersWithStatus.length > 0;
                  
                  return (
                    <div key={status} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-300 dark:bg-zinc-600 text-gray-500 dark:text-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${
                          isActive 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {status.replace(/-/g, ' ')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {ordersWithStatus.length} order{ordersWithStatus.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>{showDetails ? 'Less' : 'More'} Details</span>
              </button>
              
              <button
                onClick={handleSendPDF}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Send PDF</span>
              </button>
            </div>
            
            <button
              onClick={() => setShowOverlay(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Details
            </button>
          </div>

          {/* Additional Details */}
          {showDetails && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Payment:</span>
                  <span className="ml-2">
                    ETB {parseFloat(container.advance_payment).toLocaleString()} advance • 
                    ETB {parseFloat(container.remaining_payment).toLocaleString()} remaining
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Difficulty:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    container.order_difficulty === 'SIMPLE' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : container.order_difficulty === 'MEDIUM'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {container.order_difficulty}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Services:</span>
                  <span className="ml-2">
                    {container.instalation_service && 'Installation'}
                    {container.instalation_service && container.delivery_service && ' • '}
                    {container.delivery_service && 'Delivery'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Invoice:</span>
                  <span className={`ml-2 ${container.invoice ? 'text-green-600' : 'text-gray-500'}`}>
                    {container.invoice ? 'Required' : 'Not Required'}
                  </span>
                </div>
              </div>
              
              {container.note && (
                <div className="mt-3">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Note:</span>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{container.note}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detail Overlay */}
      {showOverlay && (
        <OrderContainerDetailOverlay
          container={container}
          onClose={() => setShowOverlay(false)}
        />
      )}
    </>
  );
};