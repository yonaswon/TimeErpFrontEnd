// MaintenanceTaskListItem.tsx
import { Calendar, User, Edit, CheckCircle } from 'lucide-react';

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

interface MaintenanceTaskListItemProps {
  maintenance: Maintenance;
  onEdit: (maintenance: Maintenance) => void;
}

export const MaintenanceTaskListItem = ({ maintenance, onEdit }: MaintenanceTaskListItemProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const statusConfig = {
      'NA': 'bg-gray-100 text-gray-800',
      'A': 'bg-blue-100 text-blue-800',
      'S': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-green-100 text-green-800'
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig['NA'];
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-3 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Icon or Image */}
          {maintenance.image ? (
            <img
              src={maintenance.image}
              alt="Maintenance issue"
              className="w-12 h-12 object-cover rounded border border-gray-300"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-700 rounded border border-gray-300 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-gray-400" />
            </div>
          )}
          
          <div>
            <div className="font-medium text-gray-900 dark:text-white text-sm">
              {maintenance.order?.mockup?.name || maintenance.client_name}
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400 mt-1">
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>{maintenance.assigned_to ? `@${maintenance.assigned_to.telegram_user_name}` : 'Unassigned'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(maintenance.scheduled_start_date)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(maintenance.scheduled_end_date)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
              {maintenance.reported_issue}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {maintenance.under_warranty && (
            <span className="flex items-center text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
              <CheckCircle size={12} className="mr-1" />
              Warranty
            </span>
          )}
          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(maintenance.status)}`}>
            {maintenance.status === 'NA' ? 'Not Assigned' : 
             maintenance.status === 'A' ? 'Assigned' :
             maintenance.status === 'S' ? 'Started' : 'Completed'}
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
    </div>
  );
};