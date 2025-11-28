// AssignMaintenanceOverlay.tsx
import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  Wrench,
  Package,
  AlertCircle,
  CheckCircle,
  List,
  Grid,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "@/api";

interface Maintenance {
  id: number;
  order?: {
    order_code: number;
    boms: any[];
    mockup: {
      name: string;
      mockup_image: string;
    };
  };
  posted_by: {
    telegram_user_name: string;
    first_name: string;
  };
  client_name: string;
  client_contact: string;
  reported_issue: string;
  image: string | null;
  under_warranty: boolean;
  status: string;
  scheduled_start_date: string | null;
  scheduled_end_date: string | null;
  created_at: string;
}

interface TeamUser {
  id: number;
  telegram_user_name: string;
  first_name: string;
  role: Array<{
    Name: string;
  }>;
}

interface PaginationInfo {
  count: number;
  next: string | null;
  previous: string | null;
  results: Maintenance[];
}

interface AssignMaintenanceOverlayProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignMaintenanceOverlay = ({
  onClose,
  onSuccess,
}: AssignMaintenanceOverlayProps) => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "card">("card");
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    currentPage: 1,
  });

  // Assignment form state
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [scheduledStartDate, setScheduledStartDate] = useState<string>("");
  const [scheduledEndDate, setScheduledEndDate] = useState<string>("");

  useEffect(() => {
    fetchMaintenances();
    fetchUsers();
  }, []);

  const fetchMaintenances = async (url?: string) => {
    try {
      setLoading(true);
      const endpoint = url || "/api/maintenance/?status=NA";
      const response = await api.get(endpoint);
      const data: PaginationInfo = response.data;
      
      setMaintenances(data.results || []);
      setPagination(prev => ({
        ...prev,
        count: data.count,
        next: data.next,
        previous: data.previous,
        currentPage: getCurrentPage(url || "/api/maintenance/?status=NA")
      }));
    } catch (err) {
      setError("Failed to load maintenance orders");
      console.error("Error fetching maintenances:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPage = (url: string): number => {
    const urlObj = new URL(url, window.location.origin);
    const pageParam = urlObj.searchParams.get("p");
    return pageParam ? parseInt(pageParam) : 1;
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get(
        "/core/teams/?role=AssemblyDeliveryandInstalationApp"
      );
      setUsers(response.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const handleAssignMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaintenance) return;

    setAssignLoading(true);
    try {
      const assignmentData = {
        assigned_to: assignedTo || null,
        scheduled_start_date: scheduledStartDate || null,
        scheduled_end_date: scheduledEndDate || null,
      };

      await api.post(
        `/api/maintenance/${selectedMaintenance.id}/assign/`,
        assignmentData
      );

      onSuccess();
      setSelectedMaintenance(null);
      setAssignedTo("");
      setScheduledStartDate("");
      setScheduledEndDate("");
      fetchMaintenances(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to assign maintenance");
      console.error("Error assigning maintenance:", err);
    } finally {
      setAssignLoading(false);
    }
  };

  const getMinStartDate = () => {
    return new Date().toISOString().slice(0, 16);
  };

  const getMinEndDate = () => {
    if (!scheduledStartDate) return "";
    return new Date(scheduledStartDate).toISOString().slice(0, 16);
  };

  const getDaysFromNow = (dateString: string): string => {
    const now = new Date();
    const selectedDate = new Date(dateString);
    const diffTime = selectedDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays > 1) return `${diffDays} days from now`;
    return "";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePageChange = (url: string | null) => {
    if (url) {
      // Extract the path from the full URL
      const urlPath = new URL(url).pathname + new URL(url).search;
      fetchMaintenances(urlPath);
    }
  };

  if (selectedMaintenance) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-zinc-700 shadow-sm flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Assign Maintenance
            </h2>
            <button
              onClick={() => {
                setSelectedMaintenance(null);
                setAssignedTo("");
                setScheduledStartDate("");
                setScheduledEndDate("");
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Maintenance Info */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                {selectedMaintenance.order?.mockup?.name ||
                  selectedMaintenance.client_name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                <strong>Issue:</strong> {selectedMaintenance.reported_issue}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Contact:</strong> {selectedMaintenance.client_contact}
              </p>
              {selectedMaintenance.under_warranty && (
                <div className="flex items-center mt-2 text-green-600 dark:text-green-400">
                  <CheckCircle size={16} className="mr-1" />
                  <span className="text-sm">Under Warranty</span>
                </div>
              )}
            </div>

            <form onSubmit={handleAssignMaintenance} className="space-y-4">
              {/* Assigned To Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign To
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select a team member</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name || user.telegram_user_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheduled Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scheduled Start Date
                </label>
                <input
                  type="datetime-local"
                  value={scheduledStartDate}
                  onChange={(e) => setScheduledStartDate(e.target.value)}
                  min={getMinStartDate()}
                  className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                  required
                />
                {scheduledStartDate && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    {getDaysFromNow(scheduledStartDate)}
                  </p>
                )}
              </div>

              {/* Scheduled End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scheduled End Date
                </label>
                <input
                  type="datetime-local"
                  value={scheduledEndDate}
                  onChange={(e) => setScheduledEndDate(e.target.value)}
                  min={getMinEndDate()}
                  className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                  required
                />
                {scheduledEndDate && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    {getDaysFromNow(scheduledEndDate)}
                  </p>
                )}
              </div>

              {/* Selected Dates Preview */}
              {(scheduledStartDate || scheduledEndDate) && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                    Schedule Preview
                  </h4>
                  {scheduledStartDate && (
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      <strong>Start:</strong> {formatDate(scheduledStartDate)}
                    </p>
                  )}
                  {scheduledEndDate && (
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      <strong>End:</strong> {formatDate(scheduledEndDate)}
                    </p>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <AlertCircle
                    size={16}
                    className="text-red-500 dark:text-red-400 mr-2"
                  />
                  <span className="text-sm text-red-700 dark:text-red-400">
                    {error}
                  </span>
                </div>
              )}
            </form>
          </div>

          {/* Fixed Action Buttons at Bottom */}
          <div className="flex space-x-3 pt-4 mt-4 border-t border-gray-200 dark:border-zinc-600 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedMaintenance(null);
                setAssignedTo("");
                setScheduledStartDate("");
                setScheduledEndDate("");
              }}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignMaintenance}
              disabled={assignLoading || !assignedTo || !scheduledStartDate || !scheduledEndDate}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assignLoading ? "Assigning..." : "Assign Maintenance"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-zinc-700 shadow-sm flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Maintenance Orders - Not Assigned
          </h2>
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-zinc-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode("card")}
                className={`p-2 rounded ${
                  viewMode === "card"
                    ? "bg-white dark:bg-zinc-600 shadow-sm"
                    : ""
                }`}
              >
                <Grid
                  size={16}
                  className={
                    viewMode === "card"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500"
                  }
                />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${
                  viewMode === "list"
                    ? "bg-white dark:bg-zinc-600 shadow-sm"
                    : ""
                }`}
              >
                <List
                  size={16}
                  className={
                    viewMode === "list"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500"
                  }
                />
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12 flex-1">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg flex-1">
            <AlertCircle
              size={24}
              className="text-red-500 dark:text-red-400 mr-3"
            />
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && maintenances.length === 0 && (
          <div className="text-center py-12 flex-1">
            <Package
              size={48}
              className="mx-auto text-gray-400 dark:text-gray-500 mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Maintenance Orders
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              All maintenance orders have been assigned.
            </p>
          </div>
        )}

        {/* Maintenance List */}
        {!loading && maintenances.length > 0 && (
          <>
            <div
              className={`overflow-y-auto flex-1 ${
                viewMode === "card"
                  ? "max-h-[calc(90vh-180px)]"
                  : "max-h-[calc(90vh-160px)]"
              }`}
            >
              {viewMode === "card" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {maintenances.map((maintenance) => (
                    <div
                      key={maintenance.id}
                      className="bg-gray-50 dark:bg-zinc-700 rounded-lg p-4 border border-gray-200 dark:border-zinc-600 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {maintenance.order?.mockup?.name ||
                            maintenance.client_name}
                        </h3>
                        {maintenance.under_warranty && (
                          <span className="flex items-center text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                            <CheckCircle size={12} className="mr-1" />
                            Warranty
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                        {maintenance.reported_issue}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <div className="flex items-center">
                          <User size={14} className="mr-1" />
                          {maintenance.client_contact}
                        </div>
                        <div className="flex items-center">
                          <Clock size={14} className="mr-1" />
                          {new Date(maintenance.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedMaintenance(maintenance)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
                      >
                        <Wrench size={16} className="mr-2" />
                        Assign Maintenance
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {maintenances.map((maintenance) => (
                    <div
                      key={maintenance.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-700 rounded-lg border border-gray-200 dark:border-zinc-600 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {maintenance.order?.mockup?.name ||
                              maintenance.client_name}
                          </h3>
                          {maintenance.under_warranty && (
                            <span className="flex items-center text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                              <CheckCircle size={12} className="mr-1" />
                              Warranty
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                          {maintenance.reported_issue}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <User size={14} className="mr-1" />
                            {maintenance.client_contact}
                          </span>
                          <span className="flex items-center">
                            <Clock size={14} className="mr-1" />
                            {new Date(
                              maintenance.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedMaintenance(maintenance)}
                        className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
                      >
                        <Wrench size={16} className="mr-2" />
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {(pagination.next || pagination.previous) && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200 dark:border-zinc-600 flex-shrink-0">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {maintenances.length} of {pagination.count} orders
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.previous)}
                    disabled={!pagination.previous}
                    className="p-2 border border-gray-300 dark:border-zinc-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300 px-3">
                    Page {pagination.currentPage}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.next)}
                    disabled={!pagination.next}
                    className="p-2 border border-gray-300 dark:border-zinc-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};