// AssignCutting/AssignCuttingOverlay.tsx
import { useState, useEffect } from 'react';
import { X, Scissors, Calendar, User, Package, AlertCircle, CheckCircle } from 'lucide-react';
import api from '@/api';

interface CuttingFile {
  id: number;
  orders: Order[];
  on: EachArealMaterial;
  crv3d: string;
  image: string;
  status: string;
  assigned_to: any;
  schedule_start_date: string | null;
  schedule_complate_date: string | null;
  start_date: string | null;
  complate_date: string | null;
  date: string;
}

interface Order {
  order_code: number;
  boms: Bom[];
  mockup: any;
  mockup_modification: any;
  order_status: string;
  mockup_image: string | null;
  price: number;
  pre_accepted_date: string;
  pre_confirmed_date: string | null;
  created_at: string;
  design_type: number;
}

interface Bom {
  id: number;
  amount: string;
  width: string;
  height: string;
  price_per_unit: string;
  total_price: string;
  estimated_price: string;
  date: string;
  material: number;
}

interface EachArealMaterial {
  id: number;
  material: number;
  material_name: string;
  areal_material_record: number;
  code: number;
  inventory: number;
  inventory_name: string;
  current_width: string;
  current_height: string;
  started: boolean;
  finished: boolean;
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
  date: string;
}

interface AssignCuttingOverlayProps {
  onClose: () => void;
}

export const AssignCuttingOverlay = ({ onClose }: AssignCuttingOverlayProps) => {
  const [cuttingFiles, setCuttingFiles] = useState<CuttingFile[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedFile, setSelectedFile] = useState<CuttingFile | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [scheduleStartDate, setScheduleStartDate] = useState<string>('');
  const [scheduleCompleteDate, setScheduleCompleteDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch unassigned cutting files
      const cuttingResponse = await api.get('/api/cuttingfiles/?status=NOT-ASSIGNED');
      setCuttingFiles(cuttingResponse.data.results);

      // Fetch CNC operators
      const teamResponse = await api.get('/core/teams/?role=CNC_OPEREATOR');
      setTeamMembers(teamResponse.data);

    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (fileId: number) => {
    if (!selectedMember || !scheduleStartDate || !scheduleCompleteDate) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setAssigning(true);
      setError(null);

      const payload = {
        assigned_to: parseInt(selectedMember),
        schedule_start_date: scheduleStartDate,
        schedule_complate_date: scheduleCompleteDate
      };

      await api.post(`/api/cuttingfiles/${fileId}/assign/`, payload);

      setSuccess('Task assigned successfully!');
      
      // Refresh the list after successful assignment
      setTimeout(() => {
        fetchData();
        setSelectedFile(null);
        setSuccess(null);
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign task');
    } finally {
      setAssigning(false);
    }
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

  const getMinDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-3 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-3">
            <Scissors className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Assign Cutting Tasks
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Assign CNC cutting tasks to operators
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

          {success && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {cuttingFiles.length === 0 ? (
            <div className="text-center py-8">
              <Scissors className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Unassigned Cutting Files
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                All cutting files have been assigned to operators.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cuttingFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-gray-50 dark:bg-zinc-700 rounded-lg p-4 border border-gray-200 dark:border-zinc-600"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* File Preview */}
                    <div className="shrink-0">
                      <img
                        src={file.image}
                        alt="Cutting preview"
                        className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                      />
                    </div>

                    {/* File Information */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {file.crv3d.split('/').pop()}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {file.on.material_name} - {file.on.code}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-gray-200 dark:bg-zinc-600 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                          {file.orders.length} order(s)
                        </span>
                      </div>

                      {/* Orders List */}
                      <div className="space-y-2 mb-3">
                        {file.orders.map((order) => (
                          <div
                            key={order.order_code}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center space-x-2">
                              <Package className="w-3 h-3 text-blue-600" />
                              <span className="text-gray-700 dark:text-gray-300">
                                ORD-{order.order_code}
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              order.order_status === 'PRE-ACCEPTED' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {order.order_status.replace('-', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Assignment Form */}
                      {selectedFile?.id === file.id ? (
                        <div className="space-y-3 p-3 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-600">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Team Member Selection */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Assign To *
                              </label>
                              <select
                                value={selectedMember}
                                onChange={(e) => setSelectedMember(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm"
                              >
                                <option value="">Select Operator</option>
                                {teamMembers.map((member) => (
                                  <option key={member.id} value={member.id}>
                                    @{member.telegram_user_name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Schedule Start Date */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Schedule Start Date *
                              </label>
                              <input
                                type="datetime-local"
                                value={scheduleStartDate}
                                onChange={(e) => setScheduleStartDate(e.target.value)}
                                min={getMinDate()}
                                className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm"
                              />
                              {scheduleStartDate && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                  {getRelativeDate(scheduleStartDate)}
                                </p>
                              )}
                            </div>

                            {/* Schedule Complete Date */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Schedule Complete Date *
                              </label>
                              <input
                                type="datetime-local"
                                value={scheduleCompleteDate}
                                onChange={(e) => setScheduleCompleteDate(e.target.value)}
                                min={scheduleStartDate || getMinDate()}
                                className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm"
                              />
                              {scheduleCompleteDate && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                  {getRelativeDate(scheduleCompleteDate)}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedFile(null);
                                setSelectedMember('');
                                setScheduleStartDate('');
                                setScheduleCompleteDate('');
                              }}
                              className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-600 rounded-lg transition-colors text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleAssign(file.id)}
                              disabled={assigning}
                              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                              {assigning ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                  <span>Assigning...</span>
                                </>
                              ) : (
                                <>
                                  <User className="w-3 h-3" />
                                  <span>Assign Task</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedFile(file)}
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <User className="w-3 h-3" />
                          <span>Assign Task</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};