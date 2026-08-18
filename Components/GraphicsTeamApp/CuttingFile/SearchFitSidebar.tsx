// SearchFitSidebar.tsx — Search & Fit: Order DXF → Material → Sheet → Top 3 / new sheet
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Search, Target, Layers, Loader2, CheckCircle, AlertCircle, RotateCw,
  Trophy, ChevronRight, Package, Zap, FileType, Gauge,
} from 'lucide-react';
import api, { base_url } from '@/api';
import {
  NestingResult, NestingProgressUpdate, StartNestingResponse, Material,
  NewSheetInfo, NestingApplyPrefill, ApplyNestingResponse,
} from '@/types/cutting';

interface DxfChoice {
  id: number;
  url: string;
  preview?: string | null;
  order_code: number;
  order_name?: string;
  file_exists?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  materials: Material[];
  onApplyPrefill?: (prefill: NestingApplyPrefill) => void;
}

type Step = 'orders' | 'dxfs' | 'material' | 'sheet' | 'running' | 'results';

export const SearchFitSidebar: React.FC<Props> = ({ isOpen, onClose, materials, onApplyPrefill }) => {
  const [step, setStep] = useState<Step>('orders');
  const [orderSearch, setOrderSearch] = useState('');
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [dxfChoices, setDxfChoices] = useState<DxfChoice[]>([]);
  const [selectedDxfIds, setSelectedDxfIds] = useState<number[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [sheets, setSheets] = useState<any[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<number | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [mode, setMode] = useState<'fast' | 'accurate' | 'thorough'>('accurate');

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [progress, setProgress] = useState<NestingProgressUpdate | null>(null);
  const [results, setResults] = useState<NestingResult[]>([]);
  const [newSheet, setNewSheet] = useState<NewSheetInfo | null>(null);
  const [fitStatus, setFitStatus] = useState<string | null>(null);
  const [rankingExplanation, setRankingExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyingRank, setApplyingRank] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchOrders = useCallback(async (query: string) => {
    if (!query.trim()) {
      // Default: DXF-ready orders
      setLoadingOrders(true);
      try {
        const res = await api.get(
          `/api/orders/?dxf_file_ready=true&order_status=PRE-ACCEPTED,PRE-CONFIRMED&ordering=-order_code&page_size=30`
        );
        const orders = res.data.results || res.data || [];
        setAvailableOrders(orders.filter((o: any) => o.dxf_files?.length > 0 || o.dxf_file_ready));
      } catch {
        setAvailableOrders([]);
      }
      setLoadingOrders(false);
      return;
    }
    setLoadingOrders(true);
    try {
      const res = await api.get(`/api/orders/?search=${encodeURIComponent(query)}&ordering=-order_code&page_size=20`);
      const orders = res.data.results || res.data || [];
      setAvailableOrders(orders.filter((o: any) => o.dxf_files?.length > 0 || o.dxf_file_ready));
    } catch {
      setAvailableOrders([]);
    }
    setLoadingOrders(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => searchOrders(orderSearch), 400);
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [orderSearch, searchOrders, isOpen]);

  useEffect(() => {
    if (!selectedMaterial) {
      setSheets([]);
      return;
    }
    setLoadingSheets(true);
    api
      .get(`/each-areal-materials/?material=${selectedMaterial}&started=true&finished=false&ordering=-code`)
      .then((res) => setSheets(res.data.results || res.data || []))
      .catch(() => setSheets([]))
      .finally(() => setLoadingSheets(false));
  }, [selectedMaterial]);

  const rebuildDxfChoices = useCallback((orders: any[], codes: number[]) => {
    const choices: DxfChoice[] = [];
    for (const o of orders) {
      if (!codes.includes(o.order_code)) continue;
      const files = (o.dxf_files || []).flatMap((d: any) => d.dxf_file || []);
      for (const f of files) {
        if (!f?.id) continue;
        choices.push({
          id: f.id,
          url: f.dxf,
          preview: f.preview_image || null,
          order_code: o.order_code,
          order_name: o.order_name,
          file_exists: f.file_exists !== false,
        });
      }
    }
    setDxfChoices(choices);
    // Prefer DXFs that exist on the server
    const existing = choices.filter((c) => c.file_exists !== false);
    setSelectedDxfIds((existing.length ? existing : choices).map((c) => c.id));
  }, []);

  const applyProgressUpdate = useCallback((data: NestingProgressUpdate) => {
    setProgress(data);
    if (data.status === 'COMPLETED') {
      setResults(data.results || []);
      setNewSheet(data.new_sheet || data.result_meta?.new_sheet || null);
      setFitStatus(data.fit_status || data.result_meta?.status || null);
      setRankingExplanation(data.result_meta?.ranking_explanation || null);
      if (!data.results?.length && (data.new_sheet?.required || data.result_meta?.status === 'new_sheet_required')) {
        setFitStatus('new_sheet_required');
      }
      setStep('results');
    }
    if (data.status === 'FAILED') {
      const failure = (data.error_message || '').toLowerCase();
      if (failure.includes('search budget reached') || failure.includes('time budget reached')) {
        setError(null);
        setResults([]);
        setNewSheet({
          required: true,
          reason: 'search_budget_exhausted',
          suggested_stock_size_cm: null,
        });
        setFitStatus('new_sheet_required');
        setStep('results');
        return;
      }
      setError(data.error_message || 'Analysis failed');
      setStep('results');
    }
  }, []);

  const connectWS = useCallback((sid: number) => {
    const wsProto = base_url.startsWith('https') ? 'wss' : 'ws';
    const wsHost = base_url.replace(/^https?:\/\//, '');
    const ws = new WebSocket(`${wsProto}://${wsHost}/ws/nesting/${sid}/`);
    ws.onmessage = (e) => {
      try {
        const data: NestingProgressUpdate = JSON.parse(e.data);
        applyProgressUpdate(data);
      } catch {
        /* ignore */
      }
    };
    ws.onerror = () => {
      // polling fallback handles updates
    };
    wsRef.current = ws;
  }, [applyProgressUpdate]);

  // HTTP polling fallback — critical when WS misses updates over tunnels
  useEffect(() => {
    if (step !== 'running' || !sessionId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await api.get(`/api/cuttingfiles/nesting-session/${sessionId}/`);
        if (cancelled) return;
        const data = res.data as NestingProgressUpdate;
        applyProgressUpdate({
          session_id: data.session_id,
          status: data.status,
          progress_pct: data.progress_pct,
          progress_message: data.progress_message,
          sheets_analyzed: data.sheets_analyzed,
          total_sheets: data.total_sheets,
          results: data.results,
          result_meta: (data as any).result_meta,
          new_sheet: (data as any).new_sheet,
          fit_status: (data as any).fit_status,
          error_message: data.error_message,
        });
      } catch {
        /* ignore transient poll errors */
      }
    };
    tick();
    const id = setInterval(tick, 1500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [step, sessionId, applyProgressUpdate]);

  useEffect(() => () => {
    wsRef.current?.close();
  }, []);

  const startNesting = async () => {
    setError(null);
    setResults([]);
    setNewSheet(null);
    setFitStatus(null);
    setRankingExplanation(null);
    setStep('running');
    setProgress({
      session_id: 0,
      status: 'PENDING',
      progress_pct: 0,
      progress_message: 'Starting...',
      sheets_analyzed: 0,
      total_sheets: 0,
      results: null,
      error_message: null,
    });
    try {
      const res = await api.post<StartNestingResponse>('/api/cuttingfiles/start_nesting/', {
        order_codes: selectedOrders,
        order_dxf_ids: selectedDxfIds,
        material_id: selectedMaterial,
        sheet_id: selectedSheet,
        mode,
        rotation_policy: 'free',
        material_priority: 'remnant_first',
        rotation_step_deg: mode === 'fast' ? 5 : 1,
        kerf_mm: 2,
        edge_margin_mm: 3,
        part_gap_mm: 1,
        future_optimization: true,
        max_results: 3,
      });
      setSessionId(res.data.session_id);
      connectWS(res.data.session_id);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start nesting');
      setStep('results');
    }
  };

  const applyPlacement = async (r: NestingResult) => {
    if (!sessionId) return;
    setApplyingRank(r.rank);
    try {
      const res = await api.post<ApplyNestingResponse>('/api/cuttingfiles/apply_nesting/', {
        session_id: sessionId,
        rank: r.rank,
        result: r,
      });
      onApplyPrefill?.(res.data.prefill);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to apply placement');
    } finally {
      setApplyingRank(null);
    }
  };

  const reset = () => {
    wsRef.current?.close();
    setStep('orders');
    setSelectedOrders([]);
    setDxfChoices([]);
    setSelectedDxfIds([]);
    setSelectedMaterial(null);
    setSelectedSheet(null);
    setSessionId(null);
    setProgress(null);
    setResults([]);
    setNewSheet(null);
    setFitStatus(null);
    setRankingExplanation(null);
    setError(null);
    setOrderSearch('');
    setAvailableOrders([]);
    setMode('accurate');
  };

  const toggleOrder = (code: number) => {
    setSelectedOrders((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleDxf = (id: number) => {
    setSelectedDxfIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const goToDxfs = () => {
    rebuildDxfChoices(availableOrders, selectedOrders);
    setStep('dxfs');
  };

  const canProceedToDxfs = selectedOrders.length > 0;
  const canProceedToMaterial = selectedDxfIds.length > 0;
  const canProceedToSheet = selectedMaterial !== null;
  const canStart = selectedOrders.length > 0 && selectedDxfIds.length > 0 && selectedMaterial !== null;

  const stepIndex = (s: Step) =>
    (['orders', 'dxfs', 'material', 'sheet'] as Step[]).indexOf(s);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-700 bg-gradient-to-r from-emerald-700 to-teal-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Search & Fit</h2>
              <p className="text-xs text-emerald-100">True-shape remnant nesting</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-1">
            {(['orders', 'dxfs', 'material', 'sheet'] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s
                      ? 'bg-emerald-600 text-white scale-110'
                      : stepIndex(step) > i || step === 'running' || step === 'results'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-zinc-700 text-gray-500'
                  }`}
                >
                  {i + 1}
                </div>
                {i < 3 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      stepIndex(step) > i || step === 'running' || step === 'results'
                        ? 'bg-green-500'
                        : 'bg-gray-200 dark:bg-zinc-700'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-500">Orders</span>
            <span className="text-[10px] text-gray-500">DXFs</span>
            <span className="text-[10px] text-gray-500">Material</span>
            <span className="text-[10px] text-gray-500">Sheet</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {step === 'orders' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" /> Select Order(s)
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search orders (DXF-ready shown by default)..."
                  className="w-full h-10 pl-10 pr-3 border border-gray-200 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {selectedOrders.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedOrders.map((code) => (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-xs font-medium text-emerald-800 dark:text-emerald-300"
                    >
                      ORD-{code}
                      <button onClick={() => toggleOrder(code)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {loadingOrders && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                  </div>
                )}
                {!loadingOrders &&
                  availableOrders.map((o: any) => (
                    <button
                      key={o.order_code}
                      onClick={() => toggleOrder(o.order_code)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                        selectedOrders.includes(o.order_code)
                          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-gray-200 dark:border-zinc-700 hover:border-emerald-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                          selectedOrders.includes(o.order_code)
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedOrders.includes(o.order_code) && (
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          ORD-{o.order_code}
                        </span>
                        {o.order_name && (
                          <span className="text-xs text-gray-500 ml-2 truncate">{o.order_name}</span>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
              <button
                onClick={goToDxfs}
                disabled={!canProceedToDxfs}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-40"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 'dxfs' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileType className="w-4 h-4 text-teal-600" /> Select order DXF(s)
              </h3>
              <p className="text-xs text-gray-500">
                Choose which design files to nest. Multi-part orders can include several DXFs.
              </p>
              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {dxfChoices.length === 0 && (
                  <p className="text-xs text-amber-600 text-center py-6">
                    No DXF files on the selected orders. Upload DXFs in the Orders tab first.
                  </p>
                )}
                {dxfChoices.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => toggleDxf(d.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left ${
                      selectedDxfIds.includes(d.id)
                        ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20'
                        : 'border-gray-200 dark:border-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                        selectedDxfIds.includes(d.id) ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                      }`}
                    >
                      {selectedDxfIds.includes(d.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                    {d.preview ? (
                      <img src={d.preview} alt="" className="w-12 h-12 object-contain rounded bg-gray-100" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                        <FileType className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">DXF #{d.id}</div>
                      <div className="text-xs text-gray-500">ORD-{d.order_code}</div>
                      {d.file_exists === false && (
                        <div className="text-[10px] text-amber-600 mt-0.5">File missing on server — re-upload</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('orders')}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('material')}
                  disabled={!canProceedToMaterial}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-1"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'material' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" /> Select Material
              </h3>
              <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
                {materials.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMaterial(m.id);
                      setSelectedSheet(null);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left ${
                      selectedMaterial === m.id
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedMaterial === m.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('dxfs')}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('sheet')}
                  disabled={!canProceedToSheet}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-1"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'sheet' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" /> Sheet & mode
              </h3>
              <p className="text-xs text-gray-500">
                Scan all started remnants, or pick one sheet. If nothing fits, you will get a new-sheet recommendation.
              </p>

              <div className="flex gap-2 p-1 rounded-xl bg-gray-100 dark:bg-zinc-800">
                <button
                  onClick={() => setMode('fast')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${
                    mode === 'fast' ? 'bg-white dark:bg-zinc-700 shadow text-emerald-700' : 'text-gray-500'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" /> Fast
                </button>
                <button
                  onClick={() => setMode('thorough')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${
                    mode === 'thorough' ? 'bg-white dark:bg-zinc-700 shadow text-emerald-700' : 'text-gray-500'
                  }`}
                >
                  <Gauge className="w-3.5 h-3.5" /> Thorough
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                Fast uses cached remnants + BLF search (seconds). Thorough refines to 1° locally without freezing the PC.
              </p>

              {loadingSheets ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                  <button
                    onClick={() => setSelectedSheet(null)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left ${
                      selectedSheet === null
                        ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-zinc-700'
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      All started sheets ({sheets.length})
                    </span>
                  </button>
                  {sheets.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSheet(s.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left ${
                        selectedSheet === s.id
                          ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-zinc-700'
                      }`}
                    >
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Sheet #{s.code}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {s.current_width}×{s.current_height} cm
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('material')}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm"
                >
                  Back
                </button>
                <button
                  onClick={startNesting}
                  disabled={!canStart}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" /> Run Search & Fit
                </button>
              </div>
            </div>
          )}

          {step === 'running' && progress && (
            <div className="space-y-5 py-4">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-emerald-200 flex items-center justify-center">
                    <span className="text-xl font-bold text-emerald-600">{progress.progress_pct}%</span>
                  </div>
                  <Loader2 className="absolute -top-1 -right-1 w-6 h-6 text-emerald-500 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                    {progress.status.toLowerCase().replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{progress.progress_message}</p>
                  {!!progress.result_meta?.phase_total && (
                    <div className="mt-2 flex items-center justify-center gap-3 text-[11px] text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {progress.result_meta.phase_completed || 0}/{progress.result_meta.phase_total} sheets
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {progress.result_meta.candidates_found || 0} fits
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress.progress_pct}%` }}
                />
              </div>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-4">
              {error ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                  <p className="text-sm font-semibold text-red-600">Analysis Failed</p>
                  <p className="text-xs text-gray-500 text-center max-w-[280px]">{error}</p>
                </div>
              ) : fitStatus === 'new_sheet_required' || (results.length === 0 && newSheet?.required) || results.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/30">
                    <Package className="w-8 h-8 text-amber-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white text-center">
                    Can&apos;t find a fit on any started sheet
                  </p>
                  <p className="text-xs text-gray-500 text-center max-w-[300px]">
                    {newSheet?.reason === 'no_started_sheets'
                      ? 'No started sheets found for this material.'
                      : newSheet?.reason === 'preprocessing_pending'
                        ? 'Started sheets exist, but their DXF remnant caches are still preprocessing. Retry in a moment.'
                        : newSheet?.reason === 'search_budget_exhausted'
                          ? 'No validated placement was found within the search time limit on the started sheets.'
                        : 'The design does not fit any validated free region on the started sheets.'}
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" /> Top {results.length} Result
                    {results.length > 1 ? 's' : ''}
                  </h3>
                  {rankingExplanation && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800 rounded-lg p-2">
                      {rankingExplanation}
                    </p>
                  )}
                  {progress?.result_meta?.ai_review?.status === 'completed' && progress.result_meta.ai_review.review?.summary && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-2">
                      AI visual advisory: {progress.result_meta.ai_review.review.summary}
                    </p>
                  )}
                  {results.map((r, i) => (
                    <div
                      key={i}
                      className={`rounded-2xl border overflow-hidden ${
                        i === 0
                          ? 'border-amber-300 dark:border-amber-700 ring-2 ring-amber-200/60'
                          : 'border-gray-200 dark:border-zinc-700'
                      }`}
                    >
                      {i === 0 && (
                        <div className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-400 flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-white" />
                          <span className="text-xs font-bold text-white">Best Fit</span>
                        </div>
                      )}
                      {r.preview_image && (
                        <div className="bg-slate-200 dark:bg-zinc-800 p-2">
                          <img
                            src={r.preview_image}
                            alt="Placement preview"
                            className="w-full max-h-72 min-h-[220px] object-contain rounded-lg bg-white"
                          />
                        </div>
                      )}
                      <div className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            #{r.rank} — Sheet #{r.sheet_code}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-xs font-bold text-emerald-700">
                            {r.score}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">{r.material_name}</div>
                        <div>
                          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                            <span>Before: {r.current_usage_pct}%</span>
                            <span className="font-semibold text-green-600">After: {r.new_usage_pct}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                              style={{ width: `${Math.min(r.new_usage_pct, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="text-center px-1 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800">
                            <p className="text-[10px] text-gray-400">Waste ↓</p>
                            <p className="text-xs font-bold text-green-600">{r.waste_reduction_pct}%</p>
                          </div>
                          <div className="text-center px-1 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800">
                            <p className="text-[10px] text-gray-400">Rotation</p>
                            <p className="text-xs font-bold flex items-center justify-center gap-0.5">
                              <RotateCw className="w-3 h-3" />
                              {r.rotation}°
                            </p>
                          </div>
                          <div className="text-center px-1 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800">
                            <p className="text-[10px] text-gray-400">Future fit</p>
                            <p className="text-xs font-bold">{r.future_fit_probability ?? 0}%</p>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Cut origin: ({r.position?.x}, {r.position?.y}) mm • boundary clearance {r.minimum_boundary_clearance_mm ?? 0} mm • reusable area {Math.round((r.largest_reusable_area_mm2 ?? 0) / 100) / 100} cm²
                        </div>
                        <button
                          onClick={() => applyPlacement(r)}
                          disabled={applyingRank === r.rank || !r.geometry_valid}
                          className="w-full mt-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {applyingRank === r.rank ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          Use this placement
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
              <button
                onClick={reset}
                className="w-full py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" /> Search Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
