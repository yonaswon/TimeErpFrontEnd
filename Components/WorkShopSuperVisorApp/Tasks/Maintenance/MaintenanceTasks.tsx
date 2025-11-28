// MaintenanceTasks.tsx
import { useState, useEffect } from 'react';
import { Wrench, Calendar, User, Edit, AlertCircle, RefreshCw } from 'lucide-react';
import api from '@/api';
import { EditMaintenanceOverlay } from './EditMaintenanceOverlay';
import { MaintenanceTaskListItem } from './MaintenanceTaskListItem';
import { MaintenanceTaskCard } from './MaintenanceTaskCard';

MaintenanceTaskCard

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

interface MaintenanceTasksProps {
  onRefresh?: () => void;
}

export const MaintenanceTasks = ({ onRefresh }: MaintenanceTasksProps) => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    currentPage: 1,
  });

  useEffect(() => {
    fetchMaintenances();
  }, []);

  const fetchMaintenances = async (url?: string) => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = url || '/api/maintenance/?status=A'; // A = ASSIGNED
      const response = await api.get(endpoint);
      const data = response.data;
      
      setMaintenances(data.results || []);
      setPagination(prev => ({
        ...prev,
        count: data.count,
        next: data.next,
        previous: data.previous,
        currentPage: getCurrentPage(url || '/api/maintenance/?status=A')
      }));
    } catch (err) {
      setError('Failed to fetch assigned maintenance tasks');
      console.error('Error fetching maintenances:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPage = (url: string): number => {
    const urlObj = new URL(url, window.location.origin);
    const pageParam = urlObj.searchParams.get('page');
    return pageParam ? parseInt(pageParam) : 1;
  };

  const handlePageChange = (url: string | null) => {
    if (url) {
      const urlPath = new URL(url).pathname + new URL(url).search;
      fetchMaintenances(urlPath);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-3">Loading maintenance tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-gray-200 dark:border-zinc-700 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={() => fetchMaintenances()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center mx-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  if (maintenances.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Assigned Maintenance Tasks
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          All maintenance tasks are unassigned or completed
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle and Pagination Info */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {maintenances.length} of {pagination.count} tasks
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-gray-100 dark:bg-zinc-700 rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'card'
                  ? 'bg-white dark:bg-zinc-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Card View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        {maintenances.map((maintenance) =>
          viewMode === 'card' ? (
            <MaintenanceTaskCard 
              key={maintenance.id} 
              maintenance={maintenance} 
              onEdit={setEditingMaintenance}
            />
          ) : (
            <MaintenanceTaskListItem 
              key={maintenance.id} 
              maintenance={maintenance} 
              onEdit={setEditingMaintenance}
            />
          )
        )}
      </div>

      {/* Pagination */}
      {(pagination.next || pagination.previous) && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-zinc-600">
          <button
            onClick={() => handlePageChange(pagination.previous)}
            disabled={!pagination.previous}
            className="px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {pagination.currentPage}
          </span>
          <button
            onClick={() => handlePageChange(pagination.next)}
            disabled={!pagination.next}
            className="px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Overlay */}
      {editingMaintenance && (
        <EditMaintenanceOverlay
          maintenance={editingMaintenance}
          onClose={() => setEditingMaintenance(null)}
          onSuccess={() => {
            setEditingMaintenance(null);
            fetchMaintenances();
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
};