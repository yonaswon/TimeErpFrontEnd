// Tasks/DeliveryCompletedTasks.tsx
import { useState, useEffect } from 'react';
import { Truck, Calendar, MapPin, Users, DollarSign, CheckCircle, Grid, List, AlertCircle, Clock, FileText } from 'lucide-react';
import api from '@/api';

interface DeliveryAssignment {
  id: number;
  order_container: {
    id: number;
    orders: Array<{
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
        note: string;
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
    }>;
    posted_by: {
      id: number;
      telegram_user_name: string;
      role: Array<{
        id: number;
        Name: string;
        date: string;
      }>;
    };
    client: string;
    contact: string;
    location: string;
    delivery_date: string;
    invoice: boolean;
    full_payment: number;
    special_requerment: string;
    advance_payment: string;
    remaining_payment: string;
    instalation_service: boolean;
    order_difficulty: string;
    note: string;
    delivery_service: boolean;
    created_at: string;
    updated_at: string | null;
    lead: number;
  };
  assigned_to: Array<{
    id: number;
    telegram_id: number;
    telegram_user_name: string;
    role: Array<{
      id: number;
      Name: string;
      date: string;
    }>;
    first_name: string;
  }>;
  status: string;
  schedule_start_date: string;
  schedule_complate_date: string;
  start_date: string | null;
  complate_date: string | null;
  date: string;
}

type ViewMode = 'card' | 'list';

export const DeliveryCompletedTasks = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailOverlay, setDetailOverlay] = useState<{
    isOpen: boolean;
    assignment: DeliveryAssignment | null;
  }>({
    isOpen: false,
    assignment: null,
  });

  useEffect(() => {
    fetchCompletedTasks();
  }, []);

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
      
      const response = await api.get(`/api/dandi/?assigned_to=${userId}&ordering=-date&status=COMPLATED`);
      setAssignments(response.data.results || []);
    } catch (err: any) {
      setError('Failed to fetch completed tasks');
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDetailOverlay = (assignment: DeliveryAssignment) => {
    setDetailOverlay({
      isOpen: true,
      assignment,
    });
  };

  const closeDetailOverlay = () => {
    setDetailOverlay({
      isOpen: false,
      assignment: null,
    });
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

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-3">Loading completed tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-gray-200 dark:border-zinc-700 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchCompletedTasks}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Completed Tasks
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          You haven't completed any delivery or installation tasks yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Completed Tasks ({assignments.length})
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

      {/* Tasks */}
      <div className={viewMode === 'card' ? 'space-y-4' : 'space-y-2'}>
        {assignments.map((assignment) =>
          viewMode === 'card' ? (
            <CompletedTaskCard 
              key={assignment.id} 
              assignment={assignment} 
              onViewDetails={openDetailOverlay}
              formatDateTime={formatDateTime}
              calculateDuration={calculateDuration}
              calculateScheduleOffset={calculateScheduleOffset}
            />
          ) : (
            <CompletedTaskListItem 
              key={assignment.id} 
              assignment={assignment} 
              onViewDetails={openDetailOverlay}
              formatDateTime={formatDateTime}
              calculateDuration={calculateDuration}
              calculateScheduleOffset={calculateScheduleOffset}
            />
          )
        )}
      </div>

      {/* Detail Overlay */}
      {detailOverlay.isOpen && detailOverlay.assignment && (
        <DetailOverlay
          assignment={detailOverlay.assignment}
          onClose={closeDetailOverlay}
          formatDateTime={formatDateTime}
          calculateDuration={calculateDuration}
          calculateScheduleOffset={calculateScheduleOffset}
        />
      )}
    </div>
  );
};

// Card View Component
interface CompletedTaskCardProps {
  assignment: DeliveryAssignment;
  onViewDetails: (assignment: DeliveryAssignment) => void;
  formatDateTime: (dateString: string | null) => string;
  calculateDuration: (startDate: string | null, completeDate: string | null) => string;
  calculateScheduleOffset: (scheduledDate: string, actualDate: string | null) => string;
}

const CompletedTaskCard = ({ 
  assignment, 
  onViewDetails,
  formatDateTime,
  calculateDuration,
  calculateScheduleOffset
}: CompletedTaskCardProps) => {
  const container = assignment.order_container;
  const actualDuration = calculateDuration(assignment.start_date, assignment.complate_date);
  const scheduleOffset = calculateScheduleOffset(assignment.schedule_complate_date, assignment.complate_date);

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 
            className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => onViewDetails(assignment)}
          >
            Container #{container.id} - {container.client}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {container.orders.length} order(s) • {container.contact}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Completed: {formatDateTime(assignment.complate_date)}
          </p>
        </div>
        <div className="text-right">
          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium">
            COMPLETED
          </span>
        </div>
      </div>

      {/* Completion Status */}
      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-700 dark:text-green-300 font-medium">Task Completed</span>
          </div>
          <span className="text-green-600 dark:text-green-400">
            {formatDateTime(assignment.complate_date)}
          </span>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Performance</h5>
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
              <span className="text-gray-600 dark:text-gray-400">Team Members:</span>
              <span className="text-gray-900 dark:text-white">
                {assignment.assigned_to.length}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Timeline</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Started:</span>
              <span className="text-blue-600 dark:text-blue-400">
                {formatDateTime(assignment.start_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Completed:</span>
              <span className="text-green-600 dark:text-green-400">
                {formatDateTime(assignment.complate_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Scheduled:</span>
              <span className="text-gray-900 dark:text-white">
                {formatDateTime(assignment.schedule_complate_date)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Client & Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Client Information</h5>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-gray-900 dark:text-white">{container.client}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-red-600" />
              <span className="text-gray-600 dark:text-gray-400">{container.location}</span>
            </div>
          </div>
        </div>

        <div>
          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Payment</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total:</span>
              <span className="text-gray-900 dark:text-white">${container.full_payment}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
              <span className="text-green-600 dark:text-green-400">${container.remaining_payment}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Invoice:</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                container.invoice 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
              }`}>
                {container.invoice ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="mb-4">
        <h5 className="font-medium text-gray-900 dark:text-white mb-2">Services Provided</h5>
        <div className="flex space-x-2">
          {container.delivery_service && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs">
              Delivery
            </span>
          )}
          {container.instalation_service && (
            <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs">
              Installation
            </span>
          )}
          <span className={`px-2 py-1 rounded-full text-xs ${
            container.order_difficulty === 'HIGH' 
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              : container.order_difficulty === 'MEDIUM'
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
          }`}>
            {container.order_difficulty}
          </span>
        </div>
      </div>

      {/* Orders Summary */}
      <div>
        <h5 className="font-medium text-gray-900 dark:text-white mb-2">Orders Delivered</h5>
        <div className="space-y-1">
          {container.orders.map((order) => (
            <div key={order.order_code} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-zinc-700 rounded">
              <span className="text-gray-900 dark:text-white">ORD-{order.order_code}</span>
              <span className="text-gray-600 dark:text-gray-400">${order.price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// List View Component
const CompletedTaskListItem = ({ 
  assignment, 
  onViewDetails,
  formatDateTime,
  calculateDuration,
  calculateScheduleOffset
}: CompletedTaskCardProps) => {
  const container = assignment.order_container;
  const actualDuration = calculateDuration(assignment.start_date, assignment.complate_date);
  const scheduleOffset = calculateScheduleOffset(assignment.schedule_complate_date, assignment.complate_date);

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="shrink-0">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <span 
                className="font-medium text-gray-900 dark:text-white text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                onClick={() => onViewDetails(assignment)}
              >
                Container #{container.id} - {container.client}
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs">
                COMPLETED
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
              <span className="shrink-0">Completed: {formatDateTime(assignment.complate_date)}</span>
              <span className="shrink-0">Team: {assignment.assigned_to.length} members</span>
              <span className="shrink-0">${container.full_payment}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4 shrink-0">
          <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
// Detail Overlay Component - CORRECTED VERSION
const DetailOverlay = ({
  assignment,
  onClose,
  formatDateTime,
  calculateDuration,
  calculateScheduleOffset
}: {
  assignment: DeliveryAssignment;
  onClose: () => void;
  formatDateTime: (dateString: string | null) => string;
  calculateDuration: (startDate: string | null, completeDate: string | null) => string;
  calculateScheduleOffset: (scheduledDate: string, actualDate: string | null) => string;
}) => {
  const container = assignment.order_container;
  const actualDuration = calculateDuration(assignment.start_date, assignment.complate_date);
  const scheduleOffset = calculateScheduleOffset(assignment.schedule_complate_date, assignment.complate_date);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Container #{container.id} - {container.client}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Completed Delivery & Installation
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
        <div className="p-6 space-y-6">
          {/* Completion Status */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 dark:text-green-300 font-medium">Task Successfully Completed</span>
              </div>
              <span className="text-green-600 dark:text-green-400">
                {formatDateTime(assignment.complate_date)}
              </span>
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-sm text-blue-600 dark:text-blue-400">Actual Duration</div>
                <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{actualDuration}</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-sm text-green-600 dark:text-green-400">Schedule Offset</div>
                <div className={`text-xl font-bold ${
                  scheduleOffset.startsWith('-') 
                    ? 'text-green-600 dark:text-green-400' 
                    : scheduleOffset.startsWith('+')
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {scheduleOffset}
                </div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-sm text-purple-600 dark:text-purple-400">Team Size</div>
                <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                  {assignment.assigned_to.length}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Scheduled Start</label>
                  <p className="text-gray-900 dark:text-white">{formatDateTime(assignment.schedule_start_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Scheduled Completion</label>
                  <p className="text-gray-900 dark:text-white">{formatDateTime(assignment.schedule_complate_date)}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Actual Start</label>
                  <p className="text-blue-600 dark:text-blue-400">{formatDateTime(assignment.start_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Actual Completion</label>
                  <p className="text-green-600 dark:text-green-400">{formatDateTime(assignment.complate_date)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Client Name</label>
                  <p className="text-gray-900 dark:text-white">{container.client}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Contact</label>
                  <p className="text-gray-900 dark:text-white">{container.contact}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Location</label>
                  <p className="text-gray-900 dark:text-white">{container.location}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Special Requirements</label>
                  <p className="text-gray-900 dark:text-white">{container.special_requerment || 'None'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Container Note</label>
                  <p className="text-gray-900 dark:text-white">{container.note || 'None'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Order Difficulty</label>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    container.order_difficulty === 'HIGH' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : container.order_difficulty === 'MEDIUM'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  }`}>
                    {container.order_difficulty}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400">Total Payment</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">${container.full_payment}</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400">Advance Paid</div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">${container.advance_payment}</div>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Remaining Collected</div>
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">${container.remaining_payment}</div>
              </div>
            </div>
          </div>

          {/* Assigned Team */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assigned Team</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignment.assigned_to.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">@{member.telegram_user_name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {member.role.map(r => r.Name).join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Services Provided */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Services Provided</h3>
            <div className="flex space-x-4">
              {container.delivery_service && (
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-900 dark:text-white">Delivery Service</span>
                </div>
              )}
              {container.instalation_service && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-900 dark:text-white">Installation Service</span>
                </div>
              )}
            </div>
          </div>

          {/* Orders Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Orders Delivered</h3>
            <div className="space-y-4">
              {container.orders.map((order) => (
                <div key={order.order_code} className="border border-gray-200 dark:border-zinc-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">ORD-{order.order_code}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">${order.price}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.order_status === 'REM-ACCEPTED' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {order.order_status.replace('-', ' ')}
                    </span>
                  </div>
                  
                  {/* Order Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Cutting Status</h5>
                      <div className="space-y-1">
                        {order.cutting_files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">File #{file.id}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              file.status === 'COMPLATED' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            }`}>
                              {file.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Mockup</h5>
                      {order.mockup && (
                        <div className="flex items-start space-x-3">
                          {order.mockup.mockup_image && (
                            <img
                              src={order.mockup.mockup_image}
                              alt="Order mockup"
                              className="w-16 h-16 object-cover rounded border border-gray-300 dark:border-zinc-600"
                            />
                          )}
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Status: {order.mockup.request_status}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {order.mockup.note || 'No description'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BOM Items */}
                  {order.boms && order.boms.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Bill of Materials</h5>
                      <div className="space-y-2">
                        {order.boms.map((bom) => (
                          <div key={bom.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-zinc-700 rounded">
                            <div>
                              <span className="text-gray-900 dark:text-white">
                                {bom.width} x {bom.height}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400 ml-2">
                                Qty: {bom.amount}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-gray-900 dark:text-white">
                                ${bom.total_price}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                ${bom.price_per_unit}/unit
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Posted By</label>
                <p className="text-gray-900 dark:text-white">
                  @{container.posted_by.telegram_user_name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {container.posted_by.role.map(r => r.Name).join(', ')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Container Created</label>
                <p className="text-gray-900 dark:text-white">{formatDateTime(container.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-zinc-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Close
          </button>
         
        </div>
      </div>
    </div>
  );
};
