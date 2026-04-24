'use client';
import React, { useState, useEffect } from 'react';
import {
  X, FileSpreadsheet, Package, ChevronRight, Loader2,
  ShoppingCart, Database, Download, AlertCircle, CheckCircle2,
} from 'lucide-react';
import api from '@/api';

// ── Types ────────────────────────────────────────────────────────────────────
interface ReportRelease {
  date: string;
  reason: string;
  reason_display: string;
  amount: number;
  order_code?: number;
  order_name?: string | null;
  additional_amount?: number;
  sale_id?: number;
  customer_name?: string | null;
  isDivider?: boolean;
  dividerLabel?: string;
}

interface Material {
  id: number;
  name: string;
  type: 'L' | 'P';
  code_name: string | null;
  available: string;
}

interface TimelineEvent {
  type: 'record' | 'transfer' | 'release';
  source?: string;
  date: string;
  amount: number;
  current_amount?: number;
  is_active?: boolean;
  price?: number;
  inventory_id?: number;
  inventory_name?: string;
  created_by?: string | null;
  purchase_id?: number | null;
  record_id?: number;
  release_id?: number;
  reason?: string;
  reason_display?: string;
  order_code?: number;
  order_name?: string | null;
  released_by?: string | null;
  confirmed?: boolean;
}

interface UsageData {
  material: { id: number; name: string; type_code: string };
  timeline: TimelineEvent[];
}

interface LandPRecord {
  id: number;
  first_amount: number;
  current_amount: number;
  price: number;
  created_at: string;
  created_by: string | null;
  source: 'purchased' | 'default' | 'transfer';
  purchase_id: number | null;
  inventory_name: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtAmt(n: number, type: string) {
  return type === 'L'
    ? `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} m`
    : `${n.toLocaleString('en-US', { maximumFractionDigits: 0 })} pcs`;
}

// ── Step indicator ───────────────────────────────────────────────────────────
const Step = ({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) => (
  <div className="flex items-center gap-2">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0 transition-colors ${
      done ? 'bg-green-600 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
    }`}>
      {done ? <CheckCircle2 size={16} /> : n}
    </div>
    <span className={`text-sm font-medium ${active ? 'text-gray-900 dark:text-slate-100' : done ? 'text-green-600 dark:text-green-500' : 'text-gray-500 dark:text-slate-400'}`}>
      {label}
    </span>
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
  telegramUsername?: string | null;
}

export const GenerateExcelSidebar = ({ isOpen, onClose, telegramUsername }: Props) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — materials
  const [materials, setMaterials] = useState<Material[]>([]);
  const [matsLoading, setMatsLoading] = useState(false);
  const [selectedMat, setSelectedMat] = useState<Material | null>(null);

  // Step 2 — records
  const [records, setRecords] = useState<LandPRecord[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LandPRecord | null>(null);

  // Step 3 — report preview + download
  const [reportRows, setReportRows] = useState<ReportRelease[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load materials on open
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setSelectedMat(null);
    setSelectedRecord(null);
    setReportRows([]);
    setError(null);
    loadMaterials();
  }, [isOpen]);

  const loadMaterials = async () => {
    try {
      setMatsLoading(true);
      const [lRes, pRes] = await Promise.all([
        api.get('/materials/', { params: { type: 'L', page_size: 500 } }),
        api.get('/materials/', { params: { type: 'P', page_size: 500 } }),
      ]);
      const lMats = (lRes.data.results || lRes.data) as Material[];
      const pMats = (pRes.data.results || pRes.data) as Material[];
      setMaterials([...lMats, ...pMats]);
    } catch {
      setError('Failed to load materials');
    } finally {
      setMatsLoading(false);
    }
  };

  const selectMaterial = async (mat: Material) => {
    setSelectedMat(mat);
    setSelectedRecord(null);
    setReportRows([]);
    setError(null);
    setStep(2);
    try {
      setRecLoading(true);
      const res = await api.get<UsageData>(`/material-usage-progress/${mat.id}/`);
      // Extract only purchase + default records (not transfer-created), sorted latest first
      const recs: LandPRecord[] = res.data.timeline
        .filter(e => e.type === 'record' && (e.source === 'purchased' || e.source === 'default'))
        .map(e => ({
          id: e.record_id!,
          first_amount: e.amount,
          current_amount: e.current_amount ?? 0,
          price: e.price ?? 0,
          created_at: e.date,
          created_by: e.created_by ?? null,
          source: e.source as 'purchased' | 'default',
          purchase_id: e.purchase_id ?? null,
          inventory_name: e.inventory_name ?? '',
        }));
      setRecords(recs);
    } catch {
      setError('Failed to load records');
    } finally {
      setRecLoading(false);
    }
  };

  const selectRecord = async (rec: LandPRecord) => {
    if (!selectedMat) return;
    setSelectedRecord(rec);
    setError(null);
    setStep(3);
    try {
      setReportLoading(true);
      // Fetch full timeline for this material
      const res = await api.get<UsageData>(`/material-usage-progress/${selectedMat.id}/`);
      const timeline = res.data.timeline;

      // All records sorted latest first (same as records list)
      const allRecords = timeline
        .filter(e => e.type === 'record' && (e.source === 'purchased' || e.source === 'default'))
        .sort((a, b) => b.date.localeCompare(a.date));

      const selectedIdx = allRecords.findIndex(r => r.record_id === rec.id);
      const isLatest = selectedIdx === 0;

      // Records between selected and latest (exclusive of selected, inclusive of newer ones)
      const newerRecords = allRecords.slice(0, selectedIdx); // records newer than selected

      // All releases from selected record date onwards (to today)
      const fromDate = rec.created_at;
      const releases = timeline
        .filter(e => e.type === 'release' && e.date >= fromDate)
        .sort((a, b) => a.date.localeCompare(b.date)); // chronological

      // Build report rows with dividers for intermediate records
      const rows: ReportRelease[] = [];

      // Group releases by which "record window" they fall in
      // Windows: [selected_record_date .. next_newer_record_date), [next_newer .. next_next), ..., [latest .. today]
      // We insert divider rows when we cross into a new record window

      // Build sorted boundary dates (from oldest to newest)
      const boundaries = [rec.created_at, ...newerRecords.map(r => r.date).reverse()];

      let boundaryIdx = 0;
      
      // Group ORDER and ADD releases by order_code
      const orderReleaseMap = new Map<number, { order: TimelineEvent | null; additional: TimelineEvent[] }>();
      const otherReleases: TimelineEvent[] = [];
      
      for (const rel of releases) {
        if ((rel.reason === 'ORDER' || rel.reason === 'ADD') && rel.order_code) {
          if (!orderReleaseMap.has(rel.order_code)) {
            orderReleaseMap.set(rel.order_code, { order: null, additional: [] });
          }
          const group = orderReleaseMap.get(rel.order_code)!;
          if (rel.reason === 'ORDER') {
            group.order = rel;
          } else {
            group.additional.push(rel);
          }
        } else {
          otherReleases.push(rel);
        }
      }
      
      // Merge grouped releases back into chronological order
      const mergedReleases: Array<{ date: string; releases: TimelineEvent[] }> = [];
      
      // Add order groups
      for (const [orderCode, group] of orderReleaseMap) {
        const allInGroup = [group.order, ...group.additional].filter(Boolean) as TimelineEvent[];
        if (allInGroup.length > 0) {
          // Use the earliest date in the group
          const earliestDate = allInGroup.reduce((min, r) => r.date < min ? r.date : min, allInGroup[0].date);
          mergedReleases.push({ date: earliestDate, releases: allInGroup });
        }
      }
      
      // Add other releases
      for (const rel of otherReleases) {
        mergedReleases.push({ date: rel.date, releases: [rel] });
      }
      
      // Sort by date
      mergedReleases.sort((a, b) => a.date.localeCompare(b.date));
      
      // Build rows with dividers
      for (const { date, releases: relGroup } of mergedReleases) {
        // Check if we've crossed into a new record window
        while (boundaryIdx + 1 < boundaries.length && date >= boundaries[boundaryIdx + 1]) {
          boundaryIdx++;
          const divRec = newerRecords[newerRecords.length - boundaryIdx];
          if (divRec) {
            rows.push({
              date: divRec.date,
              reason: '',
              reason_display: '',
              amount: 0,
              isDivider: true,
              dividerLabel: `New Record: ${fmtAmt(divRec.amount, selectedMat.type)} recorded on ${fmtDate(divRec.date)}${divRec.created_by ? ` by @${divRec.created_by}` : ''}`,
            });
          }
        }

        // If this is an order group with ORDER + ADD releases
        if (relGroup.length > 1 && relGroup.some(r => r.reason === 'ORDER')) {
          const orderRel = relGroup.find(r => r.reason === 'ORDER');
          const addRels = relGroup.filter(r => r.reason === 'ADD');
          const totalAdditional = addRels.reduce((sum, r) => sum + r.amount, 0);
          
          rows.push({
            date: orderRel?.date ?? date,
            reason: 'ORDER',
            reason_display: orderRel?.reason_display ?? 'Order',
            amount: orderRel?.amount ?? 0,
            order_code: orderRel?.order_code,
            order_name: orderRel?.order_name ?? null,
            additional_amount: totalAdditional > 0 ? totalAdditional : undefined,
          });
        } else {
          // Single release or non-order releases
          for (const rel of relGroup) {
            rows.push({
              date: rel.date,
              reason: rel.reason ?? '',
              reason_display: rel.reason_display ?? rel.reason ?? '',
              amount: rel.amount,
              order_code: rel.order_code,
              order_name: rel.order_name ?? null,
            });
          }
        }
      }

      setReportRows(rows);
    } catch {
      setError('Failed to build report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedMat || !selectedRecord) return;
    try {
      setDownloading(true);
      
      // Send data to backend to generate Excel and get file URL
      const response = await api.post('/generate-material-usage-excel/', {
        materialName: selectedMat.name,
        materialType: selectedMat.type,
        recordedBy: telegramUsername ?? selectedRecord.created_by,
        fromRecord: {
          id: selectedRecord.id,
          first_amount: selectedRecord.first_amount,
          current_amount: selectedRecord.current_amount,
          price: selectedRecord.price,
          created_at: selectedRecord.created_at,
          created_by: selectedRecord.created_by,
          source: selectedRecord.source,
          purchase_id: selectedRecord.purchase_id,
          inventory_name: selectedRecord.inventory_name,
        },
        rows: reportRows,
      });
      
      if (response.data.success && response.data.file_url) {
        const baseUrl = api.defaults.baseURL || '';
        const fileUrl = response.data.file_url.startsWith('http') 
          ? response.data.file_url 
          : `${baseUrl}${response.data.file_url}`;
        
        // Use the same download pattern as DXF files
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          window.Telegram.WebApp.openLink(fileUrl);
        } else {
          const link = document.createElement('a');
          link.href = fileUrl;
          link.download = response.data.filename;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        setError('Failed to generate Excel file');
      }
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to generate Excel file');
    } finally {
      setDownloading(false);
    }
  };

  const totalReleased = reportRows
    .filter(r => !r.isDivider)
    .reduce((s, r) => s + r.amount, 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar panel — full screen on mobile */}
      <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-500" />
            <span className="font-semibold text-gray-900 dark:text-slate-100 text-lg">Excel Report</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 overflow-x-auto">
          <Step n={1} label="Material" active={step === 1} done={step > 1} />
          <ChevronRight size={16} className="text-gray-300 dark:text-slate-600 shrink-0" />
          <Step n={2} label="Record" active={step === 2} done={step > 2} />
          <ChevronRight size={16} className="text-gray-300 dark:text-slate-600 shrink-0" />
          <Step n={3} label="Download" active={step === 3} done={false} />
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-300 shrink-0">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">

          {/* ── STEP 1: Material selection ── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-base text-gray-600 dark:text-slate-400">Choose a material to generate usage report</p>
              {matsLoading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-gray-600 dark:text-slate-400">
                  <Loader2 className="animate-spin w-6 h-6" /> Loading materials...
                </div>
              ) : (
                <>
                  {(['L', 'P'] as const).map(type => {
                    const filtered = materials.filter(m => m.type === type);
                    if (!filtered.length) return null;
                    return (
                      <div key={type} className="space-y-3">
                        <div className="text-sm font-semibold text-gray-500 dark:text-slate-400 px-1">
                          {type === 'L' ? '📏 Length Materials' : '🔢 Piece Materials'}
                        </div>
                        <div className="space-y-2">
                          {filtered.map(mat => (
                            <button
                              key={mat.id}
                              onClick={() => selectMaterial(mat)}
                              className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Package size={20} className="text-blue-600 dark:text-blue-500 shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-medium text-gray-900 dark:text-slate-100 text-base truncate">{mat.name}</div>
                                  {mat.code_name && <div className="text-sm text-gray-500 dark:text-slate-400 truncate">{mat.code_name}</div>}
                                </div>
                              </div>
                              <div className="text-right shrink-0 ml-3">
                                <div className="text-xs text-gray-500 dark:text-slate-400">Available</div>
                                <div className="text-base font-semibold text-green-600 dark:text-green-500 whitespace-nowrap">
                                  {parseFloat(mat.available).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                  {type === 'L' ? ' m' : ''}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* ── STEP 2: Record selection ── */}
          {step === 2 && selectedMat && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setStep(1); setSelectedMat(null); }}
                  className="text-sm text-blue-600 dark:text-blue-500 hover:underline font-medium"
                >← Back</button>
                <span className="text-base font-semibold text-gray-900 dark:text-slate-100">{selectedMat.name}</span>
              </div>
              <p className="text-base text-gray-600 dark:text-slate-400">
                Select starting record for the report
              </p>
              {recLoading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-gray-600 dark:text-slate-400">
                  <Loader2 className="animate-spin w-6 h-6" /> Loading records...
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-16 text-gray-500 dark:text-slate-400">
                  <Database size={48} className="mx-auto mb-3 opacity-40" />
                  <p className="text-base">No records found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {records.map((rec, idx) => (
                    <button
                      key={rec.id}
                      onClick={() => selectRecord(rec)}
                      className="w-full flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${rec.source === 'purchased' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'}`}>
                        {rec.source === 'purchased' ? <ShoppingCart size={20} /> : <Database size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-gray-900 dark:text-slate-100 text-base">
                            {fmtAmt(rec.first_amount, selectedMat.type)}
                          </span>
                          {idx === 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold">LATEST</span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${rec.source === 'purchased' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
                            {rec.source === 'purchased' ? 'Purchase' : 'Manual'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-slate-400">
                          {fmtDate(rec.created_at)}
                          {rec.created_by && ` · @${rec.created_by}`}
                          {rec.purchase_id && ` · PO #${rec.purchase_id}`}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-slate-500 mt-1">
                          {rec.inventory_name} · Remaining: {fmtAmt(rec.current_amount, selectedMat.type)}
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-300 dark:text-slate-600 shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Report preview ── */}
          {step === 3 && selectedMat && selectedRecord && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setStep(2); setSelectedRecord(null); setReportRows([]); }}
                  className="text-sm text-blue-600 dark:text-blue-500 hover:underline font-medium"
                >← Back</button>
                <span className="text-base font-semibold text-gray-900 dark:text-slate-100">{selectedMat.name}</span>
              </div>

              {/* Report meta */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-base space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">From record:</span>
                  <span className="font-semibold text-gray-900 dark:text-slate-100">{fmtDate(selectedRecord.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Initial amount:</span>
                  <span className="font-semibold text-gray-900 dark:text-slate-100">{fmtAmt(selectedRecord.first_amount, selectedMat.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Recorded by:</span>
                  <span className="font-semibold text-gray-900 dark:text-slate-100">
                    {telegramUsername ? `@${telegramUsername}` : selectedRecord.created_by ? `@${selectedRecord.created_by}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Total released:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{fmtAmt(totalReleased, selectedMat.type)}</span>
                </div>
              </div>

              {reportLoading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-gray-600 dark:text-slate-400">
                  <Loader2 className="animate-spin w-6 h-6" /> Building report...
                </div>
              ) : reportRows.length === 0 ? (
                <div className="text-center py-16 text-gray-500 dark:text-slate-400 text-base">
                  No releases found from this record onwards
                </div>
              ) : (
                <>
                  {/* Preview table */}
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-blue-600 dark:bg-blue-600 text-white">
                          <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Date</th>
                          <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Type</th>
                          <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Order / ID</th>
                          <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Name</th>
                          <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Amount</th>
                          <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Additional</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportRows.map((row, i) => {
                          if (row.isDivider) {
                            return (
                              <tr key={i} className="bg-gray-100 dark:bg-slate-700">
                                <td colSpan={6} className="px-3 py-3 text-sm font-semibold italic text-gray-700 dark:text-slate-300">
                                  {row.dividerLabel}
                                </td>
                              </tr>
                            );
                          }
                          const isEven = i % 2 === 0;
                          const reasonColors: Record<string, string> = {
                            ORDER: 'text-blue-700 dark:text-blue-400',
                            ADD: 'text-purple-700 dark:text-purple-400',
                            SALE: 'text-green-700 dark:text-green-400',
                            MAINTENANCE: 'text-orange-700 dark:text-orange-400',
                            WAST: 'text-red-700 dark:text-red-400',
                            ADJ: 'text-yellow-700 dark:text-yellow-400',
                          };
                          return (
                            <tr key={i} className={isEven ? 'bg-white dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-800/50'}>
                              <td className="px-3 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap">{fmtDate(row.date)}</td>
                              <td className={`px-3 py-3 font-medium whitespace-nowrap ${reasonColors[row.reason] || 'text-gray-700 dark:text-slate-300'}`}>
                                {row.reason_display}
                              </td>
                              <td className="px-3 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap">
                                {row.reason === 'ORDER' || row.reason === 'ADD'
                                  ? (row.order_code ? `ORD-${row.order_code}` : '—')
                                  : row.reason === 'SALE'
                                    ? (row.sale_id ? `SALE-${row.sale_id}` : '—')
                                    : '—'}
                              </td>
                              <td className="px-3 py-3 text-gray-700 dark:text-slate-300 max-w-[120px] truncate">
                                {row.order_name || row.customer_name || '—'}
                              </td>
                              <td className="px-3 py-3 text-right font-semibold text-gray-900 dark:text-slate-100 whitespace-nowrap">
                                {fmtAmt(row.amount, selectedMat.type)}
                              </td>
                              <td className="px-3 py-3 text-right font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                                {row.additional_amount ? fmtAmt(row.additional_amount, selectedMat.type) : '—'}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Totals */}
                        <tr className="bg-blue-700 dark:bg-blue-700 text-white font-bold">
                          <td colSpan={4} className="px-3 py-3">TOTAL</td>
                          <td className="px-3 py-3 text-right">{fmtAmt(totalReleased, selectedMat.type)}</td>
                          <td className="px-3 py-3 text-right">
                            {reportRows.reduce((sum, r) => sum + (r.additional_amount || 0), 0) > 0
                              ? fmtAmt(reportRows.reduce((sum, r) => sum + (r.additional_amount || 0), 0), selectedMat.type)
                              : '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer — Download button */}
        {step === 3 && !reportLoading && reportRows.length > 0 && (
          <div className="shrink-0 px-4 py-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-base transition-colors shadow-sm"
            >
              {downloading ? <Loader2 className="animate-spin w-5 h-5" /> : <Download size={20} />}
              {downloading ? 'Generating...' : 'Download Excel Report'}
            </button>
          </div>
        )}
      </div>
    </>
  );
};
