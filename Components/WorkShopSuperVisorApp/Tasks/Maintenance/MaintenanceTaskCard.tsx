// MaintenanceTaskCard.tsx
import { Calendar, User, Edit, CheckCircle, AlertCircle, Clock,Wrench } from 'lucide-react';

interface Maintenance {
  id: number;
  order?: {
    order_code: number;
    mockup: {
      name: string;
      mockup_image: string;
    };
  };
  posted_by: {
    telegram_user_name: string;
    first_name: string;
  };
  client_name: string;
  client_contact: string;
  reported_issue: string;
  image: string | null;
  under_warranty: boolean;
  assigned_to: {
    id: number;
    telegram_user_name: string;
    first_name: string;
  } | null;
  status: string;
  scheduled_start_date: string | null;
  scheduled_end_date: string | null;
  started: string | null;
  end: string | null;
  created_at: string;
}

interface MaintenanceTaskCardProps {
  maintenance: Maintenance;
  onEdit: (maintenance: Maintenance) => void;
}

export const MaintenanceTaskCard = ({ maintenance, onEdit }: MaintenanceTaskCardProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (status: string) => {
    const statusConfig = {
      'NA': { color: 'bg-gray-100 text-gray-800', label: 'Not Assigned' },
      'A': { color: 'bg-blue-100 text-blue-800', label: 'Assigned' },
      'S': { color: 'bg-yellow-100 text-yellow-800', label: 'Started' },
      'D': { color: 'bg-green-100 text-green-800', label: 'Completed' }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig['NA'];
  };

  const statusInfo = getStatusInfo(maintenance.status);

  const getDaysFromNow = (dateString: string | null): string => {
    if (!dateString) return '';
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

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Preview Image or Icon */}
        <div className="shrink-0">
          {maintenance.image ? (
            <img
              src={maintenance.image}
              alt="Maintenance issue"
              className="w-20 h-20 object-cover rounded-lg border border-gray-300"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-700 rounded-lg border border-gray-300 flex items-center justify-center">
              <Wrench className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Task Details */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {maintenance.order?.mockup?.name || maintenance.client_name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {maintenance.order ? `Order #${maintenance.order.order_code}` : 'Direct Maintenance'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              <button
                onClick={() => onEdit(maintenance)}
                className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="Edit assignment"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Issue Description */}
          <div className="mb-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
              {maintenance.reported_issue}
            </p>
          </div>

          {/* Assignment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">Assigned to:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {maintenance.assigned_to ? `@${maintenance.assigned_to.telegram_user_name}` : 'Unassigned'}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-green-600" />
                <span className="text-gray-700 dark:text-gray-300">Scheduled Start:</span>
                <div className="flex flex-col">
                  <span className="text-gray-900 dark:text-white">
                    {formatDate(maintenance.scheduled_start_date)}
                  </span>
                  {maintenance.scheduled_start_date && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      {getDaysFromNow(maintenance.scheduled_start_date)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span className="text-gray-700 dark:text-gray-300">Scheduled End:</span>
                <div className="flex flex-col">
                  <span className="text-gray-900 dark:text-white">
                    {formatDate(maintenance.scheduled_end_date)}
                  </span>
                  {maintenance.scheduled_end_date && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      {getDaysFromNow(maintenance.scheduled_end_date)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700 dark:text-gray-300">Client:</span>
                <span className="text-gray-900 dark:text-white">{maintenance.client_contact}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700 dark:text-gray-300">Posted:</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(maintenance.created_at).toLocaleDateString()}
                </span>
              </div>
              {maintenance.under_warranty && (
                <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Under Warranty</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Dates */}
          {(maintenance.started || maintenance.end) && (
            <div className="border-t border-gray-200 dark:border-zinc-700 pt-3">
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Progress:</h5>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                {maintenance.started && (
                  <div className="flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span>Started: {formatDate(maintenance.started)}</span>
                  </div>
                )}
                {maintenance.end && (
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Completed: {formatDate(maintenance.end)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};