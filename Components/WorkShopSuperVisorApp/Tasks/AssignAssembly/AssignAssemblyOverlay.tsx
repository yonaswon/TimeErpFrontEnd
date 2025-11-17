// AssignAssemblyOverlay.tsx
import { useState, useEffect } from "react";
import {
  X,
  Wrench,
  User,
  Calendar,
  Package,
  AlertCircle,
  CheckCircle,
  Users,
} from "lucide-react";
import api from "@/api";

interface Order {
  id: number;
  order_code: number;
  boms: Bom[];
  mockup: Mockup | null;
  cutting_files: CuttingFile[];
  order_status: string;
  mockup_image: string | null;
  price: number;
  pre_accepted_date: string;
  created_at: string;
  design_type: number;
}

interface Bom {
  id: number;
  amount: string;
  width: string;
  height: string;
  price_per_unit: string;
  total_price: string;
  estimated_price: string;
  date: string;
  material: number;
}

interface Mockup {
  id: number;
  mockup_image: string;
  note: string;
  designer: Designer;
}

interface Designer {
  id: number;
  telegram_user_name: string;
  role: Role[];
}

interface Role {
  id: number;
  Name: string;
}

interface CuttingFile {
  id: number;
  crv3d: string;
  image: string;
  status: string;
  schedule_start_date: string | null;
  schedule_complate_date: string | null;
  start_date: string | null;
  complate_date: string | null;
}

interface TeamMember {
  id: number;
  telegram_id: number;
  telegram_user_name: string;
  role: Role[];
  first_name: string;
}

interface AssignAssemblyOverlayProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignAssemblyOverlay = ({
  onClose,
  onSuccess,
}: AssignAssemblyOverlayProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [scheduleStartDate, setScheduleStartDate] = useState<string>("");
  const [scheduleCompleteDate, setScheduleCompleteDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrders();
    fetchTeamMembers();
  }, [currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(
        `/api/orders/?order_status=PRE-ACCEPTED%2CPRE-CONFIRMED%2CCNC-STARTED%2CCNC-COMPLETED&has_cutting_file=true&has_assembly_assign=false&p=${currentPage}`
      );

      console.log("Orders fetched:", response.data.results);
      setOrders(response.data.results || []);
      setTotalPages(Math.ceil(response.data.count / 10));
    } catch (err) {
      setError("Failed to fetch orders ready for assembly");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await api.get(
        "/core/teams/?role=AssemblyDeliveryandInstalationApp"
      );
      setTeamMembers(response.data);
    } catch (err) {
      console.error("Error fetching team members:", err);
    }
  };

  const handleMemberToggle = (memberId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleAssign = async () => {
    if (!selectedOrder) {
      setError("No order selected");
      return;
    }

    if (
      selectedMembers.length === 0 ||
      !scheduleStartDate ||
      !scheduleCompleteDate
    ) {
      setError("Please select at least one team member and set schedule dates");
      return;
    }

    // Validate dates
    const startDate = new Date(scheduleStartDate);
    const completeDate = new Date(scheduleCompleteDate);
    const now = new Date();

    if (startDate <= now) {
      setError("Start date must be in the future");
      return;
    }

    if (completeDate <= startDate) {
      setError("Completion date must be after start date");
      return;
    }

    try {
      setAssigning(true);
      setError(null);

      const payload = {
        order: selectedOrder.id || selectedOrder.order_code,
        assigned_to: selectedMembers,
        schedule_start_date: startDate.toISOString(),
        schedule_complate_date: completeDate.toISOString(),
        start_date: null,
        complate_date: null,
        status: "ASSIGNED",
      };

      console.log(payload, "payload .....", selectedOrder, "selected order ");
      console.log("Sending assignment payload:", payload);

      const response = await api.post("/api/assembly-assign/", payload);

      setSuccess(
        `Assembly task for ORD-${selectedOrder.order_code} assigned successfully!`
      );

      // Refresh the list and close overlay
      setTimeout(() => {
        fetchOrders();
        setSelectedOrder(null);
        setSelectedMembers([]);
        setScheduleStartDate("");
        setScheduleCompleteDate("");
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      console.error("Assignment error:", err);

      if (err.response?.data) {
        if (typeof err.response.data === "object") {
          setError(`Assignment failed: ${JSON.stringify(err.response.data)}`);
        } else {
          setError(`Assignment failed: ${err.response.data}`);
        }
      } else {
        setError("Failed to assign assembly task. Please try again.");
      }
    } finally {
      setAssigning(false);
    }
  };

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === 2) return "2 days from now";
    if (diffDays === 3) return "3 days from now";
    return `${diffDays} days from now`;
  };

  const getMinStartDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const getMinCompleteDate = () => {
    if (!scheduleStartDate) return getMinStartDate();
    return scheduleStartDate;
  };

  const getLatestCuttingCompletion = (cuttingFiles: CuttingFile[]) => {
    if (!cuttingFiles.length) return null;

    const completionDates = cuttingFiles
      .map((file) => file.schedule_complate_date)
      .filter(Boolean)
      .map((date) => new Date(date!));

    if (!completionDates.length) return null;

    return new Date(Math.max(...completionDates.map((d) => d.getTime())));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openAssignmentForm = (order: Order) => {
    setSelectedOrder(order);
    setSelectedMembers([]);
    setScheduleStartDate("");
    setScheduleCompleteDate("");
    setError(null);
    setSuccess(null);
  };

  const closeAssignmentForm = () => {
    setSelectedOrder(null);
    setSelectedMembers([]);
    setScheduleStartDate("");
    setScheduleCompleteDate("");
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-3 text-center">
            Loading orders...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-3">
            <Wrench className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Assign Assembly Tasks
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Assign assembly tasks to team members
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Orders Ready for Assembly
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                All orders have been assigned to assembly or are not ready yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const latestCuttingCompletion = getLatestCuttingCompletion(
                  order.cutting_files
                );

                return (
                  <div
                    key={order.id}
                    className="bg-gray-50 dark:bg-zinc-700 rounded-lg p-4 border border-gray-200 dark:border-zinc-600"
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Order Preview */}
                      {order.mockup?.mockup_image && (
                        <div className="shrink-0">
                          <img
                            src={order.mockup.mockup_image}
                            alt="Order mockup"
                            className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                          />
                        </div>
                      )}

                      {/* Order Information */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              ORD-{order.order_code}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Created:{" "}
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            {order.mockup?.note && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {order.mockup.note}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.order_status === "PRE-ACCEPTED"
                                ? "bg-yellow-100 text-yellow-800"
                                : order.order_status === "PRE-CONFIRMED"
                                ? "bg-blue-100 text-blue-800"
                                : order.order_status === "CNC-STARTED"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {order.order_status.replace("-", " ")}
                          </span>
                        </div>

                        {/* Order Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Product Details
                            </h5>
                            {order.boms.map((bom) => (
                              <div
                                key={bom.id}
                                className="text-sm text-gray-600 dark:text-gray-400"
                              >
                                Size: {bom.width} x {bom.height} | Price: $
                                {order.price}
                              </div>
                            ))}
                          </div>

                          <div>
                            <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Cutting Status
                            </h5>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {order.cutting_files.length} cutting file(s)
                              {latestCuttingCompletion && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                  Latest completion:{" "}
                                  {latestCuttingCompletion.toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Assign Button */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => openAssignmentForm(order)}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Wrench className="w-4 h-4" />
                            <span>Assign Assembly</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      currentPage === page
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-zinc-700 dark:text-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Form Overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
              <div className="flex items-center space-x-3">
                <Wrench className="w-6 h-6 text-green-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Assign Assembly
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    ORD-{selectedOrder.order_code}
                  </p>
                </div>
              </div>
              <button
                onClick={closeAssignmentForm}
                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Assignment Form */}
            <div className="p-6">
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Team Members Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assign To Team Members *
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800">
                    {teamMembers.map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center space-x-2 p-3 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer border-b border-gray-100 dark:border-zinc-600 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.id)}
                          onChange={() => handleMemberToggle(member.id)}
                          className="text-green-600 rounded"
                        />
                        <Users className="w-4 h-4 text-green-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            @{member.telegram_user_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {member.role.map((r) => r.Name).join(", ")}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedMembers.length > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      {selectedMembers.length} member(s) selected
                    </p>
                  )}
                </div>

                {/* Schedule Dates */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Schedule Start Date *
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduleStartDate}
                      onChange={(e) => setScheduleStartDate(e.target.value)}
                      min={getMinStartDate()}
                      className="w-full p-3 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                    />
                    {scheduleStartDate && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {getRelativeDate(scheduleStartDate)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Schedule Complete Date *
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduleCompleteDate}
                      onChange={(e) => setScheduleCompleteDate(e.target.value)}
                      min={getMinCompleteDate()}
                      className="w-full p-3 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                    />
                    {scheduleCompleteDate && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {getRelativeDate(scheduleCompleteDate)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeAssignmentForm}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={
                    assigning ||
                    selectedMembers.length === 0 ||
                    !scheduleStartDate ||
                    !scheduleCompleteDate
                  }
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {assigning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <>
                      <Wrench className="w-4 h-4" />
                      <span>Assign Task</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
