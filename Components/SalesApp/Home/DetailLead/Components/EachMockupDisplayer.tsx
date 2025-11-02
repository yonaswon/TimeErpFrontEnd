import ModificationDisplayer from "./ModificationDisplayer";
import {
  Image as ImageIcon,
  User,
  DollarSign,
  Ruler,
  Package,
  Calendar,
  MessageCircle,
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
  hieght: string | null;
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
    green:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    yellow:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    purple:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
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
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function EachMockupDisplayer({
  mockup,
}: EachMockupDisplayerProps) {
  return (
    <div className="space-y-6">
      {/* Mockup Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Mockup #{mockup.id}
            </h2>
            <Badge variant={getStatusVariant(mockup.request_status)}>
              {mockup.request_status}
            </Badge>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            {mockup.note || "No description provided"}
          </p>
        </div>

        {mockup.request_status === "RETURNED" && (
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
            Request Modification
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium">
            <DollarSign className="w-4 h-4" />
            Price
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {mockup.price ? `$${mockup.price}` : "Not set"}
          </div>
          {mockup.price_with_vat && (
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Includes VAT
            </div>
          )}
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
            <Ruler className="w-4 h-4" />
            Dimensions
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {mockup.width && mockup.hieght
              ? `${mockup.width} × ${mockup.hieght}`
              : "Not set"}
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm font-medium">
            <Package className="w-4 h-4" />
            BOM Items
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {mockup.bom?.length || 0}
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm font-medium">
            <Calendar className="w-4 h-4" />
            Requested
          </div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
            {formatDate(mockup.requested_date)}
          </div>
        </div>
      </div>

      {/* Designer Info */}
      <div className="bg-gray-50 dark:bg-zinc-700/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Designer
            </div>
            <div className="font-medium text-gray-900 dark:text-white">
              {mockup.designer.telegram_user_name ||
                `User ${mockup.designer.id}`}
            </div>
          </div>
        </div>
      </div>

      {/* Images Section */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Images (
          {mockup.reference_images.length + (mockup.mockup_image ? 1 : 0)})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mockup Image */}
          {mockup.mockup_image && (
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Final Mockup
              </div>
              <div className="bg-gray-100 dark:bg-zinc-900 rounded-lg h-48 flex items-center justify-center overflow-hidden">
                <img
                  src={mockup.mockup_image}
                  alt={`Mockup ${mockup.id}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Reference Images */}
          {mockup.reference_images.length > 0 && (
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Reference Images ({mockup.reference_images.length})
              </div>
              <div className="grid grid-cols-2 gap-2">
                {mockup.reference_images.slice(0, 4).map((image) => (
                  <div
                    key={image.id}
                    className="bg-gray-100 dark:bg-zinc-900 rounded-lg h-24 flex items-center justify-center overflow-hidden"
                  >
                    <img
                      src={image.image}
                      alt={`Reference ${image.id}`}
                      className="max-h-full max-w-full object-cover"
                    />
                  </div>
                ))}
                {mockup.reference_images.length > 4 && (
                  <div className="bg-gray-100 dark:bg-zinc-900 rounded-lg h-24 flex items-center justify-center text-gray-500 text-sm">
                    +{mockup.reference_images.length - 4} more
                  </div>
                )}
              </div>
            </div>
          )}

          {!mockup.mockup_image && mockup.reference_images.length === 0 && (
            <div className="col-span-2 text-center py-8 text-gray-500 dark:text-gray-400">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <div>No images available</div>
            </div>
          )}
        </div>
      </div>

      {/* BOM Section */}
      {mockup.bom && mockup.bom.length > 0 && (
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Bill of Materials ({mockup.bom.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-600">
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">
                    Material
                  </th>
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">
                    Amount
                  </th>
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">
                    Dimensions
                  </th>
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">
                    Price/Unit
                  </th>
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockup.bom.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 dark:border-zinc-700"
                  >
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">
                      Material #{item.material}
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-300">
                      {item.amount ?? "—"}
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-300">
                      {item.width && item.height
                        ? `${item.width} × ${item.height}`
                        : "—"}
                    </td>
                    <td className="py-3 px-2">
                      {item.price_per_unit ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          ${item.price_per_unit}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {item.total_price ? (
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${item.total_price}
                        </span>
                      ) : item.estimated_price ? (
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          ${item.estimated_price}*
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Timeline Info */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Timeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500 dark:text-gray-400">
              Requested Date
            </div>
            <div className="font-medium text-gray-900 dark:text-white">
              {formatDate(mockup.requested_date)}
            </div>
          </div>

          <div>
            <div className="text-gray-500 dark:text-gray-400">
              First Response
            </div>
            <div className="font-medium text-gray-900 dark:text-white">
              {formatDate(mockup.first_response_date)}
            </div>
          </div>
        </div>
      </div>
      <ModificationDisplayer
        mockupId={mockup.id}
        leadId = {mockup.lead}
        canCreateModification={mockup.request_status === "RETURNED"}
      />

      {/* Placeholder for Modifications */}
      {/* <div className="bg-gray-50 dark:bg-zinc-700/30 rounded-xl p-6 border border-dashed border-gray-300 dark:border-zinc-600">
        <div className="text-center">
          <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">Modifications</h4>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Modification functionality will be implemented here
          </p>
        </div>
      </div> */}
    </div>
  );
}
