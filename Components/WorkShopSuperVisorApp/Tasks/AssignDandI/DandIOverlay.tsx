// Tasks/AssignDandI/DandIOverlay.tsx
import { useState, useEffect } from 'react';
import { Truck, Calendar, Users, MapPin, Phone, DollarSign, Grid, List, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import api from '@/api';

interface OrderContainer {
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
}

interface TeamMember {
  id: number;
  telegram_id: number;
  telegram_user_name: string;
  role: Array<{
    id: number;
    Name: string;
    date: string;
  }>;
  first_name: string;
}

type ViewMode = 'card' | 'list';

interface DandIOverlayProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const DandIOverlay = ({ onClose, onSuccess }: DandIOverlayProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [containers, setContainers] = useState<OrderContainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [assignOverlay, setAssignOverlay] = useState<{
    isOpen: boolean;
    container: OrderContainer | null;
  }>({
    isOpen: false,
    container: null,
  });

  useEffect(() => {
    fetchOrderContainers();
  }, [currentPage]);

  const fetchOrderContainers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/order-container/?is_assigned=false&page=${currentPage}`);
      setContainers(response.data.results || []);
      setTotalPages(Math.ceil(response.data.count / 10));
    } catch (err: any) {
      setError('Failed to fetch order containers');
      console.error('Error fetching containers:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAssignOverlay = (container: OrderContainer) => {
    setAssignOverlay({
      isOpen: true,
      container,
    });
  };

  const closeAssignOverlay = () => {
    setAssignOverlay({
      isOpen: false,
      container: null,
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0) return `${diffDays} days from now`;
    return `${Math.abs(diffDays)} days ago`;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex items-center space-x-3">
              <Truck className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Assign Delivery & Installation
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-3">Loading order containers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700 sticky top-0 bg-white dark:bg-zinc-800 z-10">
          <div className="flex items-center space-x-3">
            <Truck className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Assign Delivery & Installation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* View Toggle */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Available Orders ({containers.length})
            </h3>
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
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {containers.length === 0 ? (
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
              <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Orders Available</h3>
              <p className="text-gray-600 dark:text-gray-400">All orders have been assigned for delivery and installation.</p>
            </div>
          ) : (
            <div className={viewMode === 'card' ? 'space-y-4' : 'space-y-2'}>
              {containers.map((container) =>
                viewMode === 'card' ? (
                  <OrderContainerCard 
                    key={container.id} 
                    container={container} 
                    onAssign={openAssignOverlay}
                    formatDateTime={formatDateTime}
                    getRelativeDate={getRelativeDate}
                  />
                ) : (
                  <OrderContainerListItem 
                    key={container.id} 
                    container={container} 
                    onAssign={openAssignOverlay}
                    formatDateTime={formatDateTime}
                    getRelativeDate={getRelativeDate}
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

        {/* Assign Overlay */}
        {assignOverlay.isOpen && assignOverlay.container && (
          <AssignOverlay
            container={assignOverlay.container}
            onClose={closeAssignOverlay}
            onSuccess={() => {
              fetchOrderContainers();
              closeAssignOverlay();
              onSuccess?.();
            }}
            getRelativeDate={getRelativeDate}
          />
        )}
      </div>
    </div>
  );
};

// Card View Component
const OrderContainerCard = ({ 
  container, 
  onAssign, 
  formatDateTime,
  getRelativeDate
}: { 
  container: OrderContainer;
  onAssign: (container: OrderContainer) => void;
  formatDateTime: (dateString: string) => string;
  getRelativeDate: (dateString: string) => string;
}) => {
  const mainOrder = container.orders[0];
  const completedAssembly = mainOrder.order_status === 'ASSEMBLY-COMPLETED';

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Container #{container.id}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {container.orders.length} order(s) • {container.client}
          </p>
        </div>
        <div className="text-right">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            completedAssembly 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
          }`}>
            {completedAssembly ? 'Assembly Completed' : 'Assembly Pending'}
          </span>
        </div>
      </div>

      {/* Client & Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Client Information</h4>
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
        </div>

        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Order Details</h4>
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
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Delivery Date:</span>
              <span className="text-gray-900 dark:text-white">{getRelativeDate(container.delivery_date)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Services Required</h4>
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
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Orders Summary</h4>
        <div className="space-y-2">
          {container.orders.map((order) => (
            <div key={order.order_code} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-zinc-700 rounded">
              <span className="text-gray-900 dark:text-white">ORD-{order.order_code}</span>
              <span className="text-gray-600 dark:text-gray-400">${order.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Assign Button */}
      <button
        onClick={() => onAssign(container)}
        disabled={!completedAssembly}
        className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg transition-colors ${
          completedAssembly
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-400 text-white cursor-not-allowed'
        }`}
      >
        <Truck className="w-4 h-4" />
        <span>{completedAssembly ? 'Assign for Delivery' : 'Waiting for Assembly'}</span>
      </button>
    </div>
  );
};

// List View Component
const OrderContainerListItem = ({ 
  container, 
  onAssign, 
  formatDateTime,
  getRelativeDate
}: { 
  container: OrderContainer;
  onAssign: (container: OrderContainer) => void;
  formatDateTime: (dateString: string) => string;
  getRelativeDate: (dateString: string) => string;
}) => {
  const mainOrder = container.orders[0];
  const completedAssembly = mainOrder.order_status === 'ASSEMBLY-COMPLETED';

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              Container #{container.id}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs">
              {container.client}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              completedAssembly 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            }`}>
              {completedAssembly ? 'Ready' : 'Pending'}
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
              <DollarSign className="w-3 h-3" />
              <span>${container.full_payment}</span>
            </div>
            <div className="flex items-center space-x-1 shrink-0">
              <Calendar className="w-3 h-3" />
              <span>{getRelativeDate(container.delivery_date)}</span>
            </div>
            <div className="flex items-center space-x-1 shrink-0">
              <span>Orders: {container.orders.length}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4 shrink-0">
          <button
            onClick={() => onAssign(container)}
            disabled={!completedAssembly}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors text-sm ${
              completedAssembly
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-400 text-white cursor-not-allowed'
            }`}
          >
            <Truck className="w-3 h-3" />
            <span>Assign</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Assign Overlay Component
const AssignOverlay = ({
  container,
  onClose,
  onSuccess,
  getRelativeDate
}: {
  container: OrderContainer;
  onClose: () => void;
  onSuccess: () => void;
  getRelativeDate: (dateString: string) => string;
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [scheduleStartDate, setScheduleStartDate] = useState<string>('');
  const [scheduleCompleteDate, setScheduleCompleteDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingTeam, setFetchingTeam] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

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

  const handleAssign = async () => {
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
        order_container: container.id,
        assigned_to: selectedMembers,
        schedule_start_date: startDate.toISOString(),
        schedule_complate_date: completeDate.toISOString(),
        status: 'ASSIGNED'
      };

      await api.post('/api/dandi/', payload);
      onSuccess();
      
    } catch (err: any) {
      console.error('Error assigning task:', err);
      setError('Failed to assign task. Please try again.');
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-3">
            <Truck className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Assign for Delivery & Installation
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Container #{container.id} • {container.client}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
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
                          {member.role.map(r => r.Name).join(', ')}
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
              onClick={handleAssign}
              disabled={loading || selectedMembers.length === 0 || !scheduleStartDate || !scheduleCompleteDate}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Assign Task</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};