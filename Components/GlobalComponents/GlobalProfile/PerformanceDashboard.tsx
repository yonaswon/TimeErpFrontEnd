"use client";

import { useState, useEffect } from "react";
import {
    X,
    Trophy,
    Phone,
    PhoneOff,
    PhoneMissed,
    PhoneOutgoing,
    Users,
    Target,
    Palette,
    Clock,
    Wrench,
    Truck,
    Scissors,
    AlertTriangle,
    Loader2,
    RefreshCw,
    Calendar,
    ChevronDown,
} from "lucide-react";
import api from "@/api";

type TabType = "sales" | "designers" | "assembly" | "cnc";
type PresetType = "today" | "yesterday" | "this_week" | "this_month" | "custom";

interface PerformanceDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

const PRESET_LABELS: Record<PresetType, string> = {
    today: "Today",
    yesterday: "Yesterday",
    this_week: "This Week",
    this_month: "This Month",
    custom: "Custom Range",
};

const PerformanceDashboard = ({ isOpen, onClose }: PerformanceDashboardProps) => {
    const [activeTab, setActiveTab] = useState<TabType>("sales");
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Date filter
    const [preset, setPreset] = useState<PresetType>("today");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPerformance();
        }
    }, [isOpen]);

    const fetchPerformance = async (p?: PresetType, from?: string, to?: string) => {
        const activePreset = p || preset;
        setLoading(true);
        setError(null);
        try {
            let params: any = { preset: activePreset };
            if (activePreset === "custom") {
                params.date_from = from || customFrom;
                params.date_to = to || customTo;
            }
            const res = await api.get("/core/api/team-performance/", { params });
            setData(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to load performance data");
        } finally {
            setLoading(false);
        }
    };

    const handlePresetChange = (p: PresetType) => {
        setPreset(p);
        if (p !== "custom") {
            setShowDatePicker(false);
            fetchPerformance(p);
        } else {
            setShowDatePicker(true);
        }
    };

    const handleCustomApply = () => {
        if (customFrom && customTo) {
            setShowDatePicker(false);
            fetchPerformance("custom", customFrom, customTo);
        }
    };

    const getRankBadge = (rank: number) => {
        if (rank === 1) return { emoji: "🥇", bg: "bg-gradient-to-r from-yellow-400 to-amber-500", text: "text-white", border: "border-yellow-400", glow: "shadow-[0_0_16px_rgba(251,191,36,0.4)]" };
        if (rank === 2) return { emoji: "🥈", bg: "bg-gradient-to-r from-gray-300 to-slate-400", text: "text-white", border: "border-gray-300", glow: "shadow-[0_0_12px_rgba(148,163,184,0.3)]" };
        if (rank === 3) return { emoji: "🥉", bg: "bg-gradient-to-r from-orange-400 to-amber-600", text: "text-white", border: "border-orange-400", glow: "shadow-[0_0_12px_rgba(251,146,60,0.3)]" };
        return { emoji: `#${rank}`, bg: "bg-gray-100 dark:bg-zinc-800", text: "text-gray-600 dark:text-gray-400", border: "border-gray-200 dark:border-zinc-700", glow: "" };
    };

    const getUserName = (user: any) => {
        if (user.first_name) return `${user.first_name} ${user.last_name || ""}`.trim();
        return user.telegram_user_name || user.username || "Unknown";
    };

    const getUserImage = (user: any) => {
        const uname = user.telegram_user_name || user.username;
        return uname ? `https://t.me/i/userpic/160/${uname}.jpg` : "https://telegram.org/img/t_logo.png";
    };

    const formatTimeAgo = (dateStr: string | null) => {
        if (!dateStr) return "Never";
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Never";
        return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    const StatPill = ({ label, value, icon: Icon, color = "blue" }: any) => {
        const colorMap: Record<string, string> = {
            blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
            green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
            red: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
            amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
            purple: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
            gray: "bg-gray-50 text-gray-700 dark:bg-zinc-800 dark:text-gray-400",
        };
        return (
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${colorMap[color] || colorMap.blue}`}>
                {Icon && <Icon size={12} />}
                <span>{value}</span>
                <span className="opacity-60 font-normal">{label}</span>
            </div>
        );
    };

    const ScoreBar = ({ score, maxScore }: { score: number; maxScore: number }) => {
        const pct = maxScore > 0 ? Math.min(100, (score / maxScore) * 100) : 0;
        return (
            <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-10 text-right">{score}pt</span>
            </div>
        );
    };

    const tabs = [
        { id: "sales" as TabType, label: "Sales", icon: Phone },
        { id: "designers" as TabType, label: "Designers", icon: Palette },
        { id: "assembly" as TabType, label: "Assembly", icon: Wrench },
        { id: "cnc" as TabType, label: "CNC", icon: Scissors },
    ];

    const getMaxScore = (items: any[]) => {
        if (!items || items.length === 0) return 1;
        return Math.max(...items.map((i: any) => i.score || 0), 1);
    };

    // ────── RENDER CARDS ──────

    const renderSalesCard = (item: any, maxScore: number) => {
        const badge = getRankBadge(item.rank);
        return (
            <div key={item.user.id} className={`bg-white dark:bg-zinc-900 rounded-xl border ${badge.border} p-4 ${badge.glow} transition-all duration-300`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-full ${badge.bg} flex items-center justify-center text-sm font-bold ${badge.text} shrink-0`}>
                        {item.rank <= 3 ? badge.emoji : item.rank}
                    </div>
                    <img
                        src={getUserImage(item.user)}
                        className="w-9 h-9 rounded-full bg-gray-200 dark:bg-zinc-700 object-cover shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://telegram.org/img/t_logo.png"; }}
                        alt=""
                    />
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{getUserName(item.user)}</h4>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                            Last sync: {formatDate(item.last_synced)} <span className="opacity-70">({formatTimeAgo(item.last_synced)})</span>
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-1">
                    <StatPill icon={Phone} value={item.calls.answered} label="Answered" color="green" />
                    <StatPill icon={PhoneMissed} value={item.calls.missed} label="Missed" color="red" />
                    <StatPill icon={PhoneOff} value={item.calls.rejected} label="Rejected" color="amber" />
                    <StatPill icon={PhoneOutgoing} value={item.calls.outgoing} label="Out" color="blue" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <StatPill icon={Users} value={item.total_leads} label="Leads" color="purple" />
                    <StatPill icon={Palette} value={item.mockup_requests} label="Mockups" color="blue" />
                    <StatPill icon={Target} value={item.clients_converted} label="Client Converted" color="amber" />
                    <StatPill icon={Target} value={item.orders_converted} label="Order Converted" color="green" />
                </div>
                <ScoreBar score={item.score} maxScore={maxScore} />
            </div>
        );
    };

    const renderDesignerCard = (item: any, maxScore: number) => {
        const badge = getRankBadge(item.rank);
        return (
            <div key={item.user.id} className={`bg-white dark:bg-zinc-900 rounded-xl border ${badge.border} p-4 ${badge.glow} transition-all duration-300`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-full ${badge.bg} flex items-center justify-center text-sm font-bold ${badge.text} shrink-0`}>
                        {item.rank <= 3 ? badge.emoji : item.rank}
                    </div>
                    <img src={getUserImage(item.user)} className="w-9 h-9 rounded-full bg-gray-200 dark:bg-zinc-700 object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = "https://telegram.org/img/t_logo.png"; }} alt="" />
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{getUserName(item.user)}</h4>
                    </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-1">
                    <StatPill icon={Palette} value={item.mockups_returned} label="Mockups" color="green" />
                    <StatPill icon={RefreshCw} value={item.modifications_returned} label="Mods" color="blue" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <StatPill icon={Clock} value={item.avg_response_time_hours != null ? `${item.avg_response_time_hours}h` : "N/A"} label="Avg Response" color="purple" />
                    <StatPill icon={Clock} value={item.avg_modification_time_hours != null ? `${item.avg_modification_time_hours}h` : "N/A"} label="Avg Mod" color="amber" />
                </div>
                <ScoreBar score={item.score} maxScore={maxScore} />
            </div>
        );
    };

    const renderAssemblyCard = (item: any, maxScore: number) => {
        const badge = getRankBadge(item.rank);
        return (
            <div key={item.user.id} className={`bg-white dark:bg-zinc-900 rounded-xl border ${badge.border} p-4 ${badge.glow} transition-all duration-300`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-full ${badge.bg} flex items-center justify-center text-sm font-bold ${badge.text} shrink-0`}>
                        {item.rank <= 3 ? badge.emoji : item.rank}
                    </div>
                    <img src={getUserImage(item.user)} className="w-9 h-9 rounded-full bg-gray-200 dark:bg-zinc-700 object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = "https://telegram.org/img/t_logo.png"; }} alt="" />
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{getUserName(item.user)}</h4>
                    </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-1">
                    <StatPill icon={Wrench} value={item.orders_assembled} label="Assembled" color="green" />
                    <StatPill icon={Truck} value={item.orders_delivered} label="Delivered" color="blue" />
                    <StatPill icon={AlertTriangle} value={item.additional_releases} label="Extra Rel." color="red" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <StatPill icon={Clock} value={item.avg_assembly_duration_hours != null ? `${item.avg_assembly_duration_hours}h` : "N/A"} label="Avg Asm" color="purple" />
                    <StatPill icon={Clock} value={item.avg_delivery_duration_hours != null ? `${item.avg_delivery_duration_hours}h` : "N/A"} label="Avg Del" color="amber" />
                </div>
                <ScoreBar score={item.score} maxScore={maxScore} />
            </div>
        );
    };

    const renderCncCard = (item: any, maxScore: number) => {
        const badge = getRankBadge(item.rank);
        return (
            <div key={item.user.id} className={`bg-white dark:bg-zinc-900 rounded-xl border ${badge.border} p-4 ${badge.glow} transition-all duration-300`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-full ${badge.bg} flex items-center justify-center text-sm font-bold ${badge.text} shrink-0`}>
                        {item.rank <= 3 ? badge.emoji : item.rank}
                    </div>
                    <img src={getUserImage(item.user)} className="w-9 h-9 rounded-full bg-gray-200 dark:bg-zinc-700 object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = "https://telegram.org/img/t_logo.png"; }} alt="" />
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{getUserName(item.user)}</h4>
                    </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <StatPill icon={Scissors} value={item.files_completed} label="Completed" color="green" />
                    <StatPill icon={Clock} value={item.avg_duration_hours != null ? `${item.avg_duration_hours}h` : "N/A"} label="Avg Duration" color="purple" />
                </div>
                <ScoreBar score={item.score} maxScore={maxScore} />
            </div>
        );
    };

    const renderTabContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Loading performance data...</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm text-center">
                    {error}
                </div>
            );
        }
        if (!data) return null;

        const items = data[activeTab] || [];
        const maxScore = getMaxScore(items);

        if (items.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
                    <Users size={40} className="mb-3 opacity-50" />
                    <p className="text-sm">No team members found for this role</p>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {items.map((item: any) => {
                    switch (activeTab) {
                        case "sales": return renderSalesCard(item, maxScore);
                        case "designers": return renderDesignerCard(item, maxScore);
                        case "assembly": return renderAssemblyCard(item, maxScore);
                        case "cnc": return renderCncCard(item, maxScore);
                    }
                })}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className={`fixed top-0 right-0 bottom-0 w-full max-w-md bg-gray-50 dark:bg-slate-950 z-[101] flex flex-col transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Trophy size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 dark:text-white">Team Performance</h2>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">Rankings & Metrics</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Date Filter */}
                <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 py-3 shrink-0">
                    <div className="flex flex-wrap gap-1.5">
                        {(Object.keys(PRESET_LABELS) as PresetType[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => handlePresetChange(p)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${preset === p
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                                    }`}
                            >
                                {p === "custom" && <Calendar size={10} className="inline mr-1" />}
                                {PRESET_LABELS[p]}
                            </button>
                        ))}
                    </div>

                    {/* Custom Date Range Picker */}
                    {showDatePicker && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700">
                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 block">From</label>
                                    <input
                                        type="date"
                                        value={customFrom}
                                        onChange={(e) => setCustomFrom(e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 block">To</label>
                                    <input
                                        type="date"
                                        value={customTo}
                                        onChange={(e) => setCustomTo(e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleCustomApply}
                                    disabled={!customFrom || !customTo}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Active Range Label */}
                    {data && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                            <Calendar size={10} />
                            <span>{data.date_from} → {data.date_to}</span>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-2 shrink-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const count = data?.[tab.id]?.length || 0;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${isActive
                                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                    }`}
                            >
                                <Icon size={14} />
                                {tab.label}
                                {count > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isActive ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400"}`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "none" }}>
                    {renderTabContent()}
                </div>

                {/* Refresh Footer */}
                <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 shrink-0">
                    <button
                        onClick={() => fetchPerformance()}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        Refresh Data
                    </button>
                </div>
            </div>
        </>
    );
};

export default PerformanceDashboard;
