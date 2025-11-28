// EditMaintenanceOverlay.tsx
import { useState, useEffect } from 'react';
import { X, Calendar, User, AlertCircle, CheckCircle } from 'lucide-react';
import api from '@/api';

interface Maintenance {
  id: number;
  order?: {
    order_code: number;
    mockup: {
      name: string;
      mockup_image: string;
    };
  };
  client_name: string;
  client_contact: string;
  reported_issue: string;
  under_warranty: boolean;
  assigned_to: {
    id: number;
    telegram_user_name: string;
    first_name: string;
  } | null;
  status: string;
  scheduled_start_date: string | null;
  scheduled_end_date: string | null;
}

interface TeamUser {
  id: number;
  telegram_user_name: string;
  first_name: string;
  role: Array<{
    Name: string;
  }>;
}

interface EditMaintenanceOverlayProps {
  maintenance: Maintenance;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditMaintenanceOverlay = ({ maintenance, onClose, onSuccess }: EditMaintenanceOverlayProps) => {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [assignedTo, setAssignedTo] = useState<string>(maintenance.assigned_to?.id?.toString() || '');
  const [scheduledStartDate, setScheduledStartDate] = useState<string>(
    maintenance.scheduled_start_date ? new Date(maintenance.scheduled_start_date).toISOString().slice(0, 16) : ''
  );
  const [scheduledEndDate, setScheduledEndDate] = useState<string>(
    maintenance.scheduled_end_date ? new Date(maintenance.scheduled_end_date).toISOString().slice(0, 16) : ''
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/core/teams/?role=AssemblyDeliveryandInstalationApp');
      setUsers(response.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleUpdateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updateData = {
        assigned_to: assignedTo || null,
        scheduled_start_date: scheduledStartDate || null,
        scheduled_end_date: scheduledEndDate || null,
      };

      await api.post(`/api/maintenance/${maintenance.id}/assign/`, updateData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update maintenance assignment');
      console.error('Error updating maintenance:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMinStartDate = () => {
    return new Date().toISOString().slice(0, 16);
  };

  const getMinEndDate = () => {
    if (!scheduledStartDate) return '';
    return new Date(scheduledStartDate).toISOString().slice(0, 16);
  };

  const getDaysFromNow = (dateString: string): string => {
    const now = new Date();
    const selectedDate = new Date(dateString);
    const diffTime = selectedDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1) return `${diffDays} days from now`;
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    return '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-zinc-700 shadow-sm flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Maintenance Assignment
          </h2>
          <button
            onClick={onClose}
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
              {maintenance.order?.mockup?.name || maintenance.client_name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
              <strong>Issue:</strong> {maintenance.reported_issue}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Contact:</strong> {maintenance.client_contact}
            </p>
            {maintenance.under_warranty && (
              <div className="flex items-center mt-2 text-green-600 dark:text-green-400">
                <CheckCircle size={16} className="mr-1" />
                <span className="text-sm">Under Warranty</span>
              </div>
            )}
          </div>

          <form onSubmit={handleUpdateMaintenance} className="space-y-4">
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
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateMaintenance}
            disabled={loading || !assignedTo || !scheduledStartDate || !scheduledEndDate}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
};