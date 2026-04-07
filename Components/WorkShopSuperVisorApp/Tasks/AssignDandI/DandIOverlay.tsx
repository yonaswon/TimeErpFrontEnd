// Tasks/AssignDandI/DandIOverlay.tsx
import { useState, useEffect } from "react";
import { Truck, Users, MapPin, Phone, AlertCircle, CheckCircle, X, Package, CheckCircle2, XCircle, Loader2, ChevronDown } from "lucide-react";
import api from "@/api";

interface OrderContainer {
  id: number;
  orders: Array<{
    order_code: number;
    order_name?: string;
    boms: Array<{ id: number; amount: string; width: string; height: string; price_per_unit: string; total_price: string; estimated_price: string; date: string; material: number; }>;
    mockup: { id: number; reference_images: Array<{ id: number; image: string; date: string; }>; mockup_image: string; width: string; design_type: number; request_status: string; };
    cutting_files: Array<{ id: number; status: string; schedule_start_date: string; schedule_complate_date: string; start_date: string | null; complate_date: string | null; }>;
    order_status: string;
    price: number;
    design_type: number;
  }>;
  posted_by: { id: number; telegram_user_name: string; role: Array<{ id: number; Name: string; date: string; }>; };
  client: string;
  contact: string;
  location: string;
  delivery_date: string;
  invoice: boolean;
  full_payment: number;
  special_requerment: string;
  advance_payment: string;
  remaining_payment: string;
  instalation_service: boolean;
  order_difficulty: string;
  note: string;
  delivery_service: boolean;
  created_at: string;
  updated_at: string | null;
  lead: number;
}

interface TeamMember {
  id: number;
  telegram_id: number;
  telegram_user_name: string;
  role: Array<{ id: number; Name: string; date: string; }>;
  first_name: string;
}

interface DandIOverlayProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const DandIOverlay = ({ onClose, onSuccess }: DandIOverlayProps) => {
  const [containers, setContainers] = useState<OrderContainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [assignOverlay, setAssignOverlay] = useState<{ isOpen: boolean; container: OrderContainer | null; }>({ isOpen: false, container: null });

  useEffect(() => { fetchOrderContainers(1, true); }, []);

  const fetchOrderContainers = async (page: number, reset: boolean = false) => {
    try {
      if (reset) { setLoading(true); } else { setLoadingMore(true); }
      setError(null);
      const response = await api.get(`/api/order-container/?is_assigned=false&p=${page}`);
      const newResults = response.data.results || [];
      if (reset) { setContainers(newResults); } else { setContainers(prev => [...prev, ...newResults]); }
      setTotalCount(response.data.count || 0);
      setCurrentPage(page);
      setHasMore(response.data.next !== null);
    } catch (err: any) {
      setError("Failed to fetch order containers");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const getRelativeDate = (dateString: string) => {
    const diffDays = Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 0) return `${diffDays} days from now`;
    return `${Math.abs(diffDays)} days ago`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto overscroll-contain">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-800 flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-zinc-700 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20">
              <Truck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assign D&I</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{totalCount} containers available</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl mb-4">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading containers...</p>
            </div>
          ) : containers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="p-4 rounded-2xl bg-gray-100 dark:bg-zinc-700">
                <Truck className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">No Orders Available</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">All orders have been assigned for delivery.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {containers.map((container) => {
                const allCompleted = container.orders.every(o => o.order_status === "ASSEMBLY-COMPLETED");
                const completedCount = container.orders.filter(o => o.order_status === "ASSEMBLY-COMPLETED").length;
                const totalOrders = container.orders.length;

                return (
                  <div key={container.id} className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {container.client}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {totalOrders} order(s) • {container.contact}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0 ${
                          allCompleted
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                        }`}>
                          {allCompleted ? "Ready" : `${completedCount}/${totalOrders} Done`}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          <span className="truncate">{container.location}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                          <span>Delivery: {getRelativeDate(container.delivery_date)}</span>
                        </div>
                      </div>

                      {/* Services */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {container.delivery_service && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">Delivery</span>
                        )}
                        {container.instalation_service && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Installation</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          container.order_difficulty === "HIGH" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                          : container.order_difficulty === "MEDIUM" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                          : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        }`}>{container.order_difficulty}</span>
                      </div>

                      {/* Orders */}
                      <div className="space-y-1.5 mb-3">
                        {container.orders.map((order) => (
                          <div key={order.order_code} className={`flex items-center justify-between text-xs p-2 rounded-lg ${
                            order.order_status === "ASSEMBLY-COMPLETED"
                              ? "bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40"
                              : "bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/40"
                          }`}>
                            <div className="flex items-center gap-1.5 min-w-0">
                              {order.order_status === "ASSEMBLY-COMPLETED"
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                : <XCircle className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
                              }
                              <span className="font-medium text-gray-900 dark:text-white truncate">
                                ORD-{order.order_code}
                                {order.order_name && <span className="font-normal text-gray-500 dark:text-gray-400"> — {order.order_name}</span>}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Warning */}
                      {!allCompleted && (
                        <div className="flex items-center gap-2 p-2.5 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/40 rounded-lg mb-3">
                          <AlertCircle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                          <p className="text-yellow-700 dark:text-yellow-300 text-xs">
                            {totalOrders - completedCount} order(s) still need assembly completion
                          </p>
                        </div>
                      )}

                      {/* Assign Button */}
                      <button
                        onClick={() => setAssignOverlay({ isOpen: true, container })}
                        disabled={!allCompleted}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-[0.98] ${
                          allCompleted
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                        <span>{allCompleted ? "Assign D&I" : "Waiting for Assembly"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Load More */}
              {hasMore && (
                <button onClick={() => fetchOrderContainers(currentPage + 1, false)} disabled={loadingMore}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all disabled:opacity-50">
                  {loadingMore ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Loading...</span></> : <><ChevronDown className="w-4 h-4" /><span>Load More</span></>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assign Sub-Overlay */}
      {assignOverlay.isOpen && assignOverlay.container && (
        <AssignSubOverlay
          container={assignOverlay.container}
          onClose={() => setAssignOverlay({ isOpen: false, container: null })}
          onSuccess={() => {
            fetchOrderContainers(1, true);
            setAssignOverlay({ isOpen: false, container: null });
            onSuccess?.();
          }}
          getRelativeDate={getRelativeDate}
        />
      )}
    </div>
  );
};

// Assign Sub-Overlay
const AssignSubOverlay = ({
  container,
  onClose,
  onSuccess,
  getRelativeDate,
}: {
  container: OrderContainer;
  onClose: () => void;
  onSuccess: () => void;
  getRelativeDate: (d: string) => string;
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [scheduleStartDate, setScheduleStartDate] = useState<string>("");
  const [scheduleCompleteDate, setScheduleCompleteDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingTeam, setFetchingTeam] = useState(true);

  useEffect(() => { fetchTeamMembers(); }, []);

  const fetchTeamMembers = async () => {
    try {
      setFetchingTeam(true);
      const response = await api.get("/core/teams/?role=AssemblyDeliveryandInstalationApp");
      setTeamMembers(response.data);
    } catch (err) {
      setError("Failed to fetch team members");
    } finally {
      setFetchingTeam(false);
    }
  };

  const handleMemberToggle = (memberId: number) => {
    setSelectedMembers(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const handleAssign = async () => {
    if (selectedMembers.length === 0 || !scheduleStartDate || !scheduleCompleteDate) { setError("Please select team members and set dates"); return; }
    const startDate = new Date(scheduleStartDate);
    const completeDate = new Date(scheduleCompleteDate);
    if (startDate <= new Date()) { setError("Start date must be in the future"); return; }
    if (completeDate <= startDate) { setError("Completion date must be after start date"); return; }
    try {
      setLoading(true);
      setError(null);
      await api.post("/api/dandi/", {
        order_container: container.id,
        assigned_to: selectedMembers,
        schedule_start_date: startDate.toISOString(),
        schedule_complate_date: completeDate.toISOString(),
        status: "ASSIGNED",
      });
      onSuccess();
    } catch (err: any) {
      setError("Failed to assign task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getMinStartDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60]">
      <div className="bg-white dark:bg-zinc-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto overscroll-contain">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-800 flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-zinc-700 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20">
              <Truck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assign D&I</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{container.client}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Team Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign To *</label>
            <div className="max-h-48 overflow-y-auto overscroll-contain border border-gray-200 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-900">
              {fetchingTeam ? (
                <div className="flex items-center justify-center py-6 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin mr-2" />Loading...</div>
              ) : (
                teamMembers.map((member) => (
                  <label key={member.id} className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer border-b border-gray-100 dark:border-zinc-700 last:border-b-0 transition-colors">
                    <input type="checkbox" checked={selectedMembers.includes(member.id)} onChange={() => handleMemberToggle(member.id)}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300 dark:border-zinc-600 focus:ring-purple-500" />
                    <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20"><Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{member.first_name || `@${member.telegram_user_name}`}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">@{member.telegram_user_name}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
            {selectedMembers.length > 0 && <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium">{selectedMembers.length} member(s) selected</p>}
          </div>

          {/* Dates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date *</label>
            <input type="datetime-local" value={scheduleStartDate} onChange={(e) => setScheduleStartDate(e.target.value)} min={getMinStartDate()}
              className="w-full h-11 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
            {scheduleStartDate && <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{getRelativeDate(scheduleStartDate)}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Complete Date *</label>
            <input type="datetime-local" value={scheduleCompleteDate} onChange={(e) => setScheduleCompleteDate(e.target.value)} min={scheduleStartDate || getMinStartDate()}
              className="w-full h-11 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
            {scheduleCompleteDate && <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{getRelativeDate(scheduleCompleteDate)}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 px-4 py-4 flex gap-3">
          <button onClick={onClose} className="flex-1 h-11 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors">Cancel</button>
          <button onClick={handleAssign} disabled={loading || selectedMembers.length === 0 || !scheduleStartDate || !scheduleCompleteDate}
            className="flex-1 h-11 flex items-center justify-center gap-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Assigning...</span></> : <><Truck className="w-4 h-4" /><span>Assign</span></>}
          </button>
        </div>
      </div>
    </div>
  );
};

interface TeamMember {
  id: number;
  telegram_id: number;
  telegram_user_name: string;
  role: Array<{ id: number; Name: string; date: string; }>;
  first_name: string;
}
