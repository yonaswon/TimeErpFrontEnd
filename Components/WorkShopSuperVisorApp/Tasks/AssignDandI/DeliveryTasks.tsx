// Tasks/DeliveryTasks.tsx
import { useState, useEffect } from 'react';
import { Truck, Calendar, Users, MapPin, Phone, Edit, Package, AlertCircle, CheckCircle, Loader2, ChevronDown, X, Save } from 'lucide-react';
import api from '@/api';

interface DeliveryAssignment {
  id: number;
  order_container: {
    id: number;
    orders: Array<{
      order_code: number;
      order_name?: string;
      boms: Array<{ id: number; amount: string; width: string; height: string; price_per_unit: string; total_price: string; estimated_price: string; date: string; material: number; }>;
      mockup: { id: number; reference_images: Array<{ id: number; image: string; date: string; }>; mockup_image: string; width: string; design_type: number; request_status: string; note: string; };
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
  };
  assigned_to: Array<{ id: number; telegram_id: number; telegram_user_name: string; role: Array<{ id: number; Name: string; date: string; }>; first_name: string; }>;
  status: string;
  schedule_start_date: string;
  schedule_complate_date: string;
  start_date: string | null;
  complate_date: string | null;
  date: string;
}

export const DeliveryTasks = () => {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [detailOverlay, setDetailOverlay] = useState<{ isOpen: boolean; assignment: DeliveryAssignment | null; }>({ isOpen: false, assignment: null });
  const [editOverlay, setEditOverlay] = useState<{ isOpen: boolean; assignment: DeliveryAssignment | null; }>({ isOpen: false, assignment: null });

  useEffect(() => { fetchDeliveryAssignments(1, true); }, []);

  const fetchDeliveryAssignments = async (page: number, reset: boolean = false) => {
    try {
      if (reset) { setLoading(true); } else { setLoadingMore(true); }
      setError(null);
      const response = await api.get(`/api/dandi/?ordering=-date&p=${page}`);
      const newResults = response.data.results || [];
      if (reset) { setAssignments(newResults); } else { setAssignments(prev => [...prev, ...newResults]); }
      setCurrentPage(page);
      setHasMore(response.data.next !== null);
    } catch (err: any) {
      setError('Failed to fetch delivery assignments');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const cfg: Record<string, { bg: string; text: string; label: string }> = {
      'ASSIGNED': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Assigned' },
      'STARTED': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: 'Started' },
      'COMPLATED': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Completed' },
    };
    return cfg[status] || cfg['ASSIGNED'];
  };

  const getDifficultyBadge = (difficulty: string) => {
    const cfg: Record<string, string> = {
      'LOW': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      'MEDIUM': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
      'HIGH': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    };
    return cfg[difficulty] || cfg['MEDIUM'];
  };

  const getRelativeDate = (dateString: string) => {
    const diffDays = Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0) return `${diffDays}d from now`;
    return `${Math.abs(diffDays)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading delivery assignments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <button onClick={() => fetchDeliveryAssignments(1, true)} className="px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">Retry</button>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="p-4 rounded-2xl bg-gray-100 dark:bg-zinc-800">
          <Truck className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">No Delivery Assignments</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">No tasks assigned yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.map((assignment) => {
        const container = assignment.order_container;
        const statusBadge = getStatusBadge(assignment.status);

        return (
          <div key={assignment.id} className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 cursor-pointer" onClick={() => setDetailOverlay({ isOpen: true, assignment })}>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                    {container.client}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {container.orders.length} order(s) • {container.contact}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                    {statusBadge.label}
                  </span>
                  <button onClick={() => setEditOverlay({ isOpen: true, assignment })}
                    className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span className="truncate">{container.location}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 dark:text-gray-400">
                  <span>Delivery: {getRelativeDate(container.delivery_date)}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getDifficultyBadge(container.order_difficulty)}`}>{container.order_difficulty}</span>
                </div>
              </div>

              {/* Schedule & Team */}
              <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500 dark:text-gray-400 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-green-500" />
                  <span>Start: {formatDateTime(assignment.schedule_start_date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-purple-500" />
                  <span>Due: {formatDateTime(assignment.schedule_complate_date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>{assignment.assigned_to.length} member(s)</span>
                </div>
              </div>

              {/* Services & Orders */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {container.delivery_service && <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">Delivery</span>}
                {container.instalation_service && <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Installation</span>}
              </div>

              {/* Orders */}
              <div className="pt-3 border-t border-gray-100 dark:border-zinc-700">
                <div className="flex flex-wrap gap-1.5">
                  {container.orders.map((order) => (
                    <span key={order.order_code} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-700 text-xs text-gray-700 dark:text-gray-300">
                      ORD-{order.order_code}
                      {order.order_name && <span className="text-gray-500 dark:text-gray-400">— {order.order_name}</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Load More */}
      {hasMore && (
        <button onClick={() => fetchDeliveryAssignments(currentPage + 1, false)} disabled={loadingMore}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all disabled:opacity-50">
          {loadingMore ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Loading...</span></> : <><ChevronDown className="w-4 h-4" /><span>Load More</span></>}
        </button>
      )}

      {/* Detail Overlay */}
      {detailOverlay.isOpen && detailOverlay.assignment && (
        <DetailOverlay assignment={detailOverlay.assignment} onClose={() => setDetailOverlay({ isOpen: false, assignment: null })} formatDateTime={formatDateTime} getStatusBadge={getStatusBadge} getDifficultyBadge={getDifficultyBadge} getRelativeDate={getRelativeDate} />
      )}

      {/* Edit Overlay */}
      {editOverlay.isOpen && editOverlay.assignment && (
        <EditOverlay assignment={editOverlay.assignment} onClose={() => setEditOverlay({ isOpen: false, assignment: null })} onSuccess={() => { setEditOverlay({ isOpen: false, assignment: null }); fetchDeliveryAssignments(1, true); }} />
      )}
    </div>
  );
};

// Detail Overlay
const DetailOverlay = ({ assignment, onClose, formatDateTime, getStatusBadge, getDifficultyBadge, getRelativeDate }: {
  assignment: any; onClose: () => void; formatDateTime: (d: string | null) => string;
  getStatusBadge: (s: string) => { bg: string; text: string; label: string };
  getDifficultyBadge: (d: string) => string; getRelativeDate: (d: string) => string;
}) => {
  const container = assignment.order_container;
  const statusBadge = getStatusBadge(assignment.status);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto overscroll-contain">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-800 flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-zinc-700 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20">
              <Truck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{container.client}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Delivery & Installation Details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Status Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl p-3 text-center border border-gray-200 dark:border-zinc-700">
              <div className="text-[11px] text-gray-500 dark:text-gray-400">Status</div>
              <div className={`mt-1 px-2 py-0.5 rounded-md text-[11px] font-semibold inline-block ${statusBadge.bg} ${statusBadge.text}`}>{statusBadge.label}</div>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl p-3 text-center border border-gray-200 dark:border-zinc-700">
              <div className="text-[11px] text-gray-500 dark:text-gray-400">Difficulty</div>
              <div className={`mt-1 px-2 py-0.5 rounded-md text-[11px] font-semibold inline-block ${getDifficultyBadge(container.order_difficulty)}`}>{container.order_difficulty}</div>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl p-3 text-center border border-gray-200 dark:border-zinc-700">
              <div className="text-[11px] text-gray-500 dark:text-gray-400">Orders</div>
              <div className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{container.orders.length}</div>
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl p-3 border border-gray-200 dark:border-zinc-700 space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</h4>
            <div className="flex items-center gap-2 text-sm"><Users className="w-3.5 h-3.5 text-blue-500" /><span className="text-gray-900 dark:text-white font-medium">{container.client}</span></div>
            <div className="flex items-center gap-2 text-sm"><Phone className="w-3.5 h-3.5 text-green-500" /><span className="text-gray-600 dark:text-gray-400">{container.contact}</span></div>
            <div className="flex items-center gap-2 text-sm"><MapPin className="w-3.5 h-3.5 text-red-500" /><span className="text-gray-600 dark:text-gray-400">{container.location}</span></div>
            {container.special_requerment && <p className="text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200 dark:border-zinc-700"><strong>Special:</strong> {container.special_requerment}</p>}
          </div>


          {/* Schedule */}
          <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl p-3 border border-gray-200 dark:border-zinc-700 space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Schedule</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-[11px] text-gray-500 dark:text-gray-400">Start</div><div className="text-gray-900 dark:text-white font-medium">{formatDateTime(assignment.schedule_start_date)}</div></div>
              <div><div className="text-[11px] text-gray-500 dark:text-gray-400">Complete</div><div className="text-gray-900 dark:text-white font-medium">{formatDateTime(assignment.schedule_complate_date)}</div></div>
              <div><div className="text-[11px] text-gray-500 dark:text-gray-400">Actual Start</div><div className="text-gray-900 dark:text-white font-medium">{formatDateTime(assignment.start_date)}</div></div>
              <div><div className="text-[11px] text-gray-500 dark:text-gray-400">Actual End</div><div className="text-gray-900 dark:text-white font-medium">{formatDateTime(assignment.complate_date)}</div></div>
            </div>
          </div>

          {/* Team */}
          <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl p-3 border border-gray-200 dark:border-zinc-700 space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Team ({assignment.assigned_to.length})</h4>
            <div className="space-y-2">
              {assignment.assigned_to.map((member: any) => (
                <div key={member.id} className="flex items-center gap-2 text-sm">
                  <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20"><Users className="w-3 h-3 text-purple-600 dark:text-purple-400" /></div>
                  <span className="text-gray-900 dark:text-white font-medium">{member.first_name || `@${member.telegram_user_name}`}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Orders */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orders</h4>
            {container.orders.map((order: any) => (
              <div key={order.order_code} className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl p-3 border border-gray-200 dark:border-zinc-700">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">ORD-{order.order_code}</span>
                    {order.order_name && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">— {order.order_name}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Overlay
const EditOverlay = ({ assignment, onClose, onSuccess }: { assignment: any; onClose: () => void; onSuccess: () => void; }) => {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>(assignment.assigned_to.map((m: any) => m.id));
  const [scheduleStartDate, setScheduleStartDate] = useState<string>(assignment.schedule_start_date ? new Date(assignment.schedule_start_date).toISOString().slice(0, 16) : '');
  const [scheduleCompleteDate, setScheduleCompleteDate] = useState<string>(assignment.schedule_complate_date ? new Date(assignment.schedule_complate_date).toISOString().slice(0, 16) : '');
  const [loading, setLoading] = useState(false);
  const [fetchingTeam, setFetchingTeam] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchTeamMembers(); }, []);

  const fetchTeamMembers = async () => {
    try {
      setFetchingTeam(true);
      const response = await api.get('/core/teams/?role=AssemblyDeliveryandInstalationApp');
      setTeamMembers(response.data);
    } catch (err) { setError('Failed to fetch team members'); } finally { setFetchingTeam(false); }
  };

  const handleMemberToggle = (memberId: number) => {
    setSelectedMembers(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]);
  };

  const handleUpdate = async () => {
    if (selectedMembers.length === 0 || !scheduleStartDate || !scheduleCompleteDate) { setError('Please fill all fields'); return; }
    const startDate = new Date(scheduleStartDate);
    const completeDate = new Date(scheduleCompleteDate);
    if (completeDate <= startDate) { setError('Completion date must be after start date'); return; }
    try {
      setLoading(true);
      setError(null);
      await api.patch(`/api/dandi/${assignment.id}/`, {
        assigned_to: selectedMembers,
        schedule_start_date: startDate.toISOString(),
        schedule_complate_date: completeDate.toISOString()
      });
      onSuccess();
    } catch (err: any) { setError('Failed to update assignment'); } finally { setLoading(false); }
  };

  const getMinStartDate = () => { const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); return now.toISOString().slice(0, 16); };
  const getRelativeDate = (dateString: string) => {
    const diffDays = Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today'; if (diffDays === 1) return 'Tomorrow'; if (diffDays > 0) return `${diffDays} days from now`; return `${Math.abs(diffDays)} days ago`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto overscroll-contain">
        <div className="sticky top-0 bg-white dark:bg-zinc-800 flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-zinc-700 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20"><Edit className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Assignment</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{assignment.order_container.client}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500 dark:text-gray-400" /></button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" /><p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Team Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign To *</label>
            <div className="max-h-48 overflow-y-auto overscroll-contain border border-gray-200 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-900">
              {fetchingTeam ? (
                <div className="flex items-center justify-center py-6 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin mr-2" />Loading...</div>
              ) : teamMembers.map((member) => (
                <label key={member.id} className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer border-b border-gray-100 dark:border-zinc-700 last:border-b-0 transition-colors">
                  <input type="checkbox" checked={selectedMembers.includes(member.id)} onChange={() => handleMemberToggle(member.id)} className="w-4 h-4 text-purple-600 rounded border-gray-300 dark:border-zinc-600 focus:ring-purple-500" />
                  <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20"><Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{member.first_name || `@${member.telegram_user_name}`}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">@{member.telegram_user_name}</div>
                  </div>
                </label>
              ))}
            </div>
            {selectedMembers.length > 0 && <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium">{selectedMembers.length} member(s) selected</p>}
          </div>

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

        <div className="sticky bottom-0 bg-white dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 px-4 py-4 flex gap-3">
          <button onClick={onClose} className="flex-1 h-11 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors">Cancel</button>
          <button onClick={handleUpdate} disabled={loading || selectedMembers.length === 0 || !scheduleStartDate || !scheduleCompleteDate}
            className="flex-1 h-11 flex items-center justify-center gap-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Updating...</span></> : <><Save className="w-4 h-4" /><span>Update</span></>}
          </button>
        </div>
      </div>
    </div>
  );
};