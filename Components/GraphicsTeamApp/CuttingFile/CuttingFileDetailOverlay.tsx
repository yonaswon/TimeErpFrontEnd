// CuttingFileDetailOverlay.tsx
import { X, Download, Package, Ruler, Calendar, User, DollarSign, Clock, Play, CheckCircle, UserCheck } from 'lucide-react';
import { CuttingFile } from '@/types/cutting';

interface CuttingFileDetailOverlayProps {
  file: CuttingFile;
  onClose: () => void;
  onDownload: (fileUrl: string, fileName: string) => void;
}

export const CuttingFileDetailOverlay = ({ file, onClose, onDownload }: CuttingFileDetailOverlayProps) => {
  const fileName = file.crv3d.split('/').pop() || 'file.crv3d';

  const handleDownload = () => {
    onDownload(file.crv3d, fileName);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'NOT-ASSIGNED': { color: 'bg-gray-100 text-gray-800', label: 'Not Assigned' },
      'ASSIGNED': { color: 'bg-blue-100 text-blue-800', label: 'Assigned' },
      'STARTED': { color: 'bg-yellow-100 text-yellow-800', label: 'Started' },
      'COMPLATED': { color: 'bg-green-100 text-green-800', label: 'Completed' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['NOT-ASSIGNED'];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Cutting File Details
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {fileName}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download CRV3D</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Assignment Section */}
          <Section title="Production Status">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                  {getStatusBadge(file.status)}
                </div>
                
                {file.assigned_to && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Assigned To:</span>
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        @{file.assigned_to.telegram_user_name}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {file.start_date && (
                  <div className="flex items-center space-x-2">
                    <Play className="w-4 h-4 text-yellow-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Started</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDateTime(file.start_date)}
                      </div>
                    </div>
                  </div>
                )}
                
                {file.complate_date && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Completed</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDateTime(file.complate_date)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule Information */}
            {(file.schedule_start_date || file.schedule_complate_date) && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Schedule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {file.schedule_start_date && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-medium text-blue-800 dark:text-blue-200">Scheduled Start</div>
                        <div className="text-blue-600 dark:text-blue-300">
                          {formatDateTime(file.schedule_start_date)}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {file.schedule_complate_date && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-medium text-blue-800 dark:text-blue-200">Scheduled Completion</div>
                        <div className="text-blue-600 dark:text-blue-300">
                          {formatDateTime(file.schedule_complate_date)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Section>

          {/* Preview Image */}
          <Section title="Design Preview">
            <div className="bg-gray-50 dark:bg-zinc-700 rounded-lg p-4">
              <img
                src={file.image}
                alt="Cutting preview"
                className="w-full max-w-2xl h-64 object-contain mx-auto"
              />
            </div>
          </Section>

          {/* Material Information */}
          <Section title="Material Information">
            <InfoRow label="Material" value={file.on.material_name} />
            <InfoRow label="Code" value={file.on.code.toString()} />
            <InfoRow label="Inventory" value={file.on.inventory_name} />
            <InfoRow 
              label="Size" 
              value={`${file.on.current_width} x ${file.on.current_height}`} 
            />
            <InfoRow 
              label="Status" 
              value={
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  file.on.finished 
                    ? 'bg-red-100 text-red-800'
                    : file.on.started
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {file.on.finished ? 'Finished' : file.on.started ? 'In Progress' : 'Available'}
                </span>
              } 
            />
          </Section>

          {/* Connected Orders */}
          <Section title={`Connected Orders (${file.orders.length})`}>
            <div className="space-y-4">
              {file.orders.map((order) => (
                <OrderCard key={order.order_code} order={order} />
              ))}
            </div>
          </Section>

          {/* File Information */}
          <Section title="File Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="File Name" value={fileName} />
              <InfoRow label="Created Date" value={new Date(file.date).toLocaleDateString()} />
              <InfoRow label="Total Orders" value={file.orders.length.toString()} />
              <InfoRow label="File Status" value={getStatusBadge(file.status)} />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{title}</h3>
    {children}
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: any }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-700 last:border-b-0">
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
    <span className="text-sm text-gray-900 dark:text-white">{value}</span>
  </div>
);

const OrderCard = ({ order }: { order: any }) => {
  const bom = order.boms[0];
  
  return (
    <div className="bg-gray-50 dark:bg-zinc-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-gray-900 dark:text-white">
            ORD-{order.order_code}
          </span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          order.order_status === 'PRE-ACCEPTED' 
            ? 'bg-yellow-100 text-yellow-800'
            : order.order_status === 'PRE-CONFIRMED'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {order.order_status.replace('-', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <Ruler className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600 dark:text-gray-400">Size:</span>
          <span className="text-gray-900 dark:text-white">
            {bom.width} x {bom.height}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600 dark:text-gray-400">Price:</span>
          <span className="text-gray-900 dark:text-white">
            ${order.price || '0'}
          </span>
        </div>
      </div>

      {order.mockup?.mockup_image && (
        <div className="mt-3">
          <img
            src={order.mockup.mockup_image}
            alt="Order mockup"
            className="w-32 h-32 object-cover rounded-lg border border-gray-300"
          />
        </div>
      )}
    </div>
  );
};