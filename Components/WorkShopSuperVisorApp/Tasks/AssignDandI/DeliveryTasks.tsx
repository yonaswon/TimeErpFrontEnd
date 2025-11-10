// Tasks/DeliveryTasks.tsx
import { useState, useEffect } from 'react';
import { Truck, Calendar, Users, MapPin, Phone, DollarSign, Edit, Package, Wrench, Scissors, Grid, List, AlertCircle, CheckCircle } from 'lucide-react';
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

export const DeliveryTasks = () => {
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
  const [editOverlay, setEditOverlay] = useState<{
    isOpen: boolean;
    assignment: DeliveryAssignment | null;
  }>({
    isOpen: false,
    assignment: null,
  });

  useEffect(() => {
    fetchDeliveryAssignments();
  }, []);

  const fetchDeliveryAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/dandi/?ordering=-date');
      setAssignments(response.data.results || []);
    } catch (err: any) {
      setError('Failed to fetch delivery assignments');
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

  const openEditOverlay = (assignment: DeliveryAssignment) => {
    setEditOverlay({
      isOpen: true,
      assignment,
    });
  };

  const closeEditOverlay = () => {
    setEditOverlay({
      isOpen: false,
      assignment: null,
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    const statusConfig = {
      'ASSIGNED': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'STARTED': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'COMPLATED': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig['ASSIGNED'];
  };

  const getDifficultyColor = (difficulty: string) => {
    const difficultyConfig = {
      'LOW': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'MEDIUM': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'HIGH': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return difficultyConfig[difficulty as keyof typeof difficultyConfig] || difficultyConfig['MEDIUM'];
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-3">Loading delivery assignments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-gray-200 dark:border-zinc-700 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchDeliveryAssignments}
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
          No Delivery Assignments
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          No delivery and installation tasks have been assigned yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-end">
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

      {/* Tasks */}
      <div className="space-y-3">
        {assignments.map((assignment) =>
          viewMode === 'card' ? (
            <DeliveryTaskCard 
              key={assignment.id} 
              assignment={assignment} 
              onViewDetails={openDetailOverlay}
              onEdit={openEditOverlay}
              formatDateTime={formatDateTime}
              getStatusColor={getStatusColor}
              getDifficultyColor={getDifficultyColor}
            />
          ) : (
            <DeliveryTaskListItem 
              key={assignment.id} 
              assignment={assignment} 
              onViewDetails={openDetailOverlay}
              onEdit={openEditOverlay}
              formatDateTime={formatDateTime}
              getStatusColor={getStatusColor}
              getDifficultyColor={getDifficultyColor}
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
          getStatusColor={getStatusColor}
          getDifficultyColor={getDifficultyColor}
        />
      )}

      {/* Edit Overlay */}
      {editOverlay.isOpen && editOverlay.assignment && (
        <EditOverlay
          assignment={editOverlay.assignment}
          onClose={closeEditOverlay}
          onSuccess={() => {
            closeEditOverlay();
            fetchDeliveryAssignments();
          }}
        />
      )}
    </div>
  );
};

// Card View Component
interface DeliveryTaskCardProps {
  assignment: DeliveryAssignment;
  onViewDetails: (assignment: DeliveryAssignment) => void;
  onEdit: (assignment: DeliveryAssignment) => void;
  formatDateTime: (dateString: string | null) => string;
  getStatusColor: (status: string) => string;
  getDifficultyColor: (difficulty: string) => string;
}

const DeliveryTaskCard = ({ 
  assignment, 
  onViewDetails, 
  onEdit,
  formatDateTime,
  getStatusColor,
  getDifficultyColor
}: DeliveryTaskCardProps) => {
  const container = assignment.order_container;

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Client & Basic Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 
                className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                onClick={() => onViewDetails(assignment)}
              >
                Container #{container.id} - {container.client}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {container.orders.length} order(s) • {container.contact}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                {assignment.status}
              </span>
              <button
                onClick={() => onEdit(assignment)}
                className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="Edit assignment"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Client & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-gray-900 dark:text-white">{container.client}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-green-600" />
                <span className="text-gray-600 dark:text-gray-400">{container.contact}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-red-600" />
                <span className="text-gray-600 dark:text-gray-400">{container.location}</span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Payment:</span>
                <span className="text-gray-900 dark:text-white">${container.full_payment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Advance Paid:</span>
                <span className="text-green-600 dark:text-green-400">${container.advance_payment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                <span className="text-yellow-600 dark:text-yellow-400">${container.remaining_payment}</span>
              </div>
            </div>
          </div>

          {/* Schedule & Team */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-green-600" />
                <span className="text-gray-700 dark:text-gray-300">Start:</span>
                <span className="text-gray-900 dark:text-white">
                  {formatDateTime(assignment.schedule_start_date)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span className="text-gray-700 dark:text-gray-300">Complete:</span>
                <span className="text-gray-900 dark:text-white">
                  {formatDateTime(assignment.schedule_complate_date)}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">Team:</span>
                <span className="text-gray-900 dark:text-white">
                  {assignment.assigned_to.length} member(s)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-700 dark:text-gray-300">Difficulty:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(container.order_difficulty)}`}>
                  {container.order_difficulty}
                </span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="mb-3">
            <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Services Required</h5>
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
            </div>
          </div>

          {/* Orders Summary */}
          <div>
            <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Orders</h5>
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
      </div>
    </div>
  );
};

// List View Component
const DeliveryTaskListItem = ({ 
  assignment, 
  onViewDetails, 
  onEdit,
  formatDateTime,
  getStatusColor,
  getDifficultyColor
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
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(assignment.status)}`}>
                {assignment.status}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(container.order_difficulty)}`}>
                {container.order_difficulty}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400 overflow-x-auto scrollbar-thin pb-1">
              <div className="flex items-center space-x-1 shrink-0">
                <Phone className="w-3 h-3" />
                <span>{container.contact}</span>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <MapPin className="w-3 h-3" />
                <span>{container.location}</span>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <Calendar className="w-3 h-3" />
                <span>{formatDateTime(assignment.schedule_start_date)}</span>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <Users className="w-3 h-3" />
                <span>{assignment.assigned_to.length} members</span>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <DollarSign className="w-3 h-3" />
                <span>${container.full_payment}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4 shrink-0">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {container.orders.length} order(s)
          </span>
          <button
            onClick={() => onEdit(assignment)}
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

// Detail Overlay Component
const DetailOverlay = ({
  assignment,
  onClose,
  formatDateTime,
  getStatusColor,
  getDifficultyColor
}: {
  assignment: DeliveryAssignment;
  onClose: () => void;
  formatDateTime: (dateString: string | null) => string;
  getStatusColor: (status: string) => string;
  getDifficultyColor: (difficulty: string) => string;
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
          {/* Assignment Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-zinc-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
              <div className={`mt-1 px-2 py-1 rounded-full text-xs font-medium inline-block ${getStatusColor(assignment.status)}`}>
                {assignment.status}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-zinc-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Difficulty</div>
              <div className={`mt-1 px-2 py-1 rounded-full text-xs font-medium inline-block ${getDifficultyColor(container.order_difficulty)}`}>
                {container.order_difficulty}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-zinc-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Orders</div>
              <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {container.orders.length}
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

          {/* Schedule Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Schedule</h3>
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
                  <p className="text-gray-900 dark:text-white">{formatDateTime(assignment.start_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Actual Completion</label>
                  <p className="text-gray-900 dark:text-white">{formatDateTime(assignment.complate_date)}</p>
                </div>
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

// Edit Overlay Component
const EditOverlay = ({
  assignment,
  onClose,
  onSuccess
}: {
  assignment: DeliveryAssignment;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [scheduleStartDate, setScheduleStartDate] = useState<string>('');
  const [scheduleCompleteDate, setScheduleCompleteDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingTeam, setFetchingTeam] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamMembers();
    // Set initial values
    setSelectedMembers(assignment.assigned_to.map(member => member.id));
    setScheduleStartDate(assignment.schedule_start_date ? 
      new Date(assignment.schedule_start_date).toISOString().slice(0, 16) : '');
    setScheduleCompleteDate(assignment.schedule_complate_date ? 
      new Date(assignment.schedule_complate_date).toISOString().slice(0, 16) : '');
  }, [assignment]);

  const fetchTeamMembers = async () => {
    try {
      setFetchingTeam(true);
      const response = await api.get('/core/teams/?role=AssemblyDeliveryandInstalationApp');
      setTeamMembers(response.data);
    } catch (err: any) {
      setError('Failed to fetch team members');
      console.error('Error fetching team members:', err);
    } finally {
      setFetchingTeam(false);
    }
  };

  const handleMemberToggle = (memberId: number) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleUpdate = async () => {
    if (selectedMembers.length === 0 || !scheduleStartDate || !scheduleCompleteDate) {
      setError('Please select at least one team member and set schedule dates');
      return;
    }

    // Validate dates
    const startDate = new Date(scheduleStartDate);
    const completeDate = new Date(scheduleCompleteDate);
    const now = new Date();

    if (startDate <= now) {
      setError('Start date must be in the future');
      return;
    }

    if (completeDate <= startDate) {
      setError('Completion date must be after start date');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        assigned_to: selectedMembers,
        schedule_start_date: startDate.toISOString(),
        schedule_complate_date: completeDate.toISOString()
      };

      await api.patch(`/api/dandi/${assignment.id}/`, payload);
      onSuccess();
      
    } catch (err: any) {
      console.error('Error updating assignment:', err);
      setError('Failed to update assignment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMinStartDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const getMinCompleteDate = () => {
    if (!scheduleStartDate) return getMinStartDate();
    return scheduleStartDate;
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-3">
            <Edit className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Assignment
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Container #{assignment.order_container.id} - {assignment.order_container.client}
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
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Team Members Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign To Team Members *
              </label>
              {fetchingTeam ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Loading team members...</p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800">
                  {teamMembers.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center space-x-2 p-3 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer border-b border-gray-100 dark:border-zinc-600 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => handleMemberToggle(member.id)}
                        className="text-blue-600 rounded"
                      />
                      <Users className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          @{member.telegram_user_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {member.role.map((r:any) => r.Name).join(', ')}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {selectedMembers.length > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  {selectedMembers.length} member(s) selected
                </p>
              )}
            </div>

            {/* Schedule Dates */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Schedule Start Date *
                </label>
                <input
                  type="datetime-local"
                  value={scheduleStartDate}
                  onChange={(e) => setScheduleStartDate(e.target.value)}
                  min={getMinStartDate()}
                  className="w-full p-3 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                />
                {scheduleStartDate && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {getRelativeDate(scheduleStartDate)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Schedule Complete Date *
                </label>
                <input
                  type="datetime-local"
                  value={scheduleCompleteDate}
                  onChange={(e) => setScheduleCompleteDate(e.target.value)}
                  min={getMinCompleteDate()}
                  className="w-full p-3 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                />
                {scheduleCompleteDate && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {getRelativeDate(scheduleCompleteDate)}
                  </p>
                )}
              </div>
            </div>
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
              onClick={handleUpdate}
              disabled={loading || selectedMembers.length === 0 || !scheduleStartDate || !scheduleCompleteDate}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Update Assignment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};