import { useState } from "react";
import {
    X,
    User,
    Phone,
    Calendar,
    AlertCircle,
    Clock,
    Wrench,
    Image as ImageIcon,
    DollarSign,
    CreditCard,
    ShieldCheck,
    Send,
    CheckCircle,
    XCircle,
    Edit3,
    Save,
    Loader2,
    Hash,
    FileText,
    RefreshCw,
} from "lucide-react";
import api from "@/api";

interface MaintenanceDetailProps {
    maintenance: any;
    onClose: () => void;
    onUpdate?: () => void;
}

const MaintenanceDetail = ({
    maintenance,
    onClose,
    onUpdate,
}: MaintenanceDetailProps) => {
    // Edit overlay state
    const [showEditOverlay, setShowEditOverlay] = useState(false);
    const [savingDetails, setSavingDetails] = useState(false);

    // Resend states
    const [sendingOrder, setSendingOrder] = useState(false);
    const [sendingFinance, setSendingFinance] = useState(false);

    // Edit form data
    const [detailsForm, setDetailsForm] = useState({
        client_name: maintenance.client_name || "",
        client_contact: maintenance.client_contact || "",
        reported_issue: maintenance.reported_issue || "",
        under_warranty: maintenance.under_warranty || false,
    });

    // Feedback
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "D":
                return "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20";
            case "S":
                return "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20";
            case "A":
                return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20";
            default:
                return "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20";
        }
    };

    const getStatusText = (status: string) => {
        const map: Record<string, string> = { NA: "Not Assigned", A: "Assigned", S: "In Progress", D: "Completed" };
        return map[status] || status;
    };

    const getPaymentStatusText = (status: string) => {
        const map: Record<string, string> = { P: "Pending", C: "Confirmed", R: "Rejected" };
        return map[status] || status;
    };

    const getPaymentMethodText = (method: string) => {
        const map: Record<string, string> = { BANK: "Bank Transfer", CASH: "Cash", CHECK: "Check" };
        return map[method] || method;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString("en-US", {
            year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
        });
    };

    const formatCurrency = (amount: string | number) => {
        if (!amount) return "N/A";
        const num = typeof amount === "string" ? parseFloat(amount) : amount;
        return new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB", minimumFractionDigits: 0 }).format(num);
    };

    const showFeedback = (type: "success" | "error", message: string) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback(null), 4000);
    };

    // Save details
    const handleSaveDetails = async () => {
        setSavingDetails(true);
        try {
            await api.patch(`/api/maintenance/${maintenance.id}/`, detailsForm);
            showFeedback("success", "Details updated successfully");
            setShowEditOverlay(false);
            onUpdate?.();
        } catch (err: any) {
            showFeedback("error", err.response?.data?.error || "Failed to update");
        } finally {
            setSavingDetails(false);
        }
    };

    // Resend notifications
    const handleResendOrder = async () => {
        setSendingOrder(true);
        try {
            await api.post(`/api/maintenance/${maintenance.id}/resend_order_notification/`);
            showFeedback("success", "Order notification queued");
            onUpdate?.();
        } catch (err: any) {
            showFeedback("error", err.response?.data?.error || "Failed to send");
        } finally {
            setSendingOrder(false);
        }
    };

    const handleResendFinance = async () => {
        setSendingFinance(true);
        try {
            await api.post(`/api/maintenance/${maintenance.id}/resend_finance_notification/`);
            showFeedback("success", "Finance notification queued");
            onUpdate?.();
        } catch (err: any) {
            showFeedback("error", err.response?.data?.error || "Failed to send");
        } finally {
            setSendingFinance(false);
        }
    };

    const payment = maintenance.payment;

    return (
        <>
            {/* Main Detail Modal */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
                <div
                    className="bg-[#F9FAFB] dark:bg-[#0F172A] w-full h-[95vh] sm:h-[90vh] sm:max-w-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden"
                    style={{ borderRadius: "12px 12px 0 0" }}
                >
                    {/* Header */}
                    <div className="shrink-0 px-4 py-4 border-b border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h2 className="text-[22px] font-bold text-[#111827] dark:text-[#F1F5F9] leading-[1.2] truncate">
                                    {maintenance.client_name || "Maintenance"}
                                </h2>
                                <span className={`px-2 py-0.5 text-[11px] font-bold rounded-lg border ${getStatusColor(maintenance.status)}`}>
                                    {getStatusText(maintenance.status)}
                                </span>
                            </div>
                            <p className="text-[14px] text-[#6B7280] dark:text-[#94A3B8]">
                                {formatDate(maintenance.created_at)}
                                {maintenance.posted_by && (
                                    <> · by <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">{maintenance.posted_by.first_name} {maintenance.posted_by.last_name || ""}</span></>
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => setShowEditOverlay(true)}
                                className="p-2 text-[#2563EB] dark:text-[#3B82F6] hover:bg-[#2563EB]/10 rounded-lg transition-colors"
                                style={{ minHeight: 44, minWidth: 44 }}
                            >
                                <Edit3 size={20} />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#E5E7EB] dark:hover:bg-[#334155] rounded-lg transition-colors"
                                style={{ minHeight: 44, minWidth: 44 }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Feedback */}
                    {feedback && (
                        <div className={`px-4 py-3 text-[14px] font-medium ${feedback.type === "success"
                                ? "bg-[#16A34A]/10 text-[#16A34A]"
                                : "bg-[#DC2626]/10 text-[#DC2626]"
                            }`}>
                            {feedback.message}
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-4 py-4" style={{ WebkitOverflowScrolling: "touch" }}>
                        <div className="space-y-8">

                            {/* Client Info */}
                            <section>
                                <h3 className="text-[14px] font-bold text-[#111827] dark:text-[#F1F5F9] uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <User size={16} className="text-[#2563EB] dark:text-[#3B82F6]" />
                                    Client
                                </h3>
                                <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                                            <User size={20} className="text-[#2563EB]" />
                                        </div>
                                        <div>
                                            <p className="text-[16px] font-semibold text-[#111827] dark:text-[#F1F5F9]">
                                                {maintenance.client_name || "N/A"}
                                            </p>
                                            <p className="text-[14px] text-[#6B7280] dark:text-[#94A3B8] flex items-center gap-1">
                                                <Phone size={14} />
                                                {maintenance.client_contact || "No contact"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Reported Issue */}
                            <section>
                                <h3 className="text-[14px] font-bold text-[#111827] dark:text-[#F1F5F9] uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <AlertCircle size={16} className="text-[#F59E0B]" />
                                    Reported Issue
                                </h3>
                                <div className="bg-[#F59E0B]/5 dark:bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl p-4">
                                    <p className="text-[16px] text-[#111827] dark:text-[#F1F5F9] whitespace-pre-wrap leading-[1.5]">
                                        {maintenance.reported_issue || "No issue description provided."}
                                    </p>
                                </div>
                            </section>

                            {/* Warranty */}
                            {maintenance.under_warranty && (
                                <div className="bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center gap-3">
                                    <ShieldCheck size={24} className="text-purple-600 dark:text-purple-400 shrink-0" />
                                    <div>
                                        <p className="text-[16px] font-bold text-purple-800 dark:text-purple-300">Under Warranty</p>
                                        <p className="text-[14px] text-purple-600 dark:text-purple-400">Covered under warranty.</p>
                                    </div>
                                </div>
                            )}

                            {/* Order Reference */}
                            {(maintenance.order || maintenance.old_order_code) && (
                                <section>
                                    <h3 className="text-[14px] font-bold text-[#111827] dark:text-[#F1F5F9] uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Hash size={16} className="text-[#2563EB] dark:text-[#3B82F6]" />
                                        Order Reference
                                    </h3>
                                    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] p-4">
                                        {maintenance.order ? (
                                            <div>
                                                <p className="text-[14px] text-[#6B7280] dark:text-[#94A3B8]">Related Order</p>
                                                <p className="text-[18px] font-bold text-[#111827] dark:text-[#F1F5F9]">ORD-{maintenance.order.order_code}</p>
                                                {maintenance.order.order_name && (
                                                    <p className="text-[14px] text-[#6B7280] dark:text-[#94A3B8]">{maintenance.order.order_name}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-[14px] text-[#6B7280] dark:text-[#94A3B8]">Old Order Code</p>
                                                <p className="text-[18px] font-bold text-[#111827] dark:text-[#F1F5F9]">{maintenance.old_order_code}</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Assignment */}
                            <section>
                                <h3 className="text-[14px] font-bold text-[#111827] dark:text-[#F1F5F9] uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Clock size={16} className="text-[#2563EB] dark:text-[#3B82F6]" />
                                    Assignment
                                </h3>
                                <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] p-4 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#6B7280]/10 flex items-center justify-center shrink-0">
                                            <User size={20} className="text-[#6B7280]" />
                                        </div>
                                        <div>
                                            <p className="text-[14px] text-[#6B7280] dark:text-[#94A3B8]">Assigned To</p>
                                            <p className="text-[16px] font-semibold text-[#111827] dark:text-[#F1F5F9]">
                                                {maintenance.assigned_to
                                                    ? `${maintenance.assigned_to.first_name} ${maintenance.assigned_to.last_name || ""}`
                                                    : "Unassigned"}
                                            </p>
                                        </div>
                                    </div>
                                    {(maintenance.scheduled_start_date || maintenance.scheduled_end_date) && (
                                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#E5E7EB] dark:border-[#334155]">
                                            <div>
                                                <p className="text-[12px] text-[#6B7280] dark:text-[#94A3B8] uppercase font-medium">Start</p>
                                                <p className="text-[14px] font-medium text-[#111827] dark:text-[#F1F5F9]">{formatDate(maintenance.scheduled_start_date)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[12px] text-[#6B7280] dark:text-[#94A3B8] uppercase font-medium">End</p>
                                                <p className="text-[14px] font-medium text-[#111827] dark:text-[#F1F5F9]">{formatDate(maintenance.scheduled_end_date)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Attached Image */}
                            {maintenance.image && (
                                <section>
                                    <h3 className="text-[14px] font-bold text-[#111827] dark:text-[#F1F5F9] uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <ImageIcon size={16} className="text-[#2563EB] dark:text-[#3B82F6]" />
                                        Image
                                    </h3>
                                    <div className="rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-[#334155]">
                                        <img
                                            src={maintenance.image}
                                            alt="Maintenance"
                                            className="w-full h-48 object-cover cursor-pointer"
                                            onClick={() => window.open(maintenance.image, "_blank")}
                                        />
                                    </div>
                                </section>
                            )}

                            {/* Payment Info (read-only) */}
                            <section>
                                <h3 className="text-[14px] font-bold text-[#111827] dark:text-[#F1F5F9] uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <DollarSign size={16} className="text-[#2563EB] dark:text-[#3B82F6]" />
                                    Payment
                                </h3>
                                {payment ? (
                                    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] overflow-hidden">
                                        <div className="p-4 grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[12px] text-[#6B7280] dark:text-[#94A3B8] uppercase font-medium">Amount</p>
                                                <p className="text-[18px] font-bold text-[#111827] dark:text-[#F1F5F9]">{formatCurrency(payment.amount)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[12px] text-[#6B7280] dark:text-[#94A3B8] uppercase font-medium">Method</p>
                                                <p className="text-[14px] font-semibold text-[#111827] dark:text-[#F1F5F9]">{getPaymentMethodText(payment.method)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[12px] text-[#6B7280] dark:text-[#94A3B8] uppercase font-medium">Status</p>
                                                <span className={`inline-block px-2 py-0.5 text-[12px] font-bold rounded-lg ${payment.status === "C"
                                                        ? "bg-[#16A34A]/10 text-[#16A34A]"
                                                        : payment.status === "R"
                                                            ? "bg-[#DC2626]/10 text-[#DC2626]"
                                                            : "bg-[#F59E0B]/10 text-[#F59E0B]"
                                                    }`}>
                                                    {getPaymentStatusText(payment.status)}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-[12px] text-[#6B7280] dark:text-[#94A3B8] uppercase font-medium">Invoice</p>
                                                <p className="text-[14px] font-semibold text-[#111827] dark:text-[#F1F5F9]">{payment.invoice ? "Yes" : "No"}</p>
                                            </div>
                                            {payment.transaction_id && (
                                                <div className="col-span-2">
                                                    <p className="text-[12px] text-[#6B7280] dark:text-[#94A3B8] uppercase font-medium">Transaction ID</p>
                                                    <p className="text-[14px] font-mono font-semibold text-[#111827] dark:text-[#F1F5F9]">{payment.transaction_id}</p>
                                                </div>
                                            )}
                                            {payment.note && (
                                                <div className="col-span-2">
                                                    <p className="text-[12px] text-[#6B7280] dark:text-[#94A3B8] uppercase font-medium">Note</p>
                                                    <p className="text-[14px] text-[#111827] dark:text-[#F1F5F9]">{payment.note}</p>
                                                </div>
                                            )}
                                        </div>
                                        {(payment.confirmation_image || payment.invoice_image) && (
                                            <div className="border-t border-[#E5E7EB] dark:border-[#334155] p-4">
                                                <p className="text-[12px] text-[#6B7280] uppercase font-medium mb-2">Images</p>
                                                <div className="flex gap-3 flex-wrap">
                                                    {payment.confirmation_image && (
                                                        <img src={payment.confirmation_image} alt="Confirmation" className="w-16 h-16 object-cover rounded-lg border border-[#E5E7EB] dark:border-[#334155] cursor-pointer" onClick={() => window.open(payment.confirmation_image, "_blank")} />
                                                    )}
                                                    {payment.invoice_image && (
                                                        <img src={payment.invoice_image} alt="Invoice" className="w-16 h-16 object-cover rounded-lg border border-[#E5E7EB] dark:border-[#334155] cursor-pointer" onClick={() => window.open(payment.invoice_image, "_blank")} />
                                                    )}
                                                    {payment.additional_image && (
                                                        <img src={payment.additional_image} alt="Additional" className="w-16 h-16 object-cover rounded-lg border border-[#E5E7EB] dark:border-[#334155] cursor-pointer" onClick={() => window.open(payment.additional_image, "_blank")} />
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] p-4 text-center">
                                        <CreditCard size={24} className="mx-auto text-[#6B7280] mb-2" />
                                        <p className="text-[14px] text-[#6B7280] dark:text-[#94A3B8]">
                                            {maintenance.under_warranty ? "Covered under warranty" : "Payment after maintenance"}
                                        </p>
                                    </div>
                                )}
                            </section>

                            {/* Telegram Notifications */}
                            <section>
                                <h3 className="text-[14px] font-bold text-[#111827] dark:text-[#F1F5F9] uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Send size={16} className="text-[#2563EB] dark:text-[#3B82F6]" />
                                    Notifications
                                </h3>
                                <div className="space-y-3">
                                    {/* Order Group */}
                                    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {maintenance.order_group_message_id ? (
                                                <CheckCircle size={20} className="text-[#16A34A] shrink-0" />
                                            ) : (
                                                <XCircle size={20} className="text-[#DC2626] shrink-0" />
                                            )}
                                            <div>
                                                <p className="text-[16px] font-medium text-[#111827] dark:text-[#F1F5F9]">Order Group</p>
                                                <p className="text-[14px] text-[#6B7280] dark:text-[#94A3B8]">
                                                    {maintenance.order_group_message_id ? "Sent" : "Not sent"}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleResendOrder}
                                            disabled={sendingOrder}
                                            className={`flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium rounded-lg disabled:opacity-50 transition-colors ${maintenance.order_group_message_id
                                                    ? "border border-[#E5E7EB] dark:border-[#334155] text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#E5E7EB]/50 dark:hover:bg-[#334155]/50"
                                                    : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                                                }`}
                                            style={{ minHeight: 44, borderRadius: 8 }}
                                        >
                                            {sendingOrder ? <Loader2 size={16} className="animate-spin" /> : maintenance.order_group_message_id ? <RefreshCw size={16} /> : <Send size={16} />}
                                            {maintenance.order_group_message_id ? "Resend" : "Send"}
                                        </button>
                                    </div>

                                    {/* Finance Group */}
                                    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {maintenance.finance_group_message_id ? (
                                                <CheckCircle size={20} className="text-[#16A34A] shrink-0" />
                                            ) : (
                                                <XCircle size={20} className="text-[#DC2626] shrink-0" />
                                            )}
                                            <div>
                                                <p className="text-[16px] font-medium text-[#111827] dark:text-[#F1F5F9]">Finance Group</p>
                                                <p className="text-[14px] text-[#6B7280] dark:text-[#94A3B8]">
                                                    {maintenance.finance_group_message_id
                                                        ? "Sent"
                                                        : payment ? "Not sent" : "No payment"}
                                                </p>
                                            </div>
                                        </div>
                                        {payment && (
                                            <button
                                                onClick={handleResendFinance}
                                                disabled={sendingFinance}
                                                className={`flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium rounded-lg disabled:opacity-50 transition-colors ${maintenance.finance_group_message_id
                                                        ? "border border-[#E5E7EB] dark:border-[#334155] text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#E5E7EB]/50 dark:hover:bg-[#334155]/50"
                                                        : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                                                    }`}
                                                style={{ minHeight: 44, borderRadius: 8 }}
                                            >
                                                {sendingFinance ? <Loader2 size={16} className="animate-spin" /> : maintenance.finance_group_message_id ? <RefreshCw size={16} /> : <Send size={16} />}
                                                {maintenance.finance_group_message_id ? "Resend" : "Send"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Recorded By */}
                            {maintenance.posted_by && (
                                <section>
                                    <h3 className="text-[14px] font-bold text-[#111827] dark:text-[#F1F5F9] uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <FileText size={16} className="text-[#2563EB] dark:text-[#3B82F6]" />
                                        Recorded By
                                    </h3>
                                    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                                            <User size={20} className="text-[#2563EB]" />
                                        </div>
                                        <div>
                                            <p className="text-[16px] font-semibold text-[#111827] dark:text-[#F1F5F9]">
                                                {maintenance.posted_by.first_name} {maintenance.posted_by.last_name || ""}
                                            </p>
                                            <p className="text-[14px] text-[#6B7280] dark:text-[#94A3B8]">
                                                @{maintenance.posted_by.username}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Details Overlay */}
            {showEditOverlay && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60]">
                    <div
                        className="bg-[#F9FAFB] dark:bg-[#0F172A] w-full sm:max-w-md sm:rounded-xl shadow-2xl flex flex-col overflow-hidden"
                        style={{ maxHeight: "85vh", borderRadius: "12px 12px 0 0" }}
                    >
                        {/* Edit Header */}
                        <div className="shrink-0 px-4 py-4 border-b border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] flex items-center justify-between">
                            <h3 className="text-[18px] font-bold text-[#111827] dark:text-[#F1F5F9]">Edit Details</h3>
                            <button
                                onClick={() => setShowEditOverlay(false)}
                                className="p-2 text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#E5E7EB] dark:hover:bg-[#334155] rounded-lg"
                                style={{ minHeight: 44, minWidth: 44 }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Edit Form */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ WebkitOverflowScrolling: "touch" }}>
                            <div>
                                <label className="block text-[14px] font-medium text-[#111827] dark:text-[#F1F5F9] mb-2">Client Name</label>
                                <input
                                    type="text"
                                    value={detailsForm.client_name}
                                    onChange={(e) => setDetailsForm(prev => ({ ...prev, client_name: e.target.value }))}
                                    className="w-full px-4 py-3 text-[16px] border border-[#E5E7EB] dark:border-[#334155] rounded-lg bg-white dark:bg-[#1E293B] text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                                    style={{ height: 44, borderRadius: 8 }}
                                />
                            </div>
                            <div>
                                <label className="block text-[14px] font-medium text-[#111827] dark:text-[#F1F5F9] mb-2">Contact</label>
                                <input
                                    type="text"
                                    value={detailsForm.client_contact}
                                    onChange={(e) => setDetailsForm(prev => ({ ...prev, client_contact: e.target.value }))}
                                    className="w-full px-4 py-3 text-[16px] border border-[#E5E7EB] dark:border-[#334155] rounded-lg bg-white dark:bg-[#1E293B] text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                                    style={{ height: 44, borderRadius: 8 }}
                                />
                            </div>
                            <div>
                                <label className="block text-[14px] font-medium text-[#111827] dark:text-[#F1F5F9] mb-2">Reported Issue</label>
                                <textarea
                                    value={detailsForm.reported_issue}
                                    onChange={(e) => setDetailsForm(prev => ({ ...prev, reported_issue: e.target.value }))}
                                    rows={5}
                                    className="w-full px-4 py-3 text-[16px] border border-[#E5E7EB] dark:border-[#334155] rounded-lg bg-white dark:bg-[#1E293B] text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
                                    style={{ borderRadius: 8 }}
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-3 cursor-pointer p-3 bg-white dark:bg-[#1E293B] rounded-lg border border-[#E5E7EB] dark:border-[#334155]" style={{ minHeight: 44 }}>
                                    <input
                                        type="checkbox"
                                        checked={detailsForm.under_warranty}
                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, under_warranty: e.target.checked }))}
                                        className="w-5 h-5 rounded border-[#E5E7EB] text-[#2563EB] focus:ring-[#2563EB]"
                                    />
                                    <span className="text-[16px] text-[#111827] dark:text-[#F1F5F9]">Under Warranty</span>
                                </label>
                            </div>
                        </div>

                        {/* Edit Footer */}
                        <div className="shrink-0 px-4 py-4 border-t border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] flex gap-3">
                            <button
                                onClick={() => setShowEditOverlay(false)}
                                className="flex-1 px-4 py-3 border border-[#E5E7EB] dark:border-[#334155] text-[#6B7280] dark:text-[#94A3B8] text-[16px] font-medium rounded-lg hover:bg-[#E5E7EB]/50 dark:hover:bg-[#334155]/50 transition-colors"
                                style={{ minHeight: 44, borderRadius: 8 }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveDetails}
                                disabled={savingDetails}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[16px] font-medium rounded-lg disabled:opacity-50 transition-colors"
                                style={{ minHeight: 44, borderRadius: 8 }}
                            >
                                {savingDetails ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MaintenanceDetail;
