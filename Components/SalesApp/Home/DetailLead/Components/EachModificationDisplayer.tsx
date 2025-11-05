'use client'
import {
  Image as ImageIcon,
  User,
  DollarSign,
  Ruler,
  Package,
  Calendar,
  Clock,
  FileText,
  Layers,
} from "lucide-react";

interface ImageObj {
  id: number;
  image: string;
  date: string;
}

interface BomItem {
  id: number;
  material: {
    id: number;
    name: string;
    type: string;
    code_name: string;
    available: string;
    parsialy_available: string;
    min_threshold: number;
    width: number | null;
    height: number | null;
    date: string;
    stats: any;
  };
  amount: string | null;
  width: string | null;
  height: string | null;
  price_per_unit: string | null;
  total_price: string | null;
  estimated_price: string | null;
  date: string;
}

interface Modification {
  id: number;
  reference_images: ImageObj[];
  bom: BomItem[];
  price: number | null;
  price_with_vat: boolean;
  is_edit: boolean;
  request_status: string;
  mockup_image: string | null;
  note: string | null;
  width: string | null;
  hieght: string | null;
  telegram_message_id: number | null;
  started_date: string | null;
  requested_date: string;
  response_date: string | null;
  lead: number;
  mockup: number;
  prev_modification: number | null;
  is_original_mockup?: boolean;
}

interface EachModificationDisplayerProps {
  modification: Modification;
  isOriginalMockup?: boolean;
}

const Badge = ({
  children,
  variant = "gray",
}: {
  children: React.ReactNode;
  variant?: string;
}) => {
  const map: Record<string, string> = {
    gray: "bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-200",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        map[variant] || map.gray
      }`}
    >
      {children}
    </span>
  );
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function EachModificationDisplayer({
  modification,
  isOriginalMockup = false,
}: EachModificationDisplayerProps) {
  const isReturned = modification.request_status === "RETURNED";
  const isStarted = modification.request_status === "STARTED";
  const isSent = modification.request_status === "SENT";

  return (
    <div className="space-y-3 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
      {/* Header - Fixed duplicate ID display */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
            isOriginalMockup 
              ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
              : 'bg-gradient-to-br from-blue-500 to-cyan-600'
          }`}>
            {isOriginalMockup ? 'M' : 'R'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {isOriginalMockup ? 'Original Mockup' : `Modification`}
              </span>
              <Badge variant={isOriginalMockup ? "purple" : "blue"}>
                {isOriginalMockup ? 'ORIGINAL' : modification.request_status}
              </Badge>
              {modification.is_edit && !isOriginalMockup && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">(Edit)</span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" />
              {formatDate(modification.requested_date)}
            </div>
          </div>
        </div>
        
        {isOriginalMockup && (
          <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-xs font-medium">
            <Layers className="w-3 h-3" />
            Base Design
          </div>
        )}
      </div>

      {/* Mockup Image at the top for RETURNED status */}
      {isReturned && modification.mockup_image && (
        <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
          <div className="p-2 bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-green-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {isOriginalMockup ? 'Final Mockup' : 'Modified Mockup'}
              </span>
            </div>
          </div>
          <div className="p-2">
            <img
              src={modification.mockup_image}
              alt={isOriginalMockup ? `Original Mockup` : `Modification`}
              className="w-full rounded max-h-48 object-contain"
            />
          </div>
        </div>
      )}

      {/* Status message for SENT/STARTED */}
      {(isSent || isStarted) && (
        <div className="text-center py-4">
          <div className="text-3xl mb-2">
            {isSent ? "📤" : "🔄"}
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            {isSent ? "Request Sent" : "In Progress"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isSent 
              ? "Waiting for designer to start working on this request" 
              : "Designer is currently working on this request"
            }
          </p>
        </div>
      )}

      {/* Full details only for RETURNED status */}
      {isReturned && (
        <>
          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-2 border border-gray-200 dark:border-zinc-700">
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Price</span>
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                {modification.price ? `$${modification.price}` : "—"}
              </div>
              {modification.price_with_vat && (
                <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">With VAT</div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-2 border border-gray-200 dark:border-zinc-700">
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
                <Ruler className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Size</span>
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                {modification.width && modification.hieght ? `${modification.width}×${modification.hieght}` : "—"}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-2 border border-gray-200 dark:border-zinc-700">
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
                <Package className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Materials</span>
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                {modification.bom?.length || 0}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-2 border border-gray-200 dark:border-zinc-700">
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Timeline</span>
              </div>
              <div className="text-xs text-gray-900 dark:text-white space-y-0.5">
                <div>Req: {new Date(modification.requested_date).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}</div>
                {modification.response_date && (
                  <div>Resp: {new Date(modification.response_date).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}</div>
                )}
              </div>
            </div>
          </div>

          {/* BOM Items */}
          {modification.bom && modification.bom.length > 0 && (
            <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700">
              <div className="p-2 bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                <div className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-purple-500" />
                  {/* <span className="text-sm font-medium text-gray-900 dark:text-white">Materials</span> */}
                  <Badge variant="purple">{modification.bom.length}</Badge>
                </div>
              </div>
              <div className="p-2 space-y-1">
                {modification.bom.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-1.5 bg-white dark:bg-zinc-800 rounded text-xs border border-gray-200 dark:border-zinc-700"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {item.material?.name || `Material #${item.material?.id}`}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        {item.amount && <span>Qty: {item.amount}</span>}
                        {item.width && item.height && <span>• {item.width}×{item.height}</span>}
                        {item.material?.code_name && <span>• {item.material.code_name}</span>}
                      </div>
                    </div>
                    {item.total_price && (
                      <div className="text-green-600 dark:text-green-400 font-bold text-sm ml-2">
                        ${item.total_price}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Notes - Always show if exists */}
      {modification.note && (
        <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700">
          <div className="p-2 bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-green-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {isOriginalMockup ? 'Original Notes' : 'Modification Notes'}
              </span>
            </div>
          </div>
          <div className="p-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {modification.note}
            </p>
          </div>
        </div>
      )}

      {/* Reference Images - Always show if exists */}
      {modification.reference_images.length > 0 && (
        <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700">
          <div className="p-2 bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {isOriginalMockup ? 'Reference Images' : 'Modification References'}
              </span>
              <Badge variant="blue">{modification.reference_images.length}</Badge>
            </div>
          </div>
          <div className="p-2">
            <div className="grid grid-cols-3 gap-1">
              {modification.reference_images.map((image) => (
                <div
                  key={image.id}
                  className="aspect-square bg-gray-200 dark:bg-zinc-800 rounded overflow-hidden border border-gray-300 dark:border-zinc-700"
                >
                  <img
                    src={image.image}
                    alt={`Reference ${image.id}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}