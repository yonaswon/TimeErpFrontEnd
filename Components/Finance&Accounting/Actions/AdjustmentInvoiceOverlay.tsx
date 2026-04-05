"use client";

import { useState, useEffect, useCallback } from "react";
import {
    X,
    DollarSign,
    FileText,
    AlertCircle,
    Search,
    Check,
    Loader2,
    Image as ImageIcon,
    XCircle,
} from "lucide-react";
import api from "@/api";

/* ── Types ─────────────────────────────────────────── */
interface OrderResult {
    id: number;
    client: string;
    contact: string;
    full_payment: string;
    order_codes: number[];
    order_names: string[];
    invoice: boolean;
    created_at: string | null;
}

interface SalesResult {
    id: number;
    customer_name: string;
    customer_contact: string;
    date: string | null;
}

interface AdjustmentInvoiceOverlayProps {
    open: boolean;
    onClose: () => void;
}

/* ── Toast ─────────────────────────────────────────── */
const Toast = ({
    message,
    type,
    onClose,
}: {
    message: string;
    type: "error" | "success" | "info";
    onClose: () => void;
}) => {
    useEffect(() => {
        const t = setTimeout(onClose, 5000);
        return () => clearTimeout(t);
    }, [onClose]);
    const bg = {
        error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
        success:
            "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
        info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    };
    const txt = {
        error: "text-red-800 dark:text-red-400",
        success: "text-green-800 dark:text-green-400",
        info: "text-blue-800 dark:text-blue-400",
    };
    return (
        <div
            className={`fixed top-4 right-4 p-4 rounded-lg border ${bg[type]} shadow-lg z-[60] max-w-md`}
        >
            <div className="flex items-start">
                <AlertCircle size={20} className={`mt-0.5 mr-3 shrink-0 ${txt[type]}`} />
                <p className={`text-sm font-medium flex-1 ${txt[type]}`}>{message}</p>
                <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

/* ── Searchable M2M Picker ─────────────────────────── */
function SearchablePicker<T extends { id: number }>({
    label,
    placeholder,
    selected,
    onToggle,
    searchFn,
    renderItem,
    renderChip,
}: {
    label: string;
    placeholder: string;
    selected: T[];
    onToggle: (item: T) => void;
    searchFn: (q: string) => Promise<T[]>;
    renderItem: (item: T, isSelected: boolean) => React.ReactNode;
    renderChip: (item: T) => React.ReactNode;
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const doSearch = useCallback(
        async (q: string) => {
            if (!q.trim()) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const r = await searchFn(q);
                setResults(r);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        },
        [searchFn]
    );

    useEffect(() => {
        const timer = setTimeout(() => doSearch(query), 300);
        return () => clearTimeout(timer);
    }, [query, doSearch]);

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {label}
            </label>

            {/* Selected chips */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {selected.map((item) => (
                        <span
                            key={item.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium"
                        >
                            {renderChip(item)}
                            <button onClick={() => onToggle(item)} className="hover:text-red-500">
                                <XCircle size={14} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Search input */}
            <div className="relative">
                <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                {loading && (
                    <Loader2
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-500"
                    />
                )}
            </div>

            {/* Dropdown results */}
            {open && query.trim() && (
                <div className="mt-1 max-h-48 overflow-y-auto border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 shadow-lg">
                    {results.length === 0 && !loading && (
                        <div className="p-3 text-sm text-gray-500 text-center">No results</div>
                    )}
                    {results.map((item) => {
                        const isSel = selected.some((s) => s.id === item.id);
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    onToggle(item);
                                    setOpen(false);
                                    setQuery("");
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition flex items-center gap-2 ${isSel ? "bg-blue-50 dark:bg-blue-900/20" : ""
                                    }`}
                            >
                                {isSel && <Check size={14} className="text-blue-600 shrink-0" />}
                                <div className="flex-1 min-w-0">{renderItem(item, isSel)}</div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ── Main Overlay ──────────────────────────────────── */
const AdjustmentInvoiceOverlay = ({
    open,
    onClose,
}: AdjustmentInvoiceOverlayProps) => {
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{
        message: string;
        type: "error" | "success" | "info";
    } | null>(null);
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState('');
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [additionalImage, setAdditionalImage] = useState<File | null>(null);
    const [selectedOrders, setSelectedOrders] = useState<any[]>([]);
    const [selectedSales, setSelectedSales] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            setAmount("");
            setNote("");
            setInvoiceFile(null);
            setAdditionalImage(null);
            setSelectedOrders([]);
            setSelectedSales([]);
        }
    }, [open]);

    const toggleOrder = (item: OrderResult) => {
        setSelectedOrders((prev) =>
            prev.some((o) => o.id === item.id)
                ? prev.filter((o) => o.id !== item.id)
                : [...prev, item]
        );
    };

    const toggleSales = (item: SalesResult) => {
        setSelectedSales((prev) =>
            prev.some((s) => s.id === item.id)
                ? prev.filter((s) => s.id !== item.id)
                : [...prev, item]
        );
    };

    const searchOrders = async (q: string): Promise<OrderResult[]> => {
        const res = await api.get(
            `/finance/adjustment-invoice/search_orders/?q=${encodeURIComponent(q)}`
        );
        return res.data;
    };

    const searchSales = async (q: string): Promise<SalesResult[]> => {
        const res = await api.get(
            `/finance/adjustment-invoice/search_sales/?q=${encodeURIComponent(q)}`
        );
        return res.data;
    };

    const handleSubmit = async () => {
        if (!amount.trim() || parseFloat(amount) <= 0) {
            setToast({ message: "Please enter a valid amount", type: "error" });
            return;
        }

        try {
            setSubmitting(true);
            const fd = new FormData();
            fd.append("amount", amount);
            if (note.trim()) fd.append("note", note.trim());
            if (invoiceFile) {
                fd.append('invoice', invoiceFile);
            }
            if (additionalImage) {
                fd.append('additional_image', additionalImage);
            }

            selectedOrders.forEach(o => fd.append('order_container', o.id.toString()));
            selectedSales.forEach((s) => fd.append("sales_recored", s.id.toString()));

            const res = await api.post("/finance/adjustment-invoice/", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.status === 201) {
                setToast({
                    message: "Adjustment invoice created successfully!",
                    type: "success",
                });
                setTimeout(onClose, 1500);
            }
        } catch (err: any) {
            const msg =
                err.response?.data?.error ||
                err.response?.data?.detail ||
                (typeof err.response?.data === "object"
                    ? Object.values(err.response.data).flat().join(", ")
                    : "Failed to create adjustment invoice");
            setToast({ message: `Error: ${msg}`, type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Record Adjustment Invoice
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        >
                            <X size={20} className="text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-4">
                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Amount (ETB) *
                            </label>
                            <div className="relative">
                                <DollarSign
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        {/* Invoice Image */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Invoice Image
                                </label>
                                <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 dark:border-zinc-600 rounded-lg cursor-pointer hover:border-blue-500 transition text-sm text-gray-600 dark:text-gray-400">
                                    <ImageIcon size={16} />
                                    {invoiceFile ? invoiceFile.name : "Choose file…"}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                                        disabled={submitting}
                                    />
                                </label>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-medium text-gray-500 block mb-1">Additional Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setAdditionalImage(e.target.files?.[0] || null)}
                                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>
                        </div>

                        {/* Order Container Search */}
                        <SearchablePicker<OrderResult>
                            label="Order Containers"
                            placeholder="Search by order code, client name, contact…"
                            selected={selectedOrders}
                            onToggle={toggleOrder}
                            searchFn={searchOrders}
                            renderItem={(item) => (
                                <div>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                        {item.client}
                                    </span>
                                    <span className="ml-2 text-gray-500 text-xs">
                                        #{item.order_codes.join(", #")}
                                    </span>
                                    {item.order_names.length > 0 && (
                                        <span className="ml-1 text-gray-400 text-xs">
                                            ({item.order_names.join(", ")})
                                        </span>
                                    )}
                                </div>
                            )}
                            renderChip={(item) => (
                                <>
                                    {item.client} #{item.order_codes.join(",")}
                                </>
                            )}
                        />

                        {/* Material Sales Search */}
                        <SearchablePicker<SalesResult>
                            label="Material Sales Records"
                            placeholder="Search by sales ID, customer name, contact…"
                            selected={selectedSales}
                            onToggle={toggleSales}
                            searchFn={searchSales}
                            renderItem={(item) => (
                                <div>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                        Sale #{item.id}
                                    </span>
                                    {item.customer_name && (
                                        <span className="ml-2 text-gray-500 text-xs">
                                            {item.customer_name}
                                        </span>
                                    )}
                                    {item.customer_contact && (
                                        <span className="ml-1 text-gray-400 text-xs">
                                            ({item.customer_contact})
                                        </span>
                                    )}
                                </div>
                            )}
                            renderChip={(item) => (
                                <>
                                    Sale #{item.id} {item.customer_name && `- ${item.customer_name}`}
                                </>
                            )}
                        />

                        {/* Note */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Note
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="Add any notes here…"
                                rows={3}
                                disabled={submitting}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-700 p-4">
                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                disabled={submitting}
                                className="flex-1 px-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!amount || submitting}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Creating…</span>
                                    </>
                                ) : (
                                    <>
                                        <FileText size={16} />
                                        <span>Create Invoice</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdjustmentInvoiceOverlay;
