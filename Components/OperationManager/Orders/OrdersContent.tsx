"use client";

import { useState, useEffect, useMemo } from "react";
import {
    ShoppingCart, DollarSign, AlertCircle, TrendingUp,
    Calendar, RefreshCw, Loader2, Timer, Package,
    User, MapPin, ChevronDown, ChevronUp, Clock,
    CheckCircle, Truck, Settings, Wrench, Layers,
    CreditCard, Search,
} from "lucide-react";
import api from "@/api";
import OrderContainerDetail from "./OrderContainerDetail";

type TopTab = "today" | "delivered" | "production" | "delayed";
type DatePreset = "today" | "yesterday" | "this_week" | "this_month" | "all" | "custom";

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "this_week", label: "This Week" },
    { id: "this_month", label: "This Month" },
    { id: "all", label: "All Time" },
    { id: "custom", label: "Custom" },
];

// Helpers
function daysSince(dateStr: string): number {
    return (Date.now() - new Date(dateStr).getTime()) / 86400000;
}

function timeSince(dateStr: string | null): string {
    if (!dateStr) return "N/A";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

function formatCurrency(amount: number | string | null): string {
    if (amount === null || amount === undefined) return "ETB 0";
    const n = typeof amount === "string" ? parseFloat(amount) : amount;
    return `ETB ${n.toLocaleString()}`;
}

function isToday(dateStr: string): boolean {
    return new Date(dateStr).toDateString() === new Date().toDateString();
}

function isInDateRange(dateStr: string, preset: DatePreset, cf: string, ct: string): boolean {
    if (preset === "all") return true;
    const dateOnly = dateStr.split("T")[0];
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    switch (preset) {
        case "today": return dateOnly === todayStr;
        case "yesterday": { const y = new Date(today); y.setDate(y.getDate() - 1); return dateOnly === y.toISOString().split("T")[0]; }
        case "this_week": { const s = new Date(today); s.setDate(s.getDate() - s.getDay() + 1); return dateOnly >= s.toISOString().split("T")[0] && dateOnly <= todayStr; }
        case "this_month": return dateOnly >= new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0] && dateOnly <= todayStr;
        case "custom": if (!cf || !ct) return true; return dateOnly >= cf && dateOnly <= ct;
        default: return true;
    }
}

function getOrderStatusStyle(status: string) {
    if (!status) return { bg: "bg-[#6B7280]/10", text: "text-[#6B7280]", label: "Unknown" };
    if (status.includes("REM-CONFIRMED")) return { bg: "bg-[#16A34A]/10", text: "text-[#16A34A] dark:text-[#22C55E]", label: "Rem Confirmed" };
    if (status.includes("REM-ACCEPTED")) return { bg: "bg-[#16A34A]/10", text: "text-[#16A34A] dark:text-[#22C55E]", label: "Rem Accepted" };
    if (status.includes("DANDI")) return { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", label: "D&I" };
    if (status.includes("ASSEMBLY-COMPLETED")) return { bg: "bg-[#2563EB]/10", text: "text-[#2563EB] dark:text-[#3B82F6]", label: "Asm Done" };
    if (status.includes("ASSEMBLY-STARTED")) return { bg: "bg-[#2563EB]/10", text: "text-[#2563EB] dark:text-[#3B82F6]", label: "Assembly" };
    if (status.includes("CNC-COMPLETED")) return { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400", label: "CNC Done" };
    if (status.includes("CNC-STARTED")) return { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400", label: "CNC" };
    if (status.includes("PRE-CONFIRMED")) return { bg: "bg-[#F59E0B]/10", text: "text-[#F59E0B]", label: "Pre Confirmed" };
    if (status.includes("PRE-ACCEPTED")) return { bg: "bg-[#F59E0B]/10", text: "text-[#F59E0B]", label: "Pre Accepted" };
    return { bg: "bg-[#6B7280]/10", text: "text-[#6B7280]", label: status.replace(/-/g, " ") };
}

function getPaymentType(c: any): { label: string; color: string } {
    const full = parseFloat(c.full_payment || 0);
    const adv = parseFloat(c.advance_payment || 0);
    const rem = parseFloat(c.remaining_payment || 0);
    if (adv <= 0 && rem <= 0) return { label: "FULL", color: "bg-[#16A34A]/10 text-[#16A34A] dark:text-[#22C55E]" };
    if (adv > 0 && rem > 0) return { label: "PREPAY", color: "bg-[#F59E0B]/10 text-[#F59E0B]" };
    return { label: "ADVANCE", color: "bg-[#2563EB]/10 text-[#2563EB] dark:text-[#3B82F6]" };
}

function isContainerDone(c: any): boolean {
    const orders = c.orders || [];
    return orders.length > 0 && orders.every((o: any) => ["REM-ACCEPTED", "REM-CONFIRMED"].includes(o.order_status));
}

function isContainerDelayed(c: any): boolean {
    if (!c.delivery_date) return false;
    return new Date(c.delivery_date) < new Date() && !isContainerDone(c);
}

function isContainerDeliveredToday(c: any): boolean {
    const orders = c.orders || [];
    return orders.some((o: any) =>
        ["REM-ACCEPTED", "REM-CONFIRMED"].includes(o.order_status) &&
        o.rem_accepted_date && isToday(o.rem_accepted_date)
    );
}

function getHighestStatus(orders: any[]): string {
    const PIPELINE = ["PRE-ACCEPTED", "PRE-CONFIRMED", "CNC-STARTED", "CNC-COMPLETED", "ASSEMBLY-STARTED", "ASSEMBLY-COMPLETED", "DANDI-STARTED", "REM-ACCEPTED", "REM-CONFIRMED"];
    if (!orders.length) return "UNKNOWN";
    return orders.reduce((best: string, o: any) => {
        const bIdx = PIPELINE.indexOf(best);
        const oIdx = PIPELINE.indexOf(o.order_status);
        return oIdx > bIdx ? o.order_status : best;
    }, orders[0].order_status);
}

const OrdersContent = () => {
    const [containers, setContainers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [topTab, setTopTab] = useState<TopTab>("today");
    const [datePreset, setDatePreset] = useState<DatePreset>("all");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [salesFilter, setSalesFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedContainer, setSelectedContainer] = useState<any>(null);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/api/order-container/?ordering=-created_at");
            setContainers(res.data.results || res.data);
        } catch (err: any) {
            setError(err.message || "Failed to load");
        } finally {
            setLoading(false);
        }
    };

    // Unique sales users
    const salesUsers = useMemo(() => {
        const map = new Map<string, string>();
        containers.forEach(c => {
            const pb = c.posted_by;
            if (pb) {
                const name = pb.first_name ? `${pb.first_name} ${pb.last_name || ""}`.trim() : pb.username;
                map.set(String(pb.id), name);
            }
        });
        return Array.from(map.entries());
    }, [containers]);

    // Dashboard stats
    const stats = useMemo(() => {
        const todayCreated = containers.filter(c => isToday(c.created_at));
        const preAcceptedToday = todayCreated.filter(c => (c.orders || []).some((o: any) => o.order_status === "PRE-ACCEPTED")).length;

        const remAcceptedToday = containers.filter(c =>
            (c.orders || []).some((o: any) => o.order_status === "REM-ACCEPTED" && o.rem_accepted_date && isToday(o.rem_accepted_date))
        ).length;

        const potentialRemaining = containers
            .filter(c => !isContainerDone(c) && (c.orders || []).some((o: any) => ["PRE-ACCEPTED", "PRE-CONFIRMED", "CNC-STARTED", "CNC-COMPLETED", "ASSEMBLY-STARTED", "ASSEMBLY-COMPLETED", "DANDI-STARTED"].includes(o.order_status)))
            .reduce((sum, c) => sum + parseFloat(c.remaining_payment || 0), 0);

        const delayedCount = containers.filter(isContainerDelayed).length;
        const deliveredToday = containers.filter(isContainerDeliveredToday).length;

        return { preAcceptedToday, remAcceptedToday, potentialRemaining, delayedCount, deliveredToday };
    }, [containers]);

    // Filter containers
    const filteredContainers = useMemo(() => {
        let data = containers;

        // Top tab
        switch (topTab) {
            case "today":
                data = data.filter(c => isToday(c.created_at));
                break;
            case "delivered":
                data = data.filter(isContainerDeliveredToday);
                break;
            case "production":
                data = data.filter(c => !isContainerDone(c));
                break;
            case "delayed":
                data = data.filter(isContainerDelayed);
                break;
        }

        // Date filter (applied only in production/delayed tabs)
        if (topTab !== "today" && topTab !== "delivered" && datePreset !== "all") {
            data = data.filter(c => isInDateRange(c.created_at, datePreset, customFrom, customTo));
        }

        // Sales filter
        if (salesFilter !== "all") {
            data = data.filter(c => String(c.posted_by?.id) === salesFilter);
        }

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            data = data.filter(c =>
                c.client?.toLowerCase().includes(q) ||
                c.contact?.includes(q) ||
                c.location?.toLowerCase().includes(q) ||
                (c.orders || []).some((o: any) => String(o.order_code).includes(q) || o.order_name?.toLowerCase().includes(q))
            );
        }

        return data;
    }, [containers, topTab, datePreset, customFrom, customTo, salesFilter, searchQuery]);

    // Tab counts
    const tabCounts = useMemo(() => ({
        today: containers.filter(c => isToday(c.created_at)).length,
        delivered: containers.filter(isContainerDeliveredToday).length,
        production: containers.filter(c => !isContainerDone(c)).length,
        delayed: containers.filter(isContainerDelayed).length,
    }), [containers]);

    // Container card
    const renderCard = (c: any) => {
        const orders = c.orders || [];
        const highestStatus = getHighestStatus(orders);
        const st = getOrderStatusStyle(highestStatus);
        const payment = getPaymentType(c);
        const done = isContainerDone(c);
        const delayed = isContainerDelayed(c);
        const days = c.created_at ? daysSince(c.created_at) : 0;
        const urgencyColor = done ? "text-[#16A34A] dark:text-[#22C55E]" : days > 7 ? "text-[#DC2626]" : days > 3 ? "text-[#F59E0B]" : "text-[#6B7280] dark:text-[#94A3B8]";
        const urgencyBg = done ? "" : days > 7 ? "bg-[#DC2626]/5" : days > 3 ? "bg-[#F59E0B]/5" : "";

        return (
            <div
                key={c.id}
                onClick={() => setSelectedContainer(c)}
                className={`bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] overflow-hidden cursor-pointer active:scale-[0.99] transition-all ${urgencyBg}`}
            >
                {/* Color bar */}
                <div className={`h-1 ${done ? "bg-[#16A34A]" : delayed ? "bg-[#DC2626]" : "bg-[#2563EB] dark:bg-[#3B82F6]"}`} />

                <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <span className="text-[10px] font-bold bg-[#E5E7EB] dark:bg-[#334155] text-[#6B7280] dark:text-[#94A3B8] px-1.5 py-0.5 rounded">#{c.id}</span>
                                {delayed && (
                                    <span className="text-[10px] font-bold bg-[#DC2626]/10 text-[#DC2626] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                        <AlertCircle size={9} /> DELAYED
                                    </span>
                                )}
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${payment.color}`}>{payment.label}</span>
                            </div>
                            <h3 className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9] truncate">{c.client}</h3>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${st.bg} ${st.text} shrink-0`}>{st.label}</span>
                    </div>

                    {/* Location & contact */}
                    <div className="flex items-center gap-3 text-xs text-[#6B7280] dark:text-[#94A3B8] mb-2">
                        <span className="flex items-center gap-1 truncate"><MapPin size={11} /> {c.location || "N/A"}</span>
                        <span className="flex items-center gap-1"><User size={11} /> {c.posted_by?.first_name || c.posted_by?.username || "N/A"}</span>
                    </div>

                    {/* Orders list */}
                    <div className="mb-2 space-y-1">
                        {orders.slice(0, 3).map((o: any) => {
                            const os = getOrderStatusStyle(o.order_status);
                            return (
                                <div key={o.order_code} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono font-bold text-[#111827] dark:text-[#F1F5F9]">ORD-{o.order_code}</span>
                                        {o.order_name && <span className="text-[#6B7280] dark:text-[#94A3B8] truncate">{o.order_name}</span>}
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${os.bg} ${os.text}`}>{os.label}</span>
                                </div>
                            );
                        })}
                        {orders.length > 3 && <p className="text-[10px] text-[#2563EB] dark:text-[#3B82F6]">+{orders.length - 3} more orders</p>}
                    </div>

                    {/* Financial row */}
                    <div className="flex items-center gap-2 text-xs mb-2 flex-wrap">
                        <span className="font-semibold text-[#111827] dark:text-[#F1F5F9]">{formatCurrency(c.full_payment)}</span>
                        <span className="text-[#6B7280] dark:text-[#94A3B8]">•</span>
                        <span className="text-[#F59E0B]">Adv: {formatCurrency(c.advance_payment)}</span>
                        <span className="text-[#6B7280] dark:text-[#94A3B8]">•</span>
                        <span className="text-[#DC2626]">Rem: {formatCurrency(c.remaining_payment)}</span>
                    </div>

                    {/* Time + delivery */}
                    <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-1 text-xs ${urgencyColor}`}>
                            <Timer size={12} />
                            {done ? "Completed" : <span><strong>{Math.floor(days)}</strong>d since created</span>}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[#6B7280] dark:text-[#94A3B8]">
                            <Calendar size={10} />
                            {c.delivery_date ? new Date(c.delivery_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No date"}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen pb-4">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-[#F9FAFB] dark:bg-[#0F172A]">
                <div className="px-4 pt-4 pb-3">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center">
                                <ShoppingCart size={18} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9]">Order Manager</h1>
                                <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">{filteredContainers.length} containers</p>
                            </div>
                        </div>
                        <button onClick={fetchAll} disabled={loading} className="p-2 text-[#6B7280] hover:text-[#2563EB] dark:hover:text-[#3B82F6] hover:bg-[#E5E7EB] dark:hover:bg-[#334155] rounded-lg transition-colors">
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>

                    {/* Dashboard Cards */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-7 h-7 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                                    <DollarSign size={14} className="text-[#F59E0B]" />
                                </div>
                                <span className="text-[10px] font-semibold text-[#6B7280] dark:text-[#94A3B8] uppercase leading-tight">Pre Today</span>
                            </div>
                            <p className="text-xl font-bold text-[#111827] dark:text-[#F1F5F9]">{stats.preAcceptedToday}</p>
                        </div>
                        <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-7 h-7 rounded-lg bg-[#16A34A]/10 flex items-center justify-center">
                                    <CheckCircle size={14} className="text-[#16A34A]" />
                                </div>
                                <span className="text-[10px] font-semibold text-[#6B7280] dark:text-[#94A3B8] uppercase leading-tight">Rem Today</span>
                            </div>
                            <p className="text-xl font-bold text-[#111827] dark:text-[#F1F5F9]">{stats.remAcceptedToday}</p>
                        </div>
                        <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-7 h-7 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
                                    <TrendingUp size={14} className="text-[#2563EB]" />
                                </div>
                                <span className="text-[10px] font-semibold text-[#6B7280] dark:text-[#94A3B8] uppercase leading-tight">Potential</span>
                            </div>
                            <p className="text-base font-bold text-[#111827] dark:text-[#F1F5F9]">{formatCurrency(stats.potentialRemaining)}</p>
                        </div>
                        <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#DC2626]/20 p-3" onClick={() => setTopTab("delayed")}>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-7 h-7 rounded-lg bg-[#DC2626]/10 flex items-center justify-center">
                                    <AlertCircle size={14} className="text-[#DC2626]" />
                                </div>
                                <span className="text-[10px] font-semibold text-[#DC2626] uppercase leading-tight">Delayed</span>
                            </div>
                            <p className="text-xl font-bold text-[#DC2626]">{stats.delayedCount}</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" size={14} />
                        <input
                            type="text" placeholder="Search client, order code..."
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-lg text-xs text-[#111827] dark:text-[#F1F5F9] placeholder-[#6B7280] outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                    </div>

                    {/* Top Tabs */}
                    <div className="flex bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] overflow-hidden mb-2 overflow-x-auto">
                        {([
                            { id: "today" as TopTab, label: "Today", count: tabCounts.today },
                            { id: "delivered" as TopTab, label: "Delivered", count: tabCounts.delivered },
                            { id: "production" as TopTab, label: "Production", count: tabCounts.production },
                            { id: "delayed" as TopTab, label: "Delayed", count: tabCounts.delayed },
                        ]).map(tab => {
                            const isActive = topTab === tab.id;
                            return (
                                <button key={tab.id} onClick={() => setTopTab(tab.id)}
                                    className={`flex-1 py-2.5 text-center text-xs font-semibold transition-all relative whitespace-nowrap min-w-0 ${isActive
                                        ? tab.id === "delayed" ? "text-[#DC2626] bg-[#DC2626]/5" : tab.id === "delivered" ? "text-[#16A34A] bg-[#16A34A]/5" : "text-[#2563EB] dark:text-[#3B82F6] bg-[#2563EB]/5 dark:bg-[#3B82F6]/10"
                                        : "text-[#6B7280] dark:text-[#94A3B8]"
                                        }`}>
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isActive
                                            ? tab.id === "delayed" ? "bg-[#DC2626]/10 text-[#DC2626]" : tab.id === "delivered" ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-[#2563EB]/10 text-[#2563EB] dark:text-[#3B82F6]"
                                            : "bg-[#E5E7EB] dark:bg-[#334155] text-[#6B7280]"
                                            }`}>{tab.count}</span>
                                    )}
                                    {isActive && <div className={`absolute bottom-0 left-1/4 right-1/4 h-0.5 ${tab.id === "delayed" ? "bg-[#DC2626]" : tab.id === "delivered" ? "bg-[#16A34A]" : "bg-[#2563EB] dark:bg-[#3B82F6]"} rounded-full`} />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Date + Sales Filters (Not for Today tab) */}
                    {topTab !== "today" && topTab !== "delivered" && (
                        <div className="space-y-2">
                            <div className="flex flex-wrap gap-1.5">
                                {DATE_PRESETS.map(p => (
                                    <button key={p.id} onClick={() => { setDatePreset(p.id); setShowCustomPicker(p.id === "custom"); }}
                                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${datePreset === p.id
                                            ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white shadow-md"
                                            : "bg-white dark:bg-[#1E293B] text-[#6B7280] dark:text-[#94A3B8] border border-[#E5E7EB] dark:border-[#334155]"
                                            }`}>
                                        {p.id === "custom" && <Calendar size={10} className="inline mr-1" />}{p.label}
                                    </button>
                                ))}
                            </div>

                            {showCustomPicker && (
                                <div className="p-3 bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155]">
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-semibold text-[#6B7280] uppercase mb-1 block">From</label>
                                            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                                                className="w-full px-3 py-2 bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] rounded-lg text-xs text-[#111827] dark:text-[#F1F5F9] outline-none focus:ring-2 focus:ring-[#2563EB]" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] font-semibold text-[#6B7280] uppercase mb-1 block">To</label>
                                            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                                                className="w-full px-3 py-2 bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] rounded-lg text-xs text-[#111827] dark:text-[#F1F5F9] outline-none focus:ring-2 focus:ring-[#2563EB]" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sales Filter */}
                            {salesUsers.length > 0 && (
                                <select
                                    value={salesFilter} onChange={e => setSalesFilter(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-lg text-xs text-[#111827] dark:text-[#F1F5F9] outline-none focus:ring-2 focus:ring-[#2563EB]"
                                >
                                    <option value="all">All Sales</option>
                                    {salesUsers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                                </select>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Feed */}
            <div className="px-4 mt-3 space-y-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-[#2563EB]" size={32} />
                        <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-3">Loading orders...</p>
                    </div>
                ) : error ? (
                    <div className="p-4 bg-[#DC2626]/10 rounded-xl text-[#DC2626] text-sm text-center">{error}</div>
                ) : filteredContainers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-[#6B7280]">
                        <Package size={40} className="mb-3 opacity-50" />
                        <p className="text-sm">No orders found</p>
                        <p className="text-xs opacity-70 mt-1">Try a different filter</p>
                    </div>
                ) : (
                    filteredContainers.map(c => renderCard(c))
                )}
            </div>

            {/* Detail Overlay */}
            {selectedContainer && (
                <OrderContainerDetail
                    container={selectedContainer}
                    onClose={() => setSelectedContainer(null)}
                />
            )}
        </div>
    );
};

export default OrdersContent;
