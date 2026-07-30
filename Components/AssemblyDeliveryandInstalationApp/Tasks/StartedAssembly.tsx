// Tasks/StartedAssembly.tsx
import { useState, useEffect } from "react";
import {
  CheckCircle,
  Grid,
  List,
  AlertCircle,
  Package,
  Clock,
} from "lucide-react";
import api from "@/api";
import { useSidebar } from "@/Components/GlobalComponents/SideBar/SidebarContext";
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
      material: number;
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
import { ReleaseOverlay } from "./ReleaseOverlay";
import ReleaseContent from "./Release/ReleaseContent";
import CompleteReleaseOverlay, {
  type UnreleasedBomRow,
} from "./CompleteReleaseOverlay";
import AssemblyBomList from "@/Components/shared/AssemblyBomList";

type TaskView = "card" | "list";

export const StartedAssembly = () => {
  const [viewMode, setViewMode] = useState<TaskView>("card");
  const [tasks, setTasks] = useState<AssemblyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [completingTask, setCompletingTask] = useState<number | null>(null);
  const [completeRelease, setCompleteRelease] = useState<{
    assemblyId: number;
    unreleasedBoms: UnreleasedBomRow[];
  } | null>(null);
  const [releaseOverlay, setReleaseOverlay] = useState<{
    isOpen: boolean;
    task: AssemblyAssignment | null;
  }>({
    isOpen: false,
    task: null,
  });
  const { openSidebar } = useSidebar();

  const openReleaseSideBar = (id: any) => {
    openSidebar(<ReleaseContent id={id} />, `Releases ORD-${id}`);
  };

  useEffect(() => {
    fetchStartedTasks(1, false);
  }, []);

  const fetchStartedTasks = async (pageNum = 1, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      const userData = localStorage.getItem("user_data");
      if (!userData) {
        throw new Error("User data not found");
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      const response = await api.get(
        `/api/assembly-assign/?status=STARTED&assigned_to=${userId}&p=${pageNum}`
      );
      const results = response.data.results || [];
      setTasks((prev) => (append ? [...prev, ...results] : results));
      setPage(pageNum);
      setHasMore(!!response.data.next);
    } catch (err: any) {
      setError("Failed to fetch started assembly tasks");
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    fetchStartedTasks(page + 1, true);
  };

  const handleComplete = async (assemblyId: number) => {
    try {
      setCompletingTask(assemblyId);
      setError(null);

      const res = await api.post(`/api/assembly-assign/${assemblyId}/complete/`);
      if (res.data?.release_prompt_needed) {
        setCompleteRelease({
          assemblyId,
          unreleasedBoms: res.data.unreleased_boms || [],
        });
        return;
      }

      fetchStartedTasks(1, false);
    } catch (err: any) {
      console.error("Error completing task:", err);
      setError(
        err.response?.data?.error ||
          "Failed to complete task. Please try again."
      );
    } finally {
      setCompletingTask(null);
    }
  };

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

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleString();
  };

  const calculateDuration = (startDate: string | null) => {
    if (!startDate) return "N/A";

    const start = new Date(startDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-3">
          Loading started assembly tasks...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Assembly In Progress ({tasks.length})
        </h2>
        <div className="bg-gray-100 dark:bg-zinc-700 rounded-lg p-1 flex">
          <button
            onClick={() => setViewMode("card")}
            className={`p-2 rounded-md transition-colors ${viewMode === "card"
                ? "bg-white dark:bg-zinc-600 text-blue-600 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            title="Card View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md transition-colors ${viewMode === "list"
                ? "bg-white dark:bg-zinc-600 text-blue-600 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No assembly tasks in progress
          </p>
        </div>
      ) : (
        <div className={viewMode === "card" ? "space-y-4" : "space-y-2"}>
          {tasks.map((task) =>
            viewMode === "card" ? (
              <StartedAssemblyCard
                key={task.id}
                task={task}
                onComplete={handleComplete}
                onRelease={openReleaseOverlay}
                isCompleting={completingTask === task.id}
                formatDateTime={formatDateTime}
                calculateDuration={calculateDuration}
              />
            ) : (
              <StartedAssemblyListItem
                key={task.id}
                task={task}
                onComplete={handleComplete}
                onRelease={openReleaseOverlay}
                isCompleting={completingTask === task.id}
                formatDateTime={formatDateTime}
                calculateDuration={calculateDuration}
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
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
      {releaseOverlay.isOpen && releaseOverlay.task && (
        <ReleaseOverlay
          task={releaseOverlay.task}
          onClose={closeReleaseOverlay}
          onSuccess={() => fetchStartedTasks(1, false)}
        />
      )}
      {completeRelease && (
        <CompleteReleaseOverlay
          assemblyId={completeRelease.assemblyId}
          unreleasedBoms={completeRelease.unreleasedBoms}
          onClose={() => setCompleteRelease(null)}
          onSuccess={() => {
            setCompleteRelease(null);
            fetchStartedTasks(1, false);
          }}
        />
      )}
    </div>
  );
};

// Card View Component for Started Assembly Tasks
const StartedAssemblyCard = ({
  task,
  onComplete,
  onRelease,
  isCompleting,
  formatDateTime,
  calculateDuration,
}: {
  task: AssemblyAssignment;
  onComplete: (assemblyId: number) => void;
  onRelease: (task: AssemblyAssignment) => void;
  isCompleting: boolean;
  formatDateTime: (dateString: string | null) => string;
  calculateDuration: (startDate: string | null) => string;
}) => {
  const duration = calculateDuration(task.start_date);
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
            {!task.is_mass && task.order.order_name && (
              <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">— {task.order.order_name}</span>
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
            Started: {formatDateTime(task.start_date)}
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
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Timeline
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Scheduled Start:
              </span>
              <span className="text-gray-900 dark:text-white">
                {formatDateTime(task.schedule_start_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Scheduled Complete:
              </span>
              <span className="text-gray-900 dark:text-white">
                {formatDateTime(task.schedule_complate_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Actual Start:
              </span>
              <span className="text-green-600 dark:text-green-400">
                {formatDateTime(task.start_date)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Progress
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Duration:
              </span>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-blue-600" />
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {duration}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Cutting Files:
              </span>
              <span className="text-gray-900 dark:text-white">
                {task.cutting_files.length} completed
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Assigned Team:
              </span>
              <span className="text-gray-900 dark:text-white">
                {task.assigned_to.length} members
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Status */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              Assembly In Progress
            </span>
          </div>
          <span className="text-blue-600 dark:text-blue-400">
            Started {formatDateTime(task.start_date)}
          </span>
        </div>
      </div>

      {/* Mockup Image Preview */}
      {task.order?.mockup?.mockup_image && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Design Preview
          </h4>
          <img
            src={task.order?.mockup?.mockup_image}
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
        <button
          onClick={() => onComplete(task.id)}
          disabled={isCompleting}
          className="flex-1 flex items-center justify-center space-x-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isCompleting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Completing...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Complete{task.is_mass ? ' Group' : ''}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// List View Component for Started Assembly Tasks
const StartedAssemblyListItem = ({
  task,
  onComplete,
  onRelease,
  isCompleting,
  formatDateTime,
  calculateDuration,
}: {
  task: AssemblyAssignment;
  onComplete: (assemblyId: number) => void;
  onRelease: (task: AssemblyAssignment) => void;
  isCompleting: boolean;
  formatDateTime: (dateString: string | null) => string;
  calculateDuration: (startDate: string | null) => string;
}) => {
  const duration = calculateDuration(task.start_date);
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
              In Progress
            </span>
          </div>

          <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400 overflow-x-auto scrollbar-thin pb-1">
            <div className="flex items-center space-x-1 shrink-0">
              <Clock className="w-3 h-3 text-blue-600" />
              <span>Duration: {duration}</span>
            </div>
            <span className="shrink-0">
              Started: {formatDateTime(task.start_date)}
            </span>
            <span className="shrink-0">
              Schedule: {formatDateTime(task.schedule_complate_date)}
            </span>
            <span className="shrink-0">
              Team: {task.assigned_to.length} members
            </span>
            <span className="shrink-0">Design: {task.order.design_type}</span>
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
          <button
            onClick={() => onComplete(task.id)}
            disabled={isCompleting}
            className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isCompleting ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            ) : (
              <CheckCircle className="w-3 h-3" />
            )}
            <span>Complete{task.is_mass ? ' Group' : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
