"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  DollarSign,
  User,
  Tag,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Image,
  ChevronDown,
  ChevronUp,
  Loader,
  X,
  Settings,
} from "lucide-react";
import api from "@/api";
import CreatePityCostForOrder from "./CreatePityCostForOrder";

interface TeamMember {
  id: number;
  telegram_id: number;
  telegram_user_name: string;
  first_name: string;
  role: Array<{
    id: number;
    Name: string;
    date: string;
  }>;
}

interface PityCostCategory {
  id: number;
  name: string;
  date: string;
}

interface PityCostRecord {
  id: number;
  category: PityCostCategory;
  total_amount: string;
  invoice: boolean;
  invoice_image: string | null;
  status: "P" | "C" | "R";
  note: string | null;
  created_at: string;
  confirmed_at: string | null;
  created_by: number;
  order_container: number | null;
  purchase: number | null;
  maintenance: number | null;
  released_to: number | null;
  confirmed_by: number | null;
  materials: number[];
}

interface PityCostsSectionProps {
  orderContainerId: number;
}

// Toast notification component
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "error" | "success" | "info";
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    success:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
  };

  const textColor = {
    error: "text-red-800 dark:text-red-400",
    success: "text-green-800 dark:text-green-400",
    info: "text-blue-800 dark:text-blue-400",
  };

  const iconColor = {
    error: "text-red-600 dark:text-red-400",
    success: "text-green-600 dark:text-green-400",
    info: "text-blue-600 dark:text-blue-400",
  };

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg border ${bgColor[type]} shadow-lg z-60 max-w-md animate-slide-in`}
    >
      <div className="flex items-start">
        <AlertCircle
          size={20}
          className={`mt-0.5 mr-3 shrink-0 ${iconColor[type]}`}
        />
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColor[type]}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

const PityCostsSection = ({ orderContainerId }: PityCostsSectionProps) => {
  const [pityCosts, setPityCosts] = useState<PityCostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success" | "info";
  } | null>(null);

  // Show toast notification
  const showToast = (
    message: string,
    type: "error" | "success" | "info" = "error"
  ) => {
    setToast({ message, type });
  };

  // Fetch pity costs
  const fetchPityCosts = async (url?: string) => {
    try {
      if (url) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPityCosts([]);
      }

      const fetchUrl =
        url || `/finance/pity-cost-record/?order_container=${orderContainerId}&ordering=-created_at`;
      const response = await api.get(fetchUrl);

      if (url) {
        // Append new data for pagination
        setPityCosts((prev) => [...prev, ...response.data.results]);
      } else {
        // Set initial data
        setPityCosts(response.data.results || []);
      }

      setNextPage(response.data.next);
      setError(null);
    } catch (error: any) {
      console.error("Failed to fetch pity costs:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load pity costs";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      if (url) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchPityCosts();
  }, [orderContainerId]);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchPityCosts(); // Refresh the list
    showToast("Pity cost created successfully!", "success");
  };

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

  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "C":
        return (
          <CheckCircle size={16} className="text-emerald-500 dark:text-emerald-400" />
        );
      case "P":
        return (
          <Clock size={16} className="text-amber-500 dark:text-amber-400" />
        );
      case "R":
        return <XCircle size={16} className="text-rose-500 dark:text-rose-400" />;
      default:
        return (
          <AlertCircle size={16} className="text-gray-400 dark:text-gray-500" />
        );
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "C":
        return "Confirmed";
      case "P":
        return "Pending";
      case "R":
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "C":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
      case "P":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "R":
        return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 border-gray-200 dark:border-zinc-700";
    }
  };

  // Calculate total pity costs
  const totalAmount = pityCosts.reduce(
    (sum, cost) => sum + parseFloat(cost.total_amount),
    0
  );

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Create Form Overlay */}
      <CreatePityCostForOrder
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={handleCreateSuccess}
        orderContainerId={orderContainerId}
      />

      <div className="space-y-4">
        {/* Header with Create Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Pity Costs
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Additional costs associated with this order
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
          >
            <Plus size={16} />
            Add Pity Cost
          </button>
        </div>

        {/* Summary Card */}
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Total Pity Costs
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                  {formatCurrency(totalAmount.toString())}
                </p>
              </div>
            </div>
            <span className="text-sm text-blue-700 dark:text-blue-400 bg-white/50 dark:bg-black/30 px-3 py-1 rounded-full">
              {pityCosts.length} records
            </span>
          </div>
        </div>

        {/* Loading State */}
        {loading && !loadingMore && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Loader className="animate-spin h-8 w-8 mb-4 text-blue-500" />
            <p>Loading pity costs...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-lg text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
            <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => fetchPityCosts()}
              className="text-sm font-medium text-red-600 dark:text-red-400 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && pityCosts.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700">
            <Settings className="mx-auto h-12 w-12 text-gray-300 dark:text-zinc-600 mb-3" />
            <p className="text-gray-500">No pity costs recorded yet.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Add the first pity cost
            </button>
          </div>
        )}

        {/* Pity Costs List */}
        {!loading && pityCosts.length > 0 && (
          <div className="space-y-3">
            {pityCosts.map((cost) => (
              <div
                key={cost.id}
                className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 rounded-lg">
                        <Tag size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">
                          {cost.category.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {formatDate(cost.created_at)}
                          </span>
                          <span className="text-xs">•</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(
                              cost.status
                            )}`}
                          >
                            {getStatusText(cost.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(cost.total_amount)}
                      </span>
                      {getStatusIcon(cost.status)}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 bg-gray-50/50 dark:bg-zinc-900/50">
                  {/* Note */}
                  {cost.note && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Note
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 p-3 rounded border border-gray-200 dark:border-zinc-700">
                        {cost.note}
                      </p>
                    </div>
                  )}

                  {/* Invoice Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Invoice
                      </p>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            cost.invoice
                              ? "bg-green-500 dark:bg-green-400"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {cost.invoice ? "With Invoice" : "No Invoice"}
                        </span>
                      </div>
                    </div>

                    {/* Invoice Image */}
                    {cost.invoice_image && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Invoice Image
                        </p>
                        <button
                          onClick={() =>
                            window.open(cost.invoice_image!, "_blank")
                          }
                          className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Image size={14} />
                          View Image
                        </button>
                      </div>
                    )}

                    {/* Materials */}
                    {cost.materials && cost.materials.length > 0 && (
                      <div className="sm:col-span-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Related Materials
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {cost.materials.map((materialId) => (
                            <span
                              key={materialId}
                              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800"
                            >
                              Material #{materialId}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {nextPage && (
              <div className="pt-4">
                <button
                  onClick={() => fetchPityCosts(nextPage)}
                  disabled={loadingMore}
                  className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <>
                      <Loader className="animate-spin h-4 w-4" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More
                      <ChevronDown size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default PityCostsSection;