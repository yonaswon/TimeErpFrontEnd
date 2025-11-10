// Tasks/DeliveryAssignedToYou.tsx
import { useState, useEffect } from 'react';
import { Truck, Calendar, MapPin, Users, Phone, DollarSign, Package, Play, Grid, List, AlertCircle, CheckCircle } from 'lucide-react';
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

export const DeliveryAssignedToYou = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingTask, setStartingTask] = useState<number | null>(null);
  const [detailOverlay, setDetailOverlay] = useState<{
    isOpen: boolean;
    assignment: DeliveryAssignment | null;
  }>({
    isOpen: false,
    assignment: null,
  });

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
      
      const response = await api.get(`/api/dandi/?assigned_to=${userId}&status=ASSIGNED`);
      setAssignments(response.data.results || []);
    } catch (err: any) {
      setError('Failed to fetch assigned tasks');
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (assignmentId: number) => {
    try {
      setStartingTask(assignmentId);
      setError(null);

      await api.post(`/api/dandi/${assignmentId}/start/`);
      
      // Refresh the task list
      fetchAssignedTasks();
      
    } catch (err: any) {
      console.error('Error starting task:', err);
      setError('Failed to start task. Please try again.');
    } finally {
      setStartingTask(null);
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

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 0) return `${diffDays} days from now`;
    return `${Math.abs(diffDays)} days ago`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-3">Loading assigned tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-gray-200 dark:border-zinc-700 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchAssignedTasks}
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
        <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Tasks Assigned
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have any delivery or installation tasks assigned to you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Assigned to You ({assignments.length})
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
            <DeliveryTaskCard 
              key={assignment.id} 
              assignment={assignment} 
              onStart={handleStart}
              onViewDetails={openDetailOverlay}
              isStarting={startingTask === assignment.id}
              formatDateTime={formatDateTime}
              getRelativeDate={getRelativeDate}
            />
          ) : (
            <DeliveryTaskListItem 
              key={assignment.id} 
              assignment={assignment} 
              onStart={handleStart}
              onViewDetails={openDetailOverlay}
              isStarting={startingTask === assignment.id}
              formatDateTime={formatDateTime}
              getRelativeDate={getRelativeDate}
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
          getRelativeDate={getRelativeDate}
        />
      )}
    </div>
  );
};

// Card View Component
interface DeliveryTaskCardProps {
  assignment: DeliveryAssignment;
  onStart: (assignmentId: number) => void;
  onViewDetails: (assignment: DeliveryAssignment) => void;
  isStarting: boolean;
  formatDateTime: (dateString: string | null) => string;
  getRelativeDate: (dateString: string) => string;
}

const DeliveryTaskCard = ({ 
  assignment, 
  onStart, 
  onViewDetails,
  isStarting,
  formatDateTime,
  getRelativeDate
}: DeliveryTaskCardProps) => {
  const container = assignment.order_container;

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
        </div>
        <div className="text-right">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-medium">
            ASSIGNED
          </span>
        </div>
      </div>

      {/* Delivery & Location Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Delivery Information</h5>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-gray-600 dark:text-gray-400">Delivery Date</div>
                <div className="text-gray-900 dark:text-white">
                  {getRelativeDate(container.delivery_date)}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-red-600" />
              <div>
                <div className="text-gray-600 dark:text-gray-400">Location</div>
                <div className="text-gray-900 dark:text-white">{container.location}</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Schedule</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Start:</span>
              <span className="text-gray-900 dark:text-white">
                {formatDateTime(assignment.schedule_start_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Complete:</span>
              <span className="text-gray-900 dark:text-white">
                {formatDateTime(assignment.schedule_complate_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Team:</span>
              <span className="text-gray-900 dark:text-white">
                {assignment.assigned_to.length} members
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-gray-600 dark:text-gray-400">Total Payment:</span>
            <span className="font-medium text-gray-900 dark:text-white">${container.full_payment}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
            <span className="font-medium text-yellow-600 dark:text-yellow-400">${container.remaining_payment}</span>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="mb-4">
        <h5 className="font-medium text-gray-900 dark:text-white mb-2">Services Required</h5>
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
      <div className="mb-4">
        <h5 className="font-medium text-gray-900 dark:text-white mb-2">Orders</h5>
        <div className="space-y-1">
          {container.orders.map((order) => (
            <div key={order.order_code} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-zinc-700 rounded">
              <span className="text-gray-900 dark:text-white">ORD-{order.order_code}</span>
              <span className="text-gray-600 dark:text-gray-400">${order.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={() => onStart(assignment.id)}
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
            <span>Start Delivery & Installation</span>
          </>
        )}
      </button>
    </div>
  );
};

// List View Component
const DeliveryTaskListItem = ({ 
  assignment, 
  onStart, 
  onViewDetails,
  isStarting,
  formatDateTime,
  getRelativeDate
}: DeliveryTaskCardProps) => {
  const container = assignment.order_container;

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="shrink-0">
            <Truck className="w-8 h-8 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <span 
                className="font-medium text-gray-900 dark:text-white text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                onClick={() => onViewDetails(assignment)}
              >
                Container #{container.id} - {container.client}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs">
                ASSIGNED
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400 overflow-x-auto scrollbar-thin pb-1">
              <div className="flex items-center space-x-1 shrink-0">
                <MapPin className="w-3 h-3" />
                <span>{container.location}</span>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <Calendar className="w-3 h-3" />
                <span>{getRelativeDate(container.delivery_date)}</span>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <Users className="w-3 h-3" />
                <span>{assignment.assigned_to.length} members</span>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <DollarSign className="w-3 h-3" />
                <span>${container.full_payment}</span>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <span>{container.orders.length} orders</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4 shrink-0">
          <button
            onClick={() => onStart(assignment.id)}
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
        </div>
      </div>
    </div>
  );
};

// Detail Overlay Component
const DetailOverlay = ({
  assignment,
  onClose,
  formatDateTime,
  getRelativeDate
}: {
  assignment: DeliveryAssignment;
  onClose: () => void;
  formatDateTime: (dateString: string | null) => string;
  getRelativeDate: (dateString: string) => string;
}) => {
  const container = assignment.order_container;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-3">
            <Truck className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Container #{container.id} - {container.client}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Delivery & Installation Details
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

          {/* Delivery Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delivery Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Delivery Date</label>
                  <p className="text-gray-900 dark:text-white">{formatDateTime(container.delivery_date)}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">{getRelativeDate(container.delivery_date)}</p>
                </div>
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
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Services Required</label>
                  <div className="flex space-x-2 mt-1">
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
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Assigned Team</label>
                  <div className="mt-1 space-y-1">
                    {assignment.assigned_to.map((member) => (
                      <div key={member.id} className="text-sm text-gray-900 dark:text-white">
                        @{member.telegram_user_name}
                      </div>
                    ))}
                  </div>
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
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Remaining</div>
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">${container.remaining_payment}</div>
              </div>
            </div>
          </div>

          {/* Orders Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Orders</h3>
            <div className="space-y-4">
              {container.orders.map((order) => (
                <div key={order.order_code} className="border border-gray-200 dark:border-zinc-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">ORD-{order.order_code}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">${order.price}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.order_status === 'ASSEMBLY-COMPLETED' 
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
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
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
                          <img
                            src={order.mockup.mockup_image}
                            alt="Order mockup"
                            className="w-16 h-16 object-cover rounded border border-gray-300"
                          />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {order.mockup.note || 'No description'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};