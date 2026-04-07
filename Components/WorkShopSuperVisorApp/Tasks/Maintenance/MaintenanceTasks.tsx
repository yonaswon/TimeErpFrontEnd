// MaintenanceTasks.tsx
import { useState, useEffect } from 'react';
import { Wrench, AlertCircle, RefreshCw, Loader2, ChevronDown, Calendar, User, Edit, CheckCircle, Clock } from 'lucide-react';
import api from '@/api';
import { EditMaintenanceOverlay } from './EditMaintenanceOverlay';

interface Maintenance {
  id: number;
  order?: { order_code: number; mockup: { name: string; mockup_image: string; }; };
  posted_by: { telegram_user_name: string; first_name: string; };
  client_name: string;
  client_contact: string;
  reported_issue: string;
  image: string | null;
  under_warranty: boolean;
  assigned_to: { id: number; telegram_user_name: string; first_name: string; } | null;
  status: string;
  scheduled_start_date: string | null;
  scheduled_end_date: string | null;
  started: string | null;
  end: string | null;
  created_at: string;
}

interface MaintenanceTasksProps { onRefresh?: () => void; }

export const MaintenanceTasks = ({ onRefresh }: MaintenanceTasksProps) => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => { fetchMaintenances(1, true); }, []);

  const fetchMaintenances = async (page: number, reset: boolean = false) => {
    try {
      if (reset) { setLoading(true); } else { setLoadingMore(true); }
      setError(null);
      const response = await api.get(`/api/maintenance/?status=A&p=${page}`);
      const data = response.data;
      const newResults = data.results || [];
      if (reset) { setMaintenances(newResults); } else { setMaintenances(prev => [...prev, ...newResults]); }
      setTotalCount(data.count || 0);
      setCurrentPage(page);
      setHasMore(data.next !== null);
    } catch (err) {
      setError('Failed to fetch assigned maintenance tasks');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusInfo = (status: string) => {
    const cfg: Record<string, { bg: string; text: string; label: string }> = {
      'NA': { bg: 'bg-gray-100 dark:bg-zinc-700', text: 'text-gray-700 dark:text-gray-300', label: 'Not Assigned' },
      'A': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Assigned' },
      'S': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: 'Started' },
      'D': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Completed' },
    };
    return cfg[status] || cfg['NA'];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 text-orange-600 dark:text-orange-400 animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading maintenance tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <button onClick={() => fetchMaintenances(1, true)} className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (maintenances.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="p-4 rounded-2xl bg-gray-100 dark:bg-zinc-800">
          <Wrench className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">No Assigned Tasks</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">All maintenance tasks are unassigned or completed</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Count */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Showing {maintenances.length} of {totalCount} tasks
      </div>

      {/* Cards */}
      {maintenances.map((m) => {
        const statusInfo = getStatusInfo(m.status);
        return (
          <div key={m.id} className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                {m.image ? (
                  <img src={m.image} alt="Issue" className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-zinc-600 shrink-0" />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-700 rounded-lg border border-gray-200 dark:border-zinc-600 flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{m.order?.mockup?.name || m.client_name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {m.order ? `ORD-${m.order.order_code}` : 'Direct Maintenance'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${statusInfo.bg} ${statusInfo.text}`}>{statusInfo.label}</span>
                      <button onClick={() => setEditingMaintenance(m)} className="p-1.5 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Issue */}
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{m.reported_issue}</p>

              {/* Info */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-medium text-gray-900 dark:text-white">{m.assigned_to ? `@${m.assigned_to.telegram_user_name}` : 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-green-500" /><span>Start: {formatDate(m.scheduled_start_date)}</span></div>
                  <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-purple-500" /><span>End: {formatDate(m.scheduled_end_date)}</span></div>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /><span>{new Date(m.created_at).toLocaleDateString()}</span></div>
                  <span>{m.client_contact}</span>
                  {m.under_warranty && (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                      <CheckCircle className="w-3 h-3" /> Warranty
                    </span>
                  )}
                </div>
              </div>

              {/* Progress */}
              {(m.started || m.end) && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  {m.started && <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-yellow-500" />Started: {formatDate(m.started)}</span>}
                  {m.end && <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" />Done: {formatDate(m.end)}</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Load More */}
      {hasMore && (
        <button onClick={() => fetchMaintenances(currentPage + 1, false)} disabled={loadingMore}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all disabled:opacity-50">
          {loadingMore ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Loading...</span></> : <><ChevronDown className="w-4 h-4" /><span>Load More</span></>}
        </button>
      )}

      {/* Edit Overlay */}
      {editingMaintenance && (
        <EditMaintenanceOverlay
          maintenance={editingMaintenance}
          onClose={() => setEditingMaintenance(null)}
          onSuccess={() => { setEditingMaintenance(null); fetchMaintenances(1, true); onRefresh?.(); }}
        />
      )}
    </div>
  );
};