import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Plus,
  History,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon,
  DollarSign,
  ArrowRight,
  RefreshCw,
  Search
} from "lucide-react";
import api, { base_url } from "@/api";

interface Account {
  id: number;
  bank: string;
  account_number: string;
  account_name: string;
  available_amount: string;
}

interface ReconciliationFile {
  id: number;
  file: string;
}

interface ReconciliationSession {
  id: number;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  message: string;
  results: {
    matched: MatchedPayment[];
    problems: ProblemPayment[];
    not_matched: UnmatchedPayment[];
  } | null;
  created_at: string;
  account_detail: Account;
  files: ReconciliationFile[];
}

interface MatchedPayment {
  payment_id: number;
  erp_amount: number;
  statement_amount: number;
  reference: string;
  cleaned_reference: string;
  created_at: string;
  reason: string;
  client: string;
  transaction_id: string;
}

interface ProblemPayment {
  payment_id: number;
  erp_amount: number;
  statement_amount: number;
  reference: string;
  cleaned_reference: string;
  created_at: string;
  reason: string;
  client: string;
  transaction_id: string;
}

interface UnmatchedPayment {
  payment_id: number;
  amount: number;
  created_at: string;
  reason: string;
  client: string;
  transaction_id: string;
}

interface ReconciliationOverlayProps {
  onClose: () => void;
  onRefreshPayments: () => void;
}

type TabType = "matched" | "problems" | "unmatched";

export const ReconciliationOverlay = ({
  onClose,
  onRefreshPayments
}: ReconciliationOverlayProps) => {
  const [sessions, setSessions] = useState<ReconciliationSession[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New session form
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Active session status
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [progress, setProgress] = useState<{
    status: string;
    progress: number;
    message: string;
  } | null>(null);

  // Results review
  const [selectedSession, setSelectedSession] = useState<ReconciliationSession | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("matched");
  const [confirmingAll, setConfirmingAll] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Load past sessions and accounts
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sessionResponse, accountResponse] = await Promise.all([
        api.get("/finance/reconciliation/"),
        api.get("/finance/account/?deleted=false")
      ]);

      const sessionsData = sessionResponse.data.results || sessionResponse.data || [];
      const accountsData = accountResponse.data.results || accountResponse.data || [];

      setSessions(sessionsData);
      setAccounts(accountsData);
    } catch (err: any) {
      console.error("Error loading reconciliation data:", err);
      setError("Failed to load historical sessions or accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      wsRef.current?.close();
    };
  }, []);

  // WebSockets setup
  const connectWebSocket = useCallback((sessionId: number) => {
    wsRef.current?.close();

    const wsProto = base_url.startsWith("https") ? "wss" : "ws";
    const wsHost = base_url.replace(/^https?:\/\//, "");
    const wsUrl = `${wsProto}://${wsHost}/ws/reconciliation/${sessionId}/`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.session_id === sessionId) {
          setProgress({
            status: data.status,
            progress: data.progress,
            message: data.message
          });

          if (data.status === "COMPLETED") {
            // Reload the session object to view results
            fetchSessionDetails(sessionId);
            ws.close();
          } else if (data.status === "FAILED") {
            setError(data.message || "Reconciliation process failed.");
            setActiveSessionId(null);
            setProgress(null);
            ws.close();
          }
        }
      } catch (err) {
        console.error("WS message parse error:", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket Closed for Session:", sessionId);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  const fetchSessionDetails = async (sessionId: number) => {
    try {
      const response = await api.get(`/finance/reconciliation/${sessionId}/`);
      setSelectedSession(response.data);
      setActiveSessionId(null);
      setProgress(null);
      setShowNewForm(false);
      // Reload sessions list
      fetchData();
    } catch (err) {
      console.error("Failed to load session details:", err);
      setError("Reconciliation completed, but failed to fetch detailed results.");
    }
  };

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleStartReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || selectedFiles.length === 0) {
      setError("Please select an account and upload at least one file.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append("account_id", selectedAccountId);
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await api.post("/finance/reconciliation/start/", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      const sessionId = response.data.session_id;
      setActiveSessionId(sessionId);
      setProgress({
        status: response.data.status,
        progress: 10,
        message: response.data.message
      });

      connectWebSocket(sessionId);
    } catch (err: any) {
      console.error("Error starting reconciliation:", err);
      setError(err.response?.data?.error || "Failed to start reconciliation process.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmAllMatched = async () => {
    if (!selectedSession) return;
    try {
      setConfirmingAll(true);
      setError(null);

      await api.post(`/finance/reconciliation/${selectedSession.id}/confirm_matched/`);

      // Reload session details to update display
      await fetchSessionDetails(selectedSession.id);
      onRefreshPayments();
    } catch (err: any) {
      console.error("Error confirming matched payments:", err);
      setError(err.response?.data?.error || "Failed to confirm matched payments.");
    } finally {
      setConfirmingAll(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F9FAFB] dark:bg-[#0F172A] flex flex-col animate-in fade-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 px-4 py-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#2563EB]/10 rounded-xl">
            <TrendingUp className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6]" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
              Bank Reconciliation
            </h2>
            <p className="text-xs text-gray-500 dark:text-[#94A3B8]">
              Match statements with payment receipts
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-gray-500 dark:text-gray-400"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 max-w-lg mx-auto w-full space-y-4">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800 dark:text-red-300">
              <span className="font-semibold">Error:</span> {error}
            </div>
          </div>
        )}

        {/* ─── CASE 1: Websocket Progress screen ─── */}
        {activeSessionId && progress && (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 flex flex-col items-center justify-center text-center space-y-5 py-12 shadow-sm">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin" />
              <div className="absolute font-bold text-sm text-[#2563EB] dark:text-[#3B82F6]">
                {progress.progress}%
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Reconciliation in Progress
              </h3>
              <p className="text-sm text-gray-500 dark:text-[#94A3B8] max-w-xs leading-relaxed">
                {progress.message}
              </p>
            </div>
            <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-2 max-w-xs overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400 italic">
              This process involves AI statement extraction and matches, please keep this window open...
            </p>
          </div>
        )}

        {/* ─── CASE 2: Viewing results of a session ─── */}
        {selectedSession && !activeSessionId && (
          <div className="space-y-4">
            <button
              onClick={() => setSelectedSession(null)}
              className="flex items-center space-x-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400"
            >
              <span>&larr; Back to History</span>
            </button>

            {/* Session Card Info */}
            <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-gray-900 dark:text-white">
                    {selectedSession.account_detail.account_name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-[#94A3B8]">
                    {selectedSession.account_detail.bank} • {selectedSession.account_detail.account_number}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                    selectedSession.status === "COMPLETED"
                      ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                      : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
                  }`}
                >
                  {selectedSession.status}
                </span>
              </div>
              <div className="border-t border-gray-100 dark:border-zinc-800 pt-2 flex justify-between items-center text-xs text-gray-400">
                <span>Ran on {new Date(selectedSession.created_at).toLocaleString()}</span>
                <span>{selectedSession.files.length} statement file(s)</span>
              </div>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-gray-200 dark:border-zinc-800 text-sm">
              <button
                onClick={() => setActiveTab("matched")}
                className={`flex-1 py-3 text-center font-bold border-b-2 transition-all ${
                  activeTab === "matched"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400"
                }`}
              >
                Matched ({selectedSession.results?.matched.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("problems")}
                className={`flex-1 py-3 text-center font-bold border-b-2 transition-all ${
                  activeTab === "problems"
                    ? "border-amber-500 text-amber-500"
                    : "border-transparent text-gray-500 dark:text-gray-400"
                }`}
              >
                Discrepancies ({selectedSession.results?.problems.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("unmatched")}
                className={`flex-1 py-3 text-center font-bold border-b-2 transition-all ${
                  activeTab === "unmatched"
                    ? "border-red-500 text-red-500"
                    : "border-transparent text-gray-500 dark:text-gray-400"
                }`}
              >
                Statement Missing ({selectedSession.results?.not_matched.length || 0})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="space-y-3 min-h-[250px]">
              {/* MATCHED TAB */}
              {activeTab === "matched" && (
                <>
                  {selectedSession.results?.matched.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-zinc-800 text-gray-500">
                      No matching payments found.
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {selectedSession.results?.matched.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-green-200 dark:border-green-950/40 relative overflow-hidden shadow-sm"
                          >
                            <div className="absolute top-0 right-0 h-1.5 w-16 bg-green-500" />
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold uppercase">
                                  {item.reason}
                                </span>
                                <h4 className="font-extrabold text-gray-900 dark:text-white mt-1">
                                  {item.client}
                                </h4>
                              </div>
                              <span className="text-lg font-black text-green-600 dark:text-green-400">
                                {item.erp_amount.toLocaleString()} Birr
                              </span>
                            </div>
                            <div className="border-t border-gray-100 dark:border-zinc-800/80 pt-2 flex flex-col space-y-1 text-xs text-gray-500 dark:text-[#94A3B8]">
                              <div className="flex justify-between">
                                <span>Ref/Transaction ID:</span>
                                <span className="font-mono font-bold text-gray-800 dark:text-gray-300">
                                  {item.transaction_id}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Statement Match Ref:</span>
                                <span className="font-mono text-green-600 dark:text-green-400">
                                  {item.reference}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Created At:</span>
                                <span>{new Date(item.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Confirm matched payments button */}
                      <div className="sticky bottom-0 pt-4 pb-2 bg-[#F9FAFB] dark:bg-[#0F172A]">
                        <button
                          onClick={handleConfirmAllMatched}
                          disabled={confirmingAll || selectedSession.results?.matched.length === 0}
                          className="w-full flex items-center justify-center space-x-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-md shadow-green-500/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                        >
                          {confirmingAll ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Confirming Payments...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              <span>Confirm Matched Payments</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* PROBLEMS TAB */}
              {activeTab === "problems" && (
                <>
                  {selectedSession.results?.problems.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-zinc-800 text-gray-500">
                      No amount discrepancies found.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedSession.results?.problems.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-amber-200 dark:border-amber-950/40 relative overflow-hidden shadow-sm"
                        >
                          <div className="absolute top-0 right-0 h-1.5 w-16 bg-amber-500" />
                          <div className="mb-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold uppercase">
                              {item.reason}
                            </span>
                            <h4 className="font-extrabold text-gray-900 dark:text-white mt-1">
                              {item.client}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between bg-red-50 dark:bg-red-950/20 p-2.5 rounded-xl border border-red-100 dark:border-red-900/30 mb-3">
                            <div>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">ERP Receipt</p>
                              <p className="text-sm font-extrabold text-gray-900 dark:text-white">
                                {item.erp_amount.toLocaleString()} Birr
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-red-500" />
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">Statement Actual</p>
                              <p className="text-sm font-extrabold text-red-600 dark:text-red-400">
                                {item.statement_amount.toLocaleString()} Birr
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-gray-100 dark:border-zinc-800/80 pt-2 flex flex-col space-y-1 text-xs text-gray-500 dark:text-[#94A3B8]">
                            <div className="flex justify-between">
                              <span>Ref/Transaction ID:</span>
                              <span className="font-mono font-bold text-gray-800 dark:text-gray-300">
                                {item.transaction_id}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Statement Match Ref:</span>
                              <span className="font-mono text-red-600 dark:text-red-400">
                                {item.reference}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Created At:</span>
                              <span>{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* UNMATCHED TAB */}
              {activeTab === "unmatched" && (
                <>
                  {selectedSession.results?.not_matched.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-zinc-800 text-gray-500">
                      All ERP payments matched in statement!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedSession.results?.not_matched.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-red-200 dark:border-red-950/40 relative overflow-hidden shadow-sm animate-pulse"
                        >
                          <div className="absolute top-0 right-0 h-1.5 w-16 bg-red-500" />
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold uppercase">
                                {item.reason}
                              </span>
                              <h4 className="font-extrabold text-gray-900 dark:text-white mt-1">
                                {item.client}
                              </h4>
                            </div>
                            <span className="text-lg font-black text-red-600 dark:text-red-400">
                              {item.amount.toLocaleString()} Birr
                            </span>
                          </div>
                          <div className="border-t border-gray-100 dark:border-zinc-800/80 pt-2 flex flex-col space-y-1 text-xs text-gray-500 dark:text-[#94A3B8]">
                            <div className="flex justify-between">
                              <span>Ref/Transaction ID:</span>
                              <span className="font-mono font-bold text-gray-800 dark:text-gray-300">
                                {item.transaction_id || "MISSING"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Created At:</span>
                              <span>{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[10px] text-red-600 dark:text-red-400 font-medium italic mt-1">
                              ⚠️ Receipt not found in the uploaded statement.
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── CASE 3: New reconciliation form ─── */}
        {showNewForm && !activeSessionId && !selectedSession && (
          <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 space-y-4 shadow-sm animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-gray-900 dark:text-white">
                New Reconciliation
              </h3>
              <button
                onClick={() => setShowNewForm(false)}
                className="text-xs text-blue-600 font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleStartReconciliation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Select Bank Account
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  required
                  className="w-full h-12 px-3 border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Account...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name} - {acc.bank} ({acc.account_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Upload Statement Files (PDF or Images)
                </label>
                <div className="border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors relative">
                  <input
                    type="file"
                    multiple
                    accept="application/pdf,image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    required
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileText className="w-8 h-8 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Drag & drop files or click to upload
                    </p>
                    <p className="text-xs text-gray-400">
                      Supports PDF statements or transaction screenshots/images
                    </p>
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-3 bg-gray-50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800 space-y-1 max-h-40 overflow-y-auto">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Files Selected ({selectedFiles.length})
                    </p>
                    {selectedFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-zinc-900 p-1.5 px-2 rounded-lg border border-gray-100 dark:border-zinc-800"
                      >
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Uploading & Starting...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    <span>Start Reconciliation</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ─── CASE 4: Sessions history list ─── */}
        {!showNewForm && !activeSessionId && !selectedSession && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center space-x-1.5">
                <History className="w-4 h-4 text-gray-400" />
                <span>Reconciliation History</span>
              </h3>
              <button
                onClick={() => setShowNewForm(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Reconcile Statement</span>
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">
                  Loading reconciliation history...
                </p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="font-extrabold text-gray-950 dark:text-white text-sm">
                  No Reconciliation Yet
                </h4>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  Start your first reconciliation to automatically match CBE PDF statements with ERP receipt codes using AI.
                </p>
                <button
                  onClick={() => setShowNewForm(true)}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
                >
                  Start Reconciliation
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => {
                      setSelectedSession(session);
                      setActiveTab("matched");
                    }}
                    className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-[#E5E7EB] dark:border-zinc-800 overflow-hidden shadow-sm transition-all duration-200 active:scale-[0.99] cursor-pointer hover:border-blue-300 dark:hover:border-blue-900/50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-gray-950 dark:text-white truncate">
                          {session.account_detail?.account_name || "Unknown Account"}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-[#94A3B8]">
                          {session.account_detail?.bank || "Unknown Bank"} • {session.account_detail?.account_number}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 ml-3" />
                    </div>

                    <div className="border-t border-gray-100 dark:border-zinc-800/80 mt-3 pt-2.5 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            session.status === "COMPLETED"
                              ? "bg-green-500"
                              : session.status === "PROCESSING"
                              ? "bg-blue-500 animate-pulse"
                              : "bg-red-500"
                          }`}
                        />
                        <span className="font-semibold uppercase tracking-wider text-[10px]">
                          {session.status}
                        </span>
                      </div>
                      <span>
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {session.status === "COMPLETED" && session.results && (
                      <div className="mt-3 flex justify-between bg-gray-50 dark:bg-zinc-900/40 p-2 rounded-lg text-[10px] text-gray-400 font-bold border border-gray-100/50 dark:border-zinc-800/50">
                        <span className="text-green-600 dark:text-green-400">
                          Matched: {session.results.matched.length}
                        </span>
                        <span className="text-amber-500">
                          Discrepancies: {session.results.problems.length}
                        </span>
                        <span className="text-red-500">
                          Missing: {session.results.not_matched.length}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
