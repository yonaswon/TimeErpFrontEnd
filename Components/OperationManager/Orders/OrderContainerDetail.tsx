"use client";

import { useState, useEffect } from "react";
import {
    X, User, Phone, MapPin, Calendar, FileText, CreditCard,
    CheckCircle, XCircle, Package, Truck, DollarSign, Clock,
    AlertCircle, Layers, Timer, ChevronDown, ChevronUp,
    Wrench, Settings, ArrowRight,
} from "lucide-react";
import api from "@/api";

interface OrderContainerDetailProps {
    container: any;
    onClose: () => void;
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

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function daysSince(dateStr: string): number {
    return (Date.now() - new Date(dateStr).getTime()) / 86400000;
}

function getOrderStatusStyle(status: string) {
    if (!status) return { bg: "bg-[#6B7280]/10", text: "text-[#6B7280]", label: "Unknown" };
    if (status.includes("REM-CONFIRMED")) return { bg: "bg-[#16A34A]/10", text: "text-[#16A34A] dark:text-[#22C55E]", label: "Rem Confirmed" };
    if (status.includes("REM-ACCEPTED")) return { bg: "bg-[#16A34A]/10", text: "text-[#16A34A] dark:text-[#22C55E]", label: "Rem Accepted" };
    if (status.includes("DANDI")) return { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", label: "D&I Started" };
    if (status.includes("ASSEMBLY-COMPLETED")) return { bg: "bg-[#2563EB]/10", text: "text-[#2563EB] dark:text-[#3B82F6]", label: "Assembly Done" };
    if (status.includes("ASSEMBLY-STARTED")) return { bg: "bg-[#2563EB]/10", text: "text-[#2563EB] dark:text-[#3B82F6]", label: "Assembly" };
    if (status.includes("CNC-COMPLETED")) return { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400", label: "CNC Done" };
    if (status.includes("CNC-STARTED")) return { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400", label: "CNC" };
    if (status.includes("PRE-CONFIRMED")) return { bg: "bg-[#F59E0B]/10", text: "text-[#F59E0B]", label: "Pre Confirmed" };
    if (status.includes("PRE-ACCEPTED")) return { bg: "bg-[#F59E0B]/10", text: "text-[#F59E0B]", label: "Pre Accepted" };
    return { bg: "bg-[#6B7280]/10", text: "text-[#6B7280]", label: status.replace(/-/g, " ") };
}

function getPaymentStatusIcon(status: string) {
    switch (status) {
        case "C": return <CheckCircle size={16} className="text-[#16A34A]" />;
        case "R": return <XCircle size={16} className="text-[#DC2626]" />;
        default: return <Clock size={16} className="text-[#F59E0B]" />;
    }
}

function getPaymentStatusLabel(status: string) {
    switch (status) { case "C": return "Confirmed"; case "R": return "Rejected"; default: return "Pending"; }
}

function getReasonLabel(reason: string) {
    const map: Record<string, string> = { PRE: "Advance", REM: "Remaining", FULL: "Full", SALES: "Sales", MAINTENANCE: "Maintenance" };
    return map[reason] || reason;
}

// Status pipeline for timeline
const STATUS_PIPELINE = [
    { key: "PRE-ACCEPTED", label: "Pre Accepted", icon: DollarSign },
    { key: "PRE-CONFIRMED", label: "Pre Confirmed", icon: CheckCircle },
    { key: "CNC-STARTED", label: "CNC Started", icon: Settings },
    { key: "CNC-COMPLETED", label: "CNC Done", icon: CheckCircle },
    { key: "ASSEMBLY-STARTED", label: "Assembly", icon: Wrench },
    { key: "ASSEMBLY-COMPLETED", label: "Assembly Done", icon: CheckCircle },
    { key: "DANDI-STARTED", label: "D&I", icon: Truck },
    { key: "REM-ACCEPTED", label: "Rem Accepted", icon: DollarSign },
    { key: "REM-CONFIRMED", label: "Rem Confirmed", icon: CheckCircle },
];

const OrderContainerDetail = ({ container, onClose }: OrderContainerDetailProps) => {
    const [payments, setPayments] = useState<any[]>([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

    useEffect(() => { fetchPayments(); }, [container.id]);

    const fetchPayments = async () => {
        setPaymentsLoading(true);
        try {
            const res = await api.get(`/finance/payment/?order_container=${container.id}`);
            setPayments(res.data.results || res.data);
        } catch { }
        setPaymentsLoading(false);
    };

    const orders = container.orders || [];
    const totalPaid = payments.filter(p => p.status === "C").reduce((s: number, p: any) => s + parseFloat(p.amount || 0), 0);
    const fullPayment = parseFloat(container.full_payment || 0);
    const advancePayment = parseFloat(container.advance_payment || 0);
    const remainingPayment = parseFloat(container.remaining_payment || 0);
    const paymentProgress = fullPayment > 0 ? Math.min(100, (totalPaid / fullPayment) * 100) : 0;

    // Overall status: highest status among orders
    const overallStatus = orders.length > 0
        ? orders.reduce((best: string, o: any) => {
            const bIdx = STATUS_PIPELINE.findIndex(s => s.key === best);
            const oIdx = STATUS_PIPELINE.findIndex(s => s.key === o.order_status);
            return oIdx > bIdx ? o.order_status : best;
        }, orders[0].order_status)
        : "UNKNOWN";

    const isDelayed = container.delivery_date && new Date(container.delivery_date) < new Date() && !["REM-ACCEPTED", "REM-CONFIRMED"].includes(overallStatus);
    const days = container.created_at ? daysSince(container.created_at) : 0;

    const toggleOrder = (code: number) => {
        setExpandedOrders(prev => {
            const n = new Set(prev);
            n.has(code) ? n.delete(code) : n.add(code);
            return n;
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md h-full bg-[#F9FAFB] dark:bg-[#0F172A] shadow-2xl overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#334155] p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E5E7EB] dark:bg-[#334155] text-[#6B7280] dark:text-[#94A3B8]">
                                    #{container.id}
                                </span>
                                {isDelayed && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DC2626]/10 text-[#DC2626] flex items-center gap-1">
                                        <AlertCircle size={10} /> DELAYED
                                    </span>
                                )}
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getOrderStatusStyle(overallStatus).bg} ${getOrderStatusStyle(overallStatus).text}`}>
                                    {getOrderStatusStyle(overallStatus).label}
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-[#111827] dark:text-[#F1F5F9]">{container.client}</h2>
                            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                                {orders.length} order{orders.length !== 1 ? "s" : ""} • Created {timeSince(container.created_at)}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-[#E5E7EB] dark:hover:bg-[#334155] rounded-full transition-colors">
                            <X size={20} className="text-[#6B7280]" />
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-4 pb-32">
                    {/* Financial Summary */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] p-4">
                        <h3 className="text-xs font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <DollarSign size={12} /> Financial Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="p-2.5 rounded-lg bg-[#2563EB]/5 border border-[#2563EB]/10">
                                <p className="text-[10px] font-semibold text-[#2563EB] dark:text-[#3B82F6] uppercase">Full Payment</p>
                                <p className="text-lg font-bold text-[#111827] dark:text-[#F1F5F9]">{formatCurrency(fullPayment)}</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#F59E0B]/5 border border-[#F59E0B]/10">
                                <p className="text-[10px] font-semibold text-[#F59E0B] uppercase">Advance</p>
                                <p className="text-lg font-bold text-[#111827] dark:text-[#F1F5F9]">{formatCurrency(advancePayment)}</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#DC2626]/5 border border-[#DC2626]/10">
                                <p className="text-[10px] font-semibold text-[#DC2626] uppercase">Remaining</p>
                                <p className="text-lg font-bold text-[#111827] dark:text-[#F1F5F9]">{formatCurrency(remainingPayment)}</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#16A34A]/5 border border-[#16A34A]/10">
                                <p className="text-[10px] font-semibold text-[#16A34A] dark:text-[#22C55E] uppercase">Paid</p>
                                <p className="text-lg font-bold text-[#111827] dark:text-[#F1F5F9]">{formatCurrency(totalPaid)}</p>
                            </div>
                        </div>
                        {/* Progress bar */}
                        <div className="relative h-2 bg-[#E5E7EB] dark:bg-[#334155] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#2563EB] to-[#16A34A] rounded-full transition-all" style={{ width: `${paymentProgress}%` }} />
                        </div>
                        <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] text-right mt-1">{paymentProgress.toFixed(0)}% paid</p>
                    </div>

                    {/* Client Info */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] divide-y divide-[#E5E7EB] dark:divide-[#334155]">
                        <div className="p-3 flex justify-between items-center text-sm">
                            <span className="flex items-center gap-2 text-[#6B7280] dark:text-[#94A3B8]"><User size={14} /> Client</span>
                            <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">{container.client}</span>
                        </div>
                        <div className="p-3 flex justify-between items-center text-sm">
                            <span className="flex items-center gap-2 text-[#6B7280] dark:text-[#94A3B8]"><Phone size={14} /> Contact</span>
                            <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">{container.contact || "N/A"}</span>
                        </div>
                        <div className="p-3 flex justify-between items-center text-sm">
                            <span className="flex items-center gap-2 text-[#6B7280] dark:text-[#94A3B8]"><MapPin size={14} /> Location</span>
                            <span className="font-medium text-[#111827] dark:text-[#F1F5F9] text-right max-w-[60%]">{container.location || "N/A"}</span>
                        </div>
                        <div className="p-3 flex justify-between items-center text-sm">
                            <span className="flex items-center gap-2 text-[#6B7280] dark:text-[#94A3B8]"><Calendar size={14} /> Delivery</span>
                            <span className={`font-medium ${isDelayed ? "text-[#DC2626]" : "text-[#111827] dark:text-[#F1F5F9]"}`}>
                                {container.delivery_date ? new Date(container.delivery_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                            </span>
                        </div>
                        <div className="p-3 flex justify-between items-center text-sm">
                            <span className="flex items-center gap-2 text-[#6B7280] dark:text-[#94A3B8]"><Calendar size={14} /> Created</span>
                            <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">{formatDate(container.created_at)}</span>
                        </div>
                        <div className="p-3 flex justify-between items-center text-sm">
                            <span className="flex items-center gap-2 text-[#6B7280] dark:text-[#94A3B8]"><FileText size={14} /> Invoice</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${container.invoice ? "bg-[#2563EB]/10 text-[#2563EB]" : "bg-[#6B7280]/10 text-[#6B7280]"}`}>
                                {container.invoice ? "Required" : "None"}
                            </span>
                        </div>
                        <div className="p-3 flex justify-between items-center text-sm">
                            <span className="flex items-center gap-2 text-[#6B7280] dark:text-[#94A3B8]"><Settings size={14} /> Difficulty</span>
                            <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">{container.order_difficulty || "N/A"}</span>
                        </div>
                        <div className="p-3 flex justify-between items-center text-sm">
                            <span className="flex items-center gap-2 text-[#6B7280] dark:text-[#94A3B8]"><User size={14} /> Posted by</span>
                            <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">
                                {container.posted_by?.first_name ? `${container.posted_by.first_name} ${container.posted_by.last_name || ""}`.trim() : container.posted_by?.username || "N/A"}
                            </span>
                        </div>
                    </div>

                    {/* Delay/Urgency Alert */}
                    {isDelayed && (
                        <div className="p-3 rounded-xl bg-[#DC2626]/5 border border-[#DC2626]/20">
                            <div className="flex items-center gap-2 text-sm">
                                <AlertCircle size={16} className="text-[#DC2626]" />
                                <span className="font-semibold text-[#DC2626]">
                                    Delayed — delivery was {timeSince(container.delivery_date)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {(container.special_requerment || container.note) && (
                        <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-xl p-3 space-y-2">
                            {container.special_requerment && (
                                <div>
                                    <p className="text-[10px] font-bold text-[#F59E0B] uppercase">Special Requirement</p>
                                    <p className="text-sm text-[#111827] dark:text-[#F1F5F9] mt-0.5">{container.special_requerment}</p>
                                </div>
                            )}
                            {container.note && (
                                <div>
                                    <p className="text-[10px] font-bold text-[#6B7280] uppercase">Note</p>
                                    <p className="text-sm text-[#111827] dark:text-[#F1F5F9] mt-0.5 italic">"{container.note}"</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Orders List */}
                    <div>
                        <h3 className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9] mb-3 flex items-center gap-2">
                            <Layers size={16} className="text-[#2563EB]" /> Orders ({orders.length})
                        </h3>
                        <div className="space-y-2">
                            {orders.map((order: any) => {
                                const st = getOrderStatusStyle(order.order_status);
                                const isExpanded = expandedOrders.has(order.order_code);
                                const orderDays = order.created_at ? daysSince(order.created_at) : days;
                                const isOrderDone = ["REM-ACCEPTED", "REM-CONFIRMED"].includes(order.order_status);
                                const urgencyColor = isOrderDone ? "text-[#16A34A] dark:text-[#22C55E]" : orderDays > 7 ? "text-[#DC2626]" : orderDays > 3 ? "text-[#F59E0B]" : "text-[#6B7280] dark:text-[#94A3B8]";

                                // Find current position in pipeline
                                const pipelineIdx = STATUS_PIPELINE.findIndex(s => s.key === order.order_status);

                                return (
                                    <div key={order.order_code} className={`bg-white dark:bg-[#1E293B] rounded-lg border ${st.bg.replace("bg-", "border-").replace("/10", "/20")} overflow-hidden`}>
                                        <div className="p-3 cursor-pointer" onClick={() => toggleOrder(order.order_code)}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold font-mono text-[#111827] dark:text-[#F1F5F9]">ORD-{order.order_code}</span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text}`}>{st.label}</span>
                                                    </div>
                                                    {order.order_name && <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] truncate">{order.order_name}</p>}
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9]">{formatCurrency(order.price)}</span>
                                                    {isExpanded ? <ChevronUp size={14} className="text-[#6B7280]" /> : <ChevronDown size={14} className="text-[#6B7280]" />}
                                                </div>
                                            </div>
                                            <div className={`flex items-center gap-1 text-[10px] mt-1 ${urgencyColor}`}>
                                                <Timer size={10} />
                                                {isOrderDone ? "Completed" : <span>Created {Math.floor(orderDays)}d ago</span>}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="border-t border-[#E5E7EB] dark:border-[#334155] p-3 bg-[#F9FAFB] dark:bg-[#0F172A]">
                                                {/* Status Timeline */}
                                                <div className="mb-3">
                                                    <p className="text-[10px] font-bold text-[#6B7280] uppercase mb-2">Progress</p>
                                                    <div className="flex items-center gap-0.5 overflow-x-auto">
                                                        {STATUS_PIPELINE.map((step, i) => {
                                                            const reached = i <= pipelineIdx;
                                                            const isCurrent = i === pipelineIdx;
                                                            const StepIcon = step.icon;
                                                            return (
                                                                <div key={step.key} className="flex items-center">
                                                                    <div className={`flex flex-col items-center ${isCurrent ? "scale-110" : ""}`}>
                                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${reached ? (isCurrent ? "bg-[#2563EB] dark:bg-[#3B82F6]" : "bg-[#16A34A] dark:bg-[#22C55E]") : "bg-[#E5E7EB] dark:bg-[#334155]"}`}>
                                                                            <StepIcon size={10} className={reached ? "text-white" : "text-[#6B7280]"} />
                                                                        </div>
                                                                    </div>
                                                                    {i < STATUS_PIPELINE.length - 1 && (
                                                                        <div className={`w-3 h-0.5 ${reached && i < pipelineIdx ? "bg-[#16A34A]" : "bg-[#E5E7EB] dark:bg-[#334155]"}`} />
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Dates */}
                                                <div className="space-y-1 text-xs">
                                                    {order.pre_accepted_date && <div className="flex justify-between"><span className="text-[#6B7280]">Pre Accepted</span><span className="text-[#111827] dark:text-[#F1F5F9]">{formatDate(order.pre_accepted_date)}</span></div>}
                                                    {order.cnc_started_date && <div className="flex justify-between"><span className="text-[#6B7280]">CNC Started</span><span className="text-[#111827] dark:text-[#F1F5F9]">{formatDate(order.cnc_started_date)}</span></div>}
                                                    {order.assembly_started_date && <div className="flex justify-between"><span className="text-[#6B7280]">Assembly</span><span className="text-[#111827] dark:text-[#F1F5F9]">{formatDate(order.assembly_started_date)}</span></div>}
                                                    {order.dandi_date && <div className="flex justify-between"><span className="text-[#6B7280]">D&I</span><span className="text-[#111827] dark:text-[#F1F5F9]">{formatDate(order.dandi_date)}</span></div>}
                                                    {order.rem_accepted_date && <div className="flex justify-between"><span className="text-[#6B7280]">Rem Accepted</span><span className="text-[#111827] dark:text-[#F1F5F9]">{formatDate(order.rem_accepted_date)}</span></div>}
                                                </div>

                                                {/* BOM info */}
                                                {order.boms?.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-[#E5E7EB] dark:border-[#334155]">
                                                        <p className="text-[10px] font-bold text-[#6B7280] uppercase mb-1">BOM ({order.boms.length})</p>
                                                        {order.boms.map((b: any, i: number) => (
                                                            <p key={i} className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                                                                • {b.material?.name || "Unknown"} {b.width && b.height ? `(${b.width}×${b.height})` : b.amount ? `Qty: ${b.amount}` : ""}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Payments */}
                    <div>
                        <h3 className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9] mb-3 flex items-center gap-2">
                            <CreditCard size={16} className="text-[#2563EB]" /> Payments ({payments.length})
                        </h3>
                        {paymentsLoading ? (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2563EB] mx-auto" />
                            </div>
                        ) : payments.length === 0 ? (
                            <p className="text-xs text-[#6B7280] text-center py-4">No payments recorded</p>
                        ) : (
                            <div className="space-y-2">
                                {payments.map((p: any) => (
                                    <div key={p.id} className="bg-white dark:bg-[#1E293B] rounded-lg border border-[#E5E7EB] dark:border-[#334155] p-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                {getPaymentStatusIcon(p.status)}
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#2563EB]/10 text-[#2563EB] dark:text-[#3B82F6]">
                                                    {getReasonLabel(p.reason)}
                                                </span>
                                                <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">{p.method}</span>
                                            </div>
                                            <span className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9]">{formatCurrency(p.amount)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-[#6B7280] dark:text-[#94A3B8]">
                                            <span>{getPaymentStatusLabel(p.status)} • {p.wallet?.name || "N/A"}</span>
                                            <span>{p.created_at ? new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>
                                        </div>
                                        {p.transaction_id && (
                                            <p className="text-[10px] font-mono text-[#6B7280] mt-1">TXN: {p.transaction_id}</p>
                                        )}
                                        {p.account_name && (
                                            <p className="text-[10px] text-[#6B7280] mt-0.5">Account: {p.account_name}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Document Nos */}
                    {(container.folder_no || container.pad_no || container.receipt_no || container.invoice_no) && (
                        <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] p-3">
                            <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <FileText size={12} /> Documents
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {container.folder_no && <div><span className="text-[#6B7280]">Folder:</span> <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">{container.folder_no}</span></div>}
                                {container.pad_no && <div><span className="text-[#6B7280]">Pad:</span> <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">{container.pad_no}</span></div>}
                                {container.receipt_no && <div><span className="text-[#6B7280]">Receipt:</span> <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">{container.receipt_no}</span></div>}
                                {container.invoice_no && <div><span className="text-[#6B7280]">Invoice:</span> <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">{container.invoice_no}</span></div>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderContainerDetail;
