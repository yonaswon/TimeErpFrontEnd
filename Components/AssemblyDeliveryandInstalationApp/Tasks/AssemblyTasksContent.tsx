// Tasks/AssemblyTasksContent.tsx
import { useState, useEffect } from 'react';
import { Play, Grid, List, AlertCircle, CheckCircle } from 'lucide-react';

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
import { StartedAssembly } from './StartedAssembly';
import { CompletedAssembly } from './CompletedAssembly';

type TaskView = 'card' | 'list';
type TaskFilter = 'assigned' | 'started' | 'completed';

export const AssemblyTasksContent = () => {
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('assigned');
  const [viewMode, setViewMode] = useState<TaskView>('card');

  const filters: { id: TaskFilter; label: string }[] = [
    { id: 'assigned', label: 'Assigned to you' },
    { id: 'started', label: 'Started' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-4">
      {/* Horizontal Navigation */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-1">
        <div className="flex space-x-1">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeFilter === filter.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {activeFilter === 'assigned' && 'Assembly Tasks'}
          {activeFilter === 'started' && 'Tasks in Progress'}
          {activeFilter === 'completed' && 'Completed Tasks'}
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

      {/* Content based on filter */}
      {activeFilter === 'assigned' && (
        <AssemblyAssignedToYou viewMode={viewMode} />
      )}
      
      {activeFilter === 'started' && <StartedAssembly />}
      
      {activeFilter === 'completed' && <CompletedAssembly />}
    </div>
  );
};

// Assigned Tasks Component
const AssemblyAssignedToYou = ({ viewMode }: { viewMode: TaskView }) => {
  const [tasks, setTasks] = useState<AssemblyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingTask, setStartingTask] = useState<number | null>(null);

  useEffect(() => {
    fetchAssignedTasks();
  }, []);

  const fetchAssignedTasks = async () => {
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
      
      const response = await api.get(`/api/assembly-assign/?status=ASSIGNED&assigned_to=${userId}`);
      setTasks(response.data.results || []);
    } catch (err: any) {
      setError('Failed to fetch assembly tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (assemblyId: number) => {
    try {
      setStartingTask(assemblyId);
      setError(null);

      await api.post(`/api/assembly-assign/${assemblyId}/start/`);
      
      // Refresh the task list
      fetchAssignedTasks();
      
    } catch (err: any) {
      console.error('Error starting task:', err);
      setError('Failed to start task. Please try again.');
    } finally {
      setStartingTask(null);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  const canStartAssembly = (task: AssemblyAssignment) => {
    // Check if all cutting files are completed
    return task.order.cutting_files.every(file => file.status === 'COMPLATED');
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-3">Loading assembly tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-4 h-4 text-red-600" />
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <p className="text-gray-600 dark:text-gray-400">No assembly tasks assigned to you</p>
      </div>
    );
  }

  return (
    <div className={viewMode === 'card' ? 'space-y-4' : 'space-y-2'}>
      {tasks.map((task) =>
        viewMode === 'card' ? (
          <AssemblyTaskCard 
            key={task.id} 
            task={task} 
            onStart={handleStart}
            isStarting={startingTask === task.id}
            canStart={canStartAssembly(task)}
            formatDateTime={formatDateTime}
          />
        ) : (
          <AssemblyTaskListItem 
            key={task.id} 
            task={task} 
            onStart={handleStart}
            isStarting={startingTask === task.id}
            canStart={canStartAssembly(task)}
            formatDateTime={formatDateTime}
          />
        )
      )}
    </div>
  );
};

// Card View Component
const AssemblyTaskCard = ({ 
  task, 
  onStart, 
  isStarting,
  canStart,
  formatDateTime
}: { 
  task: AssemblyAssignment;
  onStart: (assemblyId: number) => void;
  isStarting: boolean;
  canStart: boolean;
  formatDateTime: (dateString: string | null) => string;
}) => {
  const completedCuttingFiles = task.order.cutting_files.filter(file => file.status === 'COMPLATED').length;
  const totalCuttingFiles = task.order.cutting_files.length;

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
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Schedule</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Start:</span>
              <span className="text-gray-900 dark:text-white">
                {formatDateTime(task.schedule_start_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Complete:</span>
              <span className="text-gray-900 dark:text-white">
                {formatDateTime(task.schedule_complate_date)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Cutting Status</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Completed:</span>
              <span className={`font-medium ${
                canStart ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
              }`}>
                {completedCuttingFiles}/{totalCuttingFiles}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                canStart 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
              }`}>
                {canStart ? 'Ready to Start' : 'Waiting for Cutting'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mockup Image Preview */}
      {task.order?.mockup?.mockup_image && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Design Preview</h4>
          <img
            src={task.order.mockup.mockup_image}
            alt="Design mockup"
            className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-zinc-600"
          />
        </div>
      )}

      {/* Start Button */}
      {canStart ? (
        <button
          onClick={() => onStart(task.id)}
          disabled={isStarting}
          className="w-full flex items-center justify-center space-x-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isStarting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Starting...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Start Assembly</span>
            </>
          )}
        </button>
      ) : (
        <div className="w-full p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-300">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">You can start when cutting is completed</span>
          </div>
        </div>
      )}
    </div>
  );
};

// List View Component
const AssemblyTaskListItem = ({ 
  task, 
  onStart, 
  isStarting,
  canStart,
  formatDateTime
}: { 
  task: AssemblyAssignment;
  onStart: (assemblyId: number) => void;
  isStarting: boolean;
  canStart: boolean;
  formatDateTime: (dateString: string | null) => string;
}) => {
  const completedCuttingFiles = task.order.cutting_files.filter(file => file.status === 'COMPLATED').length;
  const totalCuttingFiles = task.order.cutting_files.length;

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
            <span className={`px-2 py-1 rounded-full text-xs ${
              canStart 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            }`}>
              {canStart ? 'Ready' : 'Waiting'}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400 overflow-x-auto scrollbar-thin pb-1">
            <span>Start: {formatDateTime(task.schedule_start_date)}</span>
            <span>Complete: {formatDateTime(task.schedule_complate_date)}</span>
            <span>Cutting: {completedCuttingFiles}/{totalCuttingFiles}</span>
            <span>Design: {task.order.design_type}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {canStart ? (
            <button
              onClick={() => onStart(task.id)}
              disabled={isStarting}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isStarting ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <Play className="w-3 h-3" />
              )}
              <span>Start</span>
            </button>
          ) : (
            <div className="text-xs text-yellow-600 dark:text-yellow-400 text-center">
              <AlertCircle className="w-4 h-4 mx-auto mb-1" />
              <span>Waiting</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};