import { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  FileText,
  CreditCard,
  CheckCircle,
  XCircle,
  Package,
  Wrench,
  Truck,
  Settings,
  DollarSign,
  Clock,
  AlertCircle,
  Download,
  Image,
  Loader,
  Layers,
  ChevronRight,
  Receipt,
  Info,
  Pencil,
  Type,
} from "lucide-react";
import api from "@/api";
import OrderContainerEdit from "./OrderContainerEdit";
import OrderEdit from "./OrderEdit";

interface OrderDetailProps {
  order: any;
  onClose: () => void;
  onOrderUpdate?: (updatedOrder: any) => void; // Optional callback for parent
}

const OrderDetail = ({ order, onClose, onOrderUpdate }: OrderDetailProps) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "payments"
  >("overview");
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [editingContainer, setEditingContainer] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);

  const [designTypes, setDesignTypes] = useState<any[]>([]);
  const [loadingDesignTypes, setLoadingDesignTypes] = useState(false);

  // Fetch design types on component mount
  useEffect(() => {
    const fetchDesignTypes = async () => {
      try {
        setLoadingDesignTypes(true);
        const response = await api.get("/lead/design-types/");
        setDesignTypes(response.data);
      } catch (error) {
        console.error("Failed to fetch design types:", error);
      } finally {
        setLoadingDesignTypes(false);
      }
    };

    fetchDesignTypes();
  }, []);

  // Helper to get design type name
  const getDesignTypeName = (designTypeId: any) => {
    if (!designTypeId) return "N/A";

    if (typeof designTypeId === "object") {
      return designTypeId.name || "N/A";
    }

    const type = designTypes.find((t) => t.id === designTypeId);
    return type?.name || `ID: ${designTypeId}`;
  };

  // ... rest of your existing functions ...
  // Fetch payments for this order
  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      setPaymentsError(null);
      const response = await api.get(
        `/finance/payment/?order_container=${order.id}`
      );
      setPayments(response.data.results || []);
    } catch (error: any) {
      console.error("Failed to fetch payments:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load payment information";
      setPaymentsError(errorMessage);
    } finally {
      setPaymentsLoading(false);
    }
  };

  // Add import at the top

  // Update the tabs array to include pity-costs

  // Add the tab content for pity-costs

  useEffect(() => {
    if (activeTab === "payments") {
      fetchPayments();
    }
  }, [order.id, activeTab]);

  // --- Formatters ---
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const handleContainerUpdate = (updatedData: any) => {
    // Update the local order data with the new values
    // Object.keys(updatedData).forEach((key) => {
    //   if (key in order) {
    //     order[key] = updatedData[key];
    //   }
    // });
    // // Notify parent component if needed
    // if (onOrderUpdate) {
    //   onOrderUpdate(order);
    // }
    onClose();
  };

  const handleOrderUpdate = (updatedOrder: any) => {
    onClose();
  };

  // --- Helpers ---
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "C":
        return <CheckCircle size={18} className="text-emerald-500" />;
      case "P":
        return <Clock size={18} className="text-amber-500" />;
      case "R":
        return <XCircle size={18} className="text-rose-500" />;
      default:
        return <AlertCircle size={18} className="text-gray-400" />;
    }
  };

  const getReasonText = (reason: string) => {
    const map: Record<string, string> = {
      PRE: "Advance Payment",
      REM: "Remaining Payment",
      FULL: "Full Payment",
      SALES: "Product Sales",
      MAINTENANCE: "Maintenance",
    };
    return map[reason] || reason;
  };

  const getOrderStatusColor = (status: string) => {
    if (!status)
      return "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400";
    if (status.includes("CONFIRMED") || status.includes("COMPLETED")) {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
    }
    if (status.includes("STARTED") || status.includes("ACCEPTED")) {
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    }
    if (status.includes("PRE")) {
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
    }
    return "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 border-gray-200 dark:border-zinc-700";
  };

  // --- Components ---
  const InfoRow = ({ icon: Icon, label, value, subValue }: any) => (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
      <div className="mt-1 p-2 bg-gray-100 dark:bg-zinc-800 rounded-md text-gray-500 dark:text-gray-400">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
          {value || "N/A"}
        </p>
        {subValue && (
          <p className="text-sm text-gray-500 dark:text-gray-500">{subValue}</p>
        )}
      </div>
    </div>
  );

  const SectionTitle = ({ title, icon: Icon }: any) => (
    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-zinc-800 pb-2">
      {Icon && <Icon size={16} className="text-blue-600 dark:text-blue-400" />}
      {title}
    </h3>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 w-full h-[95vh] sm:h-[90vh] sm:rounded-xl shadow-2xl flex flex-col overflow-hidden border-t sm:border border-gray-200 dark:border-zinc-800 rounded-t-xl">
        {/* Header - Always Visible */}
        <div className="shrink-0 p-4 sm:p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-start gap-3">
          <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hidden sm:block shrink-0 h-fit">
              <Package size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {order.client}
                </h2>
                <span
                  className={`px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-full border whitespace-nowrap ${getOrderStatusColor(
                    order.orders?.[0]?.order_status
                  )}`}
                >
                  {order.orders?.[0]?.order_status?.replace(/-/g, " ") ||
                    "UNKNOWN"}
                </span>
                <button
                  onClick={() => setEditingContainer(true)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all shrink-0"
                  title="Edit order container"
                >
                  <Pencil size={14} />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-2">
                <span className="flex flex-wrap items-center gap-1">
                  {order.orders
                    ?.slice(0, 3)
                    .map((item: any) => (
                      <span
                        key={item.order_code}
                        className="font-mono text-[10px] sm:text-xs bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded whitespace-nowrap"
                      >
                        ORD-{item.order_code}
                      </span>
                    ))
                    .reduce(
                      (acc: any[], x: any) =>
                        acc.length ? [...acc, " ", x] : [x],
                      []
                    )}
                  {order.orders?.length > 3 && (
                    <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 ml-1 whitespace-nowrap">
                      +{order.orders.length - 3} more
                    </span>
                  )}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="whitespace-nowrap">{formatDate(order.created_at)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-all shrink-0"
          >
            <X size={20} />
          </button>
        </div>
        {/* Tabs */}
        <div className="shrink-0 px-6 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
          <div className="flex gap-6 overflow-x-auto py-1">
            {[
              { id: "overview", label: "Overview", icon: Info },
              {
                id: "orders",
                label: `Sub-Orders (${order.orders?.length || 0})`,
                icon: Layers,
              },
              { id: "payments", label: "Payments", icon: CreditCard },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap ${activeTab === tab.id
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
              >
                <tab.icon size={16} className="shrink-0" />
                <span className="truncate max-w-[150px]">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-zinc-950/30 p-6">
          {/* --- TAB: OVERVIEW --- */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
              <div className="space-y-8">
                {/* Client Info Grid */}
                <div>
                  <SectionTitle title="Client Information" icon={User} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <InfoRow icon={User} label="Name" value={order.client} />
                    <InfoRow
                      icon={Phone}
                      label="Contact"
                      value={order.contact}
                    />
                    <InfoRow
                      icon={MapPin}
                      label="Location"
                      value={order.location}
                      className="sm:col-span-2"
                    />
                  </div>
                </div>

                {/* Services */}
                {/* Services */}
                <div>
                  <SectionTitle title="Services & Complexity" icon={Settings} />
                  <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Installation Service */}
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-2 rounded-lg ${order.instalation_service
                              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500"
                            }`}
                        >
                          <Wrench size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Installation
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {order.instalation_service
                              ? "Included"
                              : "Not included"}
                          </p>
                        </div>
                      </div>

                      {/* Delivery Service */}
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-2 rounded-lg ${order.delivery_service
                              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500"
                            }`}
                        >
                          <Truck size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Delivery
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {order.delivery_service
                              ? "Included"
                              : "Not included"}
                          </p>
                        </div>
                      </div>

                      {/* Invoice */}

                      {/* Difficulty */}
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                          <Settings size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Difficulty
                          </p>
                          <p className="text-xs font-medium text-gray-900 dark:text-white">
                            {order.order_difficulty || "Standard"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Logistics */}
                <div>
                  <SectionTitle title="Logistics & Finance" icon={Receipt} />
                  <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
                    <InfoRow
                      icon={Calendar}
                      label="Delivery Date"
                      value={formatDate(order.delivery_date)}
                    />
                    <div className="border-t border-gray-100 dark:border-zinc-800"></div>
                    <InfoRow
                      icon={FileText}
                      label="Invoice Status"
                      value={order.invoice ? "Invoice Required" : "No Invoice"}
                    />
                    <div className="border-t border-gray-100 dark:border-zinc-800"></div>
                    <div className="flex items-center gap-3 p-4 bg-blue-50/50 dark:bg-blue-900/10">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">
                          Total Amount
                        </p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(order.full_payment)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes & Special Req */}
                {(order.special_requerment || order.note) && (
                  <div>
                    <SectionTitle
                      title="Notes & Requirements"
                      icon={AlertCircle}
                    />
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg p-4 space-y-3">
                      {order.special_requerment && (
                        <div>
                          <p className="text-xs font-bold text-amber-800 dark:text-amber-500 uppercase">
                            Special Requirement
                          </p>
                          <p className="text-sm text-gray-800 dark:text-gray-300 mt-1">
                            {order.special_requerment}
                          </p>
                        </div>
                      )}
                      {order.note && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase">
                            General Note
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 italic">
                            "{order.note}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- TAB: ORDERS --- */}
          {activeTab === "orders" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {!order.orders?.length ? (
                <div className="text-center py-12 text-gray-500">
                  No sub-orders found.
                </div>
              ) : (
                order.orders.map((item: any) => (
                  <div
                    key={item.order_code}
                    className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
                  >
                    {/* Item Header */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500">
                          <Package size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 dark:text-white">
                              ORD-{item.order_code}
                            </h4>
                            <button
                              onClick={() => setEditingOrder(item)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all"
                              title="Edit order"
                            >
                              <Pencil size={14} />
                            </button>
                          </div>
                          <span className="text-xs text-gray-500">
                            {/* Handle design_type whether it's object or string */}
                            {typeof item.design_type === "object"
                              ? item.design_type?.name
                              : typeof item.design_type === "string"
                                ? item.design_type
                                : `Design Type ID: ${item.design_type}`}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono font-medium text-gray-900 dark:text-gray-200">
                          {formatCurrency(item.price)}
                        </span>
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getOrderStatusColor(
                            item.order_status
                          )}`}
                        >
                          {item.order_status.replace(/-/g, " ")}
                        </span>
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="p-4 bg-gray-50/50 dark:bg-zinc-900/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">
                          Components
                        </span>
                        <div className="flex gap-2 text-gray-700 dark:text-gray-300">
                          <span className="bg-white dark:bg-zinc-800 px-2 py-1 rounded border border-gray-200 dark:border-zinc-700">
                            BOM: {item.boms?.length || 0}
                          </span>
                          <span className="bg-white dark:bg-zinc-800 px-2 py-1 rounded border border-gray-200 dark:border-zinc-700">
                            Files: {item.cutting_files?.length || 0}
                          </span>
                        </div>
                      </div>

                      {/* Design Type Display */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                          <Type
                            size={18}
                            className="text-blue-600 dark:text-blue-400"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-900 dark:text-white">
                            Design Type
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {typeof item.design_type === "object"
                              ? item.design_type?.name
                              : typeof item.design_type === "string"
                                ? item.design_type
                                : `ID: ${item.design_type}`}
                          </p>
                        </div>
                      </div>

                      {/* Mockup Preview - Check multiple possible image locations */}
                      {(item.mockup_image || item.mockup?.mockup_image) && (
                        <div className="flex items-center gap-3">
                          <img
                            src={item.mockup_image || item.mockup?.mockup_image}
                            alt="Mockup"
                            onClick={() =>
                              window.open(
                                item.mockup_image || item.mockup?.mockup_image,
                                "_blank"
                              )
                            }
                            className="w-12 h-12 object-cover rounded bg-white border border-gray-200 dark:border-zinc-700 cursor-pointer hover:scale-105 transition-transform"
                          />
                          <div>
                            <p className="text-xs font-medium text-gray-900 dark:text-white">
                              Mockup
                            </p>
                            <p
                              className="text-[10px] text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                              onClick={() =>
                                window.open(
                                  item.mockup_image ||
                                  item.mockup?.mockup_image,
                                  "_blank"
                                )
                              }
                            >
                              View Image
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Modification Preview */}
                      {item.mockup_modification?.mockup_image && (
                        <div className="flex items-center gap-3">
                          <img
                            src={item.mockup_modification.mockup_image}
                            alt="Modification"
                            onClick={() =>
                              window.open(
                                item.mockup_modification.mockup_image,
                                "_blank"
                              )
                            }
                            className="w-12 h-12 object-cover rounded bg-white border border-amber-200 dark:border-amber-900 cursor-pointer hover:scale-105 transition-transform"
                          />
                          <div>
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-500">
                              Modified
                            </p>
                            <p
                              className="text-[10px] text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                              onClick={() =>
                                window.open(
                                  item.mockup_modification.mockup_image,
                                  "_blank"
                                )
                              }
                            >
                              View Change
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* --- TAB: ORDERS --- */}
          {activeTab === "orders" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {!order.orders?.length ? (
                <div className="text-center py-12 text-gray-500">
                  No sub-orders found.
                </div>
              ) : (
                order.orders.map((item: any) => (
                  <div
                    key={item.order_code}
                    className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
                  >
                    {/* Item Header */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500">
                          <Package size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 dark:text-white">
                              ORD-{item.order_code}
                            </h4>
                            <button
                              onClick={() => setEditingOrder(item)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all"
                              title="Edit order"
                            >
                              <Pencil size={14} />
                            </button>
                          </div>
                          <span className="text-xs text-gray-500">
                            {loadingDesignTypes ? (
                              <span className="flex items-center gap-1">
                                <Loader className="animate-spin" size={12} />
                                Loading design type...
                              </span>
                            ) : (
                              getDesignTypeName(item.design_type)
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono font-medium text-gray-900 dark:text-gray-200">
                          {formatCurrency(item.price)}
                        </span>
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getOrderStatusColor(
                            item.order_status
                          )}`}
                        >
                          {item.order_status.replace(/-/g, " ")}
                        </span>
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Design Type Info */}
                      <div className="flex items-start gap-3 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                          <Type
                            size={20}
                            className="text-blue-600 dark:text-blue-400"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Design Type
                          </p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white mt-1">
                            {loadingDesignTypes ? (
                              <span className="flex items-center gap-2">
                                <Loader className="animate-spin" size={14} />
                                Loading...
                              </span>
                            ) : (
                              getDesignTypeName(item.design_type)
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Mockup Image */}
                      {(item.mockup_image || item.mockup?.mockup_image) && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Mockup
                          </p>
                          <div className="relative">
                            <img
                              src={
                                item.mockup_image || item.mockup?.mockup_image
                              }
                              alt="Mockup"
                              onClick={() =>
                                window.open(
                                  item.mockup_image ||
                                  item.mockup?.mockup_image,
                                  "_blank"
                                )
                              }
                              className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 dark:border-zinc-700 cursor-pointer hover:opacity-90 transition-opacity"
                            />
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                              Click to enlarge
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Modification Image */}
                      {item.mockup_modification?.mockup_image && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Modified Version
                          </p>
                          <div className="relative">
                            <img
                              src={item.mockup_modification.mockup_image}
                              alt="Modification"
                              onClick={() =>
                                window.open(
                                  item.mockup_modification.mockup_image,
                                  "_blank"
                                )
                              }
                              className="w-full h-40 object-cover rounded-lg border-2 border-amber-200 dark:border-amber-900 cursor-pointer hover:opacity-90 transition-opacity"
                            />
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                              Click to enlarge
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Components Info - Only show if no images */}
                      {!(item.mockup_image || item.mockup?.mockup_image) &&
                        !item.mockup_modification?.mockup_image && (
                          <div className="md:col-span-2 flex flex-col gap-3">
                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                Components
                              </p>
                              <div className="flex gap-3">
                                <div className="bg-white dark:bg-zinc-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700">
                                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {item.boms?.length || 0}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    BOM Items
                                  </p>
                                </div>
                                <div className="bg-white dark:bg-zinc-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700">
                                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {item.cutting_files?.length || 0}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Cutting Files
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* --- TAB: PAYMENTS --- */}
          {activeTab === "payments" && (
            <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
              {paymentsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader className="animate-spin h-8 w-8 mb-4 text-blue-500" />
                  <p>Loading financial data...</p>
                </div>
              ) : paymentsError ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-lg text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
                  <p className="text-red-700 dark:text-red-400 mb-4">
                    {paymentsError}
                  </p>
                  <button
                    onClick={fetchPayments}
                    className="text-sm font-medium text-red-600 underline"
                  >
                    Try Again
                  </button>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-300 dark:text-zinc-600 mb-3" />
                  <p className="text-gray-500">No payment history recorded.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-5 flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:shadow-md transition-shadow"
                    >
                      {/* Status Indicator Line */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1 ${payment.status === "C"
                            ? "bg-emerald-500"
                            : payment.status === "R"
                              ? "bg-rose-500"
                              : "bg-amber-500"
                          }`}
                      />

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                            {getReasonText(payment.reason)}
                          </h4>
                          {getStatusIcon(payment.status)}
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Calendar size={14} />{" "}
                          {formatDate(payment.created_at)}
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-xs text-gray-400 uppercase tracking-wider">
                              Method
                            </span>
                            <p className="font-medium text-gray-700 dark:text-gray-300">
                              {payment.method}{" "}
                              {payment.account ? `(#${payment.account})` : ""}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400 uppercase tracking-wider">
                              Wallet
                            </span>
                            <p className="font-medium text-gray-700 dark:text-gray-300">
                              {payment.wallet?.name || "N/A"}
                            </p>
                          </div>
                          {payment.confirmed_by && (
                            <div className="col-span-2 pt-2 border-t border-gray-100 dark:border-zinc-800 mt-2">
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle size={12} /> Confirmed by{" "}
                                {payment.confirmed_by.telegram_user_name}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Amount & Proof */}
                      <div className="flex flex-col items-start md:items-end justify-between min-w-[150px]">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(payment.amount)}
                        </span>

                        {payment.confirmation_image && (
                          <button
                            onClick={() =>
                              window.open(payment.confirmation_image, "_blank")
                            }
                            className="mt-4 flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg w-full md:w-auto justify-center"
                          >
                            <Image size={14} /> View Receipt
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Edit Overlays */}
      {editingContainer && (
        <OrderContainerEdit
          container={order}
          onClose={() => setEditingContainer(false)}
          onUpdate={handleContainerUpdate}
        />
      )}

      {editingOrder && (
        <OrderEdit
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onUpdate={handleOrderUpdate}
        />
      )}
    </div>
  );
};

export default OrderDetail;
