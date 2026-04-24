"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2, AlertCircle, BarChart2, DollarSign, Calculator,
  Factory, ShoppingCart, Check, RefreshCw, ChevronRight, X,
  TrendingUp, AlertTriangle, Package, Wrench, ShoppingBag, FileText,
  MapPin, Phone, Calendar
} from "lucide-react";
import api from "@/api";

type View = "overview" | "tax" | "finance" | "production" | "orders";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtBirr(n: number) { return `${Math.round(n).toLocaleString()} ETB`; }
function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }); }

const STATUS_COLOR: Record<string, string> = {
  "PRE-ACCEPTED": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  "PRE-CONFIRMED": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  "CNC-STARTED": "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  "CNC-COMPLETED": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  "ASSEMBLY-STARTED": "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  "ASSEMBLY-COMPLETED": "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  "DANDI-STARTED": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  "REM-ACCEPTED": "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  "REM-CONFIRMED": "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};
const STATUS_LABEL: Record<string, string> = {
  "PRE-ACCEPTED": "Pre-Accepted", "PRE-CONFIRMED": "Pre-Confirmed",
  "CNC-STARTED": "CNC", "CNC-COMPLETED": "CNC Done",
  "ASSEMBLY-STARTED": "Assembly", "ASSEMBLY-COMPLETED": "Asm. Done",
  "DANDI-STARTED": "D&I", "REM-ACCEPTED": "Rem. Acc.", "REM-CONFIRMED": "Done",
};

// ─── Sheet ────────────────────────────────────────────────────────────────────
function Sheet({ title, onClose, children }: { title: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-zinc-900 rounded-t-2xl max-h-[88vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="font-bold text-gray-900 dark:text-white text-sm">{title}</div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"><X size={16} className="text-gray-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 pb-8">{children}</div>
      </div>
    </div>
  );
}

// ─── KPI Card — minimal, no color backgrounds ─────────────────────────────────
function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700 px-4 py-3">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Stat row with thin bar ───────────────────────────────────────────────────
function StatRow({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-zinc-700/40 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-600 dark:text-gray-300 truncate mb-1">{label}</div>
        <div className="h-1 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div className="h-full bg-gray-400 dark:bg-zinc-400 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </div>
      <div className="text-sm font-semibold text-gray-900 dark:text-white shrink-0 w-8 text-right">{value}</div>
    </div>
  );
}

// ─── Simple data row ──────────────────────────────────────────────────────────
function DataRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-zinc-700/40 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-sm font-semibold ${valueColor || "text-gray-900 dark:text-white"}`}>{value}</span>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700">
      <div className="px-4 pt-3 pb-1">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
      </div>
      <div className="px-4 pb-3">{children}</div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ data }: { data: any }) {
  const sd = data.orders.status_distribution || {};
  const maxS = Math.max(...Object.values(sd) as number[], 1);
  const dd = data.orders.difficulty_distribution || {};

  return (
    <div className="space-y-4">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-2">
        <KpiCard label="Total Orders" value={fmtNum(data.orders.total_orders)} sub={`${data.orders.total_containers} containers`} />
        <KpiCard label="Confirmed" value={fmtBirr(data.finance.total_confirmed)} />
        <KpiCard label="Pending" value={fmtBirr(data.finance.total_pending)} />
        <KpiCard label="Expected Rem." value={fmtBirr(data.finance.expected_remaining || 0)} />
        <KpiCard label="Expenses" value={fmtBirr(data.finance.expenses?.total || 0)} />
        <KpiCard label="Pity Costs" value={fmtBirr(data.finance.pity_costs?.total || 0)} />
        <KpiCard label="Active Leads" value={fmtNum(data.sales.total_leads)} sub={`${data.sales.conversion_rate}% converted`} />
        <KpiCard label="Low Stock" value={data.stock.low_stock_count} sub="materials" />
      </div>

      {/* Order status */}
      <Section title="Order Status">
        {Object.entries(sd).map(([s, c]) => (
          <StatRow key={s} label={STATUS_LABEL[s] || s.replace(/-/g, " ")} value={String(c)} pct={((c as number) / maxS) * 100} />
        ))}
      </Section>

      {/* Difficulty */}
      <Section title="Difficulty">
        {Object.entries(dd).map(([d, c]) => (
          <DataRow key={d} label={d} value={String(c)} />
        ))}
      </Section>

      {/* Sales */}
      <Section title="Sales">
        <DataRow label="Total Leads" value={fmtNum(data.sales.total_leads)} />
        <DataRow label="Conversion Rate" value={`${data.sales.conversion_rate}%`} />
        <DataRow label="Total Mockups" value={String(data.sales.total_mockups)} />
        <DataRow label="Modifications" value={String(data.sales.total_modifications)} />
      </Section>

      {/* Low stock */}
      {data.stock.low_stock_materials?.length > 0 && (
        <Section title="Low Stock">
          {data.stock.low_stock_materials.slice(0, 8).map((m: any) => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-zinc-700/40 last:border-0">
              <div className="min-w-0">
                <div className="text-sm text-gray-700 dark:text-gray-300 truncate">{m.name}</div>
                <div className="text-xs text-gray-400">{m.type} · {m.lable}</div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <div className="text-sm font-semibold text-red-500">{m.available}</div>
                <div className="text-xs text-gray-400">min {m.min_threshold}</div>
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

// ─── Finance Tab ──────────────────────────────────────────────────────────────
function FinanceTab({ data }: { data: any }) {
  const byReason = data.finance.payment_by_reason || [];
  const byStatus = data.finance.payment_by_status || [];
  const wallets = data.finance.wallets || [];
  const REASON_LABEL: Record<string, string> = { PRE: "Pre-Payment", REM: "Remaining", FULL: "Full Payment", SALES: "Sales", MAINTENANCE: "Maintenance" };
  const STATUS_N: Record<string, string> = { C: "Confirmed", P: "Pending", R: "Rejected" };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <KpiCard label="Confirmed" value={fmtBirr(data.finance.total_confirmed)} />
        <KpiCard label="Pending" value={fmtBirr(data.finance.total_pending)} />
        <KpiCard label="Expected Rem." value={fmtBirr(data.finance.expected_remaining || 0)} />
        <KpiCard label="Expenses" value={fmtBirr(data.finance.expenses?.total || 0)} />
      </div>

      {wallets.length > 0 && (
        <Section title="Wallets">
          {wallets.map((w: any) => {
            const total = parseFloat(w.invoice_balance || 0) + parseFloat(w.non_invoice_balance || 0);
            return (
              <div key={w.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-zinc-700/40 last:border-0">
                <span className="text-sm text-gray-700 dark:text-gray-300">{w.name}</span>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{fmtBirr(total)}</div>
                  <div className="text-xs text-gray-400">Inv: {fmtBirr(parseFloat(w.invoice_balance || 0))}</div>
                </div>
              </div>
            );
          })}
        </Section>
      )}

      <Section title="By Reason">
        {byReason.map((r: any) => (
          <div key={r.reason} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-zinc-700/40 last:border-0">
            <span className="text-sm text-gray-600 dark:text-gray-300">{REASON_LABEL[r.reason] || r.reason}</span>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{fmtBirr(r.total || 0)}</div>
              <div className="text-xs text-gray-400">{r.count} payments</div>
            </div>
          </div>
        ))}
      </Section>

      <Section title="By Status">
        {byStatus.map((s: any) => (
          <DataRow key={s.status} label={STATUS_N[s.status] || s.status} value={fmtBirr(s.total || 0)} />
        ))}
      </Section>

      {(data.finance.expenses?.by_category || []).length > 0 && (
        <Section title="Expenses by Category">
          {data.finance.expenses.by_category.map((c: any) => (
            <DataRow key={c.expense_category__name || "other"} label={c.expense_category__name || "Uncategorized"} value={fmtBirr(c.total || 0)} />
          ))}
        </Section>
      )}

      {(data.finance.pity_costs?.by_category || []).length > 0 && (
        <Section title="Pity Costs by Category">
          {data.finance.pity_costs.by_category.map((c: any) => (
            <DataRow key={c.category__name || "other"} label={c.category__name || "Uncategorized"} value={fmtBirr(c.total || 0)} />
          ))}
        </Section>
      )}
    </div>
  );
}

// ─── Production Tab ───────────────────────────────────────────────────────────
function ProductionTab({ data }: { data: any }) {
  const maint = data.production.maintenance;
  const STAGE_LABELS: Record<string, string> = {
    "NOT-ASSIGNED": "Not Assigned", "ASSIGNED": "Assigned",
    "STARTED": "Started", "COMPLATED": "Completed",
  };
  const MAINT_LABELS: Record<string, string> = { NA: "Not Assigned", A: "Assigned", S: "Started", D: "Done" };

  const renderStage = (title: string, d: Record<string, number>) => {
    const total = Object.values(d).reduce((a, b) => a + b, 0);
    const max = Math.max(...Object.values(d), 1);
    return (
      <Section title={`${title} · ${total}`}>
        {Object.entries(d).map(([s, c]) => (
          <StatRow key={s} label={STAGE_LABELS[s] || s.replace(/-/g, " ")} value={String(c)} pct={(c / max) * 100} />
        ))}
      </Section>
    );
  };

  return (
    <div className="space-y-4">
      {renderStage("CNC Cutting", data.production.cnc || {})}
      {renderStage("Assembly", data.production.assembly || {})}
      {renderStage("Delivery & Installation", data.production.delivery || {})}

      <Section title="Maintenance">
        {Object.entries(maint.status_counts || {}).map(([s, c]) => (
          <DataRow key={s} label={MAINT_LABELS[s] || s} value={String(c)} />
        ))}
        <DataRow label="Under Warranty" value={String(maint.warranty)} />
        <DataRow label="Non-Warranty" value={String(maint.non_warranty)} />
      </Section>
    </div>
  );
}

// ─── Tax Tab ──────────────────────────────────────────────────────────────────
function TaxTab() {
  const [totals, setTotals] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vatPct, setVatPct] = useState(15);
  const [profitPct, setProfitPct] = useState(35);
  const [editVat, setEditVat] = useState(false);
  const [editProfit, setEditProfit] = useState(false);
  const [vatInput, setVatInput] = useState("15");
  const [profitInput, setProfitInput] = useState("35");
  const [includeExpected, setIncludeExpected] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const TYPE_OPTS = [
    { v: "all", l: "All" }, { v: "payment", l: "Payments" },
    { v: "purchase", l: "Purchases" }, { v: "expense", l: "Expenses" },
    { v: "pity_cost", l: "Pity" }, { v: "adjustment", l: "Adjustments" },
  ];

  const fetchTax = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      const res = await api.get(`/api/admin/finance-tax/?${params}`);
      setTotals(res.data.totals);
      setRecords(res.data.results || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [typeFilter]);

  useEffect(() => { fetchTax(); }, [fetchTax]);

  const gross = (totals?.income || 0) + (includeExpected ? (totals?.expected_revenue || 0) : 0);
  const base = gross / (1 + vatPct / 100);
  const vat = gross - base;
  const net = base - (totals?.deductions || 0);
  const profitTax = Math.max(net, 0) * (profitPct / 100);
  const withholding = totals?.withholding_tax || 0;
  const totalTax = vat + profitTax - withholding;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tax Summary</span>
          <button onClick={fetchTax} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700"><RefreshCw size={13} className="text-gray-400" /></button>
        </div>

        {/* Gross / Base */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
            <div className="text-[10px] text-blue-500 font-medium mb-0.5">Gross Revenue</div>
            <div className="text-base font-black text-blue-700 dark:text-blue-300">{fmtBirr(gross)}</div>
            <label className="flex items-center gap-1 mt-1.5 cursor-pointer">
              <input type="checkbox" checked={includeExpected} onChange={e => setIncludeExpected(e.target.checked)} className="w-3 h-3" />
              <span className="text-[9px] text-blue-400">+Exp. {fmtBirr(totals?.expected_revenue || 0)}</span>
            </label>
          </div>
          <div className="bg-gray-50 dark:bg-zinc-700/50 rounded-xl p-3">
            <div className="text-[10px] text-gray-400 font-medium mb-0.5">Base (ex-VAT)</div>
            <div className="text-base font-black text-gray-700 dark:text-gray-300">{fmtBirr(base)}</div>
          </div>
        </div>

        {/* Deductions / Net */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
            <div className="text-[10px] text-red-500 font-medium mb-0.5">Deductions</div>
            <div className="text-base font-black text-red-700 dark:text-red-300">-{fmtBirr(totals?.deductions || 0)}</div>
          </div>
          <div className={`${net >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"} rounded-xl p-3`}>
            <div className="text-[10px] font-medium mb-0.5 text-gray-400">Net Profit</div>
            <div className={`text-base font-black ${net >= 0 ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>{fmtBirr(net)}</div>
          </div>
        </div>

        {/* Tax lines */}
        <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-zinc-700">
          {[
            {
              label: "VAT", value: fmtBirr(vat), color: "text-orange-600 dark:text-orange-400",
              edit: editVat, setEdit: setEditVat, input: vatInput, setInput: setVatInput,
              pct: vatPct, setPct: setVatPct,
            },
            {
              label: "Profit Tax", value: fmtBirr(profitTax), color: "text-red-600 dark:text-red-400",
              edit: editProfit, setEdit: setEditProfit, input: profitInput, setInput: setProfitInput,
              pct: profitPct, setPct: setProfitPct,
            },
          ].map(({ label, value, color, edit, setEdit, input, setInput, pct, setPct }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{label}</span>
                {!edit ? (
                  <button onClick={() => setEdit(true)} className="text-[10px] text-blue-500 font-medium bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">{pct}% ✎</button>
                ) : (
                  <div className="flex items-center gap-1">
                    <input type="number" value={input} onChange={e => setInput(e.target.value)}
                      className="w-12 text-xs border border-gray-300 dark:border-zinc-600 rounded px-1.5 py-0.5 bg-white dark:bg-zinc-700 text-gray-900 dark:text-white" />
                    <button onClick={() => { setPct(parseFloat(input) || pct); setEdit(false); }}
                      className="bg-blue-600 text-white rounded px-2 py-0.5 text-xs"><Check size={10} /></button>
                  </div>
                )}
              </div>
              <span className={`text-sm font-bold ${color}`}>{value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Withholding (collected)</span>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">-{fmtBirr(withholding)}</span>
          </div>
        </div>

        {/* Total tax due */}
        <div className="border-t border-gray-100 dark:border-zinc-700 pt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Tax Due</span>
          <span className="text-xl font-bold text-gray-900 dark:text-white">{fmtBirr(totalTax)}</span>
        </div>

        {/* Breakdown grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { l: "Purchases", v: totals?.breakdown?.purchases || 0 },
            { l: "Expenses", v: totals?.breakdown?.expenses || 0 },
            { l: "Pity Costs", v: totals?.breakdown?.pity_costs || 0 },
            { l: "Adjustments", v: totals?.breakdown?.adjustment_invoices || 0 },
          ].map(({ l, v }) => (
            <div key={l} className="bg-gray-50 dark:bg-zinc-700/50 rounded-xl p-3">
              <div className="text-[10px] text-gray-400">{l}</div>
              <div className="text-sm font-bold text-red-600 dark:text-red-400 mt-0.5">{fmtBirr(v)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {TYPE_OPTS.map(o => (
          <button key={o.v} onClick={() => setTypeFilter(o.v)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${typeFilter === o.v ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300"}`}>
            {o.l}
          </button>
        ))}
      </div>

      {/* Records */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
      ) : (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 divide-y divide-gray-100 dark:divide-zinc-700 overflow-hidden">
          {records.length === 0 && <div className="px-4 py-6 text-center text-sm text-gray-400">No records</div>}
          {records.map((r: any, i: number) => {
            const isIncome = r.record_type === "payment" || r.record_type === "adjustment";
            return (
              <button key={`${r.record_type}-${r.id}`} onClick={() => setSelectedRecord(r)}
                className="w-full flex items-center px-4 py-3 gap-3 text-left hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors">
                <div className="text-xs text-gray-300 dark:text-zinc-600 w-5 shrink-0 text-center">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${isIncome ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"}`}>
                      {r.record_type.replace("_", " ")}
                    </span>
                    <span className="text-xs text-gray-400">{r.reason}</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 truncate mt-0.5">{r.source || "—"}</div>
                  <div className="text-[10px] text-gray-300 dark:text-zinc-600">{r.date ? fmtDate(r.date) : "—"}</div>
                </div>
                <div className={`text-sm font-bold shrink-0 ${isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {isIncome ? "+" : "-"}{fmtBirr(r.amount)}
                </div>
                <ChevronRight size={12} className="text-gray-300 shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* Record detail sheet */}
      {selectedRecord && (
        <Sheet title={`${selectedRecord.record_type.replace("_", " ").toUpperCase()} · ${fmtBirr(selectedRecord.amount)}`} onClose={() => setSelectedRecord(null)}>
          <div className="px-5 pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { l: "Type", v: selectedRecord.record_type },
                { l: "Amount", v: fmtBirr(selectedRecord.amount) },
                { l: "Reason", v: selectedRecord.reason || "—" },
                { l: "Status", v: selectedRecord.status || "—" },
                { l: "Source", v: selectedRecord.source || "—" },
                { l: "Date", v: selectedRecord.date ? fmtDate(selectedRecord.date) : "—" },
              ].map(({ l, v }) => (
                <div key={l} className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-2.5">
                  <div className="text-gray-400 mb-0.5">{l}</div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200 truncate">{v}</div>
                </div>
              ))}
            </div>
            {selectedRecord.note && (
              <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3 text-xs text-gray-500 italic">"{selectedRecord.note}"</div>
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab() {
  const [containers, setContainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedContainer, setSelectedContainer] = useState<any>(null);

  const STATUS_OPTS = [
    { v: "", l: "All" }, { v: "PRE-ACCEPTED", l: "Pre-Acc." },
    { v: "CNC-STARTED", l: "CNC" }, { v: "ASSEMBLY-STARTED", l: "Assembly" },
    { v: "DANDI-STARTED", l: "D&I" }, { v: "REM-CONFIRMED", l: "Done" },
  ];

  const fetchOrders = useCallback(async (append = false) => {
    if (!append) setLoading(true);
    try {
      const params = new URLSearchParams({ ordering: "-created_at", page_size: "30" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("order_status", statusFilter);
      const res = await api.get(`/api/admin/orders-table/?${params}`);
      const rows = res.data.results || [];
      setContainers(prev => append ? [...prev, ...rows] : rows);
      setNextPage(res.data.next || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="space-y-3">
      {/* Search */}
      <input type="text" placeholder="Search client, order name..." value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full text-sm border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400" />

      {/* Status filter */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {STATUS_OPTS.map(o => (
          <button key={o.v} onClick={() => setStatusFilter(o.v)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${statusFilter === o.v ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300"}`}>
            {o.l}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 divide-y divide-gray-100 dark:divide-zinc-700 overflow-hidden">
          {containers.length === 0 && <div className="px-4 py-8 text-center text-sm text-gray-400">No orders found</div>}
          {containers.map((c: any) => (
            <div key={c.id}>
              {/* Container header */}
              <button onClick={() => setSelectedContainer(selectedContainer?.id === c.id ? null : c)}
                className="w-full flex items-center px-4 py-3 gap-3 text-left hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors">
                {c.is_delayed && <AlertTriangle size={11} className="text-red-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.client}</div>
                  <div className="text-xs text-gray-400 truncate">{c.location} · {c.delivery_date ? fmtDate(c.delivery_date) : "—"}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-gray-900 dark:text-white">{fmtBirr(c.full_payment)}</div>
                  <div className="text-[10px] text-gray-400">{(c.orders || []).length} orders</div>
                </div>
                <ChevronRight size={13} className={`text-gray-300 shrink-0 transition-transform ${selectedContainer?.id === c.id ? "rotate-90" : ""}`} />
              </button>

              {/* Expanded orders */}
              {selectedContainer?.id === c.id && (
                <div className="bg-gray-50 dark:bg-zinc-700/30 divide-y divide-gray-100 dark:divide-zinc-700/50">
                  {(c.orders || []).map((o: any) => (
                    <button key={o.order_code} onClick={() => setSelectedOrder({ ...o, container: c })}
                      className="w-full flex items-center px-6 py-2.5 gap-3 text-left hover:bg-white dark:hover:bg-zinc-700/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">ORD-{o.order_code}</span>
                          {o.order_name && <span className="text-xs text-gray-500 truncate">{o.order_name}</span>}
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[o.order_status] || "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABEL[o.order_status] || o.order_status}
                      </span>
                      <ChevronRight size={12} className="text-gray-300 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {nextPage && !loading && (
        <button onClick={() => fetchOrders(true)} className="w-full py-2.5 text-sm text-blue-600 dark:text-blue-400 font-medium text-center">
          Load more
        </button>
      )}

      {/* Order detail sheet */}
      {selectedOrder && (
        <Sheet title={<span>ORD-{selectedOrder.order_code} {selectedOrder.order_name && <span className="font-normal text-gray-400 text-xs">{selectedOrder.order_name}</span>}</span>} onClose={() => setSelectedOrder(null)}>
          <div className="px-5 pt-4 space-y-4">
            {selectedOrder.mockup_image && (
              <img src={selectedOrder.mockup_image} alt="Mockup" className="w-full rounded-xl object-contain max-h-48 bg-gray-50 dark:bg-zinc-800" />
            )}
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[selectedOrder.order_status] || "bg-gray-100 text-gray-600"}`}>
              {STATUS_LABEL[selectedOrder.order_status] || selectedOrder.order_status}
            </span>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Phone size={13} className="text-gray-400 shrink-0" />{selectedOrder.container?.client} · {selectedOrder.container?.contact}</div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><MapPin size={13} className="text-gray-400 shrink-0" />{selectedOrder.container?.location}</div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Calendar size={13} className="text-gray-400 shrink-0" />Delivery: {selectedOrder.container?.delivery_date ? fmtDate(selectedOrder.container.delivery_date) : "—"}</div>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div><div className="text-gray-400 mb-0.5">Full</div><div className="font-bold text-gray-900 dark:text-white">{fmtBirr(parseFloat(selectedOrder.container?.full_payment || 0))}</div></div>
              <div><div className="text-gray-400 mb-0.5">Advance</div><div className="font-bold text-green-600 dark:text-green-400">{fmtBirr(parseFloat(selectedOrder.container?.advance_payment || 0))}</div></div>
              <div><div className="text-gray-400 mb-0.5">Remaining</div><div className="font-bold text-orange-600 dark:text-orange-400">{fmtBirr(parseFloat(selectedOrder.container?.remaining_payment || 0))}</div></div>
            </div>
            {(selectedOrder.bom_materials || []).length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Materials (BOM)</div>
                {selectedOrder.bom_materials.map((m: any) => (
                  <div key={m.id} className="text-xs text-gray-600 dark:text-gray-300 py-1 border-b border-gray-50 dark:border-zinc-700/50 last:border-0">{m.name}</div>
                ))}
              </div>
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const TABS: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart2 },
  { id: "tax", label: "Tax", icon: Calculator },
  { id: "finance", label: "Finance", icon: DollarSign },
  { id: "production", label: "Production", icon: Factory },
  { id: "orders", label: "Orders", icon: ShoppingCart },
];

const MobileAnalyticsContent = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>("overview");

  useEffect(() => {
    api.get("/api/admin-dashboard/")
      .then(r => setData(r.data))
      .catch(e => setError(e?.response?.data?.error || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <p className="text-sm text-gray-400 font-medium">Loading analytics...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p className="font-medium text-sm">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="pb-4">
      {/* Sticky tab bar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex overflow-x-auto scrollbar-hide">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = view === t.id;
            return (
              <button key={t.id} onClick={() => setView(t.id)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${active ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 dark:text-gray-400"}`}>
                <Icon size={13} />{t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-4">
        {view === "overview" && data && <OverviewTab data={data} />}
        {view === "tax" && <TaxTab />}
        {view === "finance" && data && <FinanceTab data={data} />}
        {view === "production" && data && <ProductionTab data={data} />}
        {view === "orders" && <OrdersTab />}
      </div>
    </div>
  );
};

export default MobileAnalyticsContent;
