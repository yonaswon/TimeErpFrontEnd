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
    // Colors updated based on design guide:
    // BG: #F9FAFB / #0F172A (Default)
    // Warning (Started): #F59E0B / #FBBF24
    // Success (Completed): #16A34A / #22C55E
    // Primary (Assigned): #2563EB / #3B82F6

    const statusConfig = {
      'NOT-ASSIGNED': { bg: 'bg-[#F9FAFB] dark:bg-[#1E293B]', text: 'text-[#6B7280] dark:text-[#94A3B8]', border: 'border-[#E5E7EB] dark:border-[#334155]', label: 'Not Assigned' },
      'ASSIGNED': { bg: 'bg-[#EFF6FF] dark:bg-blue-900/30', text: 'text-[#2563EB] dark:text-[#3B82F6]', border: 'border-blue-200 dark:border-blue-800/50', label: 'Assigned' },
      'STARTED': { bg: 'bg-[#FEF3C7] dark:bg-amber-900/30', text: 'text-[#F59E0B] dark:text-[#FBBF24]', border: 'border-amber-200 dark:border-amber-800/50', label: 'Started' },
      'COMPLATED': { bg: 'bg-[#DCFCE7] dark:bg-green-900/30', text: 'text-[#16A34A] dark:text-[#22C55E]', border: 'border-green-200 dark:border-green-800/50', label: 'Completed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['NOT-ASSIGNED'];
    return (
      <span className={`px-3 py-1 rounded-[8px] text-[14px] font-medium border ${config.bg} ${config.text} ${config.border}`}>
        {config.label}
      </span>
    );
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[#FFFFFF] dark:bg-[#0F172A] rounded-[12px] max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto relative flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#FFFFFF] dark:bg-[#0F172A] flex items-center justify-between p-[24px] border-b border-[#E5E7EB] dark:border-[#334155]">
          <div>
            <h2 className="text-[22px] font-semibold text-[#111827] dark:text-[#F1F5F9] leading-[1.2]">
              Cutting File Details
            </h2>
            <p className="text-[#6B7280] dark:text-[#94A3B8] text-[14px] mt-1">
              {fileName}
            </p>
          </div>
          <div className="flex items-center space-x-[16px]">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-[16px] py-[12px] bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[8px] hover:bg-[#1D4ED8] dark:hover:bg-[#60A5FA] transition-colors font-medium text-[16px]"
            >
              <Download className="w-[20px] h-[20px]" />
              <span className="hidden sm:inline">Download CRV3D</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] rounded-[8px] transition-colors"
            >
              <X className="w-[24px] h-[24px]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-[32px] space-y-[32px] bg-[#F9FAFB] dark:bg-[#0F172A]">
          {/* Status and Assignment Section */}
          <Section title="Production Status">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
              <div className="bg-[#FFFFFF] dark:bg-[#1E293B] p-[16px] rounded-[12px] border border-[#E5E7EB] dark:border-[#334155] space-y-[16px]">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#6B7280] dark:text-[#94A3B8]">Status</span>
                  {getStatusBadge(file.status)}
                </div>

                {file.assigned_to && (
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-medium text-[#6B7280] dark:text-[#94A3B8]">Assigned To</span>
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-[20px] h-[20px] text-[#16A34A] dark:text-[#22C55E]" />
                      <span className="text-[16px] font-medium text-[#111827] dark:text-[#F1F5F9]">
                        @{file.assigned_to.telegram_user_name}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-[#FFFFFF] dark:bg-[#1E293B] p-[16px] rounded-[12px] border border-[#E5E7EB] dark:border-[#334155] space-y-[16px]">
                {file.start_date && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#FEF3C7] dark:bg-amber-900/30 p-2 rounded-lg">
                      <Play className="w-[20px] h-[20px] text-[#F59E0B] dark:text-[#FBBF24]" />
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-[#6B7280] dark:text-[#94A3B8]">Started</div>
                      <div className="text-[16px] text-[#111827] dark:text-[#F1F5F9]">
                        {formatDateTime(file.start_date)}
                      </div>
                    </div>
                  </div>
                )}

                {file.complate_date && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#DCFCE7] dark:bg-green-900/30 p-2 rounded-lg">
                      <CheckCircle className="w-[20px] h-[20px] text-[#16A34A] dark:text-[#22C55E]" />
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-[#6B7280] dark:text-[#94A3B8]">Completed</div>
                      <div className="text-[16px] text-[#111827] dark:text-[#F1F5F9]">
                        {formatDateTime(file.complate_date)}
                      </div>
                    </div>
                  </div>
                )}

                {!file.start_date && !file.complate_date && (
                  <div className="text-[14px] text-[#6B7280] dark:text-[#94A3B8] italic">
                    No execution dates recorded yet
                  </div>
                )}
              </div>
            </div>

            {/* Schedule Information */}
            {(file.schedule_start_date || file.schedule_complate_date) && (
              <div className="mt-[16px] p-[16px] bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-[12px]">
                <h4 className="text-[18px] font-semibold text-[#111827] dark:text-[#F1F5F9] mb-[16px] leading-[1.2]">Schedule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                  {file.schedule_start_date && (
                    <div className="flex items-center space-x-3">
                      <div className="bg-[#EFF6FF] dark:bg-blue-900/30 p-2 rounded-lg">
                        <Clock className="w-[20px] h-[20px] text-[#2563EB] dark:text-[#3B82F6]" />
                      </div>
                      <div>
                        <div className="text-[14px] font-medium text-[#6B7280] dark:text-[#94A3B8]">Scheduled Start</div>
                        <div className="text-[16px] text-[#111827] dark:text-[#F1F5F9]">
                          {formatDateTime(file.schedule_start_date)}
                        </div>
                      </div>
                    </div>
                  )}

                  {file.schedule_complate_date && (
                    <div className="flex items-center space-x-3">
                      <div className="bg-[#EFF6FF] dark:bg-blue-900/30 p-2 rounded-lg">
                        <Clock className="w-[20px] h-[20px] text-[#2563EB] dark:text-[#3B82F6]" />
                      </div>
                      <div>
                        <div className="text-[14px] font-medium text-[#6B7280] dark:text-[#94A3B8]">Scheduled Completion</div>
                        <div className="text-[16px] text-[#111827] dark:text-[#F1F5F9]">
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
            <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-[12px] p-[16px]">
              <img
                src={file.image}
                alt="Cutting preview"
                className="w-full h-auto max-h-64 object-contain mx-auto rounded-[8px]"
              />
            </div>
          </Section>

          {/* Material Information */}
          <Section title="Material Information">
            <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-[12px] p-[16px]">
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
                  <span className={`px-2 py-1 rounded-[8px] text-[14px] font-medium ${file.on.finished
                    ? 'bg-[#FEF2F2] dark:bg-red-900/30 text-[#DC2626] dark:text-[#EF4444]'
                    : file.on.started
                      ? 'bg-[#FEF3C7] dark:bg-amber-900/30 text-[#F59E0B] dark:text-[#FBBF24]'
                      : 'bg-[#DCFCE7] dark:bg-green-900/30 text-[#16A34A] dark:text-[#22C55E]'
                    }`}>
                    {file.on.finished ? 'Finished' : file.on.started ? 'In Progress' : 'Available'}
                  </span>
                }
                isLast={true}
              />
            </div>
          </Section>

          {/* Connected Orders */}
          <Section title={`Connected Orders (${file.orders.length})`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
              {file.orders.map((order) => (
                <OrderCard key={order.order_code} order={order} />
              ))}
            </div>
          </Section>

          {/* File Information */}
          <Section title="File Information">
            <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-[12px] p-[16px]">
              <InfoRow label="File Name" value={fileName} />
              <InfoRow label="Created Date" value={new Date(file.date).toLocaleDateString()} />
              <InfoRow label="Total Orders" value={file.orders.length.toString()} />
              <InfoRow label="File Status" value={getStatusBadge(file.status)} isLast={true} />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="w-full">
    <h3 className="text-[18px] font-semibold text-[#111827] dark:text-[#F1F5F9] mb-[16px] leading-[1.2]">{title}</h3>
    {children}
  </div>
);

const InfoRow = ({ label, value, isLast = false }: { label: string; value: React.ReactNode; isLast?: boolean }) => (
  <div className={`flex items-center justify-between py-[16px] ${!isLast ? 'border-b border-[#E5E7EB] dark:border-[#334155]' : ''}`}>
    <span className="text-[14px] text-[#6B7280] dark:text-[#94A3B8]">{label}</span>
    <span className="text-[16px] font-medium text-[#111827] dark:text-[#F1F5F9]">{value}</span>
  </div>
);

const OrderCard = ({ order }: { order: any }) => {
  const bom = order.boms && order.boms.length > 0 ? order.boms[0] : null;

  // Custom display name according to the priority instruction logic
  // 1: order.order_name
  // 2: order.mockup?.name 
  // 3: mockup_modification.name (or nested appropriately)
  const displayOrderName = order.order_name
    || order.mockup?.name
    || order.mockup_modification?.name
    || order.mockup_modification?.mockup?.name
    || `Order #${order.order_code}`;

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#1E293B] rounded-[12px] p-[16px] border border-[#E5E7EB] dark:border-[#334155] flex flex-col h-full">
      {/* 1. Display Image */}
      {order?.mockup_image ? (
        <div className="w-full aspect-video rounded-[8px] overflow-hidden bg-[#F9FAFB] dark:bg-[#0F172A] mb-[16px] border border-[#E5E7EB] dark:border-[#334155]">
          <img
            src={order.mockup_image}
            alt="Order mockup"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full aspect-video rounded-[8px] overflow-hidden bg-[#F9FAFB] dark:bg-[#0F172A] mb-[16px] border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center">
          <Package className="w-[32px] h-[32px] text-[#6B7280] dark:text-[#94A3B8] opacity-50" />
        </div>
      )}

      <div className="flex-grow flex flex-col">
        {/* Order Name and Selection */}
        <div className="flex items-start justify-between mb-[16px] gap-[8px]">
          <div className="flex flex-col">
            <span className="text-[16px] font-semibold text-[#111827] dark:text-[#F1F5F9] line-clamp-2 leading-[1.2]">
              {displayOrderName}
            </span>
            <span className="text-[14px] text-[#6B7280] dark:text-[#94A3B8] mt-1">
              ORD-{order.order_code}
            </span>
          </div>
          <span className={`shrink-0 px-2 py-1 rounded-[8px] text-[12px] font-medium border ${order.order_status === 'PRE-ACCEPTED'
            ? 'bg-[#FEF3C7] dark:bg-amber-900/30 text-[#F59E0B] dark:text-[#FBBF24] border-amber-200 dark:border-amber-800/50'
            : order.order_status === 'PRE-CONFIRMED'
              ? 'bg-[#EFF6FF] dark:bg-blue-900/30 text-[#2563EB] dark:text-[#3B82F6] border-blue-200 dark:border-blue-800/50'
              : 'bg-[#F9FAFB] dark:bg-slate-800 text-[#6B7280] dark:text-[#94A3B8] border-gray-200 dark:border-slate-700'
            }`}>
            {order.order_status?.replace(/-/g, ' ')}
          </span>
        </div>

        {/* Details Bottom */}
        <div className="grid grid-cols-2 gap-[16px] text-[14px] mt-auto pt-[16px] border-t border-[#E5E7EB] dark:border-[#334155]">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2 text-[#6B7280] dark:text-[#94A3B8] mb-[8px]">
              <Ruler className="w-[16px] h-[16px]" />
              <span>Size</span>
            </div>
            <span className="text-[#111827] dark:text-[#F1F5F9] font-medium">
              {bom ? `${bom.width} x ${bom.height}` : 'N/A'}
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2 text-[#6B7280] dark:text-[#94A3B8] mb-[8px]">
              <DollarSign className="w-[16px] h-[16px]" />
              <span>Price</span>
            </div>
            <span className="text-[#111827] dark:text-[#F1F5F9] font-medium">
              ${order.price?.toLocaleString() || '0'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};