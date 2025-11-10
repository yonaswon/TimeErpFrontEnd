// Tasks/CompletedCutting.tsx
import { useState, useEffect } from 'react';
import { Download, CheckCircle, Grid, List, AlertCircle, Clock } from 'lucide-react';
import api from '@/api';

interface CuttingTask {
  id: number;
  orders: {
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
      crv3d: string;
      image: string;
      status: string;
      schedule_start_date: string;
      schedule_complate_date: string;
      start_date: string | null;
      complate_date: string | null;
      date: string;
    }>;
    order_status: string;
    price: number;
    design_type: number;
  }[];
  on: {
    material_name: string;
    current_width: string;
    current_height: string;
    code: number;
  };
  assigned_to: {
    id: number;
    telegram_user_name: string;
  };
}

type TaskView = 'card' | 'list';

export const CompletedCutting = () => {
  const [viewMode, setViewMode] = useState<TaskView>('card');
  const [tasks, setTasks] = useState<CuttingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCompletedTasks();
  }, [currentPage]);

  const fetchCompletedTasks = async () => {
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
      
      const response = await api.get(`/api/cuttingfiles/?status=COMPLATED&assigned_to=${userId}&ordering=-date&p=${currentPage}`);
      setTasks(response.data.results || []);
      setTotalPages(Math.ceil(response.data.count / 10));
    } catch (err: any) {
      setError('Failed to fetch completed tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  const calculateOffsetTime = (startDate: string | null, completeDate: string | null) => {
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-3">Loading completed tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Completed Tasks ({tasks.length})
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
          <p className="text-gray-600 dark:text-gray-400">No completed tasks found</p>
        </div>
      ) : (
        <div className={viewMode === 'card' ? 'space-y-4' : 'space-y-2'}>
          {tasks.map((task) =>
            viewMode === 'card' ? (
              <CompletedTaskCard 
                key={task.id} 
                task={task} 
                calculateOffsetTime={calculateOffsetTime}
                calculateScheduleOffset={calculateScheduleOffset}
                formatDateTime={formatDateTime}
              />
            ) : (
              <CompletedTaskListItem 
                key={task.id} 
                task={task} 
                calculateOffsetTime={calculateOffsetTime}
                calculateScheduleOffset={calculateScheduleOffset}
                formatDateTime={formatDateTime}
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
    </div>
  );
};

// Card View Component for Completed Tasks
const CompletedTaskCard = ({ 
  task, 
  calculateOffsetTime,
  calculateScheduleOffset,
  formatDateTime
}: { 
  task: CuttingTask;
  calculateOffsetTime: (start: string | null, complete: string | null) => string;
  calculateScheduleOffset: (scheduled: string, actual: string | null) => string;
  formatDateTime: (dateString: string | null) => string;
}) => {
  const mainOrder = task.orders[0];
  const cuttingFile = mainOrder.cutting_files[0];

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const actualDuration = calculateOffsetTime(cuttingFile.start_date, cuttingFile.complate_date);
  const scheduleOffset = calculateScheduleOffset(cuttingFile.schedule_complate_date, cuttingFile.complate_date);

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
      {/* Header with Download */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            CUT-{cuttingFile.id}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Material: {task.on.material_name}-{task.on.code}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Completed: {formatDateTime(cuttingFile.complate_date)}
          </p>
        </div>
        <button
          onClick={() => downloadFile(cuttingFile.crv3d, `cutting-file-${cuttingFile.id}.crv3d`)}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          title="Download CRV3D file"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Task Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Timeline</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Scheduled Start:</span>
              <span className="text-gray-900 dark:text-white">
                {formatDateTime(cuttingFile.schedule_start_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Scheduled Complete:</span>
              <span className="text-gray-900 dark:text-white">
                {formatDateTime(cuttingFile.schedule_complate_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Actual Start:</span>
              <span className="text-blue-600 dark:text-blue-400">
                {formatDateTime(cuttingFile.start_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Actual Complete:</span>
              <span className="text-green-600 dark:text-green-400">
                {formatDateTime(cuttingFile.complate_date)}
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
              <span className={`font-medium ${
                scheduleOffset.startsWith('-') 
                  ? 'text-green-600 dark:text-green-400' 
                  : scheduleOffset.startsWith('+')
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {scheduleOffset}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Material Size:</span>
              <span className="text-gray-900 dark:text-white">
                {task.on.current_width}m x {task.on.current_height}m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Order Price:</span>
              <span className="text-gray-900 dark:text-white">
                ${mainOrder.price}
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
            <span className="text-green-700 dark:text-green-300 font-medium">Completed</span>
          </div>
          <span className="text-green-600 dark:text-green-400">
            {formatDateTime(cuttingFile.complate_date)}
          </span>
        </div>
      </div>

      {/* Mockup Image Preview */}
      {mainOrder.mockup.mockup_image && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Design Preview</h4>
          <img
            src={mainOrder.mockup.mockup_image}
            alt="Design mockup"
            className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-zinc-600"
          />
        </div>
      )}
    </div>
  );
};

// List View Component for Completed Tasks
const CompletedTaskListItem = ({ 
  task, 
  calculateOffsetTime,
  calculateScheduleOffset,
  formatDateTime
}: { 
  task: CuttingTask;
  calculateOffsetTime: (start: string | null, complete: string | null) => string;
  calculateScheduleOffset: (scheduled: string, actual: string | null) => string;
  formatDateTime: (dateString: string | null) => string;
}) => {
  const mainOrder = task.orders[0];
  const cuttingFile = mainOrder.cutting_files[0];
  
  const actualDuration = calculateOffsetTime(cuttingFile.start_date, cuttingFile.complate_date);
  const scheduleOffset = calculateScheduleOffset(cuttingFile.schedule_complate_date, cuttingFile.complate_date);

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              CUT-{cuttingFile.id}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs">
              {task.on.material_name}-{task.on.code}
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
            <span className={`shrink-0 ${
              scheduleOffset.startsWith('-') 
                ? 'text-green-600 dark:text-green-400' 
                : scheduleOffset.startsWith('+')
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              Offset: {scheduleOffset}
            </span>
            <span className="shrink-0">Started: {formatDateTime(cuttingFile.start_date)}</span>
            <span className="shrink-0">Completed: {formatDateTime(cuttingFile.complate_date)}</span>
            <span className="shrink-0">Price: ${mainOrder.price}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4 shrink-0">
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = cuttingFile.crv3d;
              link.download = `cutting-file-${cuttingFile.id}.crv3d`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            title="Download CRV3D file"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};