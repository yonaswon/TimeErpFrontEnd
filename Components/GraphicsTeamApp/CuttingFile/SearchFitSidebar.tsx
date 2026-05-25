// SearchFitSidebar.tsx — Advanced Nesting: Order→Material→Sheet→Analyze→Top 3
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, Target, Layers, BarChart3, Loader2, CheckCircle, AlertCircle, RotateCw, Trophy, ChevronRight, Package, Zap } from 'lucide-react';
import api, { base_url } from '@/api';
import { NestingResult, NestingProgressUpdate, StartNestingResponse, Material, EachArealMaterial, Order } from '@/types/cutting';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  materials: Material[];
}

type Step = 'orders' | 'material' | 'sheet' | 'running' | 'results';

export const SearchFitSidebar: React.FC<Props> = ({ isOpen, onClose, materials }) => {
  // Wizard state
  const [step, setStep] = useState<Step>('orders');
  const [orderSearch, setOrderSearch] = useState('');
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [sheets, setSheets] = useState<any[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<number | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingSheets, setLoadingSheets] = useState(false);

  // Nesting state
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [progress, setProgress] = useState<NestingProgressUpdate | null>(null);
  const [results, setResults] = useState<NestingResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search orders
  const searchOrders = useCallback(async (query: string) => {
    if (!query.trim()) { setAvailableOrders([]); return; }
    setLoadingOrders(true);
    try {
      const res = await api.get(`/api/orders/?search=${encodeURIComponent(query)}&ordering=-order_code&page_size=20`);
      const orders = res.data.results || res.data || [];
      setAvailableOrders(orders.filter((o: any) => o.dxf_files?.length > 0 || o.dxf_file_ready));
    } catch { setAvailableOrders([]); }
    setLoadingOrders(false);
  }, []);

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => searchOrders(orderSearch), 400);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
  }, [orderSearch, searchOrders]);

  // Load sheets when material selected
  useEffect(() => {
    if (!selectedMaterial) { setSheets([]); return; }
    setLoadingSheets(true);
    api.get(`/each-areal-materials/?material=${selectedMaterial}&started=true&finished=false&ordering=-code`)
      .then(res => setSheets(res.data.results || res.data || []))
      .catch(() => setSheets([]))
      .finally(() => setLoadingSheets(false));
  }, [selectedMaterial]);

  // WebSocket connection
  const connectWS = useCallback((sid: number) => {
    const wsProto = base_url.startsWith('https') ? 'wss' : 'ws';
    const wsHost = base_url.replace(/^https?:\/\//, '');
    const ws = new WebSocket(`${wsProto}://${wsHost}/ws/nesting/${sid}/`);
    ws.onmessage = (e) => {
      try {
        const data: NestingProgressUpdate = JSON.parse(e.data);
        setProgress(data);
        if (data.status === 'COMPLETED' && data.results) {
          setResults(data.results);
          setStep('results');
        }
        if (data.status === 'FAILED') {
          setError(data.error_message || 'Analysis failed');
          setStep('results');
        }
      } catch {}
    };
    ws.onclose = () => { /* auto-closed after completion */ };
    wsRef.current = ws;
  }, []);

  // Cleanup WS on unmount
  useEffect(() => () => { wsRef.current?.close(); }, []);

  // Start nesting
  const startNesting = async () => {
    setError(null);
    setResults([]);
    setStep('running');
    setProgress({ session_id: 0, status: 'PENDING', progress_pct: 0, progress_message: 'Starting...', sheets_analyzed: 0, total_sheets: 0, results: null, error_message: null });
    try {
      const res = await api.post<StartNestingResponse>('/api/cuttingfiles/start_nesting/', {
        order_codes: selectedOrders,
        material_id: selectedMaterial,
        sheet_id: selectedSheet,
      });
      setSessionId(res.data.session_id);
      connectWS(res.data.session_id);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start nesting');
      setStep('results');
    }
  };

  // Reset
  const reset = () => {
    wsRef.current?.close();
    setStep('orders');
    setSelectedOrders([]);
    setSelectedMaterial(null);
    setSelectedSheet(null);
    setSessionId(null);
    setProgress(null);
    setResults([]);
    setError(null);
    setOrderSearch('');
    setAvailableOrders([]);
  };

  const toggleOrder = (code: number) => {
    setSelectedOrders(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  const canProceedToMaterial = selectedOrders.length > 0;
  const canProceedToSheet = selectedMaterial !== null;
  const canStart = selectedOrders.length > 0 && selectedMaterial !== null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-700 bg-gradient-to-r from-purple-600 to-indigo-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Target className="w-5 h-5 text-white" /></div>
            <div>
              <h2 className="text-lg font-bold text-white">Advanced Nesting</h2>
              <p className="text-xs text-purple-200">Find optimal sheet placement</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-1">
            {(['orders', 'material', 'sheet'] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s ? 'bg-purple-600 text-white scale-110' :
                  (['orders','material','sheet'].indexOf(step) > i || step === 'running' || step === 'results')
                    ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-gray-500'
                }`}>{i + 1}</div>
                {i < 2 && <div className={`flex-1 h-0.5 ${(['orders','material','sheet'].indexOf(step) > i || step === 'running' || step === 'results') ? 'bg-green-500' : 'bg-gray-200 dark:bg-zinc-700'}`} />}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Orders</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Material</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Sheet</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* STEP 1: Orders */}
          {step === 'orders' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-500" /> Select Order(s)
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  placeholder="Search by order code or name..."
                  className="w-full h-10 pl-10 pr-3 border border-gray-200 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              {selectedOrders.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedOrders.map(code => (
                    <span key={code} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-xs font-medium text-purple-700 dark:text-purple-300">
                      ORD-{code}
                      <button onClick={() => toggleOrder(code)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {loadingOrders && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-purple-500 animate-spin" /></div>}
                {!loadingOrders && availableOrders.map((o: any) => (
                  <button key={o.order_code} onClick={() => toggleOrder(o.order_code)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      selectedOrders.includes(o.order_code)
                        ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-700'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-purple-300 dark:hover:border-purple-600'
                    }`}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      selectedOrders.includes(o.order_code)
                        ? 'border-purple-500 bg-purple-500' : 'border-gray-300 dark:border-zinc-600'
                    }`}>
                      {selectedOrders.includes(o.order_code) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">ORD-{o.order_code}</span>
                      {o.order_name && <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 truncate">{o.order_name}</span>}
                    </div>
                  </button>
                ))}
                {!loadingOrders && orderSearch && availableOrders.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No orders with DXF files found</p>
                )}
              </div>
              <button onClick={() => setStep('material')} disabled={!canProceedToMaterial}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Material */}
          {step === 'material' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" /> Select Material
              </h3>
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {materials.map(m => (
                  <button key={m.id} onClick={() => { setSelectedMaterial(m.id); setSelectedSheet(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all ${
                      selectedMaterial === m.id
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-blue-300'
                    }`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedMaterial === m.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-zinc-600'
                    }`}>
                      {selectedMaterial === m.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep('orders')} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800">Back</button>
                <button onClick={() => setStep('sheet')} disabled={!canProceedToSheet}
                  className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Sheet */}
          {step === 'sheet' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" /> Select Sheet (Optional)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Choose a specific sheet or scan all started sheets.</p>
              {loadingSheets ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-green-500 animate-spin" /></div>
              ) : (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  <button onClick={() => setSelectedSheet(null)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all ${
                      selectedSheet === null
                        ? 'border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-green-300'
                    }`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedSheet === null ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-zinc-600'
                    }`}>
                      {selectedSheet === null && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">All started sheets ({sheets.length})</span>
                  </button>
                  {sheets.map((s: any) => (
                    <button key={s.id} onClick={() => setSelectedSheet(s.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all ${
                        selectedSheet === s.id
                          ? 'border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
                          : 'border-gray-200 dark:border-zinc-700 hover:border-green-300'
                      }`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedSheet === s.id ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-zinc-600'
                      }`}>
                        {selectedSheet === s.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Sheet #{s.code}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{s.current_width}×{s.current_height} cm</span>
                      </div>
                    </button>
                  ))}
                  {sheets.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 text-center py-4">No started sheets found for this material</p>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setStep('material')} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800">Back</button>
                <button onClick={startNesting} disabled={!canStart || sheets.length === 0}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.97] transition-all">
                  <Zap className="w-4 h-4" /> Run Analysis
                </button>
              </div>
            </div>
          )}

          {/* RUNNING */}
          {step === 'running' && progress && (
            <div className="space-y-5 py-4">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-purple-200 dark:border-purple-900 flex items-center justify-center">
                    <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{progress.progress_pct}%</span>
                  </div>
                  <Loader2 className="absolute -top-1 -right-1 w-6 h-6 text-purple-500 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{progress.status.toLowerCase().replace('_',' ')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{progress.progress_message}</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress.progress_pct}%` }} />
              </div>
              {progress.total_sheets > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Sheet {progress.sheets_analyzed}/{progress.total_sheets} analyzed
                </p>
              )}
            </div>
          )}

          {/* RESULTS */}
          {step === 'results' && (
            <div className="space-y-4">
              {error ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-900/30"><AlertCircle className="w-8 h-8 text-red-500" /></div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">Analysis Failed</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[280px]">{error}</p>
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/30"><Search className="w-8 h-8 text-amber-500" /></div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">No Placements Found</p>
                  <p className="text-xs text-gray-500 text-center">The design doesn't fit on any of the analyzed sheets.</p>
                </div>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" /> Top {results.length} Result{results.length > 1 ? 's' : ''}
                  </h3>
                  {results.map((r, i) => (
                    <div key={i} className={`rounded-2xl border overflow-hidden transition-all ${
                      i === 0 ? 'border-amber-300 dark:border-amber-700 ring-2 ring-amber-200 dark:ring-amber-800/40' : 'border-gray-200 dark:border-zinc-700'
                    }`}>
                      {i === 0 && (
                        <div className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-400 flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-white" />
                          <span className="text-xs font-bold text-white">Best Fit</span>
                        </div>
                      )}
                      {r.preview_image && (
                        <div className="bg-gray-100 dark:bg-zinc-800 p-2">
                          <img src={r.preview_image} alt="Placement preview" className="w-full h-32 object-contain rounded-lg" />
                        </div>
                      )}
                      <div className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            #{r.rank} — Sheet #{r.sheet_code}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-xs font-bold text-purple-700 dark:text-purple-300">
                            {r.score}/100
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{r.material_name}</div>
                        {/* Usage bar */}
                        <div>
                          <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                            <span>Before: {r.current_usage_pct}%</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">After: {r.new_usage_pct}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                            <div className="h-full rounded-full transition-all bg-gradient-to-r from-green-400 to-emerald-500" style={{ width: `${r.new_usage_pct}%` }} />
                          </div>
                        </div>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="text-center px-1 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800">
                            <p className="text-[10px] text-gray-400">Waste ↓</p>
                            <p className="text-xs font-bold text-green-600 dark:text-green-400">{r.waste_reduction_pct}%</p>
                          </div>
                          <div className="text-center px-1 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800">
                            <p className="text-[10px] text-gray-400">Rotation</p>
                            <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-center gap-0.5">
                              <RotateCw className="w-3 h-3" />{r.rotation}°
                            </p>
                          </div>
                          <div className="text-center px-1 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800">
                            <p className="text-[10px] text-gray-400">Compact</p>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{r.compactness_score}%</p>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 pt-0.5">
                          Position: ({r.position.x}, {r.position.y}) mm • Size: {r.design_width}×{r.design_height} mm
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              <button onClick={reset}
                className="w-full py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center justify-center gap-2 transition-all">
                <Search className="w-4 h-4" /> Search Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
