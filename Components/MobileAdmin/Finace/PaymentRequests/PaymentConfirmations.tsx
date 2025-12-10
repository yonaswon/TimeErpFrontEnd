// PaymentConfirmations.tsx
import { useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  DollarSign,
  User,
  MapPin,
  Calendar,
  Filter,
  Package,
} from "lucide-react";
import { Payment, PaymentResponse } from "@/types/finance";
import api from "@/api";
import { PaymentDetailOverlay } from "./PaymentDetailOverlay";

type PaymentStatus = "P" | "C" | "all";

export const PaymentConfirmations = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus>("P");
  const [confirmationErrors, setConfirmationErrors] = useState<{
    [key: number]: string;
  }>({});
  const [confirmingPayments, setConfirmingPayments] = useState<{
    [key: number]: boolean;
  }>({});

  const fetchPayments = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const url =
        statusFilter === "all"
          ? `/finance/payment/?p=${page}`
          : `/finance/payment/?status=${statusFilter}&p=${page}`;

      const response = await api.get<PaymentResponse>(url);
      setPayments(response.data.results);
      setTotalPages(Math.ceil(response.data.count / 10));
      setCurrentPage(page);
    } catch (err) {
      setError("Failed to fetch payments");
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const handleConfirmPayment = async (paymentId: number) => {
    try {
      setConfirmingPayments((prev) => ({ ...prev, [paymentId]: true }));
      setConfirmationErrors((prev) => ({ ...prev, [paymentId]: "" }));

      await api.post(`/finance/payment/${paymentId}/confirm/`);
      // Remove confirmed payment from list
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

  const handlePageChange = (page: number) => {
    fetchPayments(page);
  };

  const getFilterButtonClass = (filter: PaymentStatus) => {
    const baseClass =
      "px-3 py-1 rounded-lg text-sm font-medium transition-colors";
    return statusFilter === filter
      ? `${baseClass} bg-blue-600 text-white`
      : `${baseClass} bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-600`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && payments.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <CheckCircle className="w-12 h-12 mx-auto mb-2" />
          <p>{error}</p>
        </div>
        <button
          onClick={() => fetchPayments()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const pendingCount = payments.filter((p) => p.status === "P").length;

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Payment Confirmations
          </h3>
          {statusFilter === "P" && pendingCount > 0 && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              {pendingCount} Pending
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <div className="flex space-x-1">
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
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {statusFilter === "P" ? "No Pending Payments" : "No Payments Found"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {statusFilter === "P"
              ? "All payments have been confirmed"
              : "No payments match the current filter"}
          </p>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-zinc-700 dark:text-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
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

// Payment Card Component
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

  const getReasonDisplay = (reason: string) => {
    const reasonMap: { [key: string]: string } = {
      PRE: "Pre-Payment",
      REM: "Remaining Payment",
      FULL: "Full Payment",
      SALES: "Product Sales",
    };
    return reasonMap[reason] || reason;
  };

  return (
    <div className="bg-gray-50 dark:bg-zinc-700 rounded-xl p-4 border border-gray-200 dark:border-zinc-600">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            {/* Client or Sales Indicator */}
            {payment.order_container ? (
              <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-300">
                <User className="w-4 h-4" />
                <span className="font-medium">
                  {payment.order_container.client}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-300">
                <Package className="w-4 h-4" />
                <span className="font-medium">Product Sales</span>
              </div>
            )}

            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-300">
              <DollarSign className="w-4 h-4" />
              <span className="font-semibold">${payment.amount}</span>
            </div>

            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-300">
              <Clock className="w-4 h-4" />
              <span>{new Date(payment.created_at).toLocaleDateString()}</span>
            </div>

            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                payment.status === "P"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {payment.status === "P" ? "Pending" : "Confirmed"}
            </div>

            <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {payment.method}
            </div>

            <div className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
              {getReasonDisplay(payment.reason)}
            </div>
          </div>

          {/* Order Container Details */}
          {payment.order_container && (
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-300 truncate">
                  {payment.order_container.location}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-300">
                  {new Date(
                    payment.order_container.delivery_date
                  ).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {/* Confirmation Image Preview */}
          {payment.confirmation_image && (
            <div className="mt-2">
              <img
                src={payment.confirmation_image}
                alt="Payment confirmation"
                className="w-16 h-16 object-cover rounded-lg border border-gray-300 cursor-pointer"
                onClick={onViewDetails}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <button
            onClick={onViewDetails}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            View Details
          </button>
          {showConfirmButton && (
            <button
              onClick={() => onConfirm(payment.id)}
              disabled={isConfirming}
              className={`px-4 py-2 text-sm text-white rounded-lg transition-colors whitespace-nowrap flex items-center justify-center min-w-[100px] ${
                isConfirming
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isConfirming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Confirming...
                </>
              ) : (
                "Confirm"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
