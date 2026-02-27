// Tasks/DeliveryStartedTasks.tsx
import { useState, useEffect } from 'react';
import { Truck, Calendar, MapPin, Users, DollarSign, CheckCircle, Grid, List, AlertCircle, Clock } from 'lucide-react';
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

interface BankAccount {
  id: number;
  bank: string;
  available_amount: string;
  account_number: string;
  account_type: string;
  account_name: string;
  deleted: boolean;
  date: string;
}

type ViewMode = 'card' | 'list';

export const DeliveryStartedTasks = () => {
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
  const [completeOverlay, setCompleteOverlay] = useState<{
    isOpen: boolean;
    assignment: DeliveryAssignment | null;
  }>({
    isOpen: false,
    assignment: null,
  });

  useEffect(() => {
    fetchStartedTasks();
  }, []);

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

      const response = await api.get(`/api/dandi/?assigned_to=${userId}&status=STARTED`);
      setAssignments(response.data.results || []);
    } catch (err: any) {
      setError('Failed to fetch started tasks');
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

  const openCompleteOverlay = (assignment: DeliveryAssignment) => {
    setCompleteOverlay({
      isOpen: true,
      assignment,
    });
  };

  const closeCompleteOverlay = () => {
    setCompleteOverlay({
      isOpen: false,
      assignment: null,
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

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-3">Loading started tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-gray-200 dark:border-zinc-700 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchStartedTasks}
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
        <Truck className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Tasks In Progress
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have any delivery or installation tasks in progress.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tasks In Progress ({assignments.length})
        </h2>
        <div className="bg-gray-100 dark:bg-zinc-700 rounded-lg p-1 flex">
          <button
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

      {/* Tasks */}
      <div className={viewMode === 'card' ? 'space-y-4' : 'space-y-2'}>
        {assignments.map((assignment) =>
          viewMode === 'card' ? (
            <StartedTaskCard
              key={assignment.id}
              assignment={assignment}
              onComplete={openCompleteOverlay}
              onViewDetails={openDetailOverlay}
              formatDateTime={formatDateTime}
              calculateDuration={calculateDuration}
            />
          ) : (
            <StartedTaskListItem
              key={assignment.id}
              assignment={assignment}
              onComplete={openCompleteOverlay}
              onViewDetails={openDetailOverlay}
              formatDateTime={formatDateTime}
              calculateDuration={calculateDuration}
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
        />
      )}

      {/* Complete Overlay */}
      {completeOverlay.isOpen && completeOverlay.assignment && (
        <CompleteOverlay
          assignment={completeOverlay.assignment}
          onClose={closeCompleteOverlay}
          onSuccess={() => {
            closeCompleteOverlay();
            fetchStartedTasks();
          }}
        />
      )}
    </div>
  );
};

// Card View Component
interface StartedTaskCardProps {
  assignment: DeliveryAssignment;
  onComplete: (assignment: DeliveryAssignment) => void;
  onViewDetails: (assignment: DeliveryAssignment) => void;
  formatDateTime: (dateString: string | null) => string;
  calculateDuration: (startDate: string | null) => string;
}

const StartedTaskCard = ({
  assignment,
  onComplete,
  onViewDetails,
  formatDateTime,
  calculateDuration
}: StartedTaskCardProps) => {
  const container = assignment.order_container;
  const duration = calculateDuration(assignment.start_date);

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
            Started: {formatDateTime(assignment.start_date)}
          </p>
        </div>
        <div className="text-right">
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-xs font-medium">
            IN PROGRESS
          </span>
        </div>
      </div>

      {/* Progress Info */}
      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-yellow-700 dark:text-yellow-300 font-medium">In Progress</span>
          </div>
          <span className="text-yellow-600 dark:text-yellow-400">
            Duration: {duration}
          </span>
        </div>
      </div>

      {/* Delivery & Schedule Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Delivery Information</h5>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-red-600" />
              <div>
                <div className="text-gray-600 dark:text-gray-400">Location</div>
                <div className="text-gray-900 dark:text-white">{container.location}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-gray-600 dark:text-gray-400">Team</div>
                <div className="text-gray-900 dark:text-white">
                  {assignment.assigned_to.length} members
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Schedule</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Started:</span>
              <span className="text-green-600 dark:text-green-400">
                {formatDateTime(assignment.start_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Scheduled Complete:</span>
              <span className="text-gray-900 dark:text-white">
                {formatDateTime(assignment.schedule_complate_date)}
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
            <span className="text-gray-600 dark:text-gray-400">Remaining Payment:</span>
            <span className="font-medium text-yellow-600 dark:text-yellow-400">${container.remaining_payment}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Invoice: {container.invoice ? 'Yes' : 'No'}
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
        </div>
      </div>

      {/* Complete Button */}
      <button
        onClick={() => onComplete(assignment)}
        className="w-full flex items-center justify-center space-x-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <CheckCircle className="w-4 h-4" />
        <span>Complete Task</span>
      </button>
    </div>
  );
};

// List View Component
const StartedTaskListItem = ({
  assignment,
  onComplete,
  onViewDetails,
  formatDateTime,
  calculateDuration
}: StartedTaskCardProps) => {
  const container = assignment.order_container;
  const duration = calculateDuration(assignment.start_date);

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="shrink-0">
            <Truck className="w-8 h-8 text-yellow-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <span
                className="font-medium text-gray-900 dark:text-white text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                onClick={() => onViewDetails(assignment)}
              >
                Container #{container.id} - {container.client}
              </span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-xs">
                IN PROGRESS
              </span>
            </div>

            <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400 overflow-x-auto scrollbar-thin pb-1">
              <div className="flex items-center space-x-1 shrink-0">
                <MapPin className="w-3 h-3" />
                <span>{container.location}</span>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <Clock className="w-3 h-3" />
                <span>Duration: {duration}</span>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <Calendar className="w-3 h-3" />
                <span>Started: {formatDateTime(assignment.start_date)}</span>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <DollarSign className="w-3 h-3" />
                <span>${container.remaining_payment}</span>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <span>{container.orders.length} orders</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4 shrink-0">
          <button
            onClick={() => onComplete(assignment)}
            className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <CheckCircle className="w-3 h-3" />
            <span>Complete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Detail Overlay Component (Similar to previous one, but with started-specific info)
const DetailOverlay = ({
  assignment,
  onClose,
  formatDateTime,
  calculateDuration
}: {
  assignment: DeliveryAssignment;
  onClose: () => void;
  formatDateTime: (dateString: string | null) => string;
  calculateDuration: (startDate: string | null) => string;
}) => {
  const container = assignment.order_container;
  const duration = calculateDuration(assignment.start_date);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-3">
            <Truck className="w-6 h-6 text-yellow-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Container #{container.id} - {container.client}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Delivery & Installation In Progress
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
          {/* Progress Status */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-700 dark:text-yellow-300 font-medium">Task In Progress</span>
              </div>
              <span className="text-yellow-600 dark:text-yellow-400">
                Duration: {duration}
              </span>
            </div>
          </div>

          {/* Rest of the detail content similar to previous DetailOverlay */}
          {/* ... (Client Information, Payment Information, Schedule, Orders Details) */}
        </div>
      </div>
    </div>
  );
};

// Complete Overlay Component
const CompleteOverlay = ({
  assignment,
  onClose,
  onSuccess
}: {
  assignment: DeliveryAssignment;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'BANK' | 'CASH' | 'CHECK'>('CASH');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingAccounts, setFetchingAccounts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const container = assignment.order_container;

  useEffect(() => {
    if (paymentMethod === 'BANK') {
      fetchBankAccounts();
    }
  }, [paymentMethod]);

  const fetchBankAccounts = async () => {
    try {
      setFetchingAccounts(true);
      setError(null);

      const endpoint = container.invoice
        ? '/finance/account/?account_type=C&deleted=false'
        : '/finance/account/?account_type=P&deleted=false';

      const response = await api.get(endpoint);
      setBankAccounts(response.data || []);
    } catch (err: any) {
      setError('Failed to fetch bank accounts');
      console.error('Error fetching bank accounts:', err);
    } finally {
      setFetchingAccounts(false);
    }
  };

  const handleComplete = async () => {
    if (paymentMethod !== 'CASH' && !paymentScreenshot) {
      setError('Payment screenshot is required for Bank/Check payments');
      return;
    }

    if ((paymentMethod === 'BANK' || paymentMethod === 'CHECK') && !selectedAccount) {
      setError('Account selection is required for this payment method');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('method', paymentMethod);
      if (paymentScreenshot) {
        formData.append('payment_screenshot', paymentScreenshot);
      }

      if (paymentMethod !== 'CASH') {
        formData.append('account', selectedAccount);
      }

      if (paymentNote) {
        formData.append('payment_note', paymentNote);
      }

      await api.post(`/api/dandi/${assignment.id}/complete/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onSuccess();

    } catch (err: any) {
      console.error('Error completing task:', err);
      setError('Failed to complete task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentScreenshot(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Complete Task
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Container #{container.id} - {container.client}
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
            {/* Payment Information */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400">Remaining Payment</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                ${container.remaining_payment}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Invoice: {container.invoice ? 'Yes' : 'No'}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Method *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['BANK', 'CASH', 'CHECK'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-3 text-center rounded-lg border transition-colors ${paymentMethod === method
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-zinc-600 hover:border-blue-500'
                      }`}
                  >
                    <div className="text-sm font-medium">{method}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bank Account Selection */}
            {paymentMethod === 'BANK' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Bank Account *
                </label>
                {fetchingAccounts ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Loading bank accounts...</p>
                  </div>
                ) : bankAccounts.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No bank accounts available
                  </div>
                ) : (
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select an account</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.bank} - {account.account_number} ({account.account_name})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Payment Screenshot */}
            {paymentMethod !== 'CASH' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Screenshot *
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="payment-screenshot"
                  />
                  <label
                    htmlFor="payment-screenshot"
                    className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {paymentScreenshot ? paymentScreenshot.name : 'Choose payment screenshot'}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    PNG, JPG, JPEG files
                  </p>
                </div>
              </div>
            )}

            {/* Payment Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Note (Optional)
              </label>
              <textarea
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                placeholder="Add any notes about the payment..."
              />
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
              onClick={handleComplete}
              disabled={loading || (paymentMethod !== 'CASH' && !paymentScreenshot) || (paymentMethod !== 'CASH' && !selectedAccount)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Completing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete Task</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};