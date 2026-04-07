// AssignAssemblyOverlay.tsx
import { useState, useEffect } from "react";
import {
  X,
  Wrench,
  Calendar,
  AlertCircle,
  CheckCircle,
  Users,
  ChevronDown,
  Loader2,
  Package,
  Truck,
} from "lucide-react";
import api from "@/api";

interface Order {
  id: number;
  order_code: number;
  order_name?: string;
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [deliveryDateMap, setDeliveryDateMap] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchOrders(1, true);
    fetchTeamMembers();
    fetchDeliveryDates();
  }, []);

  const fetchOrders = async (page: number, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      const response = await api.get(
        `/api/orders/?order_status=PRE-ACCEPTED%2CPRE-CONFIRMED%2CCNC-STARTED%2CCNC-COMPLETED&has_cutting_file=true&has_assembly_assign=false&p=${page}`
      );

      const newResults = response.data.results || [];
      const count = response.data.count || 0;

      if (reset) {
        setOrders(newResults);
      } else {
        setOrders((prev) => [...prev, ...newResults]);
      }

      setTotalCount(count);
      setCurrentPage(page);
      setHasMore(response.data.next !== null);
    } catch (err) {
      setError("Failed to fetch orders ready for assembly");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
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

  const fetchDeliveryDates = async () => {
    try {
      // Fetch all order containers to build a lookup map of order_code -> delivery_date
      let allContainers: any[] = [];
      let page = 1;
      let hasNextPage = true;
      while (hasNextPage) {
        const response = await api.get(`/api/order-container/?p=${page}`);
        const results = response.data.results || [];
        allContainers = [...allContainers, ...results];
        hasNextPage = response.data.next !== null;
        page++;
        if (page > 20) break; // Safety limit
      }
      const map: Record<number, string> = {};
      allContainers.forEach((container: any) => {
        if (container.delivery_date && container.orders) {
          container.orders.forEach((order: any) => {
            map[order.order_code] = container.delivery_date;
          });
        }
      });
      setDeliveryDateMap(map);
    } catch (err) {
      console.error("Error fetching delivery dates:", err);
    }
  };

  const handleLoadMore = () => {
    fetchOrders(currentPage + 1, false);
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

      await api.post("/api/assembly-assign/", payload);

      setSuccess(
        `Assembly task for ORD-${selectedOrder.order_code} assigned successfully!`
      );

      setTimeout(() => {
        fetchOrders(1, true);
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
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return `${Math.abs(diffDays)} day(s) ago`;
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

  const getOrderStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      "PRE-ACCEPTED": { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", label: "Payment Pending" },
      "PRE-CONFIRMED": { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", label: "Confirmed" },
      "CNC-STARTED": { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300", label: "Cutting" },
      "CNC-COMPLETED": { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", label: "Cut Done" },
    };
    const s = map[status] || { bg: "bg-gray-100 dark:bg-zinc-700", text: "text-gray-700 dark:text-gray-300", label: status.replace("-", " ") };
    return s;
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto overscroll-contain">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-800 flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-zinc-700 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-50 dark:bg-green-900/20">
              <Wrench className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Assign Assembly
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {totalCount} orders available
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && !selectedOrder && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl mb-4">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {success && !selectedOrder && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl mb-4">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-green-700 dark:text-green-300 text-sm">{success}</p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-green-600 dark:text-green-400 animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="p-4 rounded-2xl bg-gray-100 dark:bg-zinc-700">
                <Package className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                No Orders Ready
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
                All orders have been assigned or are not ready yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const statusBadge = getOrderStatusBadge(order.order_status);

                return (
                  <div
                    key={order.id}
                    className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden"
                  >
                    <div className="p-4">
                      {/* Order Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Mockup thumbnail */}
                          {order.mockup?.mockup_image && (
                            <img
                              src={order.mockup.mockup_image}
                              alt="Mockup"
                              className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-zinc-600 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                              ORD-{order.order_code}
                            </h4>
                            {order.order_name && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                {order.order_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0 ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.label}
                        </span>
                      </div>

                      {/* Order Details */}
                      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 dark:text-gray-400 mb-3">
                        {order.boms.length > 0 && (
                          <span>
                            {order.boms[0].width} × {order.boms[0].height}
                          </span>
                        )}
                        <span>
                          {order.cutting_files.length} cut file(s)
                        </span>
                        <span>
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Delivery Date from Order Container */}
                      {deliveryDateMap[order.order_code] && (
                        <div className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-lg mb-3">
                          <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                            Delivery: {new Date(deliveryDateMap[order.order_code]).toLocaleDateString()} ({getRelativeDate(deliveryDateMap[order.order_code])})
                          </span>
                        </div>
                      )}

                      {/* Assign Button */}
                      <button
                        onClick={() => openAssignmentForm(order)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 active:scale-[0.98] transition-all"
                      >
                        <Wrench className="w-4 h-4" />
                        <span>Assign Assembly</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Load More Button */}
              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>Load More</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Form Overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60]">
          <div className="bg-white dark:bg-zinc-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto overscroll-contain">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-zinc-800 flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-zinc-700 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-green-50 dark:bg-green-900/20">
                  <Wrench className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Assign Assembly
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    ORD-{selectedOrder.order_code}
                    {selectedOrder.order_name && ` — ${selectedOrder.order_name}`}
                  </p>
                </div>
              </div>
              <button
                onClick={closeAssignmentForm}
                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Assignment Form */}
            <div className="p-4 space-y-4">
              {/* Delivery Date Banner */}
              {selectedOrder && deliveryDateMap[selectedOrder.order_code] && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-xl">
                  <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Order Delivery Date</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold">
                      {new Date(deliveryDateMap[selectedOrder.order_code]).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      <span className="text-xs font-normal text-blue-600 dark:text-blue-400 ml-2">
                        ({getRelativeDate(deliveryDateMap[selectedOrder.order_code])})
                      </span>
                    </p>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                  <p className="text-green-700 dark:text-green-300 text-sm">{success}</p>
                </div>
              )}

              {/* Team Members Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign To Team Members *
                </label>
                <div className="max-h-48 overflow-y-auto overscroll-contain border border-gray-200 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-900">
                  {teamMembers.length === 0 ? (
                    <div className="flex items-center justify-center py-6 text-sm text-gray-400 dark:text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading team members...
                    </div>
                  ) : (
                    teamMembers.map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer border-b border-gray-100 dark:border-zinc-700 last:border-b-0 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.id)}
                          onChange={() => handleMemberToggle(member.id)}
                          className="w-4 h-4 text-green-600 rounded border-gray-300 dark:border-zinc-600 focus:ring-green-500"
                        />
                        <div className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20">
                          <Users className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {member.first_name || `@${member.telegram_user_name}`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            @{member.telegram_user_name}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                {selectedMembers.length > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                    {selectedMembers.length} member(s) selected
                  </p>
                )}
              </div>

              {/* Schedule Dates */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Schedule Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleStartDate}
                    onChange={(e) => setScheduleStartDate(e.target.value)}
                    min={getMinStartDate()}
                    className="w-full h-11 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  />
                  {scheduleStartDate && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {getRelativeDate(scheduleStartDate)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Schedule Complete Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleCompleteDate}
                    onChange={(e) => setScheduleCompleteDate(e.target.value)}
                    min={getMinCompleteDate()}
                    className="w-full h-11 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  />
                  {scheduleCompleteDate && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {getRelativeDate(scheduleCompleteDate)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons - Sticky Bottom */}
            <div className="sticky bottom-0 bg-white dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 px-4 py-4 flex gap-3">
              <button
                onClick={closeAssignmentForm}
                className="flex-1 h-11 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
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
                className="flex-1 h-11 flex items-center justify-center gap-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors"
              >
                {assigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
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
      )}
    </div>
  );
};
