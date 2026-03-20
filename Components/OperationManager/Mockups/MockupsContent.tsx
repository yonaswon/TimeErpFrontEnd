"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Clock, Play, CheckCircle, Send,
    Palette, User, Calendar,
    Loader2, RefreshCw, Image as ImageIcon,
    FileText, Timer, X, DollarSign, Ruler, MessageSquare,
    GitBranch, ArrowRight,
} from "lucide-react";
import api from "@/api";
import MessageButton from "@/Components/SalesApp/Home/DetailLead/Message/MessageButton";

// ─── Types ───
interface Designer {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    telegram_user_name: string;
}

interface ReferenceImage {
    id: number;
    image: string;
}

interface Modification {
    id: number;
    request_status: string;
    note: string | null;
    price: number | null;
    price_with_vat: boolean;
    mockup_image: string | null;
    reference_images: ReferenceImage[];
    width: string | null;
    height: string | null;
    started_date: string | null;
    requested_date: string;
    response_date: string | null;
    mockup: number;
    lead: number;
    prev_modification: number | null;
    is_edit: boolean;
}

interface MockupItem {
    id: number;
    designer: Designer;
    request_status: string;
    name: string | null;
    ordered_by: string;
    lead_name: string;
    note: string | null;
    price: number | null;
    price_with_vat: boolean;
    mockup_image: string | null;
    reference_images: ReferenceImage[];
    width: string | null;
    height: string | null;
    requested_date: string;
    first_response_date: string | null;
    date: string;
    lead: number;
    modifications: Modification[];
}

// Unified feed item
interface FeedItem {
    type: "mockup" | "modification";
    id: number;
    status: string;
    requested_date: string;
    response_date: string | null;
    mockup_image: string | null;
    note: string | null;
    price: number | null;
    width: string | null;
    height: string | null;
    lead: number;
    designerName: string;
    designerImg: string;
    orderedBy: string;
    leadName: string;
    parentLabel: string;
    mockupData?: MockupItem;
    modData?: Modification;
    parentMockup?: MockupItem;
}

type StatusFilter = "ALL" | "SENT" | "STARTED" | "RETURNED";
type DatePreset = "today" | "yesterday" | "this_week" | "this_month" | "all" | "custom";

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "this_week", label: "This Week" },
    { id: "this_month", label: "This Month" },
    { id: "all", label: "All Time" },
    { id: "custom", label: "Custom" },
];

// ─── Helpers ───
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

function durationBetween(s: string | null, e: string | null): string {
    if (!s || !e) return "N/A";
    const diff = new Date(e).getTime() - new Date(s).getTime();
    if (diff < 0) return "N/A";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const rm = mins % 60;
    if (hrs < 24) return rm > 0 ? `${hrs}h ${rm}m` : `${hrs}h`;
    const days = Math.floor(hrs / 24);
    const rh = hrs % 24;
    return rh > 0 ? `${days}d ${rh}h` : `${days}d`;
}

function isInDateRange(dateStr: string, preset: DatePreset, cf: string, ct: string): boolean {
    if (preset === "all") return true;
    const dateOnly = dateStr.split("T")[0];
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    switch (preset) {
        case "today": return dateOnly === todayStr;
        case "yesterday": {
            const y = new Date(today); y.setDate(y.getDate() - 1);
            return dateOnly === y.toISOString().split("T")[0];
        }
        case "this_week": {
            const s = new Date(today); s.setDate(s.getDate() - s.getDay() + 1);
            return dateOnly >= s.toISOString().split("T")[0] && dateOnly <= todayStr;
        }
        case "this_month": {
            return dateOnly >= new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0] && dateOnly <= todayStr;
        }
        case "custom":
            if (!cf || !ct) return true;
            return dateOnly >= cf && dateOnly <= ct;
        default: return true;
    }
}

function getStatusStyle(status: string) {
    switch (status) {
        case "SENT": return { label: "Waiting", bg: "bg-[#F59E0B]/10", text: "text-[#F59E0B]", dot: "bg-[#F59E0B]", border: "border-[#F59E0B]/20", icon: Send };
        case "STARTED": return { label: "In Progress", bg: "bg-[#2563EB]/10", text: "text-[#2563EB] dark:text-[#3B82F6]", dot: "bg-[#2563EB] dark:bg-[#3B82F6]", border: "border-[#2563EB]/20 dark:border-[#3B82F6]/20", icon: Play };
        case "RETURNED": return { label: "Returned", bg: "bg-[#16A34A]/10", text: "text-[#16A34A] dark:text-[#22C55E]", dot: "bg-[#16A34A] dark:bg-[#22C55E]", border: "border-[#16A34A]/20 dark:border-[#22C55E]/20", icon: CheckCircle };
        default: return { label: status, bg: "bg-[#6B7280]/10", text: "text-[#6B7280]", dot: "bg-[#6B7280]", border: "border-[#6B7280]/20", icon: Clock };
    }
}

function getDesignerName(d: Designer) {
    if (d.first_name) return `${d.first_name} ${d.last_name || ""}`.trim();
    return d.telegram_user_name || d.username || "Unknown";
}

function getDesignerImg(d: Designer) {
    const u = d.telegram_user_name || d.username;
    return u ? `https://t.me/i/userpic/160/${u}.jpg` : "https://telegram.org/img/t_logo.png";
}

// ─── Component ───
const MockupsContent = () => {
    const [mockups, setMockups] = useState<MockupItem[]>([]);
    const [modsByMockup, setModsByMockup] = useState<Record<number, Modification[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [datePreset, setDatePreset] = useState<DatePreset>("all");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch all mockups
            const mockupRes = await api.get("/lead/mockups/", { params: { ordering: "-requested_date" } });
            const mockupData: MockupItem[] = mockupRes.data.results || mockupRes.data;
            setMockups(mockupData);

            // 2. Fetch modifications for EACH mockup separately (like GraphicsTeamApp)
            const modsMap: Record<number, Modification[]> = {};
            await Promise.all(
                mockupData.map(async (m) => {
                    try {
                        const modRes = await api.get(`/lead/modifications/`, {
                            params: { mockup: m.id, ordering: "requested_date" }
                        });
                        const mods = modRes.data.results || modRes.data;
                        if (mods.length > 0) modsMap[m.id] = mods;
                    } catch { /* ignore individual failures */ }
                })
            );
            setModsByMockup(modsMap);
        } catch (err: any) {
            setError(err.message || "Failed to load");
        } finally {
            setLoading(false);
        }
    };

    const handleDatePreset = (p: DatePreset) => {
        setDatePreset(p);
        setShowCustomPicker(p === "custom");
    };

    // Build unified feed: mockups + modifications as separate items
    const allFeed = useMemo<FeedItem[]>(() => {
        const items: FeedItem[] = [];
        for (const m of mockups) {
            const dName = getDesignerName(m.designer);
            const dImg = getDesignerImg(m.designer);

            // Mockup item
            items.push({
                type: "mockup", id: m.id, status: m.request_status,
                requested_date: m.requested_date, response_date: m.first_response_date,
                mockup_image: m.mockup_image, note: m.note, price: m.price,
                width: m.width, height: m.height, lead: m.lead,
                designerName: dName, designerImg: dImg,
                orderedBy: m.ordered_by, leadName: m.lead_name,
                parentLabel: `MC-${m.id}`, mockupData: m,
            });

            // Modifications (from separate API, or fallback to nested)
            const mods = modsByMockup[m.id] || m.modifications || [];
            for (const mod of mods) {
                items.push({
                    type: "modification", id: mod.id, status: mod.request_status,
                    requested_date: mod.requested_date, response_date: mod.response_date,
                    mockup_image: mod.mockup_image, note: mod.note, price: mod.price,
                    width: mod.width, height: mod.height, lead: mod.lead,
                    designerName: dName, designerImg: dImg,
                    orderedBy: m.ordered_by, leadName: m.lead_name,
                    parentLabel: `MC-${m.id}`,
                    modData: mod, parentMockup: m,
                });
            }
        }
        items.sort((a, b) => new Date(b.requested_date).getTime() - new Date(a.requested_date).getTime());
        return items;
    }, [mockups, modsByMockup]);

    // Apply date + status filters on frontend
    const filteredFeed = useMemo(() => {
        return allFeed.filter(item => {
            if (!isInDateRange(item.requested_date, datePreset, customFrom, customTo)) return false;
            if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
            return true;
        });
    }, [allFeed, datePreset, customFrom, customTo, statusFilter]);

    // Counts (filtered by date, before status filter)
    const statusCounts = useMemo(() => {
        const dateFiltered = allFeed.filter(item => isInDateRange(item.requested_date, datePreset, customFrom, customTo));
        const c: Record<string, number> = { ALL: dateFiltered.length, SENT: 0, STARTED: 0, RETURNED: 0 };
        dateFiltered.forEach(f => { if (c[f.status] !== undefined) c[f.status]++; });
        return c;
    }, [allFeed, datePreset, customFrom, customTo]);

    // Latest returned (global)
    const latestReturned = useMemo(() => {
        const returned = allFeed.filter(f => f.status === "RETURNED" && f.response_date);
        if (!returned.length) return null;
        return returned.reduce((best, cur) => new Date(cur.response_date!) > new Date(best.response_date!) ? cur : best);
    }, [allFeed]);

    // ─── Card ───
    const renderCard = (item: FeedItem) => {
        const style = getStatusStyle(item.status);
        const Icon = style.icon;
        const isMod = item.type === "modification";

        const isUrgent = item.status !== "RETURNED";
        const hrsWaiting = (Date.now() - new Date(item.requested_date).getTime()) / 3.6e6;
        const urgencyColor = hrsWaiting > 48 ? "text-[#DC2626]" : hrsWaiting > 24 ? "text-[#F59E0B]" : "text-[#6B7280] dark:text-[#94A3B8]";

        return (
            <div
                key={`${item.type}-${item.id}`}
                onClick={() => setSelectedItem(item)}
                className={`bg-white dark:bg-[#1E293B] rounded-xl border ${style.border} overflow-hidden cursor-pointer active:scale-[0.99] transition-all`}
            >
                <div className={`h-1 ${style.dot}`} />
                <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <img
                                src={item.designerImg}
                                className="w-10 h-10 rounded-full bg-[#E5E7EB] dark:bg-[#334155] object-cover shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).src = "https://telegram.org/img/t_logo.png"; }}
                                alt=""
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    {isMod ? (
                                        <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded tracking-wide flex items-center gap-1">
                                            <GitBranch size={10} /> MOD-{item.id}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold bg-[#E5E7EB] dark:bg-[#334155] text-[#6B7280] dark:text-[#94A3B8] px-1.5 py-0.5 rounded tracking-wide">
                                            MC-{item.id}
                                        </span>
                                    )}
                                    <span className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9] truncate">{item.leadName}</span>
                                </div>
                                <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] truncate">
                                    <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">{item.designerName}</span>
                                    {isMod && <span className="text-purple-600 dark:text-purple-400"> • {item.parentLabel}</span>}
                                </p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${style.bg} ${style.text} shrink-0`}>
                            <Icon size={12} />
                            {style.label}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                        <span className="flex items-center gap-1 text-[#6B7280] dark:text-[#94A3B8]"><User size={12} />{item.orderedBy}</span>
                        {item.price && <span className="font-semibold text-[#111827] dark:text-[#F1F5F9]">ETB {Number(item.price).toLocaleString()}</span>}
                    </div>

                    {/* Time */}
                    <div className="flex items-center justify-between mb-2">
                        <div className={`flex items-center gap-1 text-xs ${isUrgent ? urgencyColor : "text-[#16A34A] dark:text-[#22C55E]"}`}>
                            <Timer size={13} />
                            {item.status === "RETURNED" ? (
                                <span>Returned in <strong>{durationBetween(item.requested_date, item.response_date)}</strong></span>
                            ) : (
                                <span>Requested <strong>{timeSince(item.requested_date)}</strong></span>
                            )}
                        </div>
                        <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">
                            {new Date(item.requested_date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                    </div>

                    {/* Returned image */}
                    {item.status === "RETURNED" && item.mockup_image && (
                        <div className="mb-2">
                            <img src={item.mockup_image} className="w-full max-h-28 object-contain rounded-lg bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155]" alt="" />
                        </div>
                    )}

                    {/* Note */}
                    {item.note && (
                        <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] line-clamp-2 mb-2">
                            <FileText size={11} className="inline mr-1 opacity-50" />{item.note}
                        </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                        <MessageButton
                            mockupId={isMod ? undefined : item.id}
                            mockupModificationId={isMod ? item.id : undefined}
                            leadId={item.lead}
                        />
                        <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">Tap for details</span>
                    </div>
                </div>
            </div>
        );
    };

    // ─── Detail Overlay ───
    const renderDetail = () => {
        if (!selectedItem) return null;
        const item = selectedItem;
        const isMod = item.type === "modification";
        const style = getStatusStyle(item.status);
        const refImages = isMod ? (item.modData?.reference_images || []) : (item.mockupData?.reference_images || []);

        // For mockup detail: get its modifications from the separate fetch
        const mods = isMod ? [] : (modsByMockup[item.id] || item.mockupData?.modifications || []);

        return (
            <div className="fixed inset-0 z-50 flex justify-end">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
                <div className="relative w-full max-w-md h-full bg-[#F9FAFB] dark:bg-[#0F172A] shadow-2xl overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#334155] p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    {isMod ? (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 flex items-center gap-1">
                                            <GitBranch size={10} /> MOD-{item.id}
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E5E7EB] dark:bg-[#334155] text-[#6B7280] dark:text-[#94A3B8]">
                                            MC-{item.id}
                                        </span>
                                    )}
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${style.bg} ${style.text}`}>
                                        {style.label}
                                    </span>
                                </div>
                                <h2 className="text-lg font-bold text-[#111827] dark:text-[#F1F5F9]">{item.leadName}</h2>
                                {isMod && (
                                    <p className="text-sm text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-0.5">
                                        <GitBranch size={12} /> Modification of {item.parentLabel}
                                    </p>
                                )}
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-[#E5E7EB] dark:hover:bg-[#334155] rounded-full transition-colors">
                                <X size={20} className="text-[#6B7280]" />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Info Grid */}
                        <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] divide-y divide-[#E5E7EB] dark:divide-[#334155]">
                            <div className="p-3 flex justify-between items-center text-sm">
                                <span className="flex items-center gap-2 text-[#6B7280] dark:text-[#94A3B8]"><Palette size={14} /> Designer</span>
                                <div className="flex items-center gap-2">
                                    <img src={item.designerImg} className="w-6 h-6 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://telegram.org/img/t_logo.png"; }} alt="" />
                                    <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">{item.designerName}</span>
                                </div>
                            </div>
                            <div className="p-3 flex justify-between items-center text-sm">
                                <span className="flex items-center gap-2 text-[#6B7280] dark:text-[#94A3B8]"><User size={14} /> Requested by</span>
                                <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">{item.orderedBy}</span>
                            </div>
                            <div className="p-3 flex justify-between items-center text-sm">
                                <span className="flex items-center gap-2 text-[#6B7280] dark:text-[#94A3B8]"><Calendar size={14} /> Requested</span>
                                <div className="text-right">
                                    <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">
                                        {new Date(item.requested_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </span>
                                    <span className="text-xs text-[#6B7280] dark:text-[#94A3B8] ml-1">({timeSince(item.requested_date)})</span>
                                </div>
                            </div>
                            {item.response_date && (
                                <div className="p-3 flex justify-between items-center text-sm">
                                    <span className="flex items-center gap-2 text-[#16A34A] dark:text-[#22C55E]"><CheckCircle size={14} /> Returned</span>
                                    <div className="text-right">
                                        <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">
                                            {new Date(item.response_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </span>
                                        <span className="text-xs text-[#16A34A] dark:text-[#22C55E] ml-1">
                                            ({durationBetween(item.requested_date, item.response_date)} turnaround)
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div className="p-3 flex justify-between items-center text-sm">
                                <span className="flex items-center gap-2 text-[#6B7280] dark:text-[#94A3B8]"><DollarSign size={14} /> Price</span>
                                <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">{item.price ? `ETB ${Number(item.price).toLocaleString()}` : "--"}</span>
                            </div>
                            <div className="p-3 flex justify-between items-center text-sm">
                                <span className="flex items-center gap-2 text-[#6B7280] dark:text-[#94A3B8]"><Ruler size={14} /> Dimensions</span>
                                <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">{item.width && item.height ? `${item.width}" × ${item.height}"` : "--"}</span>
                            </div>
                        </div>

                        {/* Urgency Alert */}
                        {item.status !== "RETURNED" && (
                            <div className={`p-3 rounded-xl border ${item.status === "SENT" ? "bg-[#F59E0B]/5 border-[#F59E0B]/20" : "bg-[#2563EB]/5 border-[#2563EB]/20"}`}>
                                <div className="flex items-center gap-2 text-sm">
                                    <Timer size={16} className={item.status === "SENT" ? "text-[#F59E0B]" : "text-[#2563EB] dark:text-[#3B82F6]"} />
                                    <span className={`font-semibold ${item.status === "SENT" ? "text-[#F59E0B]" : "text-[#2563EB] dark:text-[#3B82F6]"}`}>
                                        {item.status === "SENT" ? "Waiting" : "In progress"} for {durationBetween(item.requested_date, new Date().toISOString())}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {item.note && (
                            <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-xl p-3">
                                <h3 className="text-xs font-bold text-[#F59E0B] mb-1 flex items-center gap-1.5 uppercase tracking-wide">
                                    <MessageSquare size={12} /> Notes
                                </h3>
                                <p className="text-sm text-[#111827] dark:text-[#F1F5F9] leading-relaxed whitespace-pre-wrap">{item.note}</p>
                            </div>
                        )}

                        {/* Result Image */}
                        {item.mockup_image && (
                            <div>
                                <h3 className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9] mb-2 flex items-center gap-2">
                                    <CheckCircle size={16} className="text-[#16A34A]" />
                                    {isMod ? "Modification Result" : "Mockup Design"}
                                </h3>
                                <a href={item.mockup_image} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-[#334155]">
                                    <img src={item.mockup_image} className="w-full object-contain max-h-64 bg-white dark:bg-[#1E293B]" alt="" />
                                </a>
                            </div>
                        )}

                        {/* Reference Images */}
                        {refImages.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9] mb-2 flex items-center gap-2">
                                    <ImageIcon size={16} /> Reference Images ({refImages.length})
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {refImages.map(img => (
                                        <a key={img.id} href={img.image} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden border border-[#E5E7EB] dark:border-[#334155]">
                                            <img src={img.image} className="w-full h-full object-cover" alt="" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Modifications Timeline (only for mockup detail) */}
                        {!isMod && mods.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9] mb-3 flex items-center gap-2">
                                    <GitBranch size={16} className="text-purple-500" /> Modifications ({mods.length})
                                </h3>
                                <div className="space-y-2">
                                    {mods.map(mod => {
                                        const ms = getStatusStyle(mod.request_status);
                                        const MIcon = ms.icon;
                                        return (
                                            <div key={mod.id} className={`bg-white dark:bg-[#1E293B] rounded-lg border ${ms.border} p-3`}>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                            <GitBranch size={9} /> MOD-{mod.id}
                                                        </span>
                                                        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${ms.bg} ${ms.text}`}>
                                                            <MIcon size={10} /> {ms.label}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">
                                                        {new Date(mod.requested_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-[#6B7280] dark:text-[#94A3B8] flex items-center gap-1 mb-1">
                                                    <Timer size={11} />
                                                    {mod.request_status === "RETURNED"
                                                        ? <span>Returned in <strong>{durationBetween(mod.requested_date, mod.response_date)}</strong></span>
                                                        : <span>Requested {timeSince(mod.requested_date)}</span>
                                                    }
                                                </div>
                                                {mod.mockup_image && (
                                                    <a href={mod.mockup_image} target="_blank" rel="noopener noreferrer">
                                                        <img src={mod.mockup_image} className="w-full max-h-24 object-contain rounded mt-1 bg-[#F9FAFB] dark:bg-[#0F172A]" alt="" />
                                                    </a>
                                                )}
                                                {mod.note && <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1 line-clamp-2">{mod.note}</p>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Message */}
                        <div onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2 p-3 bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155]">
                                <MessageButton
                                    mockupId={isMod ? undefined : item.id}
                                    mockupModificationId={isMod ? item.id : undefined}
                                    leadId={item.lead}
                                />
                                <span className="text-sm text-[#6B7280] dark:text-[#94A3B8]">Send a message</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ─── Main ───
    return (
        <div className="min-h-screen pb-4">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-[#F9FAFB] dark:bg-[#0F172A]">
                <div className="px-4 pt-4 pb-3">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center">
                                <Palette size={18} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9]">Mockup Manager</h1>
                                <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">{filteredFeed.length} items</p>
                            </div>
                        </div>
                        <button onClick={fetchAll} disabled={loading} className="p-2 text-[#6B7280] hover:text-[#2563EB] dark:hover:text-[#3B82F6] hover:bg-[#E5E7EB] dark:hover:bg-[#334155] rounded-lg transition-colors">
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>

                    {/* Date Filters */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {DATE_PRESETS.map(p => (
                            <button key={p.id} onClick={() => handleDatePreset(p.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${datePreset === p.id
                                    ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white shadow-md"
                                    : "bg-white dark:bg-[#1E293B] text-[#6B7280] dark:text-[#94A3B8] border border-[#E5E7EB] dark:border-[#334155]"
                                    }`}>
                                {p.id === "custom" && <Calendar size={10} className="inline mr-1" />}{p.label}
                            </button>
                        ))}
                    </div>

                    {showCustomPicker && (
                        <div className="p-3 bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] mb-2">
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
                                <button onClick={() => { if (customFrom && customTo) setShowCustomPicker(false); }} disabled={!customFrom || !customTo}
                                    className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold disabled:opacity-40">Apply</button>
                            </div>
                        </div>
                    )}

                    {/* Status Tabs */}
                    <div className="flex bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] overflow-hidden">
                        {([
                            { id: "ALL" as StatusFilter, label: "All" },
                            { id: "SENT" as StatusFilter, label: "Waiting" },
                            { id: "STARTED" as StatusFilter, label: "Active" },
                            { id: "RETURNED" as StatusFilter, label: "Done" },
                        ]).map(tab => {
                            const isActive = statusFilter === tab.id;
                            const count = statusCounts[tab.id] || 0;
                            return (
                                <button key={tab.id} onClick={() => setStatusFilter(tab.id)}
                                    className={`flex-1 py-2.5 text-center text-xs font-semibold transition-all relative ${isActive
                                        ? "text-[#2563EB] dark:text-[#3B82F6] bg-[#2563EB]/5 dark:bg-[#3B82F6]/10"
                                        : "text-[#6B7280] dark:text-[#94A3B8]"
                                        }`}>
                                    {tab.label}
                                    {count > 0 && (
                                        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isActive ? "bg-[#2563EB]/10 text-[#2563EB] dark:text-[#3B82F6]" : "bg-[#E5E7EB] dark:bg-[#334155] text-[#6B7280]"}`}>{count}</span>
                                    )}
                                    {isActive && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#2563EB] dark:bg-[#3B82F6] rounded-full" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Latest Returned */}
            {latestReturned && (
                <div className="mx-4 mt-3 p-4 bg-gradient-to-r from-[#16A34A] to-[#15803D] dark:from-[#22C55E]/90 dark:to-[#16A34A]/90 rounded-2xl shadow-lg text-white cursor-pointer" onClick={() => setSelectedItem(latestReturned)}>
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">Latest Returned</span>
                    </div>
                    <div className="flex gap-3">
                        {latestReturned.mockup_image && <img src={latestReturned.mockup_image} className="w-14 h-14 rounded-lg object-cover border-2 border-white/30 shrink-0" alt="" />}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate">
                                {latestReturned.type === "modification" ? `MOD-${latestReturned.id}` : `MC-${latestReturned.id}`}
                                <span className="font-normal opacity-80"> • {latestReturned.leadName}</span>
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                    <Timer size={11} /> {durationBetween(latestReturned.requested_date, latestReturned.response_date)}
                                </span>
                                <span className="text-[10px] opacity-70">{timeSince(latestReturned.response_date)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Feed */}
            <div className="px-4 mt-3 space-y-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-[#2563EB]" size={32} />
                        <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-3">Loading...</p>
                    </div>
                ) : error ? (
                    <div className="p-4 bg-[#DC2626]/10 rounded-xl text-[#DC2626] text-sm text-center">{error}</div>
                ) : filteredFeed.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-[#6B7280]">
                        <Palette size={40} className="mb-3 opacity-50" />
                        <p className="text-sm">No items found</p>
                        <p className="text-xs opacity-70 mt-1">Try a different filter</p>
                    </div>
                ) : (
                    filteredFeed.map(item => renderCard(item))
                )}
            </div>

            {renderDetail()}
        </div>
    );
};

export default MockupsContent;
