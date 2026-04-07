// EditAssignmentOverlay.tsx
import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Loader2, User } from 'lucide-react';
import api from '@/api';

interface EditAssignmentOverlayProps {
  file: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditAssignmentOverlay = ({ file, onClose, onSuccess }: EditAssignmentOverlayProps) => {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>(file.assigned_to?.id?.toString() || '');
  const [scheduleStartDate, setScheduleStartDate] = useState<string>(
    file.schedule_start_date ? new Date(file.schedule_start_date).toISOString().slice(0, 16) : ''
  );
  const [scheduleCompleteDate, setScheduleCompleteDate] = useState<string>(
    file.schedule_complate_date ? new Date(file.schedule_complate_date).toISOString().slice(0, 16) : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchTeamMembers(); }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await api.get('/core/teams/?role=CNC_OPEREATOR');
      setTeamMembers(response.data);
    } catch (err) {
      console.error('Error fetching team members:', err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMember || !scheduleStartDate || !scheduleCompleteDate) {
      setError('Please fill all required fields'); return;
    }
    try {
      setLoading(true);
      setError(null);
      await api.patch(`/api/cuttingfiles/${file.id}/`, {
        assigned_to: parseInt(selectedMember),
        schedule_start_date: new Date(scheduleStartDate).toISOString(),
        schedule_complate_date: new Date(scheduleCompleteDate).toISOString()
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update assignment');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const getRelativeDate = (dateString: string) => {
    const diffDays = Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)} day(s) ago`;
    return `${diffDays} days from now`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto overscroll-contain">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-800 flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-zinc-700 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Assignment</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Update task assignment details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* File Info */}
          <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl p-3 border border-gray-200 dark:border-zinc-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Task Details</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{file.crv3d.split('/').pop()}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {file.orders.length} order(s) • {file.on ? file.on.material_name : file.old_material ? `${file.old_material.name} - ${file.old_material_number}` : 'Unknown Material'}
            </p>
          </div>

          {/* Team Member Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign To *</label>
            <select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full h-11 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
              <option value="">Select Operator</option>
              {teamMembers.map((m) => <option key={m.id} value={m.id}>@{m.telegram_user_name}</option>)}
            </select>
          </div>

          {/* Schedule Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
            <input type="datetime-local" value={scheduleStartDate} onChange={(e) => setScheduleStartDate(e.target.value)} min={getMinDate()}
              className="w-full h-11 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            {scheduleStartDate && <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{getRelativeDate(scheduleStartDate)}</p>}
          </div>

          {/* Schedule Complete Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Complete Date</label>
            <input type="datetime-local" value={scheduleCompleteDate} onChange={(e) => setScheduleCompleteDate(e.target.value)} min={scheduleStartDate || getMinDate()}
              className="w-full h-11 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            {scheduleCompleteDate && <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{getRelativeDate(scheduleCompleteDate)}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 px-4 py-4 flex gap-3">
          <button onClick={onClose}
            className="flex-1 h-11 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 h-11 flex items-center justify-center gap-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving...</span></> : <><Save className="w-4 h-4" /><span>Save Changes</span></>}
          </button>
        </div>
      </div>
    </div>
  );
};