// Tasks/StartedAssembly.tsx
import { useState, useEffect } from 'react';
import { CheckCircle, Grid, List, AlertCircle, Package, Clock } from 'lucide-react';
import api from '@/api';

interface AssemblyAssignment {
  id: number;
  order: {
    order_code: number;
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
}

type TaskView = 'card' | 'list';

export const StartedAssembly = () => {
  const [viewMode, setViewMode] = useState<TaskView>('card');
  const [tasks, setTasks] = useState<AssemblyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [completingTask, setCompletingTask] = useState<number | null>(null);
  const [releaseOverlay, setReleaseOverlay] = useState<{
    isOpen: boolean;
    task: AssemblyAssignment | null;
  }>({
    isOpen: false,
    task: null,
  });

  useEffect(() => {
    fetchStartedTasks();
  }, [currentPage]);

  const fetchStartedTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user data from localStorage
      const userData = localStorage.getItem('user_data');
      if (!userData) {
        throw new Error('User data not found');
      }
      
      const user = JSON.parse(userData);
      const userId = user.id;
      
      const response = await api.get(`/api/assembly-assign/?status=STARTED&assigned_to=${userId}&page=${currentPage}`);
      setTasks(response.data.results || []);
      setTotalPages(Math.ceil(response.data.count / 10));
    } catch (err: any) {
      setError('Failed to fetch started assembly tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (assemblyId: number) => {
    try {
      setCompletingTask(assemblyId);
      setError(null);

      await api.post(`/api/assembly-assign/${assemblyId}/complete/`);
      
      // Refresh the task list
      fetchStartedTasks();
      
    } catch (err: any) {
      console.error('Error completing task:', err);
      setError('Failed to complete task. Please try again.');
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
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  const calculateDuration = (startDate: string | null) => {
    if (!startDate) return 'N/A';
    
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-3">Loading started assembly tasks...</p>
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
            onClick={() => setViewMode('card')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'card'
                ? 'bg-white dark:bg-zinc-600 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="Card View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
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
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
          <p className="text-gray-600 dark:text-gray-400">No assembly tasks in progress</p>
        </div>
      ) : (
        <div className={viewMode === 'card' ? 'space-y-4' : 'space-y-2'}>
          {tasks.map((task) =>
            viewMode === 'card' ? (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded-lg text-sm ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-zinc-700 dark:text-gray-300'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Release Overlay */}
      {releaseOverlay.isOpen && releaseOverlay.task && (
        <ReleaseOverlay
          task={releaseOverlay.task}
          onClose={closeReleaseOverlay}
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
  calculateDuration
}: { 
  task: AssemblyAssignment;
  onComplete: (assemblyId: number) => void;
  onRelease: (task: AssemblyAssignment) => void;
  isCompleting: boolean;
  formatDateTime: (dateString: string | null) => string;
  calculateDuration: (startDate: string | null) => string;
}) => {
  const duration = calculateDuration(task.start_date);

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            ORD-{task.order.order_code}
          </h3>
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
              <span className="text-green-600 dark:text-green-400">
                {formatDateTime(task.start_date)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Progress</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Duration:</span>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-blue-600" />
                <span className="text-blue-600 dark:text-blue-400 font-medium">{duration}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cutting Files:</span>
              <span className="text-gray-900 dark:text-white">
                {task.cutting_files.length} completed
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Assigned Team:</span>
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
            <span className="text-blue-700 dark:text-blue-300 font-medium">Assembly In Progress</span>
          </div>
          <span className="text-blue-600 dark:text-blue-400">
            Started {formatDateTime(task.start_date)}
          </span>
        </div>
      </div>

      {/* Mockup Image Preview */}
      {task.order.mockup.mockup_image && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Design Preview</h4>
          <img
            src={task.order.mockup.mockup_image}
            alt="Design mockup"
            className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-zinc-600"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
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
              <span>Complete</span>
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
  calculateDuration
}: { 
  task: AssemblyAssignment;
  onComplete: (assemblyId: number) => void;
  onRelease: (task: AssemblyAssignment) => void;
  isCompleting: boolean;
  formatDateTime: (dateString: string | null) => string;
  calculateDuration: (startDate: string | null) => string;
}) => {
  const duration = calculateDuration(task.start_date);

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              ORD-{task.order.order_code}
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
            <span className="shrink-0">Started: {formatDateTime(task.start_date)}</span>
            <span className="shrink-0">Schedule: {formatDateTime(task.schedule_complate_date)}</span>
            <span className="shrink-0">Team: {task.assigned_to.length} members</span>
            <span className="shrink-0">Design: {task.order.design_type}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4 shrink-0">
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
            <span>Complete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Release Overlay Component
const ReleaseOverlay = ({
  task,
  onClose,
}: {
  task: AssemblyAssignment;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-yellow-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Additional Release
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                ORD-{task.order.order_code}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Additional release functionality will be implemented here. This could include:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-disc list-inside">
              <li>Material release requests</li>
              <li>Additional component requirements</li>
              <li>Quality control checks</li>
              <li>Documentation upload</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Handle release logic here
                console.log('Release requested for task:', task.id);
                onClose();
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Request Release
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};