// AssignedMaintenance.tsx
import { useState, useEffect } from "react";
import {
  Clock,
  User,
  Phone,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "@/api";

interface Maintenance {
  id: number;
  order?: {
    order_code: number;
    mockup: {
      name: string;
      mockup_image: string;
    };
  };
  client_name: string;
  client_contact: string;
  reported_issue: string;
  image: string | null;
  under_warranty: boolean;
  payment_status: string | null;
  status: string;
  scheduled_start_date: string | null;
  scheduled_end_date: string | null;
  created_at: string;
}

interface AssignedMaintenanceProps {
  userId: number;
}

export const AssignedMaintenance = ({ userId }: AssignedMaintenanceProps) => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    currentPage: 1,
  });

  useEffect(() => {
    fetchMaintenances();
  }, [userId]);

  const fetchMaintenances = async (url?: string) => {
    try {
      setLoading(true);
      setError(null);

      const endpoint =
        url || `/api/maintenance/?status=A&assigned_to=${userId}`;
      const response = await api.get(endpoint);
      const data = response.data;

      setMaintenances(data.results || []);
      setPagination((prev) => ({
        ...prev,
        count: data.count,
        next: data.next,
        previous: data.previous,
        currentPage: getCurrentPage(url || endpoint),
      }));
    } catch (err) {
      setError("Failed to fetch assigned maintenance tasks");
      console.error("Error fetching maintenances:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPage = (url: string): number => {
    const urlObj = new URL(url, window.location.origin);
    const pageParam = urlObj.searchParams.get("page");
    return pageParam ? parseInt(pageParam) : 1;
  };

  const handleStartMaintenance = async (maintenanceId: number) => {
    setStartingId(maintenanceId);
    try {
      await api.post(`/api/maintenance/${maintenanceId}/start/`);
      // Refresh the list
      fetchMaintenances();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to start maintenance");
      console.error("Error starting maintenance:", err);
    } finally {
      setStartingId(null);
    }
  };

  const handlePageChange = (url: string | null) => {
    if (url) {
      const urlPath = new URL(url).pathname + new URL(url).search;
      fetchMaintenances(urlPath);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not scheduled";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysFromNow = (dateString: string | null): string => {
    if (!dateString) return "";
    const now = new Date();
    const selectedDate = new Date(dateString);
    const diffTime = selectedDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays > 1) return `${diffDays} days from now`;
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    return "";
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-3">
          Loading assigned maintenance tasks...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-gray-200 dark:border-zinc-700 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={() => fetchMaintenances()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (maintenances.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Assigned Tasks
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have any maintenance tasks assigned to you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Maintenance Tasks Grid - Mobile First */}
      <div className="space-y-3">
        {maintenances.map((maintenance) => (
          <div
            key={maintenance.id}
            className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                  {maintenance.order?.mockup?.name || maintenance.client_name}
                </h3>
                {maintenance.order && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Order #{maintenance.order.order_code}
                  </p>
                )}
              </div>
              {maintenance.under_warranty && (
                <span className="flex items-center text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded-full ml-2 shrink-0">
                  <CheckCircle size={12} className="mr-1" />
                  Warranty
                </span>
              )}
            </div>

            {/* Issue Description */}
            <div className="mb-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {maintenance.reported_issue}
              </p>
            </div>

            {/* Client Info */}
            <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
              <div className="flex items-center space-x-1">
                <User size={14} />
                <span>{maintenance.client_name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Phone size={14} />
                <span>{maintenance.client_contact}</span>
              </div>
            </div>

            {/* Schedule Info */}
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Start:</span>
                <div className="text-right">
                  <span className="text-gray-900 dark:text-white">
                    {formatDate(maintenance.scheduled_start_date)}
                  </span>
                  {maintenance.scheduled_start_date && (
                    <span className="block text-xs text-blue-600 dark:text-blue-400">
                      {getDaysFromNow(maintenance.scheduled_start_date)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">End:</span>
                <div className="text-right">
                  <span className="text-gray-900 dark:text-white">
                    {formatDate(maintenance.scheduled_end_date)}
                  </span>
                  {maintenance.scheduled_end_date && (
                    <span className="block text-xs text-blue-600 dark:text-blue-400">
                      {getDaysFromNow(maintenance.scheduled_end_date)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => handleStartMaintenance(maintenance.id)}
              disabled={
                startingId === maintenance.id ||
                (maintenance.payment_status !== "C" &&
                  maintenance.payment_status !== null &&
                  !maintenance.under_warranty)
              }
              className={`w-full py-3 px-4 rounded-lg transition-colors text-sm font-medium ${
                maintenance.payment_status === "C" ||
                maintenance.payment_status === null ||
                maintenance.under_warranty
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 dark:bg-zinc-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {startingId === maintenance.id ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Starting...
                </div>
              ) : maintenance.payment_status === "A" &&
                !maintenance.under_warranty ? (
                "Waiting for Payment"
              ) : (
                "Start Maintenance"
              )}
            </button>

            {/* Payment Status Message */}
            {maintenance.payment_status === "A" &&
              !maintenance.under_warranty && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 text-center">
                  Payment accepted - waiting for confirmation
                </p>
              )}
          </div>
        ))}
      </div>

      {/* Pagination - Mobile Friendly */}
      {(pagination.next || pagination.previous) && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-zinc-600">
          <button
            onClick={() => handlePageChange(pagination.previous)}
            disabled={!pagination.previous}
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 text-sm"
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300 px-4">
            {pagination.currentPage}
          </span>
          <button
            onClick={() => handlePageChange(pagination.next)}
            disabled={!pagination.next}
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 text-sm"
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
