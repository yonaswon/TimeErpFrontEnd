// AssignCutting/AssignCuttingOverlay.tsx
import { useState, useEffect } from "react";
import { X, Scissors, User, Package, AlertCircle, CheckCircle, Loader2, Clock } from "lucide-react";
import api, { base_url } from "@/api";

interface CuttingFile {
  id: number;
  orders: Order[];
  on: EachArealMaterial | null;
  old_material_number: string | null;
  old_material: { id: number; name: string } | null;
  crv3d: string;
  image: string;
  line_image: string | null;
  status: string;
  assigned_to: any;
  schedule_start_date: string | null;
  schedule_complate_date: string | null;
  start_date: string | null;
  complate_date: string | null;
  date: string;
  analysis_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  analysis_error: string | null;
  total_usage_percentage: string | null;
}

interface Order {
  order_code: number;
  order_name?: string;
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

interface Bom { id: number; amount: string; width: string; height: string; price_per_unit: string; total_price: string; estimated_price: string; date: string; material: number; }
interface EachArealMaterial { id: number; material: number; material_name: string; areal_material_record: number; code: number; inventory: number; inventory_name: string; current_width: string; current_height: string; started: boolean; finished: boolean; date: string; }
interface TeamMember { id: number; telegram_id: number; telegram_user_name: string; role: Role[]; first_name: string; }
interface Role { id: number; Name: string; date: string; }

interface AssignCuttingOverlayProps {
  onClose: () => void;
}

export const AssignCuttingOverlay = ({ onClose }: AssignCuttingOverlayProps) => {
  const [cuttingFiles, setCuttingFiles] = useState<CuttingFile[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedFile, setSelectedFile] = useState<CuttingFile | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [scheduleStartDate, setScheduleStartDate] = useState<string>("");
  const [scheduleCompleteDate, setScheduleCompleteDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const cuttingResponse = await api.get("/api/cuttingfiles/?status=NOT-ASSIGNED");
      setCuttingFiles(cuttingResponse.data.results);
      const teamResponse = await api.get("/core/teams/?role=CNC_OPEREATOR");
      setTeamMembers(teamResponse.data);
    } catch (err) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // WebSocket: real-time analysis status updates
  useEffect(() => {
    const wsProtocol = base_url.startsWith('https') ? 'wss' : 'ws';
    const wsHost = base_url.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}://${wsHost}/ws/cutting-file-analysis/`;

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.cutting_file_id) {
            const toAbsolute = (url: string | null) =>
              url && url.startsWith('/') ? `${base_url}${url}` : url;

            setCuttingFiles(prev => prev.map(cf =>
              cf.id === data.cutting_file_id
                ? {
                    ...cf,
                    analysis_status: data.analysis_status,
                    image: toAbsolute(data.image) || cf.image,
                    line_image: toAbsolute(data.line_image) || cf.line_image,
                    analysis_error: data.analysis_error,
                    total_usage_percentage: data.total_usage_percentage || cf.total_usage_percentage,
                  }
                : cf
            ));
          }
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  const isAnalysisReady = (file: CuttingFile) => file.analysis_status === 'COMPLETED';

  const handleAssign = async (fileId: number) => {
    if (!selectedMember || !scheduleStartDate || !scheduleCompleteDate) { setError("Please fill all required fields"); return; }
    try {
      setAssigning(true);
      setError(null);
      await api.post(`/api/cuttingfiles/${fileId}/assign/`, {
        assigned_to: parseInt(selectedMember),
        schedule_start_date: scheduleStartDate,
        schedule_complate_date: scheduleCompleteDate,
      });
      setSuccess("Task assigned successfully!");
      setTimeout(() => { fetchData(); setSelectedFile(null); setSelectedMember(""); setScheduleStartDate(""); setScheduleCompleteDate(""); setSuccess(null); }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to assign task");
    } finally {
      setAssigning(false);
    }
  };

  const getRelativeDate = (dateString: string) => {
    const diffDays = Math.ceil((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return `${Math.abs(diffDays)} day(s) ago`;
    return `${diffDays} days from now`;
  };

  const getMinDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const getAnalysisBadge = (file: CuttingFile) => {
    switch (file.analysis_status) {
      case 'PENDING':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
            <Clock className="w-2.5 h-2.5" /> Queued
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Processing
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            <AlertCircle className="w-2.5 h-2.5" /> Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto overscroll-contain">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-800 flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-zinc-700 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <Scissors className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assign Cutting</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{cuttingFiles.length} unassigned file(s)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl mb-4">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl mb-4">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-green-700 dark:text-green-300 text-sm">{success}</p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
          ) : cuttingFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="p-4 rounded-2xl bg-gray-100 dark:bg-zinc-700">
                <Scissors className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">No Unassigned Files</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">All cutting files have been assigned.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cuttingFiles.map((file) => {
                const analysisReady = isAnalysisReady(file);
                const canAssign = analysisReady;
                return (
                  <div key={file.id} className={`bg-gray-50 dark:bg-zinc-900/50 rounded-xl border ${
                    !analysisReady ? 'border-blue-200 dark:border-blue-800/40' : 'border-gray-200 dark:border-zinc-700'
                  } overflow-hidden`}>
                    <div className="p-4">
                      {/* File Header */}
                      <div className="flex items-start gap-3 mb-3">
                        {/* Image or spinner placeholder */}
                        {file.image && analysisReady ? (
                          <img src={file.image} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-zinc-600 shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg border border-gray-200 dark:border-zinc-600 shrink-0 flex items-center justify-center bg-gray-100 dark:bg-zinc-700">
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{file.crv3d.split("/").pop()}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {file.on ? `${file.on.material_name} - ${file.on.code}` : file.old_material ? `${file.old_material.name} - ${file.old_material_number}` : 'Unknown Material'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-200 dark:bg-zinc-600 text-gray-700 dark:text-gray-300">
                            {file.orders.length} order(s)
                          </span>
                          {/* Analysis status badge */}
                          {getAnalysisBadge(file)}
                        </div>
                      </div>

                      {/* Orders */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {file.orders.map((order) => (
                          <span key={order.order_code} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                            order.order_status === "PRE-ACCEPTED" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300" : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          }`}>
                            <Package className="w-2.5 h-2.5" />
                            ORD-{order.order_code}
                            {order.order_name && <span className="opacity-70">— {order.order_name}</span>}
                          </span>
                        ))}
                      </div>

                      {/* Assignment Form or Button */}
                      {selectedFile?.id === file.id ? (
                        <div className="space-y-3 p-3 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign To *</label>
                            <select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)}
                              className="w-full h-11 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                              <option value="">Select Operator</option>
                              {teamMembers.map((m) => <option key={m.id} value={m.id}>@{m.telegram_user_name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date *</label>
                            <input type="datetime-local" value={scheduleStartDate} onChange={(e) => setScheduleStartDate(e.target.value)} min={getMinDate()}
                              className="w-full h-11 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            {scheduleStartDate && <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{getRelativeDate(scheduleStartDate)}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Complete Date *</label>
                            <input type="datetime-local" value={scheduleCompleteDate} onChange={(e) => setScheduleCompleteDate(e.target.value)} min={scheduleStartDate || getMinDate()}
                              className="w-full h-11 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            {scheduleCompleteDate && <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{getRelativeDate(scheduleCompleteDate)}</p>}
                          </div>
                          <div className="flex gap-3 pt-2">
                            <button onClick={() => { setSelectedFile(null); setSelectedMember(""); setScheduleStartDate(""); setScheduleCompleteDate(""); }}
                              className="flex-1 h-11 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors">
                              Cancel
                            </button>
                            <button onClick={() => handleAssign(file.id)} disabled={assigning}
                              className="flex-1 h-11 flex items-center justify-center gap-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors">
                              {assigning ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Assigning...</span></> : <><User className="w-4 h-4" /><span>Assign</span></>}
                            </button>
                          </div>
                        </div>
                      ) : canAssign ? (
                        <button onClick={() => setSelectedFile(file)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:scale-[0.98] transition-all">
                          <User className="w-4 h-4" /> <span>Assign Task</span>
                        </button>
                      ) : (
                        <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 text-sm font-medium cursor-not-allowed">
                          {file.analysis_status === 'FAILED' ? (
                            <><AlertCircle className="w-4 h-4" /><span>Analysis failed — cannot assign</span></>
                          ) : (
                            <><Loader2 className="w-4 h-4 animate-spin" /><span>Waiting for analysis...</span></>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
