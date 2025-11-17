// EditAssignmentOverlay.tsx
import { useState, useEffect } from 'react';
import { X, Save, Calendar, User, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    fetchTeamMembers();
  }, []);

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
      setError('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        assigned_to: parseInt(selectedMember),
        schedule_start_date: new Date(scheduleStartDate).toISOString(),
        schedule_complate_date: new Date(scheduleCompleteDate).toISOString()
      };

      await api.patch(`/api/cuttingfiles/${file.id}/`, payload);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Assignment
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Update task assignment details
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

          <div className="space-y-4">
            {/* File Info */}
            <div className="bg-gray-50 dark:bg-zinc-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Task Details</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {file.crv3d.split('/').pop()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {file.orders.length} order(s) • {file.on.material_name}
              </p>
            </div>

            {/* Team Member Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign To *
              </label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
              >
                <option value="">Select Operator</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    @{member.telegram_user_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Schedule Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Schedule Start Date
              </label>
              <input
                type="datetime-local"
                value={scheduleStartDate}
                onChange={(e) => setScheduleStartDate(e.target.value)}
                min={getMinDate()}
                className="w-full p-3 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Schedule Complete Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Schedule Complete Date
              </label>
              <input
                type="datetime-local"
                value={scheduleCompleteDate}
                onChange={(e) => setScheduleCompleteDate(e.target.value)}
                min={scheduleStartDate || getMinDate()}
                className="w-full p-3 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-zinc-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};