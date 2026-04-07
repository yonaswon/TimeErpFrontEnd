// AssemblyTasks.tsx
import { useState, useEffect } from 'react';
import { Wrench, Users, Calendar, Edit, AlertCircle, CheckCircle, X, Save, Loader2, ChevronDown } from 'lucide-react';
import api from '@/api';

interface AssemblyAssignment {
  id: number;
  order: {
    id: number;
    order_code: number;
    order_name?: string;
    design_type: number;
    order_status: string;
    mockup: number;
    mockup_modification: any;
    mockup_image: string | null;
    price: number;
  };
  assigned_to: TeamMember[];
  status: string;
  schedule_start_date: string | null;
  schedule_complate_date: string | null;
  start_date: string | null;
  complate_date: string | null;
  date: string;
}

interface TeamMember {
  id: number;
  telegram_id: number;
  telegram_user_name: string;
  role: Role[];
  first_name: string;
}

interface Role {
  id: number;
  Name: string;
}

export const AssemblyTasks = () => {
  const [assignments, setAssignments] = useState<AssemblyAssignment[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [editingAssignment, setEditingAssignment] = useState<AssemblyAssignment | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [scheduleStartDate, setScheduleStartDate] = useState<string>('');
  const [scheduleCompleteDate, setScheduleCompleteDate] = useState<string>('');
  const [status, setStatus] = useState<string>('ASSIGNED');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchAssignments(1, true);
    fetchTeamMembers();
  }, []);

  const fetchAssignments = async (page: number, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      const response = await api.get(`/api/assembly-assign/?ordering=-date&p=${page}`);
      const newResults = response.data.results || [];
      const count = response.data.count || 0;

      if (reset) {
        setAssignments(newResults);
      } else {
        setAssignments(prev => [...prev, ...newResults]);
      }

      setTotalCount(count);
      setCurrentPage(page);
      setHasMore(response.data.next !== null);
    } catch (err) {
      setError('Failed to fetch assembly assignments');
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await api.get('/core/teams/?role=AssemblyDeliveryandInstalationApp');
      setTeamMembers(response.data);
    } catch (err) {
      console.error('Error fetching team members:', err);
    }
  };

  const handleLoadMore = () => {
    fetchAssignments(currentPage + 1, false);
  };

  const openEditOverlay = (assignment: AssemblyAssignment) => {
    setEditingAssignment(assignment);
    setSelectedMembers(assignment.assigned_to.map(member => member.id));
    setScheduleStartDate(assignment.schedule_start_date ?
      new Date(assignment.schedule_start_date).toISOString().slice(0, 16) : '');
    setScheduleCompleteDate(assignment.schedule_complate_date ?
      new Date(assignment.schedule_complate_date).toISOString().slice(0, 16) : '');
    setStatus(assignment.status);
    setError(null);
    setSuccess(null);
  };

  const closeEditOverlay = () => {
    setEditingAssignment(null);
    setSelectedMembers([]);
    setScheduleStartDate('');
    setScheduleCompleteDate('');
    setStatus('ASSIGNED');
    setError(null);
    setSuccess(null);
  };

  const handleMemberToggle = (memberId: number) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleUpdate = async () => {
    if (!editingAssignment) return;

    if (selectedMembers.length === 0 || !scheduleStartDate || !scheduleCompleteDate) {
      setError('Please select at least one team member and set schedule dates');
      return;
    }

    const startDate = new Date(scheduleStartDate);
    const completeDate = new Date(scheduleCompleteDate);
    const now = new Date();

    if (startDate <= now) {
      setError('Start date must be in the future');
      return;
    }

    if (completeDate <= startDate) {
      setError('Completion date must be after start date');
      return;
    }

    try {
      setUpdating(true);
      setError(null);

      const payload = {
        assigned_to: selectedMembers,
        schedule_start_date: startDate.toISOString(),
        schedule_complate_date: completeDate.toISOString(),
        status: status
      };

      await api.patch(`/api/assembly-assign/${editingAssignment.id}/`, payload);

      setSuccess('Assembly assignment updated successfully!');

      setTimeout(() => {
        fetchAssignments(1, true);
        closeEditOverlay();
      }, 1500);

    } catch (err: any) {
      console.error('Update error:', err);

      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          setError(`Update failed: ${JSON.stringify(err.response.data)}`);
        } else {
          setError(`Update failed: ${err.response.data}`);
        }
      } else {
        setError('Failed to update assignment. Please try again.');
      }
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      'NOT-ASSIGNED': { bg: 'bg-gray-100 dark:bg-zinc-700', text: 'text-gray-700 dark:text-gray-300', label: 'Not Assigned' },
      'ASSIGNED': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Assigned' },
      'STARTED': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: 'Started' },
      'COMPLATED': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Completed' }
    };

    const config = statusConfig[status] || statusConfig['NOT-ASSIGNED'];
    return config;
  };

  const getOrderStatusBadge = (orderStatus: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      'PRE-ACCEPTED': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: 'Payment Pending' },
      'PRE-CONFIRMED': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Confirmed' },
      'CNC-STARTED': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', label: 'Cutting' },
      'CNC-COMPLETED': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Cut Done' },
      'ASSEMBLY-STARTED': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', label: 'Assembling' },
      'ASSEMBLY-COMPLETED': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', label: 'Assembly Done' },
    };
    const s = map[orderStatus] || { bg: 'bg-gray-100 dark:bg-zinc-700', text: 'text-gray-700 dark:text-gray-300', label: orderStatus.replace('-', ' ') };
    return s;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading assembly tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && !editingAssignment && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {success && !editingAssignment && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl">
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
          <p className="text-green-700 dark:text-green-300 text-sm">{success}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Assembly Assignments
          <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
            {totalCount} total
          </span>
        </h2>
      </div>

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="p-4 rounded-2xl bg-gray-100 dark:bg-zinc-800">
            <Wrench className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            No Assembly Assignments
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            No assembly tasks have been assigned yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const statusBadge = getStatusBadge(assignment.status);
            const orderStatusBadge = getOrderStatusBadge(assignment.order.order_status);

            return (
              <div
                key={assignment.id}
                className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden"
              >
                {/* Card Header - Order Code & Status */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        ORD-{assignment.order.order_code}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    {assignment.order.order_name && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {assignment.order.order_name}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => openEditOverlay(assignment)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors shrink-0 ml-2"
                    title="Edit assignment"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                {/* Card Body */}
                <div className="px-4 pb-4 space-y-3">
                  {/* Order Status */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${orderStatusBadge.bg} ${orderStatusBadge.text}`}>
                      {orderStatusBadge.label}
                    </span>
                  </div>

                  {/* Team Members */}
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1 min-w-0">
                      {assignment.assigned_to.map(member => (
                        <span
                          key={member.id}
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-xs font-medium text-blue-700 dark:text-blue-300"
                        >
                          @{member.telegram_user_name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Schedule Dates */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />
                      <span>Start: {formatDate(assignment.schedule_start_date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                      <span>Due: {formatDate(assignment.schedule_complate_date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

      {/* Edit Overlay */}
      {editingAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto overscroll-contain">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-zinc-800 flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-zinc-700 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Edit Assembly
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    ORD-{editingAssignment.order.order_code}
                    {editingAssignment.order.order_name && ` — ${editingAssignment.order.order_name}`}
                  </p>
                </div>
              </div>
              <button
                onClick={closeEditOverlay}
                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Edit Form */}
            <div className="p-4 space-y-4">
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

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-11 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="NOT-ASSIGNED">Not Assigned</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="STARTED">Started</option>
                  <option value="COMPLATED">Completed</option>
                </select>
              </div>

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
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-zinc-600 focus:ring-blue-500"
                        />
                        <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                          <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
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
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
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
                    className="w-full h-11 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                  {scheduleStartDate && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
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
                    className="w-full h-11 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                  {scheduleCompleteDate && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {getRelativeDate(scheduleCompleteDate)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons - Sticky Bottom */}
            <div className="sticky bottom-0 bg-white dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 px-4 py-4 flex gap-3">
              <button
                onClick={closeEditOverlay}
                className="flex-1 h-11 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating || selectedMembers.length === 0 || !scheduleStartDate || !scheduleCompleteDate}
                className="flex-1 h-11 flex items-center justify-center gap-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update</span>
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