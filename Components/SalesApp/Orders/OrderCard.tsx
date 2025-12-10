import {
  MoreHorizontal,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
  Hash,
  Image as ImageIcon,
} from "lucide-react";

interface OrderCardProps {
  order: any;
  onViewDetails: (order: any) => void;
  onMenuClick: (order: any) => void;
}

const OrderCard = ({ order, onViewDetails, onMenuClick }: OrderCardProps) => {
  const mainOrder = order.orders?.[0];

  // Show only first 5 order codes
  const displayLimit = 5;
  const visibleOrders = order.orders?.slice(0, displayLimit) || [];
  const remainingCount = (order.orders?.length || 0) - displayLimit;

  // Gather all mockup images
  const mockupImages =
    order.orders?.map((o: any) => o.mockup_image).filter((img: any) => img) ||
    [];

  const getStatusStyle = (status: string) => {
    if (!status)
      return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
    if (status.includes("CONFIRMED") || status.includes("COMPLETED"))
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
    if (status.includes("STARTED") || status.includes("ACCEPTED"))
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
    if (status.includes("PRE"))
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800";
    return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(dateString));
  };

  return (
    <div
      className="group flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={() => onViewDetails(order)}
    >
      {/* --- HEADER: Client + Status --- */}
      <div className="p-4 pb-2">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3
              className="font-bold text-gray-900 dark:text-white text-lg line-clamp-1"
              title={order.client}
            >
              {order.client}
            </h3>

            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
              {order.orders
                ?.slice(0, 3)
                .map((item: any) => (
                  <span key={item.order_code} className="font-mono">
                    ORD-{item.order_code}
                  </span>
                ))
                .reduce(
                  (acc: any[], x: any) =>
                    acc.length ? [...acc, ", ", x] : [x],
                  []
                )}
              {order.orders?.length > 3 && ` +${order.orders.length - 3} more`}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick(order);
            }}
            className="p-1.5 -mr-2 -mt-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {mainOrder && (
            <span
              className={`px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide rounded-md border ${getStatusStyle(
                mainOrder.order_status
              )}`}
            >
              {mainOrder.order_status.replace(/-/g, " ")}
            </span>
          )}

          {order.invoice && (
            <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide rounded-md border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800 flex items-center gap-1">
              <FileText size={10} /> Invoice
            </span>
          )}
        </div>
      </div>

      {/* --- BODY: Logistics --- */}
      <div className="px-4 py-3 border-t border-gray-50 dark:border-zinc-800/50">
        <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <Calendar size={14} className="text-gray-400" />
            <span>{formatDate(order.delivery_date)}</span>

            <span className="text-gray-300 dark:text-zinc-700">|</span>

            <Phone size={14} className="text-gray-400" />
            <span>{order.contact}</span>
          </div>

          <div className="flex items-center gap-3">
            <MapPin size={14} className="text-gray-400 shrink-0" />
            <span className="truncate" title={order.location}>
              {order.location || "No location provided"}
            </span>
          </div>
        </div>
      </div>

      {/* --- BODY: Order Codes List --- */}
      <div className="px-4 pb-3 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Hash size={12} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Order Codes
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {visibleOrders.map((item: any) => (
            <span
              key={item.order_code}
              className="font-mono text-xs bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 px-2 py-1 rounded border border-gray-200 dark:border-zinc-700"
            >
              ORD-{item.order_code}
            </span>
          ))}

          {remainingCount > 0 && (
            <span className="font-mono text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded border border-blue-100 dark:border-blue-900/30 font-medium">
              +{remainingCount} more
            </span>
          )}

          {(!visibleOrders || visibleOrders.length === 0) && (
            <span className="text-xs text-gray-400 italic">
              No sub-orders linked
            </span>
          )}
        </div>
      </div>

      {/* --- WARNINGS --- */}
      {order.special_requerment && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border-t border-b border-amber-100 dark:border-amber-900/20 flex items-start gap-2">
          <AlertCircle
            size={14}
            className="text-amber-600 dark:text-amber-500 mt-0.5 shrink-0"
          />
          <p className="text-xs text-amber-800 dark:text-amber-400 line-clamp-1 font-medium">
            {order.special_requerment}
          </p>
        </div>
      )}

      {/* --- FOOTER: MOCKUP IMAGES --- */}
      <div className="p-3 bg-gray-50/50 dark:bg-zinc-900/50 border-t border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon size={12} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Mockups
          </span>
        </div>

        {mockupImages.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {mockupImages.map((img: string, idx: number) => (
              <img
                key={idx}
                src={img}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(img, "_blank");
                }}
                className="h-14 w-14 object-cover rounded-md border border-gray-200 dark:border-zinc-700 hover:opacity-80 cursor-pointer"
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No mockups yet</p>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
