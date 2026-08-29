"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, AlertTriangle, FileText, CheckCircle2, ChevronRight,
  X, Calendar, MapPin, Phone, Loader2, Package, Palette, BarChart2,
  ShoppingBag, Wrench, Filter, Users, Camera, DollarSign, MessageSquare
} from "lucide-react";
import api from "@/api";

// ─── Types ───────────────────────────────────────────────────────────────────
interface OrderRow {
  order_code: number; order_name: string | null; order_status: string;
  price: number; client: string; contact: string; location: string;
  delivery_date: string; container_id: number; mockup_url: string | null;
  advance_payment: number; remaining_payment: number; full_payment: number;
  is_delayed: boolean;
  today_status_image: string | null;
  today_status_note: string | null;
  status_duration_seconds: number | null;
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

const ACTIVE_PRODUCTION_STATUSES = ["CNC-STARTED","CNC-COMPLETED","ASSEMBLY-STARTED","ASSEMBLY-COMPLETED","DANDI-STARTED"];

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

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
  if (preset === "yesterday") {
    const y = new Date(now); y.setDate(now.getDate() - 1);
    const yStr = fmt(y);
    return { from: yStr, to: yStr };
  }
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
  const [statusImages, setStatusImages] = useState<any[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesError, setImagesError] = useState(false);
  const isActive = ACTIVE_PRODUCTION_STATUSES.includes(order.order_status);

  useEffect(() => {
    if (!isActive) return;
    setImagesLoading(true);
    setImagesError(false);
    api.get(`/api/order-status-images/?order=${order.order_code}&status=${order.order_status}`)
      .then(res => setStatusImages(res.data?.results || res.data || []))
      .catch(() => setImagesError(true))
      .finally(() => setImagesLoading(false));
  }, [order.order_code, order.order_status, isActive]);

  return (
    <Sheet title={<span className="flex items-center gap-2">ORD-{order.order_code} {order.order_name && <span className="font-normal text-gray-400">{order.order_name}</span>}</span>} onClose={onClose}>
      <div className="px-5 pt-4 space-y-4">
        {order.is_delayed && <div className="flex items-center gap-2 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg"><AlertTriangle size={13} /> Delivery overdue</div>}
        {order.mockup_url && <img src={order.mockup_url} alt="Mockup" className="w-full rounded-xl object-contain max-h-48 bg-gray-50 dark:bg-zinc-800" />}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[order.order_status] || "bg-gray-100 text-gray-600"}`}>{STATUS_LABEL[order.order_status] || order.order_status}</span>
          {order.status_duration_seconds != null && (
            <span className="text-xs text-gray-400">{formatDuration(order.status_duration_seconds)} in this status</span>
          )}
        </div>
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

        {/* Status image gallery */}
        {isActive && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Images</h3>
              {!order.today_status_image && (
                <span className="text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">No image today</span>
              )}
            </div>
            {imagesLoading && <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-blue-500" /></div>}
            {imagesError && <p className="text-xs text-red-400 text-center py-2">Failed to load images</p>}
            {!imagesLoading && !imagesError && statusImages.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">No images yet</p>
            )}
            {!imagesLoading && statusImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {statusImages.map((img: any) => (
                  <a key={img.id} href={img.image} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <div className="relative">
                      <img src={img.image} alt={img.upload_date} className="w-20 h-20 rounded-lg object-cover border border-gray-200 dark:border-zinc-700" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5 rounded-b-lg">{img.upload_date}</div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Today's note */}
        {isActive && order.today_status_note && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Today's Note</h3>
            <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/50">
              <MessageSquare size={14} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{order.today_status_note}</p>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

// ─── Payment Detail Sheet ─────────────────────────────────────────────────────
function PaymentSheet({ reason, dateRange, title, totalAmount, onClose }: { reason: string; dateRange: {from: string, to: string}; title: string; totalAmount?: number; onClose: () => void }) {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchPayments = useCallback(async (append = false) => {
    if (!append) setLoading(true);
    try {
      const url = append && nextPage 
        ? nextPage 
        : `/api/admin/finance-detail/?date_from=${dateRange.from}&date_to=${dateRange.to}&reason=${reason}&page_size=25`;
      // Use absolute path if nextPage provides it, else relative
      const res = await (append && nextPage && nextPage.startsWith('http') ? api.get(nextPage.replace(/^.*\/\/[^\/]+/, '')) : api.get(url));
      
      const pItems: PaymentRow[] = (res.data.results || []).map((p: any) => ({
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
      setPayments(prev => append ? [...prev, ...pItems] : pItems);
      setNextPage(res.data.next || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [reason, dateRange, nextPage]);

  useEffect(() => {
    fetchPayments();
  }, [reason, dateRange]);

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

  const total = totalAmount !== undefined ? totalAmount : payments.reduce((s, p) => s + p.amount, 0);

  return (
    <Sheet title={`${title} · ${fmtBirr(total)}`} onClose={onClose}>
      {loading && payments.length === 0 && <div className="px-5 py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>}
      {!loading && payments.length === 0 && <div className="px-5 py-8 text-center text-sm text-gray-400">No payments found</div>}
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
        {nextPage && !loading && (
          <button onClick={() => fetchPayments(true)} className="w-full py-3 text-sm text-blue-600 dark:text-blue-400 font-medium text-center hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
            Load more
          </button>
        )}
        {loading && payments.length > 0 && <div className="py-3 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-blue-500" /></div>}
      </div>
    </Sheet>
  );
}

// ─── Outstanding Payments Sheet ──────────────────────────────────────────────
function OutstandingPaymentsSheet({ onClose, onSelectOrder }: { onClose: () => void; onSelectOrder: (o: OrderRow) => void }) {
  const [containers, setContainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPage, setNextPage] = useState<string | null>(null);

  const fetchData = useCallback(async (url: string, append = false) => {
    setLoading(true);
    try {
      const res = await api.get(url);
      const results = res.data?.results || res.data || [];
      setContainers(prev => append ? [...prev, ...results] : results);
      setNextPage(res.data?.next || null);
    } catch (e) {
      console.error('Failed to fetch outstanding payments', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData('/api/admin/orders-table/?is_expected_remaining=true');
  }, [fetchData]);

  let totalOutstanding = 0;
  let totalOrders = 0;
  containers.forEach(c => {
    totalOutstanding += parseFloat(c.remaining_payment || 0);
    totalOrders += (c.orders || []).length;
  });

  return (
    <Sheet
      title={
        <span className="flex items-center gap-2">
          <DollarSign size={16} className="text-amber-500" />
          Outstanding Payments
        </span>
      }
      onClose={onClose}
    >
      <div className="p-4 bg-gray-50 dark:bg-zinc-800/60 border-b border-gray-100 dark:border-zinc-800 grid grid-cols-2 gap-2">
        <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl border border-gray-100 dark:border-zinc-700">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Remaining</div>
          <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">{fmtBirr(totalOutstanding)}</div>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl border border-gray-100 dark:border-zinc-700">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Containers / Orders</div>
          <div className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">{containers.length} Conts ({totalOrders} Ords)</div>
        </div>
      </div>

      {loading && containers.length === 0 && (
        <div className="px-5 py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
      )}
      {!loading && containers.length === 0 && (
        <div className="px-5 py-8 text-center text-sm text-gray-400">No outstanding payments to collect</div>
      )}

      <div className="divide-y divide-gray-100 dark:divide-zinc-800">
        {containers.map((c: any) => (
          <div key={c.id} className="px-5 py-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-bold text-gray-900 dark:text-white">{c.client || 'Unknown Client'}</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{fmtBirr(parseFloat(c.remaining_payment || 0))}</span>
            </div>
            <div className="text-xs text-gray-400 mb-2">{c.contact || '-'} · {c.location || '-'}</div>

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
                  today_status_image: o.today_status_image || null,
                  today_status_note: o.today_status_note || null,
                  status_duration_seconds: o.status_duration_seconds ?? null,
                };
                return (
                  <button
                    key={o.order_code}
                    onClick={() => { onClose(); onSelectOrder(row); }}
                    className="w-full flex items-center gap-2 py-1 px-2 rounded-lg bg-gray-50 dark:bg-zinc-800/80 text-left hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">ORD-{o.order_code}</span>
                    {o.order_name && <span className="text-xs text-gray-500 truncate">{o.order_name}</span>}
                    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[o.order_status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABEL[o.order_status] || o.order_status}</span>
                    <ChevronRight size={12} className="text-gray-300 shrink-0" />
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 mt-2 pt-1 border-t border-gray-100 dark:border-zinc-800/60">
              <span>Full: {fmtBirr(parseFloat(c.full_payment || 0))}</span>
              <span className="text-green-600 dark:text-green-400">Adv: {fmtBirr(parseFloat(c.advance_payment || 0))}</span>
            </div>
          </div>
        ))}
      </div>

      {nextPage && !loading && (
        <button
          onClick={() => fetchData(nextPage, true)}
          className="w-full py-3 text-sm text-blue-600 dark:text-blue-400 font-medium text-center hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Load more
        </button>
      )}
    </Sheet>
  );
}

// ─── Maintenance & Product Sales Sheet ────────────────────────────────────────
function MaintenanceAndSalesSheet({ initialTab = 'maintenance', onClose }: { initialTab?: 'maintenance' | 'sales'; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'maintenance' | 'sales'>(initialTab);
  
  const [maintRows, setMaintRows] = useState<any[]>([]);
  const [maintLoading, setMaintLoading] = useState(false);
  const [maintNext, setMaintNext] = useState<string | null>(null);

  const [salesRows, setSalesRows] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesNext, setSalesNext] = useState<string | null>(null);

  const fetchMaint = useCallback(async (url: string, append = false) => {
    setMaintLoading(true);
    try {
      const res = await api.get(url);
      const results = res.data?.results || res.data || [];
      setMaintRows(prev => append ? [...prev, ...results] : results);
      setMaintNext(res.data?.next || null);
    } catch (e) {
      console.error('Failed to fetch maintenance records', e);
    } finally {
      setMaintLoading(false);
    }
  }, []);

  const fetchSales = useCallback(async (url: string, append = false) => {
    setSalesLoading(true);
    try {
      const res = await api.get(url);
      const results = res.data?.results || res.data || [];
      setSalesRows(prev => append ? [...prev, ...results] : results);
      setSalesNext(res.data?.next || null);
    } catch (e) {
      console.error('Failed to fetch sales records', e);
    } finally {
      setSalesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'maintenance' && maintRows.length === 0) {
      fetchMaint('/api/admin/finance-tables/?type=maintenance');
    } else if (activeTab === 'sales' && salesRows.length === 0) {
      fetchSales('/api/admin/finance-tables/?type=material_sales');
    }
  }, [activeTab, fetchMaint, fetchSales, maintRows.length, salesRows.length]);

  return (
    <Sheet
      title={
        <div className="flex items-center gap-2">
          {activeTab === 'maintenance' ? <Wrench size={16} className="text-orange-500" /> : <ShoppingBag size={16} className="text-indigo-500" />}
          <span>Maintenance & Product Sales</span>
        </div>
      }
      onClose={onClose}
    >
      <div className="p-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/40">
        <div className="flex bg-gray-200 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'maintenance' ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <Wrench size={13} /> Maintenance
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'sales' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <ShoppingBag size={13} /> Product Sales
          </button>
        </div>
      </div>

      {activeTab === 'maintenance' ? (
        <div>
          {maintLoading && maintRows.length === 0 && (
            <div className="px-5 py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
          )}
          {!maintLoading && maintRows.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No maintenance records found</div>
          )}
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {maintRows.map((m: any) => (
              <div key={m.id} className="px-5 py-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{m.client_name || 'Client'}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${m.under_warranty ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                    {m.under_warranty ? 'Warranty' : 'Non-Warranty'}
                  </span>
                </div>
                {m.client_contact && <div className="text-xs text-gray-400">{m.client_contact}</div>}
                {m.reported_issue && <div className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-zinc-800/60 p-2 rounded-lg mt-1">{m.reported_issue}</div>}
                <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                  <span>Assigned: {m.assigned_to || '-'}</span>
                  <span>{fmtDate(m.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
          {maintNext && !maintLoading && (
            <button onClick={() => fetchMaint(maintNext, true)} className="w-full py-3 text-sm text-blue-600 dark:text-blue-400 font-medium text-center hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
              Load more
            </button>
          )}
        </div>
      ) : (
        <div>
          {salesLoading && salesRows.length === 0 && (
            <div className="px-5 py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
          )}
          {!salesLoading && salesRows.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No product sales records found</div>
          )}
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {salesRows.map((sr: any) => (
              <div key={sr.id} className="px-5 py-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{sr.customer_name || 'Customer'}</span>
                  <span className="text-xs text-gray-400">{fmtDate(sr.date)}</span>
                </div>
                {sr.customer_contact && <div className="text-xs text-gray-400">{sr.customer_contact}</div>}
                
                <div className="space-y-1 pt-1">
                  {(sr.releases || []).map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-zinc-800/60 p-2 rounded-lg">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{r.material_name}</span>
                      <span className="text-purple-600 dark:text-purple-400 font-medium">{r.amount} pcs ({r.inventory})</span>
                    </div>
                  ))}
                </div>

                {(sr.payments || []).length > 0 && (
                  <div className="flex items-center justify-between text-xs pt-1 text-green-600 dark:text-green-400 font-medium">
                    <span>Paid: {fmtBirr((sr.payments || []).reduce((a: number, b: any) => a + (b.amount || 0), 0))}</span>
                    <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 rounded-full">Confirmed</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {salesNext && !salesLoading && (
            <button onClick={() => fetchSales(salesNext, true)} className="w-full py-3 text-sm text-blue-600 dark:text-blue-400 font-medium text-center hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
              Load more
            </button>
          )}
        </div>
      )}
    </Sheet>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const MobileHomeSkeleton = () => {
  const glassBlock = "relative overflow-hidden rounded-xl border border-gray-200/70 bg-white/60 backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-800/40";

  return (
    <div className="relative pb-4">
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className={`${glassBlock} h-4 w-28`} />
            <div className={`${glassBlock} h-3 w-20`} />
          </div>
          <div className={`${glassBlock} h-9 w-9 !rounded-full`} />
        </div>
      </div>

      <div className="flex gap-2 overflow-hidden px-4 pt-3">
        {["w-14", "w-20", "w-14", "w-20", "w-16"].map((width, index) => (
          <div key={index} className={`${glassBlock} h-8 shrink-0 !rounded-full ${width}`} />
        ))}
      </div>

      <div className="space-y-5 px-4 pt-4">
        <section>
          <div className={`${glassBlock} h-3 w-24`} />
          <div className="mt-2 grid grid-cols-2 gap-2">
            {["bg-blue-50 dark:bg-blue-900/20", "bg-green-50 dark:bg-green-900/20", "bg-purple-50 dark:bg-purple-900/20", "bg-gray-50 dark:bg-zinc-800", "bg-amber-50 dark:bg-amber-900/20", "bg-gradient-to-br from-indigo-50 to-orange-50 dark:from-indigo-900/20 dark:to-orange-900/20"].map((background, index) => (
              <div key={index} className={`${glassBlock} ${background} h-16 p-3`}>
                <div className="flex h-full items-center gap-3">
                  <div className="h-[18px] w-[18px] shrink-0 rounded-md bg-gray-200/80 dark:bg-zinc-700/70" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-16 rounded bg-gray-200/80 dark:bg-zinc-700/70" />
                    <div className="h-3 w-12 rounded bg-gray-200/70 dark:bg-zinc-700/50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className={`${glassBlock} h-3 w-20`} />
          <div className="mt-2 flex gap-2 overflow-hidden">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className={`${glassBlock} h-[70px] w-[68px] shrink-0`}>
                <div className="flex h-full flex-col items-center justify-center gap-1.5">
                  <div className="h-5 w-8 rounded bg-gray-200/80 dark:bg-zinc-700/70" />
                  <div className="h-2.5 w-10 rounded bg-gray-200/70 dark:bg-zinc-700/50" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="rounded-xl bg-gray-100 p-1 dark:bg-zinc-800">
            <div className="grid grid-cols-2 gap-1">
              <div className={`${glassBlock} h-8 !rounded-lg`} />
              <div className={`${glassBlock} h-8 !rounded-lg`} />
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-zinc-700 dark:bg-zinc-800">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5 last:border-b-0 dark:border-zinc-700">
                <div className="h-8 w-8 shrink-0 rounded-md bg-gray-200/80 dark:bg-zinc-700/70" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-2/5 rounded bg-gray-200/80 dark:bg-zinc-700/70" />
                  <div className="h-3 w-3/5 rounded bg-gray-200/70 dark:bg-zinc-700/50" />
                </div>
                <div className="h-5 w-12 shrink-0 rounded-full bg-gray-200/70 dark:bg-zinc-700/50" />
                <div className="h-3.5 w-3.5 shrink-0 rounded-sm bg-gray-200/50 dark:bg-zinc-700/40" />
              </div>
            ))}
          </div>
        </section>

        <div className={`${glassBlock} flex h-12 items-center justify-center`}>
          <div className="h-3.5 w-44 rounded bg-gray-200/80 dark:bg-zinc-700/70" />
        </div>
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        <div
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/5"
          style={{ animation: "mobileHomeSkeletonShimmer 1.6s ease-in-out infinite" }}
        />
      </div>

      <style>{`
        @keyframes mobileHomeSkeletonShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};

const contentTransition = "opacity-100 transition-opacity duration-300 ease-out";

export default function MobileHomeContent({ onShowFullDashboard, onShowCRM }: { onShowFullDashboard: () => void; onShowCRM?: () => void }) {

  const [dashData, setDashData] = useState<any>(null);
  const [productionOrders, setProductionOrders] = useState<OrderRow[]>([]);
  const [delayedOrders, setDelayedOrders] = useState<OrderRow[]>([]);
  const [mockups, setMockups] = useState<MockupRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [rangeContainers, setRangeContainers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"production" | "mockups">("production");
  const [pipelineFilter, setPipelineFilter] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<"today" | "yesterday" | "week" | "month" | "custom">("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [appliedCustomRange, setAppliedCustomRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [showCustom, setShowCustom] = useState(false);

  // Sheet state
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [paymentSheet, setPaymentSheet] = useState<{ title: string; reason: string; totalAmount?: number } | null>(null);
  const [delayedSheet, setDelayedSheet] = useState(false);
  const [newOrdersSheet, setNewOrdersSheet] = useState(false);
  const [missingImageSheet, setMissingImageSheet] = useState(false);
  const [outstandingSheet, setOutstandingSheet] = useState(false);
  const [maintSalesSheet, setMaintSalesSheet] = useState<{ open: boolean; initialTab: 'maintenance' | 'sales' }>({ open: false, initialTab: 'maintenance' });

  const getRange = useCallback(() => {
    if (datePreset === "custom") return { from: appliedCustomRange.from, to: appliedCustomRange.to };
    return getDateRange(datePreset);
  }, [datePreset, appliedCustomRange]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { from, to } = getRange();
    try {
      const [dashRes, rangeRes, prodRes, mockupRes, rangeOrdersRes] = await Promise.all([
        api.get("/api/admin-dashboard/"),
        api.get(`/api/admin-dashboard/?date_from=${from}&date_to=${to}`),
        api.get("/api/admin/orders-table/?ordering=-created_at&page_size=100"),
        api.get("/lead/mockups/?ordering=-requested_date&page_size=50"),
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
              today_status_image: o.today_status_image || null,
              today_status_note: o.today_status_note || null,
              status_duration_seconds: o.status_duration_seconds ?? null,
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
  const salesTotal = payByReason.find((p: any) => p.reason === "SALES")?.total || 0;
  const maintTotal = payByReason.find((p: any) => p.reason === "MAINTENANCE")?.total || 0;

  // ── Filtered orders list ──
  const visibleOrders = pipelineFilter
    ? productionOrders.filter(o => o.order_status === pipelineFilter)
    : productionOrders;

  const missingImageCount = productionOrders.filter(
    o => ACTIVE_PRODUCTION_STATUSES.includes(o.order_status) && !o.today_status_image
  ).length;

  // ── Payment helpers ──
  const openPaymentSheet = (reason: string, label: string, totalAmount: number) => {
    setPaymentSheet({ title: `${label} Payments`, reason, totalAmount });
  };

  if (loading) return (
    <MobileHomeSkeleton />
  );

  return (
    <div className={`pb-4 ${contentTransition}`}>
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
        {(["today","yesterday","week","month"] as const).map(p => (
          <button key={p} onClick={() => { setDatePreset(p); setShowCustom(false); }}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${datePreset === p && !showCustom ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300"}`}>
            {p === "today" ? "Today" : p === "yesterday" ? "Yesterday" : p === "week" ? "This Week" : "This Month"}
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
          <button onClick={() => { setAppliedCustomRange({ from: customFrom, to: customTo }); setDatePreset("custom"); }}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium">Go</button>
        </div>
      )}

      <div className="px-4 pt-4 space-y-5">
        {/* ── Today's Pulse ── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {datePreset === "today" ? "Today" : datePreset === "yesterday" ? "Yesterday" : datePreset === "week" ? "This Week" : datePreset === "month" ? "This Month" : "Custom Range"}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => openPaymentSheet("PRE", "Pre-Payment", preTotal)}
              className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 flex items-center gap-3 text-left active:opacity-70">
              <FileText size={18} className="text-blue-600 dark:text-blue-400" />
              <div><div className="text-base font-bold text-blue-600 dark:text-blue-400">{fmtBirr(preTotal)}</div><div className="text-xs text-gray-500">Pre-Payment</div></div>
            </button>
            <button onClick={() => openPaymentSheet("REM", "Remaining", remTotal)}
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
          {/* Outstanding Payments & Combined Maintenance + Sales row */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={() => setOutstandingSheet(true)}
              className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 flex items-center gap-3 text-left active:opacity-70">
              <DollarSign size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                  {fmtBirr(dashData?.orders?.outstanding_payments?.total_remaining ?? dashData?.finance?.expected_remaining ?? 0)}
                </div>
                <div className="text-xs text-gray-500">Outstanding Payments</div>
              </div>
            </button>
            <button onClick={() => setMaintSalesSheet({ open: true, initialTab: 'maintenance' })}
              className="bg-gradient-to-br from-indigo-50 to-orange-50 dark:from-indigo-900/20 dark:to-orange-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-xl p-3 flex items-center gap-2 text-left active:opacity-70">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <Wrench size={14} className="text-orange-500" />
                  <ShoppingBag size={14} className="text-indigo-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white">Maint. & Sales</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{fmtBirr(salesTotal + maintTotal)}</div>
                </div>
              </div>
            </button>
          </div>

          {onShowCRM && (
            <button onClick={onShowCRM}
              className="mt-3 w-full min-h-14 flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-100 dark:border-blue-800/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/25 dark:to-indigo-900/20 text-left active:scale-[0.99] transition-all">
              <span className="w-9 h-9 rounded-lg bg-blue-600 text-white grid place-items-center shrink-0"><Users size={18} /></span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-gray-900 dark:text-white">Manage CRM</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">Customers, calls, pipeline and conversations</span>
              </span>
              <ChevronRight size={17} className="text-blue-500 shrink-0" />
            </button>
          )}
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
                {t === "production" ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <span>In Production ({visibleOrders.length})</span>
                    {missingImageCount > 0 && (
                      <span className="flex items-center gap-0.5 text-red-500">
                        <span className="font-bold">{missingImageCount}</span>
                        <Camera size={11} className="text-red-500" />
                      </span>
                    )}
                  </span>
                ) : `Mockups (${mockups.length})`}
              </button>
            ))}
          </div>

          {activeTab === "production" && (
            <div className="bg-white dark:bg-zinc-800 rounded-xl divide-y divide-gray-100 dark:divide-zinc-700 overflow-hidden border border-gray-100 dark:border-zinc-700">
              {visibleOrders.length === 0 && <div className="px-4 py-6 text-center text-sm text-gray-400">{pipelineFilter ? `No orders at ${STATUS_LABEL[pipelineFilter]}` : "No active orders"}</div>}
              {visibleOrders.slice(0, 50).map(o => {
                const isActive = ACTIVE_PRODUCTION_STATUSES.includes(o.order_status);
                const dur = formatDuration(o.status_duration_seconds);
                return (
                  <button key={o.order_code} onClick={() => setSelectedOrder(o)}
                    className="w-full flex items-center px-3 py-2.5 gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors text-left">
                    {o.is_delayed && <AlertTriangle size={11} className="text-red-400 shrink-0" />}
                    {/* Status image thumbnail or missing badge */}
                    {isActive && (
                      o.today_status_image
                        ? <img src={o.today_status_image} alt="status" className="w-8 h-8 rounded-md object-cover shrink-0 border border-green-300 dark:border-green-700" />
                        : <div className="w-8 h-8 rounded-md bg-orange-50 dark:bg-orange-900/20 border border-dashed border-orange-300 dark:border-orange-700 flex items-center justify-center shrink-0">
                            <Camera size={12} className="text-orange-400" />
                          </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">ORD-{o.order_code}</span>
                        {o.order_name && <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{o.order_name}</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 truncate">
                        <span className="truncate">{o.client}</span>
                        {dur && <span className="shrink-0 text-gray-300">·</span>}
                        {dur && <span className="shrink-0 font-medium text-gray-500 dark:text-gray-400">{dur}</span>}
                      </div>
                      {isActive && o.today_status_note && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MessageSquare size={10} className="text-blue-400 shrink-0" />
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{o.today_status_note}</span>
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[o.order_status] || "bg-gray-100 text-gray-600"}`}>{STATUS_LABEL[o.order_status] || o.order_status}</span>
                    <ChevronRight size={13} className="text-gray-300 shrink-0" />
                  </button>
                );
              })}
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
          <div className="px-5 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/40 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wider">Total Overdue Remaining Unpaid</div>
              <div className="text-xs text-red-700 dark:text-red-300 font-medium mt-0.5">{delayedOrders.length} delayed orders pending delivery</div>
            </div>
            <div className="text-base font-bold text-red-600 dark:text-red-400">
              {fmtBirr(dashData?.orders?.delayed_summary?.overdue_remaining_total ?? delayedOrders.reduce((a, b) => a + b.remaining_payment, 0))}
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {delayedOrders.map(o => (
              <button key={o.order_code} onClick={() => { setDelayedSheet(false); setSelectedOrder(o); }}
                className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5"><span className="text-sm font-semibold text-gray-900 dark:text-white">ORD-{o.order_code}</span>{o.order_name && <span className="text-sm text-gray-500 truncate">{o.order_name}</span>}</div>
                  <div className="text-xs text-red-500 mt-0.5">{o.client} · Due {fmtDate(o.delivery_date)}</div>
                  <div className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-0.5">Remaining Unpaid: {fmtBirr(o.remaining_payment)}</div>
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
                      today_status_image: o.today_status_image || null,
                      today_status_note: o.today_status_note || null,
                      status_duration_seconds: o.status_duration_seconds ?? null,
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

      {paymentSheet && <PaymentSheet reason={paymentSheet.reason} dateRange={getRange()} title={paymentSheet.title} totalAmount={paymentSheet.totalAmount} onClose={() => setPaymentSheet(null)} />}
      {selectedOrder && <OrderSheet order={selectedOrder} onClose={() => setSelectedOrder(null)} />}

      {missingImageSheet && (
        <Sheet title={<span className="flex items-center gap-2"><Camera size={14} className="text-orange-500" /> Missing Today's Image ({missingImageCount})</span>} onClose={() => setMissingImageSheet(false)}>
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {productionOrders
              .filter(o => ACTIVE_PRODUCTION_STATUSES.includes(o.order_status) && !o.today_status_image)
              .map(o => (
                <button key={o.order_code} onClick={() => { setMissingImageSheet(false); setSelectedOrder(o); }}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">ORD-{o.order_code}</span>
                      {o.order_name && <span className="text-sm text-gray-500 truncate">{o.order_name}</span>}
                    </div>
                    <div className="text-xs text-orange-500 mt-0.5">{STATUS_LABEL[o.order_status]} · {formatDuration(o.status_duration_seconds)}</div>
                  </div>
                  <ChevronRight size={13} className="text-gray-300 shrink-0" />
                </button>
              ))}
          </div>
        </Sheet>
      )}

      {outstandingSheet && (
        <OutstandingPaymentsSheet
          onClose={() => setOutstandingSheet(false)}
          onSelectOrder={(o) => setSelectedOrder(o)}
        />
      )}

      {maintSalesSheet.open && (
        <MaintenanceAndSalesSheet
          initialTab={maintSalesSheet.initialTab}
          onClose={() => setMaintSalesSheet({ open: false, initialTab: 'maintenance' })}
        />
      )}
    </div>
  );
}
