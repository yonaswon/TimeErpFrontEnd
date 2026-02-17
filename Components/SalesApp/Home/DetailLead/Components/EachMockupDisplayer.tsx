import ModificationDisplayer from "./ModificationDisplayer";
import {
  Image as ImageIcon,
  User,
  DollarSign,
  Ruler,
  Package,
  Calendar,
  Clock,
  FileText,
} from "lucide-react";

interface ImageObj {
  id: number;
  image: string;
  date: string;
}

interface BomItem {
  id: number;
  amount: number | null;
  width: string | null;
  height: string | null;
  price_per_unit: string | null;
  total_price: string | null;
  estimated_price: string | null;
  date: string;
  material: number;
}

interface Designer {
  id: number;
  telegram_id: number;
  telegram_user_name: string | null;
  role: Array<{
    id: number;
    Name: string;
    date: string;
  }>;
  first_name: string;
}

interface Mockup {
  id: number;
  reference_images: ImageObj[];
  bom: BomItem[];
  designer: Designer;
  request_status: string;
  note: string;
  price: number | null;
  price_with_vat: boolean;
  mockup_image: string | null;
  width: string | null;
  height: string | null;
  telegram_message_id: number | null;
  requested_date: string;
  first_response_date: string | null;
  date: string;
  lead: number;
}

interface EachMockupDisplayerProps {
  mockup: Mockup;
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
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${map[variant] || map.gray
        }`}
    >
      {children}
    </span>
  );
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case "SENT":
      return "blue";
    case "STARTED":
      return "yellow";
    case "RETURNED":
      return "green";
    case "CONVERTED":
      return "purple";
    default:
      return "gray";
  }
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

export default function EachMockupDisplayer({
  mockup,
}: EachMockupDisplayerProps) {
  const isReturned = mockup.request_status === "RETURNED";

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            M{mockup.id}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Mockup #{mockup.id}</span>
              <Badge variant={getStatusVariant(mockup.request_status)}>
                {mockup.request_status}
              </Badge>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <User className="w-3 h-3" />
              {mockup.designer.telegram_user_name || `Designer ${mockup.designer.id}`}
            </div>
          </div>
        </div>

        {/* The "Modify" button is kept here, but the modification logic is now housed in the ModificationDisplayer below */}
        {isReturned && (
          <button className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium">
            Modify
          </button>
        )}
      </div>

      {/* Mockup Image - Top for Returned */}
      {isReturned && mockup.mockup_image && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
          <div className="p-2 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Final Mockup</span>
            </div>
          </div>
          <div className="p-2">
            <img
              src={mockup.mockup_image}
              alt={`Mockup ${mockup.id}`}
              className="w-full rounded max-h-48 object-contain"
            />
          </div>
        </div>
      )}

      {/* Key Stats - Compact Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-2 border border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Price</span>
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-white">
            {mockup.price ? `$${mockup.price}` : "—"}
          </div>
          {mockup.price_with_vat && (
            <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">With VAT</div>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg p-2 border border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
            <Ruler className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Size</span>
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-white">
            {mockup.width && mockup.height ? `${mockup.width}×${mockup.height}` : "—"}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg p-2 border border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
            <Package className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">BOM</span>
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-white">
            {mockup.bom?.length || 0}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg p-2 border border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Timeline</span>
          </div>
          <div className="text-xs text-gray-900 dark:text-white">
            {new Date(mockup.requested_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* BOM Items - Compact List */}
      {mockup.bom && mockup.bom.length > 0 && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
          <div className="p-2 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Materials</span>
              <Badge variant="purple">{mockup.bom.length}</Badge>
            </div>
          </div>
          <div className="p-2 space-y-1">
            {mockup.bom.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-1.5 bg-gray-50 dark:bg-zinc-900 rounded text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    Material #{item.material}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                    {item.amount && <span>Qty: {item.amount}</span>}
                    {item.width && item.height && <span>• {item.width}×{item.height}</span>}
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

      {/* Designer & Timeline - Side by Side */}
      <div className="grid grid-cols-2 gap-2">
        {/* Designer */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-2 border border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
            <User className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Designer</span>
          </div>
          <div className="text-sm text-gray-900 dark:text-white">
            {mockup.designer.first_name || "Not set"}
          </div>
          {mockup.designer.telegram_user_name && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              @{mockup.designer.telegram_user_name}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-2 border border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Dates</span>
          </div>
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Requested:</span>
              <span className="text-gray-900 dark:text-white">
                {new Date(mockup.requested_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {mockup.first_response_date && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Started:</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(mockup.first_response_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {mockup.note && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
          <div className="p-2 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-green-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Notes</span>
            </div>
          </div>
          <div className="p-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {mockup.note}
            </p>
          </div>
        </div>
      )}

      {/* Reference Images */}
      {mockup.reference_images.length > 0 && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
          <div className="p-2 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Reference Images</span>
              <Badge variant="purple">{mockup.reference_images.length}</Badge>
            </div>
          </div>
          <div className="p-2">
            <div className="grid grid-cols-3 gap-1">
              {mockup.reference_images.map((image) => (
                <div
                  key={image.id}
                  className="aspect-square bg-gray-100 dark:bg-zinc-900 rounded overflow-hidden"
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

      {/* Mockup Image for non-RETURNED status */}
      {!isReturned && mockup.mockup_image && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
          <div className="p-2 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Current Mockup</span>
            </div>
          </div>
          <div className="p-2">
            <img
              src={mockup.mockup_image}
              alt={`Mockup ${mockup.id}`}
              className="w-full rounded max-h-40 object-contain"
            />
          </div>
        </div>
      )}

      {/* ModificationDisplayer REMOVED from here to be managed by the parent MockUpDisplayer for proper layout. */}
    </div>
  );
}