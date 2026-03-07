import React, { useState, useEffect, useCallback } from "react";
import api from "@/api";
import { Search, Upload, Settings, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight, Calendar, Filter, ChevronDown, ChevronUp } from "lucide-react";

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

    const [activeTab, setActiveTab] = useState<"pity-purchase" | "wallet-transfer" | "pity-cost" | "pity-release">("pity-cost");

    const [pityPurchases, setPityPurchases] = useState<PityPurchase[]>([]);
    const [walletTransfers, setWalletTransfers] = useState<WalletTransfer[]>([]);
    const [pityCosts, setPityCosts] = useState<PityCostRecord[]>([]);
    const [pityReleases, setPityReleases] = useState<WalletTransfer[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination URLs
    const [nextPityPurchasesUrl, setNextPityPurchasesUrl] = useState<string | null>(null);
    const [nextWalletTransfersUrl, setNextWalletTransfersUrl] = useState<string | null>(null);
    const [nextPityCostsUrl, setNextPityCostsUrl] = useState<string | null>(null);
    const [nextPityReleasesUrl, setNextPityReleasesUrl] = useState<string | null>(null);

    const defaultDate = new Date().toISOString().split('T')[0];

    const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);
    const [materials, setMaterials] = useState<{ id: number, name: string }[]>([]);

    const [pityPurchaseFilters, setPityPurchaseFilters] = useState({ startDate: defaultDate, endDate: defaultDate, materialId: '' });
    const [pityCostFilters, setPityCostFilters] = useState({ startDate: defaultDate, endDate: defaultDate, categoryId: '' });
    const [walletTransferFilters, setWalletTransferFilters] = useState({ startDate: '', endDate: '' });
    const [pityReleaseFilters, setPityReleaseFilters] = useState({ startDate: '', endDate: '' });

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

    useEffect(() => {
        if (activeTab === "pity-purchase") {
            fetchPityPurchases();
        } else if (activeTab === "wallet-transfer") {
            fetchWalletTransfers();
        } else if (activeTab === "pity-cost") {
            fetchPityCosts();
        } else if (activeTab === "pity-release") {
            fetchPityReleases();
        }
    }, [activeTab, pityPurchaseFilters, pityCostFilters, walletTransferFilters, pityReleaseFilters]);

    const tabs = [
        { id: "pity-cost", label: "Pity Cost", icon: Settings },
        { id: "pity-purchase", label: "Pity Purchase", icon: Search },
        { id: "wallet-transfer", label: "Wallet Transfer", icon: Upload },
        { id: "pity-release", label: "Pity Release", icon: RefreshCw },
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
