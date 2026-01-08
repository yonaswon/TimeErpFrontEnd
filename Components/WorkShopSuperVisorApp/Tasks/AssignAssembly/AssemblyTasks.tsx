// AssemblyTasks.tsx
import { useState, useEffect } from 'react';
import { Wrench, User, Calendar, Edit, Users, AlertCircle, CheckCircle, X, Save, Grid, List } from 'lucide-react';
import api from '@/api';

interface AssemblyAssignment {
  id: number;
  order: {
    design_type: number;
    order_status: string;
    mockup: number;
    mockup_modification: any;
    mockup_image: string | null;
    price: number;
  };
  assigned_to: TeamMember[];
  status: string;
  schedule_start_date: string | null;
  schedule_complate_date: string | null;
  start_date: string | null;
  complate_date: string | null;
  date: string;
}

interface TeamMember {
  id: number;
  telegram_id: number;
  telegram_user_name: string;
  role: Role[];
  first_name: string;
}

interface Role {
  id: number;
  Name: string;
}

export const AssemblyTasks = () => {
  const [assignments, setAssignments] = useState<AssemblyAssignment[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [editingAssignment, setEditingAssignment] = useState<AssemblyAssignment | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [scheduleStartDate, setScheduleStartDate] = useState<string>('');
  const [scheduleCompleteDate, setScheduleCompleteDate] = useState<string>('');
  const [status, setStatus] = useState<string>('ASSIGNED');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  useEffect(() => {
    fetchAssignments();
    fetchTeamMembers();
  }, [currentPage]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/assembly-assign/?ordering=-date&p=${currentPage}`);
      setAssignments(response.data.results || []);
      setTotalPages(Math.ceil(response.data.count / 10));
    } catch (err) {
      setError('Failed to fetch assembly assignments');
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await api.get('/core/teams/?role=ASSEMBLY');
      setTeamMembers(response.data);
    } catch (err) {
      console.error('Error fetching team members:', err);
    }
  };

  const openEditOverlay = (assignment: AssemblyAssignment) => {
    setEditingAssignment(assignment);
    setSelectedMembers(assignment.assigned_to.map(member => member.id));
    setScheduleStartDate(assignment.schedule_start_date ? 
      new Date(assignment.schedule_start_date).toISOString().slice(0, 16) : '');
    setScheduleCompleteDate(assignment.schedule_complate_date ? 
      new Date(assignment.schedule_complate_date).toISOString().slice(0, 16) : '');
    setStatus(assignment.status);
    setError(null);
    setSuccess(null);
  };

  const closeEditOverlay = () => {
    setEditingAssignment(null);
    setSelectedMembers([]);
    setScheduleStartDate('');
    setScheduleCompleteDate('');
    setStatus('ASSIGNED');
    setError(null);
    setSuccess(null);
  };

  const handleMemberToggle = (memberId: number) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleUpdate = async () => {
    if (!editingAssignment) return;

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
      setUpdating(true);
      setError(null);

      const payload = {
        assigned_to: selectedMembers,
        schedule_start_date: startDate.toISOString(),
        schedule_complate_date: completeDate.toISOString(),
        status: status
      };

      console.log('Updating assignment:', payload);

      const response = await api.patch(`/api/assembly-assign/${editingAssignment.id}/`, payload);

      setSuccess('Assembly assignment updated successfully!');
      
      // Refresh the list and close overlay
      setTimeout(() => {
        fetchAssignments();
        closeEditOverlay();
      }, 2000);

    } catch (err: any) {
      console.error('Update error:', err);
      
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          setError(`Update failed: ${JSON.stringify(err.response.data)}`);
        } else {
          setError(`Update failed: ${err.response.data}`);
        }
      } else {
        setError('Failed to update assignment. Please try again.');
      }
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'NOT-ASSIGNED': { color: 'bg-gray-100 text-gray-800', label: 'Not Assigned' },
      'ASSIGNED': { color: 'bg-blue-100 text-blue-800', label: 'Assigned' },
      'STARTED': { color: 'bg-yellow-100 text-yellow-800', label: 'Started' },
      'COMPLATED': { color: 'bg-green-100 text-green-800', label: 'Completed' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['NOT-ASSIGNED'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
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
    if (diffDays === 2) return '2 days from now';
    if (diffDays === 3) return '3 days from now';
    return `${diffDays} days from now`;
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Card View Component
  const CardView = ({ assignment }: { assignment: AssemblyAssignment }) => (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Assignment #{assignment.id}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Created: {formatDate(assignment.date)}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(assignment.status)}
          <button
            onClick={() => openEditOverlay(assignment)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Edit assignment"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Information */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Order Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                assignment.order.order_status === 'PRE-ACCEPTED' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {assignment.order.order_status.replace('-', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Price:</span>
              <span className="text-gray-900 dark:text-white">
                ${assignment.order.price}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Design Type:</span>
              <span className="text-gray-900 dark:text-white">
                {assignment.order.design_type}
              </span>
            </div>
          </div>
        </div>

        {/* Assignment Details */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Assignment Details</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Assigned To:</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {assignment.assigned_to.map(member => `@${member.telegram_user_name}`).join(', ')}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Schedule Start:</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatDate(assignment.schedule_start_date)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Schedule Complete:</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatDate(assignment.schedule_complate_date)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // List View Component with horizontal scrolling
  const ListView = ({ assignment }: { assignment: AssemblyAssignment }) => (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="shrink-0">
            <Wrench className="w-8 h-8 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                Assignment #{assignment.id}
              </span>
              {getStatusBadge(assignment.status)}
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-zinc-600 dark:scrollbar-track-zinc-800 pb-1">
              <div className="flex items-center space-x-1 shrink-0">
                <Users className="w-3 h-3" />
                <span className="truncate">
                  {assignment.assigned_to.map(member => `@${member.telegram_user_name}`).join(', ')}
                </span>
              </div>
              
              <div className="flex items-center space-x-1 shrink-0">
                <Calendar className="w-3 h-3" />
                <span>Start: {formatDate(assignment.schedule_start_date)}</span>
              </div>
              
              <div className="flex items-center space-x-1 shrink-0">
                <Calendar className="w-3 h-3" />
                <span>Complete: {formatDate(assignment.schedule_complate_date)}</span>
              </div>
              
              <div className="flex items-center space-x-1 shrink-0">
                <span>Order: ${assignment.order.price}</span>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                <span>Design: {assignment.order.design_type}</span>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                <span>Created: {formatDate(assignment.date)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 shrink-0 ml-4">
          <span className={`px-2 py-1 rounded-full text-xs ${
            assignment.order.order_status === 'PRE-ACCEPTED' 
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {assignment.order.order_status.replace('-', ' ')}
          </span>
          <button
            onClick={() => openEditOverlay(assignment)}
            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            title="Edit assignment"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-3">Loading assembly tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Assembly Assignments ({assignments.length})
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

      {assignments.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
          <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Assembly Assignments
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No assembly tasks have been assigned yet.
          </p>
        </div>
      ) : (
        <div className={viewMode === 'card' ? 'space-y-4' : 'space-y-2'}>
          {assignments.map((assignment) =>
            viewMode === 'card' ? (
              <CardView key={assignment.id} assignment={assignment} />
            ) : (
              <ListView key={assignment.id} assignment={assignment} />
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

      {/* Edit Overlay */}
      {editingAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
              <div className="flex items-center space-x-3">
                <Wrench className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Edit Assembly Assignment
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Assignment #{editingAssignment.id}
                  </p>
                </div>
              </div>
              <button
                onClick={closeEditOverlay}
                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Edit Form */}
            <div className="p-6">
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Status Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                  >
                    <option value="NOT-ASSIGNED">Not Assigned</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="STARTED">Started</option>
                    <option value="COMPLATED">Completed</option>
                  </select>
                </div>

                {/* Team Members Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assign To Team Members *
                  </label>
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
                  onClick={closeEditOverlay}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={updating || selectedMembers.length === 0 || !scheduleStartDate || !scheduleCompleteDate}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update Assignment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};