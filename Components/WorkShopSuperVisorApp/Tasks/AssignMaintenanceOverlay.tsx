// AssignMaintenanceOverlay.tsx
import { useState, useEffect } from "react";
import { X, Clock, User, Wrench, Package, AlertCircle, CheckCircle, Loader2, ChevronDown } from "lucide-react";
import api from "@/api";

interface Maintenance {
  id: number;
  order?: { order_code: number; boms: any[]; mockup: { name: string; mockup_image: string; }; };
  posted_by: { telegram_user_name: string; first_name: string; };
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

interface TeamUser { id: number; telegram_user_name: string; first_name: string; role: Array<{ Name: string; }>; }
interface PaginationInfo { count: number; next: string | null; previous: string | null; results: Maintenance[]; }

interface AssignMaintenanceOverlayProps { onClose: () => void; onSuccess: () => void; }

export const AssignMaintenanceOverlay = ({ onClose, onSuccess }: AssignMaintenanceOverlayProps) => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [assignedTo, setAssignedTo] = useState<string>("");
  const [scheduledStartDate, setScheduledStartDate] = useState<string>("");
  const [scheduledEndDate, setScheduledEndDate] = useState<string>("");

  useEffect(() => { fetchMaintenances(1, true); fetchUsers(); }, []);

  const fetchMaintenances = async (page: number, reset: boolean = false) => {
    try {
      if (reset) { setLoading(true); } else { setLoadingMore(true); }
      setError(null);
      const response = await api.get(`/api/maintenance/?status=NA&p=${page}`);
      const data: PaginationInfo = response.data;
      if (reset) { setMaintenances(data.results || []); } else { setMaintenances(prev => [...prev, ...(data.results || [])]); }
      setTotalCount(data.count || 0);
      setCurrentPage(page);
      setHasMore(data.next !== null);
    } catch (err) {
      setError("Failed to load maintenance orders");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/core/teams/?role=AssemblyDeliveryandInstalationApp");
      setUsers(response.data || []);
    } catch (err) { console.error("Error fetching users:", err); }
  };

  const handleAssignMaintenance = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedMaintenance) return;
    setAssignLoading(true);
    try {
      await api.post(`/api/maintenance/${selectedMaintenance.id}/assign/`, {
        assigned_to: assignedTo || null,
        scheduled_start_date: scheduledStartDate || null,
        scheduled_end_date: scheduledEndDate || null,
      });
      onSuccess();
      setSelectedMaintenance(null);
      setAssignedTo("");
      setScheduledStartDate("");
      setScheduledEndDate("");
      fetchMaintenances(1, true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to assign maintenance");
    } finally {
      setAssignLoading(false);
    }
  };

  const getMinStartDate = () => new Date().toISOString().slice(0, 16);
  const getMinEndDate = () => scheduledStartDate ? new Date(scheduledStartDate).toISOString().slice(0, 16) : "";
  const getDaysFromNow = (dateString: string): string => {
    const diffDays = Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today"; if (diffDays === 1) return "Tomorrow"; if (diffDays > 1) return `${diffDays} days from now`; return "";
  };

  // Assignment form view
  if (selectedMaintenance) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
        <div className="bg-white dark:bg-zinc-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto overscroll-contain">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-zinc-800 flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-zinc-700 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-900/20">
                <Wrench className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assign Maintenance</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedMaintenance.client_name}</p>
              </div>
            </div>
            <button onClick={() => { setSelectedMaintenance(null); setAssignedTo(""); setScheduledStartDate(""); setScheduledEndDate(""); }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Maintenance Info */}
            <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl p-3 border border-gray-200 dark:border-zinc-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {selectedMaintenance.order?.mockup?.name || selectedMaintenance.client_name}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Issue:</strong> {selectedMaintenance.reported_issue}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5"><strong>Contact:</strong> {selectedMaintenance.client_contact}</p>
              {selectedMaintenance.under_warranty && (
                <div className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
                  <CheckCircle className="w-3 h-3" /> Under Warranty
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Assign To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign To *</label>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} required
                className="w-full h-11 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all">
                <option value="">Select a team member</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.first_name || u.telegram_user_name}</option>)}
              </select>
            </div>

            {/* Dates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date *</label>
              <input type="datetime-local" value={scheduledStartDate} onChange={(e) => setScheduledStartDate(e.target.value)} min={getMinStartDate()} required
                className="w-full h-11 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
              {scheduledStartDate && <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{getDaysFromNow(scheduledStartDate)}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date *</label>
              <input type="datetime-local" value={scheduledEndDate} onChange={(e) => setScheduledEndDate(e.target.value)} min={getMinEndDate()} required
                className="w-full h-11 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
              {scheduledEndDate && <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{getDaysFromNow(scheduledEndDate)}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 px-4 py-4 flex gap-3">
            <button onClick={() => { setSelectedMaintenance(null); setAssignedTo(""); setScheduledStartDate(""); setScheduledEndDate(""); }}
              className="flex-1 h-11 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors">Cancel</button>
            <button onClick={() => handleAssignMaintenance()} disabled={assignLoading || !assignedTo || !scheduledStartDate || !scheduledEndDate}
              className="flex-1 h-11 flex items-center justify-center gap-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors">
              {assignLoading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Assigning...</span></> : <><Wrench className="w-4 h-4" /><span>Assign</span></>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto overscroll-contain">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-800 flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-zinc-700 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-900/20">
              <Wrench className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Maintenance</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{totalCount} unassigned tasks</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          {error && !loading && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl mb-4">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-orange-600 dark:text-orange-400 animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
          ) : maintenances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="p-4 rounded-2xl bg-gray-100 dark:bg-zinc-700">
                <Package className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">No Maintenance Orders</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">All have been assigned.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {maintenances.map((m) => (
                <div key={m.id} className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {m.order?.mockup?.name || m.client_name}
                        </h4>
                        {m.order && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ORD-{m.order.order_code}</p>}
                      </div>
                      {m.under_warranty && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 shrink-0">
                          <CheckCircle className="w-2.5 h-2.5" /> Warranty
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{m.reported_issue}</p>

                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap mb-3">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{m.client_contact}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>

                    <button onClick={() => setSelectedMaintenance(m)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 active:scale-[0.98] transition-all">
                      <Wrench className="w-4 h-4" /> <span>Assign</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Load More */}
              {hasMore && (
                <button onClick={() => fetchMaintenances(currentPage + 1, false)} disabled={loadingMore}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all disabled:opacity-50">
                  {loadingMore ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Loading...</span></> : <><ChevronDown className="w-4 h-4" /><span>Load More</span></>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};