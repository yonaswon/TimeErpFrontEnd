"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, AlertTriangle, FileText, CheckCircle2, ChevronRight,
  X, Calendar, MapPin, Phone, Loader2, Package, Palette, BarChart2,
  ShoppingBag, Wrench, Filter
} from "lucide-react";
import api from "@/api";

// ─── Types ───────────────────────────────────────────────────────────────────
interface OrderRow {
  order_code: number; order_name: string | null; order_status: string;
  price: number; client: string; contact: string; location: string;
  delivery_date: string; container_id: number; mockup_url: string | null;
  advance_payment: number; remaining_payment: number; full_payment: number;
  is_delayed: boolean;
}
interface MockupRow {
  id: number; name: string | null; lead_name: string | null;
  designer: string; request_status: string; requested_date: string;
}
interface PaymentRow {
  id: number; amount: number; reason: string; status: string; method: string;
  source_type: string | null; client: string | null; created_at: string;
  confirmed_at?: string; transaction_id?: string; note?: string;
  accepted_by?: string; confirmed_by?: string; wallet_name?: string; account_bank?: string;
  invoice_image?: string; confirmation_image?: string; additional_image?: string;
  order_container?: { client: string; orders: any[] };
  material_sales?: { customer_name: string };
  maintenance?: { order_code: number | null };
}

// ─── Constants ───────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  "PRE-ACCEPTED": "Pre-Accepted", "PRE-CONFIRMED": "Pre-Confirmed",
  "CNC-STARTED": "CNC", "CNC-COMPLETED": "CNC Done",
  "ASSEMBLY-STARTED": "Assembly", "ASSEMBLY-COMPLETED": "Asm. Done",
  "DANDI-STARTED": "D&I", "REM-ACCEPTED": "Rem. Acc.", "REM-CONFIRMED": "Done",
};
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
const MOCKUP_COLOR: Record<string, string> = {
  "SENT": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  "STARTED": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  "RETURNED": "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};
const PIPELINE = ["PRE-ACCEPTED","PRE-CONFIRMED","CNC-STARTED","CNC-COMPLETED","ASSEMBLY-STARTED","ASSEMBLY-COMPLETED","DANDI-STARTED"];
const REASON_LABEL: Record<string, string> = { PRE: "Pre-Payment", REM: "Remaining", FULL: "Full", SALES: "Sales", MAINTENANCE: "Maintenance" };

function fmtBirr(n: number) { return `${Math.round(n).toLocaleString()} ETB`; }
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }); }
function daysAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return diff === 0 ? "Today" : diff === 1 ? "Yesterday" : `${diff}d ago`;
}
function getDateRange(preset: string): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const today = fmt(now);
  if (preset === "today") return { from: today, to: today };
  if (preset === "week") {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay());
    return { from: fmt(start), to: today };
  }
  if (preset === "month") {
    return { from: `${now.getFullYear()}-${pad(now.getMonth()+1)}-01`, to: today };
  }
  return { from: today, to: today };
}

// ─── Bottom Sheet wrapper ─────────────────────────────────────────────────────
function Sheet({ title, onClose, children }: { title: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-zinc-900 rounded-t-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="font-bold text-gray-900 dark:text-white text-sm">{title}</div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"><X size={16} className="text-gray-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 pb-8">{children}</div>
      </div>
    </div>
  );
}

// ─── Order Detail Sheet ───────────────────────────────────────────────────────
function OrderSheet({ order, onClose }: { order: OrderRow; onClose: () => void }) {
  return (
    <Sheet title={<span className="flex items-center gap-2">ORD-{order.order_code} {order.order_name && <span className="font-normal text-gray-400">{order.order_name}</span>}</span>} onClose={onClose}>
      <div className="px-5 pt-4 space-y-4">
        {order.is_delayed && <div className="flex items-center gap-2 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg"><AlertTriangle size={13} /> Delivery overdue</div>}
        {order.mockup_url && <img src={order.mockup_url} alt="Mockup" className="w-full rounded-xl object-contain max-h-48 bg-gray-50 dark:bg-zinc-800" />}
        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[order.order_status] || "bg-gray-100 text-gray-600"}`}>{STATUS_LABEL[order.order_status] || order.order_status}</span>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Phone size={13} className="text-gray-400 shrink-0" />{order.client} · {order.contact}</div>
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><MapPin size={13} className="text-gray-400 shrink-0" />{order.location}</div>
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Calendar size={13} className={`shrink-0 ${order.is_delayed ? "text-red-400" : "text-gray-400"}`} /><span className={order.is_delayed ? "text-red-600 dark:text-red-400 font-medium" : ""}>Delivery: {fmtDate(order.delivery_date)}</span></div>
        </div>
        <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div><div className="text-gray-400 mb-0.5">Full</div><div className="font-semibold text-gray-900 dark:text-white">{fmtBirr(order.full_payment)}</div></div>
          <div><div className="text-gray-400 mb-0.5">Advance</div><div className="font-semibold text-green-600 dark:text-green-400">{fmtBirr(order.advance_payment)}</div></div>
          <div><div className="text-gray-400 mb-0.5">Remaining</div><div className="font-semibold text-orange-600 dark:text-orange-400">{fmtBirr(order.remaining_payment)}</div></div>
        </div>
      </div>
    </Sheet>
  );
}

// ─── Payment Detail Sheet ─────────────────────────────────────────────────────
function PaymentSheet({ payments, title, onClose }: { payments: PaymentRow[]; title: string; onClose: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const sourceIcon = (s: string | null) => {
    if (s === "order") return <Package size={13} className="text-blue-400 shrink-0" />;
    if (s === "sales") return <ShoppingBag size={13} className="text-purple-400 shrink-0" />;
    if (s === "maintenance") return <Wrench size={13} className="text-orange-400 shrink-0" />;
    return <FileText size={13} className="text-gray-400 shrink-0" />;
  };

  const sourceLabel = (p: PaymentRow) => {
    if (p.source_type === "order" && p.order_container) {
      const orders = p.order_container.orders || [];
      const orderStr = orders.map((o: any) => `ORD-${o.order_code}${o.order_name ? ` ${o.order_name}` : ""}`).join(", ");
      return { main: p.order_container.client, sub: orderStr || null };
    }
    if (p.source_type === "sales" && p.material_sales) return { main: "Product Sale", sub: p.material_sales.customer_name };
    if (p.source_type === "maintenance" && p.maintenance) return { main: "Maintenance", sub: p.maintenance.order_code ? `ORD-${p.maintenance.order_code}` : null };
    return { main: "—", sub: null };
  };

  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <Sheet title={`${title} · ${fmtBirr(total)}`} onClose={onClose}>
      {payments.length === 0 && <div className="px-5 py-8 text-center text-sm text-gray-400">No payments found</div>}
      <div className="divide-y divide-gray-100 dark:divide-zinc-800">
        {payments.map(p => {
          const { main, sub } = sourceLabel(p);
          const isOpen = expanded === p.id;
          return (
            <div key={p.id}>
              <button onClick={() => setExpanded(isOpen ? null : p.id)}
                className="w-full px-5 py-3 flex items-start gap-3 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                {sourceIcon(p.source_type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{fmtBirr(p.amount)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${p.status === "C" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : p.status === "P" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" : "bg-red-100 text-red-700"}`}>
                      {p.status === "C" ? "Confirmed" : p.status === "P" ? "Pending" : "Rejected"}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-0.5">{main}</div>
                  {sub && <div className="text-xs text-blue-500 dark:text-blue-400 mt-0.5 truncate">{sub}</div>}
                  <div className="text-xs text-gray-400 mt-0.5">{p.method}{p.account_bank ? ` · ${p.account_bank}` : ""} · {fmtDate(p.created_at)}</div>
                </div>
                <ChevronRight size={13} className={`text-gray-300 shrink-0 mt-1 transition-transform ${isOpen ? "rotate-90" : ""}`} />
              </button>

              {isOpen && (
                <div className="px-5 pb-4 bg-gray-50 dark:bg-zinc-800/50 space-y-3">
                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {p.wallet_name && <div><span className="text-gray-400">Wallet</span><div className="font-medium text-gray-800 dark:text-gray-200">{p.wallet_name}</div></div>}
                    {p.transaction_id && <div><span className="text-gray-400">Tx ID</span><div className="font-medium text-gray-800 dark:text-gray-200 truncate">{p.transaction_id}</div></div>}
                    {p.accepted_by && <div><span className="text-gray-400">Accepted by</span><div className="font-medium text-gray-800 dark:text-gray-200">{p.accepted_by}</div></div>}
                    {p.confirmed_by && <div><span className="text-gray-400">Confirmed by</span><div className="font-medium text-gray-800 dark:text-gray-200">{p.confirmed_by}</div></div>}
                    {p.confirmed_at && <div><span className="text-gray-400">Confirmed at</span><div className="font-medium text-gray-800 dark:text-gray-200">{fmtDate(p.confirmed_at)}</div></div>}
                  </div>
                  {p.note && <div className="text-xs text-gray-500 dark:text-gray-400 italic">"{p.note}"</div>}
                  {/* Images */}
                  {[
                    { url: p.invoice_image, label: "Invoice" },
                    { url: p.confirmation_image, label: "Confirmation" },
                    { url: p.additional_image, label: "Additional" },
                  ].filter(i => i.url).map(({ url, label }) => (
                    <div key={label}>
                      <div className="text-xs text-gray-400 mb-1">{label}</div>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={label} className="w-full rounded-lg object-contain max-h-48 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MobileHomeContent({ onShowFullDashboard }: { onShowFullDashboard: () => void }) {
  const [dashData, setDashData] = useState<any>(null);
  const [productionOrders, setProductionOrders] = useState<OrderRow[]>([]);
  const [delayedOrders, setDelayedOrders] = useState<OrderRow[]>([]);
  const [mockups, setMockups] = useState<MockupRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [rangeContainers, setRangeContainers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"production" | "mockups">("production");
  const [pipelineFilter, setPipelineFilter] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<"today" | "week" | "month" | "custom">("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  // Sheet state
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [paymentSheet, setPaymentSheet] = useState<{ title: string; items: PaymentRow[] } | null>(null);
  const [delayedSheet, setDelayedSheet] = useState(false);
  const [newOrdersSheet, setNewOrdersSheet] = useState(false);

  const getRange = useCallback(() => {
    if (datePreset === "custom") return { from: customFrom, to: customTo };
    return getDateRange(datePreset);
  }, [datePreset, customFrom, customTo]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { from, to } = getRange();
    try {
      const [dashRes, rangeRes, prodRes, mockupRes, payRes, rangeOrdersRes] = await Promise.all([
        api.get("/api/admin-dashboard/"),
        api.get(`/api/admin-dashboard/?date_from=${from}&date_to=${to}`),
        api.get("/api/admin/orders-table/?ordering=-created_at&page_size=100"),
        api.get("/lead/mockups/?ordering=-requested_date&page_size=50"),
        api.get(`/api/admin/finance-detail/?date_from=${from}&date_to=${to}&page_size=100`),
        api.get(`/api/admin/orders-table/?ordering=-created_at&date_from=${from}&date_to=${to}&page_size=50`),
      ]);

      setDashData({ ...dashRes.data, rangeFinance: rangeRes.data?.finance, rangeOrders: rangeRes.data?.orders });
      setRangeContainers(rangeOrdersRes.data.results || []);

      const done = new Set(["REM-ACCEPTED", "REM-CONFIRMED"]);
      const allRows: OrderRow[] = [];
      const delayed: OrderRow[] = [];
      for (const c of (prodRes.data.results || [])) {
        for (const o of (c.orders || [])) {
          if (!done.has(o.order_status)) {
            const row: OrderRow = {
              order_code: o.order_code, order_name: o.order_name, order_status: o.order_status,
              price: o.price || 0, client: c.client, contact: c.contact, location: c.location,
              delivery_date: c.delivery_date, container_id: c.id, mockup_url: o.mockup_image || null,
              advance_payment: parseFloat(c.advance_payment || 0),
              remaining_payment: parseFloat(c.remaining_payment || 0),
              full_payment: parseFloat(c.full_payment || 0),
              is_delayed: c.is_delayed === true,
            };
            allRows.push(row);
            if (c.is_delayed) delayed.push(row);
          }
        }
      }
      setProductionOrders(allRows);
      setDelayedOrders(delayed);

      const mItems: MockupRow[] = (mockupRes.data.results || mockupRes.data || [])
        .filter((m: any) => m.request_status === "SENT" || m.request_status === "STARTED")
        .map((m: any) => ({
          id: m.id, name: m.name, lead_name: m.lead_name || null,
          designer: typeof m.designer === "object" ? (m.designer?.username || "—") : (m.designer || "—"),
          request_status: m.request_status, requested_date: m.requested_date,
        }));
      setMockups(mItems);

      const pItems: PaymentRow[] = (payRes.data.results || []).map((p: any) => ({
        id: p.id, amount: parseFloat(p.amount || 0), reason: p.reason, status: p.status,
        method: p.method,
        source_type: p.source_type || null,
        client: p.order_container?.client || p.material_sales?.customer_name || null,
        created_at: p.created_at,
        confirmed_at: p.confirmed_at,
        transaction_id: p.transaction_id,
        note: p.note,
        accepted_by: p.accepted_by,
        confirmed_by: p.confirmed_by,
        wallet_name: p.wallet_name,
        account_bank: p.account_bank,
        invoice_image: p.invoice_image,
        confirmation_image: p.confirmation_image,
        additional_image: p.additional_image,
        order_container: p.order_container || undefined,
        material_sales: p.material_sales || undefined,
        maintenance: p.maintenance || undefined,
      }));
      setPayments(pItems);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [getRange]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived stats ──
  const rangeFinance = dashData?.rangeFinance;
  const rangeOrders = dashData?.rangeOrders;
  const payByReason = rangeFinance?.payment_by_reason || [];
  const preTotal = payByReason.find((p: any) => p.reason === "PRE")?.total || 0;
  const remTotal = payByReason.find((p: any) => p.reason === "REM")?.total || 0;
  // Orders created in the selected period
  const newOrdersCount = rangeOrders?.total_containers || 0;
  const statusDist = dashData?.orders?.status_distribution || {};

  // ── Filtered orders list ──
  const visibleOrders = pipelineFilter
    ? productionOrders.filter(o => o.order_status === pipelineFilter)
    : productionOrders;

  // ── Payment helpers ──
  const openPaymentSheet = (reason: string, label: string) => {
    const items = payments.filter(p => p.reason === reason);
    setPaymentSheet({ title: `${label} Payments`, items });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  );

  return (
    <div className="pb-4">
      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">TimeERP</h1>
          <p className="text-xs text-gray-400">{new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })}</p>
        </div>
        <button onClick={fetchAll} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
          <RefreshCw size={16} className="text-gray-500" />
        </button>
      </div>

      {/* ── Date Filter Bar ── */}
      <div className="px-4 pt-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {(["today","week","month"] as const).map(p => (
          <button key={p} onClick={() => { setDatePreset(p); setShowCustom(false); }}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${datePreset === p && !showCustom ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300"}`}>
            {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
          </button>
        ))}
        <button onClick={() => setShowCustom(v => !v)}
          className={`shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${showCustom ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300"}`}>
          <Filter size={11} /> Custom
        </button>
      </div>
      {showCustom && (
        <div className="px-4 pt-2 flex items-center gap-2">
          <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
            className="flex-1 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white" />
          <span className="text-xs text-gray-400">–</span>
          <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
            className="flex-1 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white" />
          <button onClick={() => { setDatePreset("custom"); fetchAll(); }}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium">Go</button>
        </div>
      )}

      <div className="px-4 pt-4 space-y-5">
        {/* ── Today's Pulse ── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {datePreset === "today" ? "Today" : datePreset === "week" ? "This Week" : datePreset === "month" ? "This Month" : "Custom Range"}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => openPaymentSheet("PRE", "Pre-Payment")}
              className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 flex items-center gap-3 text-left active:opacity-70">
              <FileText size={18} className="text-blue-600 dark:text-blue-400" />
              <div><div className="text-base font-bold text-blue-600 dark:text-blue-400">{fmtBirr(preTotal)}</div><div className="text-xs text-gray-500">Pre-Payment</div></div>
            </button>
            <button onClick={() => openPaymentSheet("REM", "Remaining")}
              className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 flex items-center gap-3 text-left active:opacity-70">
              <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
              <div><div className="text-base font-bold text-green-600 dark:text-green-400">{fmtBirr(remTotal)}</div><div className="text-xs text-gray-500">Remaining Paid</div></div>
            </button>
            <button onClick={() => setNewOrdersSheet(true)}
              className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 flex items-center gap-3 text-left active:opacity-70">
              <Package size={18} className="text-purple-600 dark:text-purple-400" />
              <div><div className="text-base font-bold text-purple-600 dark:text-purple-400">{newOrdersCount}</div><div className="text-xs text-gray-500">New Orders</div></div>
            </button>
            <button onClick={() => setDelayedSheet(true)}
              className={`${delayedOrders.length > 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-gray-50 dark:bg-zinc-800"} rounded-xl p-3 flex items-center gap-3 text-left active:opacity-70`}>
              <AlertTriangle size={18} className={delayedOrders.length > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400"} />
              <div><div className={`text-base font-bold ${delayedOrders.length > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400"}`}>{delayedOrders.length}</div><div className="text-xs text-gray-500">Delayed</div></div>
            </button>
          </div>
        </section>

        {/* ── Pipeline ── */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pipeline</h2>
            {pipelineFilter && <button onClick={() => setPipelineFilter(null)} className="text-xs text-blue-500">Clear filter</button>}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {PIPELINE.map(s => {
              const count = statusDist[s] || 0;
              const active = pipelineFilter === s;
              return (
                <button key={s} onClick={() => { setPipelineFilter(active ? null : s); setActiveTab("production"); }}
                  className={`flex-shrink-0 rounded-xl px-3 py-2 text-center min-w-[68px] border transition-colors ${active ? "bg-blue-600 border-blue-600 text-white" : "bg-white dark:bg-zinc-800 border-gray-100 dark:border-zinc-700 text-gray-900 dark:text-white"}`}>
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-[10px] leading-tight mt-0.5 opacity-80">{STATUS_LABEL[s]}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Tab Nav: In Production / Mockups ── */}
        <section>
          <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-xl p-1 mb-3">
            {(["production","mockups"] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === t ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
                {t === "production" ? `In Production (${visibleOrders.length})` : `Mockups (${mockups.length})`}
              </button>
            ))}
          </div>

          {activeTab === "production" && (
            <div className="bg-white dark:bg-zinc-800 rounded-xl divide-y divide-gray-100 dark:divide-zinc-700 overflow-hidden border border-gray-100 dark:border-zinc-700">
              {visibleOrders.length === 0 && <div className="px-4 py-6 text-center text-sm text-gray-400">{pipelineFilter ? `No orders at ${STATUS_LABEL[pipelineFilter]}` : "No active orders"}</div>}
              {visibleOrders.slice(0, 50).map(o => (
                <button key={o.order_code} onClick={() => setSelectedOrder(o)}
                  className="w-full flex items-center px-3 py-2.5 gap-3 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors text-left">
                  {o.is_delayed && <AlertTriangle size={11} className="text-red-400 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">ORD-{o.order_code}</span>
                      {o.order_name && <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{o.order_name}</span>}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{o.client} · {fmtDate(o.delivery_date)}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[o.order_status] || "bg-gray-100 text-gray-600"}`}>{STATUS_LABEL[o.order_status] || o.order_status}</span>
                  <ChevronRight size={13} className="text-gray-300 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {activeTab === "mockups" && (
            <div className="bg-white dark:bg-zinc-800 rounded-xl divide-y divide-gray-100 dark:divide-zinc-700 overflow-hidden border border-gray-100 dark:border-zinc-700">
              {mockups.length === 0 && <div className="px-4 py-6 text-center text-sm text-gray-400">No active mockups</div>}
              {mockups.map(m => (
                <div key={m.id} className="flex items-center px-3 py-2.5 gap-3">
                  <Palette size={13} className="text-purple-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.lead_name || m.name || `Mockup #${m.id}`}</div>
                    <div className="text-xs text-gray-400 truncate">{m.designer} · {daysAgo(m.requested_date)}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${MOCKUP_COLOR[m.request_status] || "bg-gray-100 text-gray-500"}`}>{m.request_status}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Full Dashboard ── */}
        <button onClick={onShowFullDashboard}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
          <BarChart2 size={16} /> Full Dashboard & Analytics <ChevronRight size={13} />
        </button>
      </div>

      {/* ── Sheets ── */}
      {delayedSheet && (
        <Sheet title={<span className="flex items-center gap-2"><AlertTriangle size={14} className="text-red-500" /> Delayed Orders ({delayedOrders.length})</span>} onClose={() => setDelayedSheet(false)}>
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {delayedOrders.map(o => (
              <button key={o.order_code} onClick={() => { setDelayedSheet(false); setSelectedOrder(o); }}
                className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5"><span className="text-sm font-semibold text-gray-900 dark:text-white">ORD-{o.order_code}</span>{o.order_name && <span className="text-sm text-gray-500 truncate">{o.order_name}</span>}</div>
                  <div className="text-xs text-red-500 mt-0.5">{o.client} · Due {fmtDate(o.delivery_date)}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[o.order_status] || ""}`}>{STATUS_LABEL[o.order_status]}</span>
                <ChevronRight size={13} className="text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {newOrdersSheet && (
        <Sheet title={`New Orders (${rangeContainers.length})`} onClose={() => setNewOrdersSheet(false)}>
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {rangeContainers.length === 0 && <div className="px-5 py-8 text-center text-sm text-gray-400">No orders in this period</div>}
            {rangeContainers.map((c: any) => (
              <div key={c.id} className="px-5 py-3">
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{c.client}</div>
                <div className="space-y-1">
                  {(c.orders || []).map((o: any) => {
                    const row: OrderRow = {
                      order_code: o.order_code, order_name: o.order_name, order_status: o.order_status,
                      price: o.price || 0, client: c.client, contact: c.contact, location: c.location,
                      delivery_date: c.delivery_date, container_id: c.id, mockup_url: o.mockup_image || null,
                      advance_payment: parseFloat(c.advance_payment || 0),
                      remaining_payment: parseFloat(c.remaining_payment || 0),
                      full_payment: parseFloat(c.full_payment || 0),
                      is_delayed: c.is_delayed === true,
                    };
                    return (
                      <button key={o.order_code} onClick={() => { setNewOrdersSheet(false); setSelectedOrder(row); }}
                        className="w-full flex items-center gap-2 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg px-2 transition-colors">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0">ORD-{o.order_code}</span>
                        {o.order_name && <span className="text-xs text-gray-500 truncate">{o.order_name}</span>}
                        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[o.order_status] || "bg-gray-100 text-gray-600"}`}>{STATUS_LABEL[o.order_status] || o.order_status}</span>
                        <ChevronRight size={12} className="text-gray-300 shrink-0" />
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs text-gray-400 mt-1">{fmtBirr(parseFloat(c.full_payment || 0))} · {fmtDate(c.created_at)}</div>
              </div>
            ))}
          </div>
        </Sheet>
      )}

      {paymentSheet && <PaymentSheet payments={paymentSheet.items} title={paymentSheet.title} onClose={() => setPaymentSheet(null)} />}
      {selectedOrder && <OrderSheet order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}
