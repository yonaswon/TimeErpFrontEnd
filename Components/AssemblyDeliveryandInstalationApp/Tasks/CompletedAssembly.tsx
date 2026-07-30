import { useState, useEffect, useRef } from 'react';
import { CheckCircle, Grid, List, AlertCircle, Clock, Package, Search } from 'lucide-react';
import api from '@/api';
import { useSidebar } from "@/Components/GlobalComponents/SideBar/SidebarContext";
import { ReleaseOverlay } from "./ReleaseOverlay";
import ReleaseContent from "./Release/ReleaseContent";
import AssemblyBomList from '@/Components/shared/AssemblyBomList';

interface AssemblyAssignment {
  id: number;
  order: {
    order_code: number;
    order_name?: string;
    boms: Array<{
      id: number;
      amount: string;
      width: string;
      height: string;
      price_per_unit: string;
      total_price: string;
      estimated_price: string;
      date: string;
      released?: boolean;
      material: number | {
        id: number;
        name: string;
        type: string;
        code_name?: string | null;
      };
    }>;
    mockup: {
      id: number;
      reference_images: Array<{
        id: number;
        image: string;
        date: string;
      }>;
      mockup_image: string;
      width: string;
      design_type: number;
      request_status: string;
    };
    cutting_files: Array<{
      id: number;
      status: string;
      schedule_start_date: string;
      schedule_complate_date: string;
      start_date: string | null;
      complate_date: string | null;
    }>;
    order_status: string;
    price: number;
    design_type: number;
  };
  assigned_to: Array<{
    id: number;
    telegram_user_name: string;
  }>;
  cutting_files: Array<{
    id: number;
    status: string;
  }>;
  status: string;
  schedule_start_date: string;
  schedule_complate_date: string;
  start_date: string | null;
  complate_date: string | null;
  date: string;
  is_mass?: boolean;
  mass_group?: string | null;
  order_count?: number;
  mass_range_label?: string | null;
}

type TaskView = 'card' | 'list';

export const CompletedAssembly = () => {
  const [viewMode, setViewMode] = useState<TaskView>('card');
  const [tasks, setTasks] = useState<AssemblyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [releaseOverlay, setReleaseOverlay] = useState<{
    isOpen: boolean;
    task: AssemblyAssignment | null;
  }>({
    isOpen: false,
    task: null,
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  useEffect(() => {
    fetchCompletedTasks(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const openReleaseOverlay = (task: AssemblyAssignment) => {
    setReleaseOverlay({
      isOpen: true,
      task,
    });
  };

  const closeReleaseOverlay = () => {
    setReleaseOverlay({
      isOpen: false,
      task: null,
    });
  };

  const fetchCompletedTasks = async (pageNum = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setSearching(true);
        if (tasks.length === 0) setLoading(true);
      }
      setError(null);

      const userData = localStorage.getItem('user_data');
      if (!userData) {
        throw new Error('User data not found');
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      const params = new URLSearchParams({
        status: 'COMPLATED',
        assigned_to: String(userId),
        ordering: '-date',
        p: String(pageNum),
      });
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const response = await api.get(`/api/assembly-assign/?${params.toString()}`);
      const results = response.data.results || [];
      setTasks((prev) => (append ? [...prev, ...results] : results));
      setPage(pageNum);
      setHasMore(!!response.data.next);
    } catch (err: any) {
      setError('Failed to fetch completed assembly tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setSearching(false);
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    fetchCompletedTasks(page + 1, true);
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  const calculateDuration = (startDate: string | null, completeDate: string | null) => {
    if (!startDate || !completeDate) return 'N/A';

    const start = new Date(startDate);
    const complete = new Date(completeDate);
    const diffMs = complete.getTime() - start.getTime();

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const calculateScheduleOffset = (scheduledDate: string, actualDate: string | null) => {
    if (!actualDate) return 'N/A';

    const scheduled = new Date(scheduledDate);
    const actual = new Date(actualDate);
    const diffMs = actual.getTime() - scheduled.getTime();

    const hours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
    const minutes = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60)) / (1000 * 60));

    const isEarly = diffMs < 0;
    const sign = isEarly ? '-' : '+';

    if (hours > 0) {
      return `${sign}${hours}h ${minutes}m`;
    }
    return `${sign}${minutes}m`;
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] dark:text-[#94A3B8]" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by order code or name…"
            className="w-full h-11 pl-10 pr-4 text-base rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#111827] dark:text-[#F1F5F9] placeholder:text-[#6B7280]"
          />
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-8 border border-gray-200 dark:border-zinc-700 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-3">Loading completed assembly tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] dark:text-[#94A3B8]" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by order code or name…"
          className="w-full h-11 pl-10 pr-4 text-base rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#111827] dark:text-[#F1F5F9] placeholder:text-[#6B7280]"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2563EB]" />
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Completed Assembly Tasks ({tasks.length})
        </h2>
        <div className="bg-gray-100 dark:bg-zinc-700 rounded-lg p-1 flex">
          <button
            type="button"
            onClick={() => setViewMode('card')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'card'
              ? 'bg-white dark:bg-zinc-600 text-blue-600 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            title="Card View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list'
              ? 'bg-white dark:bg-zinc-600 text-blue-600 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-8 border border-gray-200 dark:border-zinc-700 text-center">
          <p className="text-base text-gray-600 dark:text-gray-400">
            {searchQuery
              ? 'No completed tasks match your search'
              : 'No completed assembly tasks found'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'card' ? 'space-y-4' : 'space-y-2'}>
          {tasks.map((task) =>
            viewMode === 'card' ? (
              <CompletedAssemblyCard
                key={task.id}
                task={task}
                formatDateTime={formatDateTime}
                calculateDuration={calculateDuration}
                calculateScheduleOffset={calculateScheduleOffset}
                onRelease={openReleaseOverlay}
              />
            ) : (
              <CompletedAssemblyListItem
                key={task.id}
                task={task}
                formatDateTime={formatDateTime}
                calculateDuration={calculateDuration}
                calculateScheduleOffset={calculateScheduleOffset}
                onRelease={openReleaseOverlay}
              />
            )
          )}
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="w-full min-h-[44px] flex items-center justify-center gap-2 py-3 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-base font-medium text-[#111827] dark:text-[#F1F5F9] disabled:opacity-50"
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}

      {releaseOverlay.isOpen && releaseOverlay.task && (
        <ReleaseOverlay
          task={releaseOverlay.task}
          onClose={closeReleaseOverlay}
          onSuccess={() => fetchCompletedTasks(1, false)}
        />
      )}
    </div>
  );
};

// Card View Component for Completed Assembly Tasks
const CompletedAssemblyCard = ({
  task,
  formatDateTime,
  calculateDuration,
  calculateScheduleOffset,
  onRelease
}: {
  task: AssemblyAssignment;
  formatDateTime: (dateString: string | null) => string;
  calculateDuration: (startDate: string | null, completeDate: string | null) => string;
  calculateScheduleOffset: (scheduledDate: string, actualDate: string | null) => string;
  onRelease: (task: AssemblyAssignment) => void;
}) => {
  const actualDuration = calculateDuration(task.start_date, task.complate_date);
  const scheduleOffset = calculateScheduleOffset(task.schedule_complate_date, task.complate_date);
  const { openSidebar } = useSidebar();

  const openReleaseSideBar = (id: any) => {
    openSidebar(<ReleaseContent id={id} />, `Releases ORD-${id}`);
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {task.is_mass && task.mass_range_label ? task.mass_range_label : `ORD-${task.order.order_code}`}
            {!task.is_mass && (task.order as any).order_name && (
              <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">— {(task.order as any).order_name}</span>
            )}
          </h3>
          {task.is_mass && (
            <span className="inline-flex mt-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              MASS{task.order_count ? ` · ${task.order_count}` : ''}
            </span>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Design Type: {task.order.design_type}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Completed: {formatDateTime(task.complate_date)}
          </p>
        </div>
        <div className="text-right">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-medium">
            ${task.order.price}
          </span>
        </div>
      </div>

      {/* Task Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Timeline</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Scheduled Start:</span>
              <span className="text-gray-900 dark:text-white">
                {formatDateTime(task.schedule_start_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Scheduled Complete:</span>
              <span className="text-gray-900 dark:text-white">
                {formatDateTime(task.schedule_complate_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Actual Start:</span>
              <span className="text-blue-600 dark:text-blue-400">
                {formatDateTime(task.start_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Actual Complete:</span>
              <span className="text-green-600 dark:text-green-400">
                {formatDateTime(task.complate_date)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Performance</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Actual Duration:</span>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-blue-600" />
                <span className="text-blue-600 dark:text-blue-400 font-medium">{actualDuration}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Schedule Offset:</span>
              <span className={`font-medium ${scheduleOffset.startsWith('-')
                ? 'text-green-600 dark:text-green-400'
                : scheduleOffset.startsWith('+')
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-gray-600 dark:text-gray-400'
                }`}>
                {scheduleOffset}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cutting Files:</span>
              <span className="text-gray-900 dark:text-white">
                {task.cutting_files.length} completed
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Team Members:</span>
              <span className="text-gray-900 dark:text-white">
                {task.assigned_to.length} assigned
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Status */}
      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-700 dark:text-green-300 font-medium">Assembly Completed</span>
          </div>
          <span className="text-green-600 dark:text-green-400">
            {formatDateTime(task.complate_date)}
          </span>
        </div>
      </div>

      {/* Mockup Image Preview */}
      {task?.order?.mockup?.mockup_image && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Design Preview</h4>
          <img
            src={task.order.mockup.mockup_image}
            alt="Design mockup"
            className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-zinc-600"
          />
        </div>
      )}

      <AssemblyBomList boms={task.order?.boms as any} />

      {/* Action Buttons */}
      <div className="flex space-x-3 mt-4">
        <button
          onClick={() => openReleaseSideBar(task.order.order_code)}
          className="flex-1 flex items-center justify-center space-x-2 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <Package className="w-4 h-4" />
          <span>See Release</span>
        </button>

        <button
          onClick={() => onRelease(task)}
          className="flex-1 flex items-center justify-center space-x-2 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <Package className="w-4 h-4" />
          <span>Additional Release</span>
        </button>
      </div>
    </div>
  );
};

// List View Component for Completed Assembly Tasks
const CompletedAssemblyListItem = ({
  task,
  formatDateTime,
  calculateDuration,
  calculateScheduleOffset,
  onRelease
}: {
  task: AssemblyAssignment;
  formatDateTime: (dateString: string | null) => string;
  calculateDuration: (startDate: string | null, completeDate: string | null) => string;
  calculateScheduleOffset: (scheduledDate: string, actualDate: string | null) => string;
  onRelease: (task: AssemblyAssignment) => void;
}) => {
  const actualDuration = calculateDuration(task.start_date, task.complate_date);
  const scheduleOffset = calculateScheduleOffset(task.schedule_complate_date, task.complate_date);
  const { openSidebar } = useSidebar();

  const openReleaseSideBar = (id: any) => {
    openSidebar(<ReleaseContent id={id} />, `Releases ORD-${id}`);
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              {task.is_mass && task.mass_range_label ? task.mass_range_label : `ORD-${task.order.order_code}`}
              {task.is_mass && (
                <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                  MASS
                </span>
              )}
              {!task.is_mass && (task.order as any).order_name && (
                <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">— {(task.order as any).order_name}</span>
              )}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs">
              ${task.order.price}
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs">
              Completed
            </span>
          </div>

          <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400 overflow-x-auto scrollbar-thin pb-1">
            <div className="flex items-center space-x-1 shrink-0">
              <Clock className="w-3 h-3 text-blue-600" />
              <span>Duration: {actualDuration}</span>
            </div>
            <span className={`shrink-0 ${scheduleOffset.startsWith('-')
              ? 'text-green-600 dark:text-green-400'
              : scheduleOffset.startsWith('+')
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-gray-600 dark:text-gray-400'
              }`}>
              Offset: {scheduleOffset}
            </span>
            <span className="shrink-0">Started: {formatDateTime(task.start_date)}</span>
            <span className="shrink-0">Completed: {formatDateTime(task.complate_date)}</span>
            <span className="shrink-0">Team: {task.assigned_to.length} members</span>
          </div>
          <AssemblyBomList boms={task.order?.boms as any} className="mt-2" />
        </div>

        <div className="flex items-center space-x-2 ml-4 shrink-0">
          <button
            onClick={() => openReleaseSideBar(task.order.order_code)}
            className="flex items-center space-x-1 px-2 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
          >
            <Package className="w-3 h-3" />
            <span>See Release</span>
          </button>
          <button
            onClick={() => onRelease(task)}
            className="flex items-center space-x-1 px-2 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
          >
            <Package className="w-3 h-3" />
            <span>Release</span>
          </button>
          <div className="flex items-center space-x-1 px-2 py-1 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};