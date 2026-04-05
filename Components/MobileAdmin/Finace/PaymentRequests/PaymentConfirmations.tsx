// PaymentConfirmations.tsx
import { useState, useEffect } from "react";
import {
  CheckCircle,
  User,
  MapPin,
  Calendar,
  Package,
  Wrench,
  ChevronRight,
  Loader2,
  ImageIcon,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";
import { Payment, PaymentResponse } from "@/types/finance";
import api from "@/api";
import { PaymentDetailOverlay } from "./PaymentDetailOverlay";

type PaymentStatus = "P" | "C" | "all";

export const PaymentConfirmations = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus>("P");
  const [confirmationErrors, setConfirmationErrors] = useState<{
    [key: number]: string;
  }>({});
  const [confirmingPayments, setConfirmingPayments] = useState<{
    [key: number]: boolean;
  }>({});

  const fetchPayments = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      let url: string;
      if (loadMore && nextPage) {
        url = nextPage;
      } else {
        url =
          statusFilter === "all"
            ? `/finance/payment/`
            : `/finance/payment/?status=${statusFilter}`;
      }

      const response = await api.get<PaymentResponse>(url);

      if (loadMore) {
        setPayments((prev) => [...prev, ...response.data.results]);
      } else {
        setPayments(response.data.results);
      }
      setNextPage(response.data.next);
      setTotalCount(response.data.count);
    } catch (err) {
      setError("Failed to fetch payments");
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPayments([]);
    setNextPage(null);
    fetchPayments();
  }, [statusFilter]);

  const handleConfirmPayment = async (paymentId: number) => {
    try {
      setConfirmingPayments((prev) => ({ ...prev, [paymentId]: true }));
      setConfirmationErrors((prev) => ({ ...prev, [paymentId]: "" }));

      await api.post(`/finance/payment/${paymentId}/confirm/`);
      setPayments((prev) => prev.filter((payment) => payment.id !== paymentId));
    } catch (err: any) {
      setConfirmationErrors((prev) => ({
        ...prev,
        [paymentId]: err.response?.data?.message || "Failed to confirm payment",
      }));
      console.error("Error confirming payment:", err);
    } finally {
      setConfirmingPayments((prev) => ({ ...prev, [paymentId]: false }));
    }
  };

  const getFilterButtonClass = (filter: PaymentStatus) => {
    if (statusFilter === filter) {
      return "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-[#2563EB] text-white shadow-md shadow-blue-500/25";
    }
    return "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-[#F9FAFB] text-[#6B7280] hover:bg-[#E5E7EB] dark:bg-[#1E293B] dark:text-[#94A3B8] dark:hover:bg-[#334155]";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="w-10 h-10 rounded-full border-3 border-[#2563EB] border-t-transparent animate-spin" />
        <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">Loading payments...</p>
      </div>
    );
  }

  if (error && payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-[#DC2626] dark:text-[#EF4444]" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-semibold text-[#111827] dark:text-[#F1F5F9]">Something went wrong</p>
          <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">{error}</p>
        </div>
        <button
          onClick={() => fetchPayments()}
          className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const pendingCount = payments.filter((p) => p.status === "P").length;

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-bold text-[#111827] dark:text-[#F1F5F9]">
              Payments
            </h3>
            {statusFilter === "P" && pendingCount > 0 && (
              <span className="px-2.5 py-0.5 bg-[#F59E0B]/15 text-[#F59E0B] rounded-lg text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </div>
          <span className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
            {totalCount} total
          </span>
        </div>

        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setStatusFilter("P")}
            className={getFilterButtonClass("P")}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter("C")}
            className={getFilterButtonClass("C")}
          >
            Confirmed
          </button>
          <button
            onClick={() => setStatusFilter("all")}
            className={getFilterButtonClass("all")}
          >
            All
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
          <p className="text-[#DC2626] dark:text-[#EF4444] text-sm">{error}</p>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-[#16A34A] dark:text-[#22C55E]" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-[#111827] dark:text-[#F1F5F9]">
              {statusFilter === "P" ? "All Clear!" : "No Payments Found"}
            </h3>
            <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
              {statusFilter === "P"
                ? "All payments have been confirmed"
                : "No payments match the current filter"}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {payments.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                onViewDetails={() => setSelectedPayment(payment)}
                onConfirm={handleConfirmPayment}
                error={confirmationErrors[payment.id]}
                isConfirming={confirmingPayments[payment.id]}
              />
            ))}
          </div>

          {/* Load More Button */}
          {nextPage && (
            <div className="flex justify-center pt-2 pb-4">
              <button
                onClick={() => fetchPayments(true)}
                disabled={loadingMore}
                className="w-full px-5 py-3 bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#E5E7EB] dark:hover:bg-[#334155] text-[#111827] dark:text-[#F1F5F9] rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 border border-[#E5E7EB] dark:border-[#334155]"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>Load More</span>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Overlay */}
      {selectedPayment && (
        <PaymentDetailOverlay
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onConfirm={handleConfirmPayment}
          isConfirming={confirmingPayments[selectedPayment.id]}
        />
      )}
    </div>
  );
};

// ─── Helper ─────────────────────────────────────────────
const getReasonDisplay = (reason: string) => {
  const map: Record<string, string> = {
    PRE: "Pre-Payment",
    REM: "Remaining",
    FULL: "Full Payment",
    SALES: "Product Sales",
    MAINTENANCE: "Maintenance",
  };
  return map[reason] || reason;
};

const getStatusColor = (status: string) => {
  if (status === "P")
    return {
      bg: "bg-[#F59E0B]/10",
      text: "text-[#F59E0B]",
      dot: "bg-[#F59E0B]",
      label: "Pending",
    };
  return {
    bg: "bg-[#16A34A]/10",
    text: "text-[#16A34A] dark:text-[#22C55E]",
    dot: "bg-[#16A34A] dark:bg-[#22C55E]",
    label: "Confirmed",
  };
};

const getMethodColor = (method: string) => {
  switch (method) {
    case "BANK":
      return "bg-[#2563EB]/10 text-[#2563EB] dark:text-[#3B82F6]";
    case "CASH":
      return "bg-[#16A34A]/10 text-[#16A34A] dark:text-[#22C55E]";
    case "CHECK":
      return "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400";
    default:
      return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
  }
};

// ─── Payment Card ───────────────────────────────────────
interface PaymentCardProps {
  payment: Payment;
  onViewDetails: () => void;
  onConfirm: (paymentId: number) => void;
  error?: string;
  isConfirming?: boolean;
}

const PaymentCard = ({
  payment,
  onViewDetails,
  onConfirm,
  error,
  isConfirming,
}: PaymentCardProps) => {
  const isPending = payment.status === "P";
  const isCashPayment = payment.method === "CASH";
  const showConfirmButton = isPending && !isCashPayment;
  const statusInfo = getStatusColor(payment.status);
  const container = payment.order_container;
  const maintenance = payment.maintenance;
  const isSales = payment.reason === "SALES";
  const isMaintenance = payment.reason === "MAINTENANCE";

  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (payment.transaction_id) {
      try {
        await navigator.clipboard.writeText(payment.transaction_id);
      } catch (err) {
        // Fallback for Telegram Web App / non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = payment.transaction_id;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (fallbackErr) {
          console.error('Fallback copy failed', fallbackErr);
        }
        document.body.removeChild(textArea);
      }
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div
      className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] overflow-hidden transition-all duration-200 active:scale-[0.99]"
      onClick={onViewDetails}
    >
      {/* Card Header — Amount + Status */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xl font-bold text-[#111827] dark:text-[#F1F5F9]">
                {payment.amount} Birr
              </span>
              <span
                className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-xs font-bold ${statusInfo.bg} ${statusInfo.text}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}
                />
                <span>{statusInfo.label}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-semibold ${getMethodColor(
                  payment.method
                )}`}
              >
                {payment.method}
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                {getReasonDisplay(payment.reason)}
              </span>
              {payment.transaction_id && (
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                  title="Copy Transaction ID"
                >
                  <span className="truncate max-w-[100px]">{payment.transaction_id}</span>
                  {copiedId ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
              <span className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                {new Date(payment.created_at).toLocaleDateString()}
              </span>
            </div>
            {payment.note && (
              <p className="mt-2 text-xs text-[#4B5563] dark:text-[#94A3B8] italic border-l-2 border-[#E5E7EB] dark:border-[#334155] pl-2 line-clamp-2">
                "{payment.note}"
              </p>
            )}
            {payment.with_holding_tax && (
              <div className="mt-1.5 flex items-center space-x-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                <span className="bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">📉 WHT: {payment.with_holding_tax_amount} Birr</span>
                <span className="text-[#6B7280] dark:text-[#94A3B8]">|</span>
                <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                  Actual: {(Number(payment.amount) - (payment.with_holding_tax_amount || 0)).toFixed(2)} Birr
                </span>
              </div>
            )}
          </div>

          {/* Confirmation image thumbnail */}
          {payment.confirmation_image && (
            <img
              src={payment.confirmation_image}
              alt="Receipt"
              className="w-10 h-10 rounded-lg object-cover border border-[#E5E7EB] dark:border-[#334155] ml-3 flex-shrink-0"
            />
          )}
        </div>

        {/* ─── Order Container Section ─── */}
        {container && (
          <div className="space-y-2.5">
            {/* Client info row */}
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#111827] dark:text-[#F1F5F9] truncate">
                  {container.client}
                </p>
                <div className="flex items-center space-x-1 text-xs text-[#6B7280] dark:text-[#94A3B8]">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{container.location}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-xs text-[#6B7280] dark:text-[#94A3B8] flex-shrink-0">
                <Calendar className="w-3 h-3" />
                <span>
                  {new Date(container.delivery_date).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Orders list */}
            {container.orders && container.orders.length > 0 && (
              <div className="bg-[#F9FAFB] dark:bg-[#0F172A] rounded-lg p-2.5 space-y-1.5">
                <p className="text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider">
                  Orders ({container.orders.length})
                </p>
                {container.orders.map((order) => (
                  <div
                    key={order.order_code}
                    className="flex items-center space-x-2.5 bg-white dark:bg-[#1E293B] rounded-lg p-2 border border-[#E5E7EB] dark:border-[#334155]"
                  >
                    {order.mockup_image ? (
                      <img
                        src={order.mockup_image}
                        alt={`ORD-${order.order_code}`}
                        className="w-9 h-9 rounded-md object-cover border border-[#E5E7EB] dark:border-[#334155] flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-md bg-[#E5E7EB] dark:bg-[#334155] flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-4 h-4 text-[#6B7280] dark:text-[#94A3B8]" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#111827] dark:text-[#F1F5F9] truncate">
                        ORD-{order.order_code}
                        {order.order_name && (
                          <span className="font-normal text-[#6B7280] dark:text-[#94A3B8]">
                            {" "}
                            — {order.order_name}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Maintenance Section ─── */}
        {isMaintenance && maintenance && (
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center flex-shrink-0">
                <Wrench className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-semibold text-[#111827] dark:text-[#F1F5F9]">
                    MNT-{maintenance.id}
                  </p>
                  {maintenance.under_warranty && (
                    <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded-md text-xs font-bold bg-[#16A34A]/10 text-[#16A34A] dark:text-[#22C55E]">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Warranty</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-[#6B7280] dark:text-[#94A3B8]">
                  {maintenance.order && (
                    <span className="font-medium">ORD-{maintenance.order}</span>
                  )}
                  {maintenance.old_order_code && (
                    <span className="font-medium">
                      OLD-{maintenance.old_order_code}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {maintenance.client_name && (
              <div className="flex items-center space-x-2 text-xs text-[#6B7280] dark:text-[#94A3B8] ml-10">
                <User className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{maintenance.client_name}</span>
              </div>
            )}
            {maintenance.reported_issue && (
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] ml-10 line-clamp-2">
                {maintenance.reported_issue}
              </p>
            )}
          </div>
        )}

        {/* ─── Sales Section ─── */}
        {isSales && !container && (
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm font-semibold text-[#111827] dark:text-[#F1F5F9]">
              Product Sales
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-[#DC2626] dark:text-[#EF4444] text-xs font-medium">
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Card Footer — Actions */}
      <div className="flex items-center border-t border-[#E5E7EB] dark:border-[#334155]">
        {showConfirmButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConfirm(payment.id);
            }}
            disabled={isConfirming}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-semibold transition-colors border-r border-[#E5E7EB] dark:border-[#334155] ${isConfirming
              ? "text-[#16A34A]/50 dark:text-[#22C55E]/50 cursor-not-allowed"
              : "text-[#16A34A] dark:text-[#22C55E] active:bg-green-50 dark:active:bg-green-900/10"
              }`}
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Confirming...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Confirm</span>
              </>
            )}
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
          className="flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-semibold text-[#2563EB] dark:text-[#3B82F6] active:bg-blue-50 dark:active:bg-blue-900/10 transition-colors"
        >
          <span>Details</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
