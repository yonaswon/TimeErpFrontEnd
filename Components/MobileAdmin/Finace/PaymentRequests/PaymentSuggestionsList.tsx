import { useState, useEffect } from "react";
import { Loader2, CheckCircle, XCircle, ChevronRight, AlertTriangle, FileEdit, User, Calendar } from "lucide-react";
import api from "@/api";

type SuggestionStatus = "P" | "C" | "R";

export const PaymentSuggestionsList = () => {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<SuggestionStatus>("P");

    const [processingId, setProcessingId] = useState<number | null>(null);

    const fetchSuggestions = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/finance/payment-edit-suggestion/?status=${statusFilter}`);
            setSuggestions(response.data.results || response.data);
        } catch (err) {
            setError("Failed to fetch suggestions");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, [statusFilter]);

    const handleAction = async (id: number, action: "confirm" | "reject") => {
        try {
            setProcessingId(id);
            await api.post(`/finance/payment-edit-suggestion/${id}/${action}/`);
            setSuggestions(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            alert("Failed to " + action);
        } finally {
            setProcessingId(null);
        }
    };

    const getFilterClass = (filter: SuggestionStatus) => {
        if (statusFilter === filter) {
            return "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-emerald-600 text-white shadow-md shadow-emerald-500/25";
        }
        return "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-gray-50 text-gray-500 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-400 dark:hover:bg-zinc-700";
    };

    const renderChanges = (suggestion: any) => {
        if (suggestion.edit_type === "CONTAINER") {
            return (
                <div className="text-sm mt-3 space-y-2 bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg">
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Container Pricing Update</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <span className="text-gray-500">Full:</span> {suggestion.suggested_full_payment}
                        </div>
                        <div>
                            <span className="text-gray-500">Adv:</span> {suggestion.suggested_advance_payment}
                        </div>
                        <div>
                            <span className="text-gray-500">Rem:</span> {suggestion.suggested_remaining_payment}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="text-sm mt-3 space-y-2 bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg">
                <p className="font-semibold text-gray-700 dark:text-gray-300">
                    {suggestion.edit_type === "PAYMENT_ADD" ? "New Payment" : "Edit Payment"}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-500">Amt:</span> {suggestion.suggested_amount} Birr</div>
                    <div><span className="text-gray-500">Method:</span> {suggestion.suggested_method}</div>
                    {suggestion.suggested_method === "BANK" && suggestion.suggested_transaction_id && (
                        <div><span className="text-gray-500">Trans. ID:</span> {suggestion.suggested_transaction_id}</div>
                    )}
                    <div><span className="text-gray-500">Reason:</span> {suggestion.suggested_reason}</div>
                    {suggestion.suggested_confirmation_image && (
                        <div>
                            <a href={suggestion.suggested_confirmation_image} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">View Receipt</a>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4 px-2 pb-20">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Suggested Edits</h3>
                </div>
                <div className="flex space-x-2 overflow-x-auto scrollbar-hide py-1">
                    <button onClick={() => setStatusFilter("P")} className={getFilterClass("P")}>Queued</button>
                    <button onClick={() => setStatusFilter("C")} className={getFilterClass("C")}>Confirmed</button>
                    <button onClick={() => setStatusFilter("R")} className={getFilterClass("R")}>Rejected</button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>
            ) : suggestions.length === 0 ? (
                <div className="text-center py-16 text-gray-500 py-16">
                    <FileEdit className="mx-auto h-12 w-12 text-gray-300 dark:text-zinc-600 mb-2" />
                    <p>No {statusFilter === "P" ? "queued" : statusFilter === "C" ? "confirmed" : "rejected"} edits.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {suggestions.map((s) => (
                        <div key={s.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <FileEdit size={16} className="text-emerald-500" />
                                        {s.order_container?.client || "Container"}
                                    </p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                        <User size={12} /> {s.suggested_by?.telegram_user_name || "Sales Rep"}
                                        <span className="mx-1">•</span>
                                        <Calendar size={12} /> {new Date(s.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-bold rounded-lg ${s.status === "P" ? "bg-amber-100 text-amber-700" : s.status === "C" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                    {s.status === "P" ? "PENDING" : s.status === "C" ? "CONFIRMED" : "REJECTED"}
                                </span>
                            </div>

                            {renderChanges(s)}

                            {s.status === "P" && (
                                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                                    <button
                                        onClick={() => handleAction(s.id, "reject")}
                                        disabled={processingId === s.id}
                                        className="flex-1 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm transition-colors flex items-center justify-center gap-1"
                                    >
                                        <XCircle size={16} /> Reject
                                    </button>
                                    <button
                                        onClick={() => handleAction(s.id, "confirm")}
                                        disabled={processingId === s.id}
                                        className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-1"
                                    >
                                        {processingId === s.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                        Confirm
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default PaymentSuggestionsList;
