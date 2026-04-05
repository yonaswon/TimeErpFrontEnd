import React, { useState, useEffect, useCallback } from "react";
import api from "@/api";
import { Search, Upload, Settings, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight, Calendar, Filter, ChevronDown, ChevronUp, FileText, Edit3, Save, X, Eye } from "lucide-react";

interface PityPurchase {
    id: number;
    pity_material: {
        id: number;
        name: string;
        description: string;
    };
    price: string;
    amount: number;
    total_price: string;
    date: string;
}

interface WalletTransfer {
    id: number;
    from_wallet: {
        id: number;
        name: string;
    } | null;
    to_wallet: {
        id: number;
        name: string;
    } | null;
    amount: string;
    note: string;
    created_at: string;
}

interface PityCostRecord {
    id: number;
    created_by: {
        id: number;
        first_name: string;
        last_name: string;
        username?: string;
        telegram_user_name?: string;
    } | null;
    category: {
        id: number;
        name: string;
    } | null;
    total_amount: string;
    status: string;
    note: string;
    created_at: string;
}

interface AdjustmentInvoice {
    id: number;
    amount: string;
    invoice: string | null;
    note: string | null;
    recorded_by: {
        id: number;
        first_name: string;
        last_name: string;
        username?: string;
        telegram_user_name?: string;
    } | null;
    order_container: any[];
    sales_recored: any[];
    created_at: string;
    additional_image: string | null;
}

export const FinanceLogs = () => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
        return `${Math.floor(diffInSeconds / 31536000)} years ago`;
    };

    const [activeTab, setActiveTab] = useState<"pity-purchase" | "wallet-transfer" | "pity-cost" | "pity-release" | "adjustment">("pity-cost");

    const [pityPurchases, setPityPurchases] = useState<PityPurchase[]>([]);
    const [walletTransfers, setWalletTransfers] = useState<WalletTransfer[]>([]);
    const [pityCosts, setPityCosts] = useState<PityCostRecord[]>([]);
    const [pityReleases, setPityReleases] = useState<WalletTransfer[]>([]);
    const [adjustments, setAdjustments] = useState<AdjustmentInvoice[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination URLs
    const [nextPityPurchasesUrl, setNextPityPurchasesUrl] = useState<string | null>(null);
    const [nextWalletTransfersUrl, setNextWalletTransfersUrl] = useState<string | null>(null);
    const [nextPityCostsUrl, setNextPityCostsUrl] = useState<string | null>(null);
    const [nextPityReleasesUrl, setNextPityReleasesUrl] = useState<string | null>(null);
    const [nextAdjustmentsUrl, setNextAdjustmentsUrl] = useState<string | null>(null);

    const defaultDate = new Date().toISOString().split('T')[0];

    const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);
    const [materials, setMaterials] = useState<{ id: number, name: string }[]>([]);

    const [pityPurchaseFilters, setPityPurchaseFilters] = useState({ startDate: defaultDate, endDate: defaultDate, materialId: '' });
    const [pityCostFilters, setPityCostFilters] = useState({ startDate: defaultDate, endDate: defaultDate, categoryId: '' });
    const [walletTransferFilters, setWalletTransferFilters] = useState({ startDate: '', endDate: '' });
    const [pityReleaseFilters, setPityReleaseFilters] = useState({ startDate: '', endDate: '' });
    const [adjustmentFilters, setAdjustmentFilters] = useState({ startDate: defaultDate, endDate: defaultDate });

    const [showAdjustmentFilters, setShowAdjustmentFilters] = useState(false);

    // Detail / edit state for adjustment
    const [selectedAdjustment, setSelectedAdjustment] = useState<AdjustmentInvoice | null>(null);
    const [editingAdjustment, setEditingAdjustment] = useState(false);
    const [editAmount, setEditAmount] = useState("");
    const [editNote, setEditNote] = useState("");
    const [editInvoiceFile, setEditInvoiceFile] = useState<File | null>(null);
    const [editAdditionalImage, setEditAdditionalImage] = useState<File | null>(null);

    // Collapsible states
    const [showPityPurchaseFilters, setShowPityPurchaseFilters] = useState(false);
    const [showPityCostFilters, setShowPityCostFilters] = useState(false);
    const [showWalletTransferFilters, setShowWalletTransferFilters] = useState(false);
    const [showPityReleaseFilters, setShowPityReleaseFilters] = useState(false);

    const [pityPurchaseStats, setPityPurchaseStats] = useState({ total_amount: 0, total_records: 0 });
    const [pityCostStats, setPityCostStats] = useState({ total_amount: 0, total_records: 0 });

    useEffect(() => {
        api.get('/finance/pity-cost-record-category/').then(res => setCategories(res.data.results || res.data)).catch(console.error);
        api.get('/finance/pity-material/').then(res => setMaterials(res.data.results || res.data)).catch(console.error);
    }, []);

    const fetchPityPurchases = async (loadMore = false) => {
        try {
            setLoading(true);
            setError(null);
            let url = "/finance/each-pity-material-record/";
            if (loadMore && nextPityPurchasesUrl) {
                url = nextPityPurchasesUrl.replace(api.defaults.baseURL || '', '');
            } else {
                const params = new URLSearchParams();
                if (pityPurchaseFilters.startDate) params.append('date__gte', `${pityPurchaseFilters.startDate}T00:00:00Z`);
                if (pityPurchaseFilters.endDate) params.append('date__lte', `${pityPurchaseFilters.endDate}T23:59:59Z`);
                if (pityPurchaseFilters.materialId) params.append('pity_material', pityPurchaseFilters.materialId);
                url = `${url}?${params.toString()}`;
            }

            const response = await api.get(url);
            const results = response.data.results || response.data;
            if (loadMore) {
                setPityPurchases(prev => [...prev, ...results]);
            } else {
                setPityPurchases(results);
                // Also fetch stats on fresh load
                try {
                    const params = new URLSearchParams();
                    if (pityPurchaseFilters.startDate) params.append('date__gte', `${pityPurchaseFilters.startDate}T00:00:00Z`);
                    if (pityPurchaseFilters.endDate) params.append('date__lte', `${pityPurchaseFilters.endDate}T23:59:59Z`);
                    if (pityPurchaseFilters.materialId) params.append('pity_material', pityPurchaseFilters.materialId);
                    const statsRes = await api.get(`/finance/each-pity-material-record/stats/?${params.toString()}`);
                    setPityPurchaseStats(statsRes.data);
                } catch (statsErr) {
                    console.error("Failed to fetch pity purchase stats", statsErr);
                }
            }
            setNextPityPurchasesUrl(response.data.next || null);
        } catch (err: any) {
            setError(err.message || "Failed to fetch pity purchases");
        } finally {
            setLoading(false);
        }
    };

    const fetchWalletTransfers = async (loadMore = false) => {
        try {
            setLoading(true);
            setError(null);
            let url = "/finance/in-wallet-transaction/?wallet_id=2";
            if (loadMore && nextWalletTransfersUrl) {
                url = nextWalletTransfersUrl.replace(api.defaults.baseURL || '', '');
            } else {
                const params = new URLSearchParams();
                if (walletTransferFilters.startDate) params.append('created_at__gte', `${walletTransferFilters.startDate}T00:00:00Z`);
                if (walletTransferFilters.endDate) params.append('created_at__lte', `${walletTransferFilters.endDate}T23:59:59Z`);
                url = `${url}&${params.toString()}`;
            }

            const response = await api.get(url);
            const results = response.data.results || response.data;
            if (loadMore) {
                setWalletTransfers(prev => [...prev, ...results]);
            } else {
                setWalletTransfers(results);
            }
            setNextWalletTransfersUrl(response.data.next || null);
        } catch (err: any) {
            setError(err.message || "Failed to fetch wallet transfers");
        } finally {
            setLoading(false);
        }
    };

    const fetchPityReleases = async (loadMore = false) => {
        try {
            setLoading(true);
            setError(null);
            let url = "/finance/in-wallet-transaction/?wallet_id=3";
            if (loadMore && nextPityReleasesUrl) {
                url = nextPityReleasesUrl.replace(api.defaults.baseURL || '', '');
            } else {
                const params = new URLSearchParams();
                if (pityReleaseFilters.startDate) params.append('created_at__gte', `${pityReleaseFilters.startDate}T00:00:00Z`);
                if (pityReleaseFilters.endDate) params.append('created_at__lte', `${pityReleaseFilters.endDate}T23:59:59Z`);
                url = `${url}&${params.toString()}`;
            }

            const response = await api.get(url);
            const results = response.data.results || response.data;
            if (loadMore) {
                setPityReleases(prev => [...prev, ...results]);
            } else {
                setPityReleases(results);
            }
            setNextPityReleasesUrl(response.data.next || null);
        } catch (err: any) {
            setError(err.message || "Failed to fetch pity releases");
        } finally {
            setLoading(false);
        }
    };

    const fetchPityCosts = async (loadMore = false) => {
        try {
            setLoading(true);
            setError(null);
            let url = "/finance/pity-cost-record/";
            if (loadMore && nextPityCostsUrl) {
                url = nextPityCostsUrl.replace(api.defaults.baseURL || '', '');
            } else {
                const params = new URLSearchParams();
                if (pityCostFilters.startDate) params.append('created_at__gte', `${pityCostFilters.startDate}T00:00:00Z`);
                if (pityCostFilters.endDate) params.append('created_at__lte', `${pityCostFilters.endDate}T23:59:59Z`);
                if (pityCostFilters.categoryId) params.append('category', pityCostFilters.categoryId);
                url = `${url}?${params.toString()}`;
            }

            const response = await api.get(url);
            const results = response.data.results || response.data;
            if (loadMore) {
                setPityCosts(prev => [...prev, ...results]);
            } else {
                setPityCosts(results);
                // Also fetch stats
                try {
                    const params = new URLSearchParams();
                    if (pityCostFilters.startDate) params.append('created_at__gte', `${pityCostFilters.startDate}T00:00:00Z`);
                    if (pityCostFilters.endDate) params.append('created_at__lte', `${pityCostFilters.endDate}T23:59:59Z`);
                    if (pityCostFilters.categoryId) params.append('category', pityCostFilters.categoryId);
                    const statsRes = await api.get(`/finance/pity-cost-record/stats/?${params.toString()}`);
                    setPityCostStats(statsRes.data);
                } catch (statsErr) {
                    console.error("Failed to fetch pity cost stats", statsErr);
                }
            }
            setNextPityCostsUrl(response.data.next || null);
        } catch (err: any) {
            setError(err.message || "Failed to fetch pity costs");
        } finally {
            setLoading(false);
        }
    };

    const fetchAdjustments = async (loadMore = false) => {
        try {
            setLoading(true);
            setError(null);
            let url = "/finance/adjustment-invoice/";
            if (loadMore && nextAdjustmentsUrl) {
                url = nextAdjustmentsUrl.replace(api.defaults.baseURL || '', '');
            } else {
                const params = new URLSearchParams();
                if (adjustmentFilters.startDate) params.append('created_at__gte', `${adjustmentFilters.startDate}T00:00:00Z`);
                if (adjustmentFilters.endDate) params.append('created_at__lte', `${adjustmentFilters.endDate}T23:59:59Z`);
                url = `${url}?${params.toString()}`;
            }
            const response = await api.get(url);
            const results = response.data.results || response.data;
            if (loadMore) {
                setAdjustments(prev => [...prev, ...results]);
            } else {
                setAdjustments(results);
            }
            setNextAdjustmentsUrl(response.data.next || null);
        } catch (err: any) {
            setError(err.message || "Failed to fetch adjustments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "pity-purchase") {
            fetchPityPurchases();
        } else if (activeTab === "wallet-transfer") {
            fetchWalletTransfers();
        } else if (activeTab === "pity-cost") {
            fetchPityCosts();
        } else if (activeTab === "pity-release") {
            fetchPityReleases();
        } else if (activeTab === "adjustment") {
            fetchAdjustments();
        }
    }, [activeTab, pityPurchaseFilters, pityCostFilters, walletTransferFilters, pityReleaseFilters, adjustmentFilters]);

    const tabs = [
        { id: "pity-cost", label: "Pity Cost", icon: Settings },
        { id: "pity-purchase", label: "Pity Purchase", icon: Search },
        { id: "wallet-transfer", label: "Wallet Transfer", icon: Upload },
        { id: "pity-release", label: "Pity Release", icon: RefreshCw },
        { id: "adjustment", label: "Adjustment", icon: FileText },
    ] as const;

    return (
        <div className="space-y-4">
            {/* Container */}
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Finance Logs
                </h3>

                {/* Tab Selection */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1 hide-scrollbar">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors text-sm font-medium
                  ${isActive
                                        ? "bg-blue-600 text-white dark:bg-blue-500"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-600"
                                    }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Error State */}
                {error && (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md mb-4 text-sm">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {/* List Content */}
                <div className="space-y-4">
                    {activeTab === "pity-purchase" && (
                        <>
                            {/* Pity Purchase Stats & Filters */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-zinc-900/80 dark:to-zinc-800/80 rounded-xl border border-blue-100 dark:border-zinc-700 shadow-sm mb-4 overflow-hidden">
                                <div
                                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-blue-100/30 dark:hover:bg-zinc-800/50 transition-colors"
                                    onClick={() => setShowPityPurchaseFilters(!showPityPurchaseFilters)}
                                >
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            {pityPurchaseStats.total_amount ? parseFloat(pityPurchaseStats.total_amount.toString()).toLocaleString() : '0.00'} ETB
                                            <span className="text-xs font-normal text-gray-500 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-zinc-700">
                                                {pityPurchaseStats.total_records || 0} Records
                                            </span>
                                        </h4>
                                    </div>
                                    <button className="p-2 bg-white dark:bg-zinc-800 rounded-full shadow-sm text-blue-600 dark:text-blue-400 border border-gray-100 dark:border-zinc-700">
                                        {showPityPurchaseFilters ? <ChevronUp size={18} /> : <Filter size={18} />}
                                    </button>
                                </div>

                                {showPityPurchaseFilters && (
                                    <div className="p-4 pt-2 border-t border-blue-200/50 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/30">
                                        <div className="flex flex-col md:flex-row gap-3">
                                            <div className="flex flex-col flex-1">
                                                <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12} /> Start Date</label>
                                                <input type="date" value={pityPurchaseFilters.startDate} onChange={e => setPityPurchaseFilters(prev => ({ ...prev, startDate: e.target.value }))} className="px-3 py-1.5 text-sm rounded bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500" />
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12} /> End Date</label>
                                                <input type="date" value={pityPurchaseFilters.endDate} onChange={e => setPityPurchaseFilters(prev => ({ ...prev, endDate: e.target.value }))} className="px-3 py-1.5 text-sm rounded bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500" />
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Filter size={12} /> Material</label>
                                                <select value={pityPurchaseFilters.materialId} onChange={e => setPityPurchaseFilters(prev => ({ ...prev, materialId: e.target.value }))} className="px-3 py-1.5 text-sm rounded bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500">
                                                    <option value="">All Materials</option>
                                                    {materials.map(m => (
                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                {pityPurchases.map((log) => (
                                    <div key={log.id} className="p-3 border border-gray-100 dark:border-zinc-700 rounded-md bg-gray-50 dark:bg-zinc-900/50">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {log.pity_material?.name || "Unknown Material"}
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                {parseFloat(log.total_price).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex flex-col">
                                                <span>{log.amount} x {parseFloat(log.price).toLocaleString()}</span>
                                            </div>
                                            <span>{formatDate(log.date)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {pityPurchases.length === 0 && !loading && !error && (
                                <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">No pity purchases found.</div>
                            )}
                            {nextPityPurchasesUrl && (
                                <button
                                    onClick={() => fetchPityPurchases(true)}
                                    disabled={loading}
                                    className="w-full py-2 flex justify-center items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition"
                                >
                                    {loading ? <RefreshCw size={16} className="animate-spin" /> : "Load More"}
                                </button>
                            )}
                        </>
                    )}
                    {/* Random Cmment for push  */}
                    {activeTab === "wallet-transfer" && (
                        <>
                            {/* Wallet Transfer Filters */}
                            <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm mb-4 overflow-hidden">
                                <div
                                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                                    onClick={() => setShowWalletTransferFilters(!showWalletTransferFilters)}
                                >
                                    <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Filter size={16} className="text-blue-600 dark:text-blue-400" /> Date Filters
                                    </h4>
                                    <button className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-full text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-zinc-700 shadow-sm">
                                        {showWalletTransferFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                </div>

                                {showWalletTransferFilters && (
                                    <div className="p-4 pt-2 border-t border-gray-100 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/30 w-full flex flex-col md:flex-row gap-3">
                                        <div className="flex flex-col flex-1">
                                            <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12} /> Start Date</label>
                                            <input type="date" value={walletTransferFilters.startDate} onChange={e => setWalletTransferFilters(prev => ({ ...prev, startDate: e.target.value }))} className="px-3 py-1.5 text-sm rounded bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500" />
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12} /> End Date</label>
                                            <input type="date" value={walletTransferFilters.endDate} onChange={e => setWalletTransferFilters(prev => ({ ...prev, endDate: e.target.value }))} className="px-3 py-1.5 text-sm rounded bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            {walletTransfers.map((log) => {
                                const isIncoming = log.to_wallet?.id === 2;
                                return (
                                    <div key={log.id} className="p-3 border border-gray-100 dark:border-zinc-700 rounded-md bg-gray-50 dark:bg-zinc-900/50">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                {isIncoming ? (
                                                    <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                                        <ArrowDownRight size={16} />
                                                    </div>
                                                ) : (
                                                    <div className="p-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                                        <ArrowUpRight size={16} />
                                                    </div>
                                                )}
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {isIncoming ? `From ${log.from_wallet?.name || "Unknown"}` : `To ${log.to_wallet?.name || "Unknown"}`}
                                                </span>
                                            </div>
                                            <span className={`font-semibold ${isIncoming ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-gray-100"}`}>
                                                {isIncoming ? "+" : "-"}{parseFloat(log.amount).toLocaleString()}
                                            </span>
                                        </div>
                                        {log.note && (
                                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-1">
                                                {log.note}
                                            </div>
                                        )}
                                        <div className="flex justify-end text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {formatDate(log.created_at)}
                                        </div>
                                    </div>
                                );
                            })}
                            {walletTransfers.length === 0 && !loading && !error && (
                                <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">No wallet transfers found.</div>
                            )}
                            {nextWalletTransfersUrl && (
                                <button
                                    onClick={() => fetchWalletTransfers(true)}
                                    disabled={loading}
                                    className="w-full py-2 flex justify-center items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition"
                                >
                                    {loading ? <RefreshCw size={16} className="animate-spin" /> : "Load More"}
                                </button>
                            )}
                        </>
                    )}

                    {activeTab === "pity-cost" && (
                        <>
                            {/* Pity Cost Stats & Filters */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-zinc-900/80 dark:to-zinc-800/80 rounded-xl border border-blue-100 dark:border-zinc-700 shadow-sm mb-4 overflow-hidden">
                                <div
                                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-blue-100/30 dark:hover:bg-zinc-800/50 transition-colors"
                                    onClick={() => setShowPityCostFilters(!showPityCostFilters)}
                                >
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            {pityCostStats.total_amount ? parseFloat(pityCostStats.total_amount.toString()).toLocaleString() : '0.00'} ETB
                                            <span className="text-xs font-normal text-gray-500 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-zinc-700">
                                                {pityCostStats.total_records || 0} Records
                                            </span>
                                        </h4>
                                    </div>
                                    <button className="p-2 bg-white dark:bg-zinc-800 rounded-full shadow-sm text-blue-600 dark:text-blue-400 border border-gray-100 dark:border-zinc-700">
                                        {showPityCostFilters ? <ChevronUp size={18} /> : <Filter size={18} />}
                                    </button>
                                </div>

                                {showPityCostFilters && (
                                    <div className="p-4 pt-2 border-t border-blue-200/50 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/30">
                                        <div className="flex flex-col md:flex-row gap-3">
                                            <div className="flex flex-col flex-1">
                                                <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12} /> Start Date</label>
                                                <input type="date" value={pityCostFilters.startDate} onChange={e => setPityCostFilters(prev => ({ ...prev, startDate: e.target.value }))} className="px-3 py-1.5 text-sm rounded bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500" />
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12} /> End Date</label>
                                                <input type="date" value={pityCostFilters.endDate} onChange={e => setPityCostFilters(prev => ({ ...prev, endDate: e.target.value }))} className="px-3 py-1.5 text-sm rounded bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500" />
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Filter size={12} /> Category</label>
                                                <select value={pityCostFilters.categoryId} onChange={e => setPityCostFilters(prev => ({ ...prev, categoryId: e.target.value }))} className="px-3 py-1.5 text-sm rounded bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500">
                                                    <option value="">All Categories</option>
                                                    {categories.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                {pityCosts.map((log) => (
                                    <div key={log.id} className="p-3 border border-gray-100 dark:border-zinc-700 rounded-md bg-gray-50 dark:bg-zinc-900/50">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {log.category?.name || "General"}
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                {parseFloat(log.total_amount).toLocaleString()}
                                            </span>
                                        </div>
                                        {log.note && (
                                            <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                                {log.note}
                                            </div>
                                        )}
                                        <div className="flex justify-between items-end text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            <span>{log.created_by ? `${log.created_by.first_name || ''} ${log.created_by.last_name || ''}`.trim() || log.created_by.username || log.created_by.telegram_user_name || "Unknown User" : "Unknown User"}</span>
                                            <span>{formatDate(log.created_at)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {pityCosts.length === 0 && !loading && !error && (
                                <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">No pity costs found.</div>
                            )}
                            {nextPityCostsUrl && (
                                <button
                                    onClick={() => fetchPityCosts(true)}
                                    disabled={loading}
                                    className="w-full py-2 flex justify-center items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition"
                                >
                                    {loading ? <RefreshCw size={16} className="animate-spin" /> : "Load More"}
                                </button>
                            )}
                        </>
                    )}

                    {activeTab === "pity-release" && (
                        <>
                            {/* Pity Release Filters */}
                            <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm mb-4 overflow-hidden">
                                <div
                                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                                    onClick={() => setShowPityReleaseFilters(!showPityReleaseFilters)}
                                >
                                    <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Filter size={16} className="text-blue-600 dark:text-blue-400" /> Date Filters
                                    </h4>
                                    <button className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-full text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-zinc-700 shadow-sm">
                                        {showPityReleaseFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                </div>

                                {showPityReleaseFilters && (
                                    <div className="p-4 pt-2 border-t border-gray-100 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/30 w-full flex flex-col md:flex-row gap-3">
                                        <div className="flex flex-col flex-1">
                                            <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12} /> Start Date</label>
                                            <input type="date" value={pityReleaseFilters.startDate} onChange={e => setPityReleaseFilters(prev => ({ ...prev, startDate: e.target.value }))} className="px-3 py-1.5 text-sm rounded bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500" />
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12} /> End Date</label>
                                            <input type="date" value={pityReleaseFilters.endDate} onChange={e => setPityReleaseFilters(prev => ({ ...prev, endDate: e.target.value }))} className="px-3 py-1.5 text-sm rounded bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            {pityReleases.map((log) => {
                                const isIncoming = log.to_wallet?.id === 3;
                                return (
                                    <div key={log.id} className="p-3 border border-gray-100 dark:border-zinc-700 rounded-md bg-gray-50 dark:bg-zinc-900/50">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                {isIncoming ? (
                                                    <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                                        <ArrowDownRight size={16} />
                                                    </div>
                                                ) : (
                                                    <div className="p-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                                        <ArrowUpRight size={16} />
                                                    </div>
                                                )}
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {isIncoming ? `From ${log.from_wallet?.name || "Unknown"}` : `To ${log.to_wallet?.name || "Unknown"}`}
                                                </span>
                                            </div>
                                            <span className={`font-semibold ${isIncoming ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-gray-100"}`}>
                                                {isIncoming ? "+" : "-"}{parseFloat(log.amount).toLocaleString()}
                                            </span>
                                        </div>
                                        {log.note && (
                                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-1">
                                                {log.note}
                                            </div>
                                        )}
                                        <div className="flex justify-between items-end text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            <span>{formatTimeAgo(log.created_at)}</span>
                                            <span>{formatDate(log.created_at)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            {pityReleases.length === 0 && !loading && !error && (
                                <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">No pity releases found.</div>
                            )}
                            {nextPityReleasesUrl && (
                                <button
                                    onClick={() => fetchPityReleases(true)}
                                    disabled={loading}
                                    className="w-full py-2 flex justify-center items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition"
                                >
                                    {loading ? <RefreshCw size={16} className="animate-spin" /> : "Load More"}
                                </button>
                            )}
                        </>
                    )}

                    {activeTab === "adjustment" && (
                        <>
                            {/* Filters */}
                            <div className="rounded-xl border" style={{ background: 'var(--card-bg, #FFFFFF)', borderColor: 'var(--border, #E5E7EB)' }}>
                                <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setShowAdjustmentFilters(!showAdjustmentFilters)}>
                                    <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><Filter size={16} className="text-blue-600 dark:text-blue-400" /> Date Filters</h4>
                                    <button className="p-2 rounded-full bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-zinc-700">
                                        {showAdjustmentFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                </div>
                                {showAdjustmentFilters && (
                                    <div className="p-4 pt-2 border-t border-gray-100 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/30 w-full flex flex-col md:flex-row gap-4">
                                        <div className="flex flex-col flex-1">
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><Calendar size={12} /> Start Date</label>
                                            <input type="date" value={adjustmentFilters.startDate} onChange={e => setAdjustmentFilters(prev => ({ ...prev, startDate: e.target.value }))} className="px-3 py-2 text-sm rounded-lg bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] text-gray-900 dark:text-[#F1F5F9] outline-none focus:ring-2 focus:ring-blue-500" style={{ minHeight: 44 }} />
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><Calendar size={12} /> End Date</label>
                                            <input type="date" value={adjustmentFilters.endDate} onChange={e => setAdjustmentFilters(prev => ({ ...prev, endDate: e.target.value }))} className="px-3 py-2 text-sm rounded-lg bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] text-gray-900 dark:text-[#F1F5F9] outline-none focus:ring-2 focus:ring-blue-500" style={{ minHeight: 44 }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* List */}
                            <div className="space-y-3">
                                {adjustments.map((adj) => (
                                    <div key={adj.id} className="p-4 border rounded-xl cursor-pointer transition-all bg-white dark:bg-[#1E293B] border-gray-200 dark:border-[#334155] hover:border-[#2563EB] dark:hover:border-[#3B82F6] active:scale-[0.99]" onClick={() => setSelectedAdjustment(adj)}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] dark:text-[#3B82F6]">
                                                    <FileText size={16} />
                                                </div>
                                                <span className="font-medium text-[#111827] dark:text-[#F1F5F9]" style={{ fontSize: 16 }}>Invoice #{adj.id}</span>
                                            </div>
                                            <span className="font-semibold text-[#111827] dark:text-[#F1F5F9]" style={{ fontSize: 16 }}>{parseFloat(adj.amount).toLocaleString()} ETB</span>
                                        </div>
                                        {adj.note && <div className="text-sm text-[#6B7280] dark:text-[#94A3B8] mb-2 line-clamp-1">{adj.note}</div>}
                                        <div className="flex justify-between items-end text-xs text-[#6B7280] dark:text-[#94A3B8]">
                                            <span>{adj.recorded_by ? adj.recorded_by.telegram_user_name || adj.recorded_by.username || `${adj.recorded_by.first_name || ''} ${adj.recorded_by.last_name || ''}`.trim() || 'Unknown' : 'Unknown'}</span>
                                            <span>{formatDate(adj.created_at)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {adjustments.length === 0 && !loading && !error && (
                                <div className="text-center py-8 text-[#6B7280] dark:text-[#94A3B8]" style={{ fontSize: 14 }}>No adjustment invoices found.</div>
                            )}
                            {nextAdjustmentsUrl && (
                                <button onClick={() => fetchAdjustments(true)} disabled={loading} className="w-full py-3 flex justify-center items-center gap-2 text-[#2563EB] dark:text-[#3B82F6] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" style={{ fontSize: 14, minHeight: 44 }}>
                                    {loading ? <RefreshCw size={16} className="animate-spin" /> : "Load More"}
                                </button>
                            )}

                            {/* ── Detail Overlay ── */}
                            {selectedAdjustment && !editingAdjustment && (
                                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setSelectedAdjustment(null)}>
                                    <div className="bg-white dark:bg-[#1E293B] w-full sm:max-w-md sm:rounded-xl rounded-t-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                                        {/* Header */}
                                        <div className="sticky top-0 bg-white dark:bg-[#1E293B] border-b border-gray-200 dark:border-[#334155] p-4 flex items-center justify-between" style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] dark:text-[#3B82F6]">
                                                    <FileText size={20} />
                                                </div>
                                                <h2 className="font-semibold text-[#111827] dark:text-[#F1F5F9]" style={{ fontSize: 18 }}>Invoice #{selectedAdjustment.id}</h2>
                                            </div>
                                            <button onClick={() => setSelectedAdjustment(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#334155] transition" style={{ minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <X size={20} className="text-[#6B7280] dark:text-[#94A3B8]" />
                                            </button>
                                        </div>

                                        {/* Body */}
                                        <div className="p-4 space-y-4">
                                            <div className="flex justify-between items-center p-4 rounded-xl bg-gray-50 dark:bg-[#0F172A]">
                                                <span className="text-[#6B7280] dark:text-[#94A3B8]" style={{ fontSize: 14 }}>Amount</span>
                                                <span className="font-bold text-[#111827] dark:text-[#F1F5F9]" style={{ fontSize: 22 }}>{parseFloat(selectedAdjustment.amount).toLocaleString()} ETB</span>
                                            </div>

                                            {selectedAdjustment.note && (
                                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0F172A]">
                                                    <span className="text-xs font-medium text-[#6B7280] dark:text-[#94A3B8] block mb-1">Note</span>
                                                    <p className="text-[#111827] dark:text-[#F1F5F9]" style={{ fontSize: 16, lineHeight: 1.5 }}>{selectedAdjustment.note}</p>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0F172A]">
                                                    <span className="text-xs font-medium text-[#6B7280] dark:text-[#94A3B8] block mb-1">Recorded by</span>
                                                    <span className="text-[#111827] dark:text-[#F1F5F9]" style={{ fontSize: 14 }}>{selectedAdjustment.recorded_by ? selectedAdjustment.recorded_by.telegram_user_name || selectedAdjustment.recorded_by.username || `${selectedAdjustment.recorded_by.first_name} ${selectedAdjustment.recorded_by.last_name}` : 'N/A'}</span>
                                                </div>
                                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0F172A]">
                                                    <span className="text-xs font-medium text-[#6B7280] dark:text-[#94A3B8] block mb-1">Date</span>
                                                    <span className="text-[#111827] dark:text-[#F1F5F9]" style={{ fontSize: 14 }}>{formatDate(selectedAdjustment.created_at)}</span>
                                                </div>
                                            </div>

                                            {selectedAdjustment.order_container?.length > 0 && (
                                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0F172A]">
                                                    <span className="text-xs font-medium text-[#6B7280] dark:text-[#94A3B8] block mb-2">Linked Orders</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedAdjustment.order_container.map((c: any) => (
                                                            <span key={c.id} className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-[#2563EB] dark:text-[#60A5FA] text-xs font-medium">#{c.id} {c.client}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedAdjustment.sales_recored?.length > 0 && (
                                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0F172A]">
                                                    <span className="text-xs font-medium text-[#6B7280] dark:text-[#94A3B8] block mb-2">Linked Sales</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedAdjustment.sales_recored.map((s: any) => (
                                                            <span key={s.id} className="px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-[#16A34A] dark:text-[#22C55E] text-xs font-medium">Sale #{s.id}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedAdjustment.invoice && (
                                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0F172A]">
                                                    <span className="text-xs font-medium text-[#6B7280] dark:text-[#94A3B8] block mb-2">Invoice Image</span>
                                                    <img src={selectedAdjustment.invoice} alt="Invoice" className="w-full rounded-lg border border-gray-200 dark:border-[#334155]" />
                                                </div>
                                            )}

                                            {selectedAdjustment.additional_image && (
                                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0F172A]">
                                                    <span className="text-xs font-medium text-[#6B7280] dark:text-[#94A3B8] block mb-2">Additional Image</span>
                                                    <img src={selectedAdjustment.additional_image} alt="Additional" className="w-full rounded-lg border border-gray-200 dark:border-[#334155]" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="sticky bottom-0 bg-white dark:bg-[#1E293B] border-t border-gray-200 dark:border-[#334155] p-4">
                                            <button
                                                onClick={() => {
                                                    setEditingAdjustment(true);
                                                    setEditAmount(selectedAdjustment.amount);
                                                    setEditNote(selectedAdjustment.note || '');
                                                    setEditInvoiceFile(null);
                                                    setEditAdditionalImage(null);
                                                }}
                                                className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-[#2563EB] dark:bg-[#3B82F6] text-white hover:bg-[#1D4ED8] dark:hover:bg-[#60A5FA] transition"
                                                style={{ fontSize: 16, minHeight: 48, borderRadius: 8 }}
                                            >
                                                <Edit3 size={18} /> Edit Invoice
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Edit Overlay ── */}
                            {selectedAdjustment && editingAdjustment && (
                                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => { setEditingAdjustment(false); }}>
                                    <div className="bg-white dark:bg-[#1E293B] w-full sm:max-w-md sm:rounded-xl rounded-t-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                                        {/* Header */}
                                        <div className="sticky top-0 bg-white dark:bg-[#1E293B] border-b border-gray-200 dark:border-[#334155] p-4 flex items-center justify-between" style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                                            <div className="flex items-center gap-2">
                                                <Edit3 size={20} className="text-[#2563EB] dark:text-[#3B82F6]" />
                                                <h2 className="font-semibold text-[#111827] dark:text-[#F1F5F9]" style={{ fontSize: 18 }}>Edit Invoice #{selectedAdjustment.id}</h2>
                                            </div>
                                            <button onClick={() => setEditingAdjustment(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#334155] transition" style={{ minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <X size={20} className="text-[#6B7280] dark:text-[#94A3B8]" />
                                            </button>
                                        </div>

                                        {/* Body */}
                                        <div className="p-4 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] dark:text-[#F1F5F9] mb-2">Amount (ETB)</label>
                                                <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-[#334155] text-[#111827] dark:text-[#F1F5F9] outline-none focus:ring-2 focus:ring-[#2563EB] dark:focus:ring-[#3B82F6]" style={{ minHeight: 44, fontSize: 16 }} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] dark:text-[#F1F5F9] mb-2">Note</label>
                                                <textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-lg bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-[#334155] text-[#111827] dark:text-[#F1F5F9] outline-none focus:ring-2 focus:ring-[#2563EB] dark:focus:ring-[#3B82F6] resize-none" style={{ fontSize: 16, lineHeight: 1.5 }} />
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-sm font-medium text-[#111827] dark:text-[#F1F5F9] mb-2">Invoice Image</label>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={e => setEditInvoiceFile(e.target.files?.[0] || null)}
                                                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-sm font-medium text-[#111827] dark:text-[#F1F5F9] mb-2">Additional Image</label>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={e => setEditAdditionalImage(e.target.files?.[0] || null)}
                                                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="sticky bottom-0 bg-white dark:bg-[#1E293B] border-t border-gray-200 dark:border-[#334155] p-4 flex gap-3">
                                            <button onClick={() => setEditingAdjustment(false)} className="flex-1 py-3 rounded-lg font-medium border border-gray-200 dark:border-[#334155] text-[#111827] dark:text-[#F1F5F9] hover:bg-gray-50 dark:hover:bg-[#334155] transition" style={{ fontSize: 16, minHeight: 48, borderRadius: 8 }}>
                                                Cancel
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const fd = new FormData();
                                                        fd.append('amount', editAmount);
                                                        if (editNote) fd.append('note', editNote);
                                                        if (editInvoiceFile) fd.append('invoice', editInvoiceFile);
                                                        if (editAdditionalImage) fd.append('additional_image', editAdditionalImage);

                                                        await api.patch(`/finance/adjustment-invoice/${selectedAdjustment.id}/`, fd, {
                                                            headers: { 'Content-Type': 'multipart/form-data' }
                                                        });
                                                        setEditingAdjustment(false);
                                                        setSelectedAdjustment(null);
                                                        fetchAdjustments();
                                                    } catch (e) { console.error(e); }
                                                }}
                                                className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-[#2563EB] dark:bg-[#3B82F6] text-white hover:bg-[#1D4ED8] dark:hover:bg-[#60A5FA] transition"
                                                style={{ fontSize: 16, minHeight: 48, borderRadius: 8 }}
                                            >
                                                <Save size={18} /> Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Loading Indicator */}
                    {loading && !nextPityPurchasesUrl && !nextWalletTransfersUrl && !nextPityCostsUrl && !nextPityReleasesUrl && (
                        <div className="flex justify-center py-4">
                            <RefreshCw size={20} className="animate-spin text-blue-600" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
