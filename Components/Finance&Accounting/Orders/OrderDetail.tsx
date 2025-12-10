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
} from "lucide-react";
import api from "@/api";
import PityCostsSection from "./PityCost/PityCostsSection";

interface OrderDetailProps {
  order: any;
  onClose: () => void;
}

const OrderDetail = ({ order, onClose }: OrderDetailProps) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "payments" | "pity-costs"
  >("overview");
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-zinc-800">
        {/* Header - Always Visible */}
        <div className="shrink-0 p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-start">
          <div className="flex gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hidden sm:block">
              <Package size={28} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {order.client}
                </h2>
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getOrderStatusColor(
                    order.orders?.[0]?.order_status
                  )}`}
                >
                  {order.orders?.[0]?.order_status?.replace(/-/g, " ") ||
                    "UNKNOWN"}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  {order.orders
                    ?.slice(0, 3)
                    .map((item: any) => (
                      <span
                        key={item.order_code}
                        className="font-mono text-xs bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded"
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
                    <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">
                      +{order.orders.length - 3} more
                    </span>
                  )}
                </span>
                <span>•</span>
                <span>{formatDate(order.created_at)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-all"
          >
            <X size={24} />
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
              { id: "pity-costs", label: "Pity Costs", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap ${
                  activeTab === tab.id
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
                <div>
                  <SectionTitle title="Services & Complexity" icon={Settings} />
                  <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-2">
                      <div
                        className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                          order.instalation_service
                            ? "bg-green-100 text-green-600 dark:bg-green-900/20"
                            : "bg-gray-100 text-gray-400 dark:bg-zinc-800"
                        }`}
                      >
                        <Wrench size={20} />
                      </div>
                      <p className="text-sm font-medium dark:text-white">
                        Installation
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.instalation_service ? "Included" : "No"}
                      </p>
                    </div>
                    <div className="text-center p-2">
                      <div
                        className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                          order.delivery_service
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20"
                            : "bg-gray-100 text-gray-400 dark:bg-zinc-800"
                        }`}
                      >
                        <Truck size={20} />
                      </div>
                      <p className="text-sm font-medium dark:text-white">
                        Delivery
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.delivery_service ? "Included" : "No"}
                      </p>
                    </div>
                    <div className="text-center p-2">
                      <div className="mx-auto w-10 h-10 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20 flex items-center justify-center mb-2">
                        <Settings size={20} />
                      </div>
                      <p className="text-sm font-medium dark:text-white">
                        Difficulty
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.order_difficulty || "Standard"}
                      </p>
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
                    className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  >
                    {/* Item Header */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500">
                          <Package size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">
                            ORD-{item.order_code}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {item.design_type}
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

                      {/* Mockup Preview */}
                      {item.mockup?.mockup_image && (
                        <div className="flex items-center gap-3">
                          <img
                            src={item.mockup.mockup_image}
                            alt="Mockup"
                            onClick={() =>
                              window.open(item.mockup.mockup_image, "_blank")
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
                                window.open(item.mockup.mockup_image, "_blank")
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

          {activeTab === "pity-costs" && (
            <div className="animate-in fade-in duration-300">
              <PityCostsSection orderContainerId={order.id} />
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
                        className={`absolute left-0 top-0 bottom-0 w-1 ${
                          payment.status === "C"
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
    </div>
  );
};

export default OrderDetail;
