// EditMaintenanceOverlay.tsx
import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Loader2, Wrench } from 'lucide-react';
import api from '@/api';

interface Maintenance {
  id: number;
  order?: { order_code: number; mockup: { name: string; mockup_image: string; }; };
  client_name: string;
  client_contact: string;
  reported_issue: string;
  under_warranty: boolean;
  assigned_to: { id: number; telegram_user_name: string; first_name: string; } | null;
  status: string;
  scheduled_start_date: string | null;
  scheduled_end_date: string | null;
}

interface TeamUser { id: number; telegram_user_name: string; first_name: string; role: Array<{ Name: string; }>; }

interface EditMaintenanceOverlayProps {
  maintenance: Maintenance;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditMaintenanceOverlay = ({ maintenance, onClose, onSuccess }: EditMaintenanceOverlayProps) => {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignedTo, setAssignedTo] = useState<string>(maintenance.assigned_to?.id?.toString() || '');
  const [scheduledStartDate, setScheduledStartDate] = useState<string>(
    maintenance.scheduled_start_date ? new Date(maintenance.scheduled_start_date).toISOString().slice(0, 16) : ''
  );
  const [scheduledEndDate, setScheduledEndDate] = useState<string>(
    maintenance.scheduled_end_date ? new Date(maintenance.scheduled_end_date).toISOString().slice(0, 16) : ''
  );

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/core/teams/?role=AssemblyDeliveryandInstalationApp');
      setUsers(response.data || []);
    } catch (err) { console.error('Error fetching users:', err); }
  };

  const handleUpdateMaintenance = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post(`/api/maintenance/${maintenance.id}/assign/`, {
        assigned_to: assignedTo || null,
        scheduled_start_date: scheduledStartDate || null,
        scheduled_end_date: scheduledEndDate || null,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update maintenance assignment');
    } finally {
      setLoading(false);
    }
  };

  const getMinStartDate = () => new Date().toISOString().slice(0, 16);
  const getMinEndDate = () => scheduledStartDate ? new Date(scheduledStartDate).toISOString().slice(0, 16) : '';
  const getDaysFromNow = (dateString: string): string => {
    const diffDays = Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today'; if (diffDays === 1) return 'Tomorrow'; if (diffDays > 1) return `${diffDays} days from now`; if (diffDays < 0) return `${Math.abs(diffDays)} days ago`; return '';
  };

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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Maintenance</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Update assignment details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Maintenance Info */}
          <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl p-3 border border-gray-200 dark:border-zinc-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {maintenance.order?.mockup?.name || maintenance.client_name}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Issue:</strong> {maintenance.reported_issue}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5"><strong>Contact:</strong> {maintenance.client_contact}</p>
            {maintenance.under_warranty && (
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

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date *</label>
            <input type="datetime-local" value={scheduledStartDate} onChange={(e) => setScheduledStartDate(e.target.value)} min={getMinStartDate()} required
              className="w-full h-11 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
            {scheduledStartDate && <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{getDaysFromNow(scheduledStartDate)}</p>}
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date *</label>
            <input type="datetime-local" value={scheduledEndDate} onChange={(e) => setScheduledEndDate(e.target.value)} min={getMinEndDate()} required
              className="w-full h-11 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
            {scheduledEndDate && <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{getDaysFromNow(scheduledEndDate)}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 px-4 py-4 flex gap-3">
          <button onClick={onClose} className="flex-1 h-11 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors">Cancel</button>
          <button onClick={() => handleUpdateMaintenance()} disabled={loading || !assignedTo || !scheduledStartDate || !scheduledEndDate}
            className="flex-1 h-11 flex items-center justify-center gap-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Updating...</span></> : <span>Update Assignment</span>}
          </button>
        </div>
      </div>
    </div>
  );
};