import { useState, useEffect } from 'react';
import {
    ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
    Package, Ruler, Box, Clock, AlertCircle, Filter,
    ShoppingCart, Plus, MapPin, Layers, Tag
} from 'lucide-react';
import api from '@/api';

// ── Types ──────────────────────────────────────────────
interface UnifiedItem {
    id: string;
    type: 'landp' | 'areal';
    category: 'transfer' | 'purchase' | 'default';
    direction: 'incoming' | 'outgoing';
    fromName: string;
    toName: string;
    materialName: string;
    detail: string;
    amount?: number;
    price?: number;
    purchaseId?: number;
    createdBy?: string;
    date: string;
}

interface PaginatedResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: UnifiedItem[];
}

const STOCK_KEEPER_ID = 2;

// ── Category styling config ────────────────────────────
const categoryConfig = {
    transfer: {
        label: 'Transfer',
        badgeClasses: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        icon: ArrowLeftRight,
    },
    purchase: {
        label: 'Purchase',
        badgeClasses: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        icon: ShoppingCart,
    },
    default: {
        label: 'Manual',
        badgeClasses: 'bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-gray-300',
        icon: Plus,
    },
};

// ── Component ──────────────────────────────────────────
export const TransfersList = () => {
    const [items, setItems] = useState<UnifiedItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextUrl, setNextUrl] = useState<string | null>(null);

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [directionFilter, setDirectionFilter] = useState<'ALL' | 'INCOMING' | 'OUTGOING'>('ALL');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'LANDP' | 'AREAL'>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'TRANSFER' | 'PURCHASE' | 'DEFAULT'>('ALL');
    const [inventoryFilter, setInventoryFilter] = useState<number | 'ALL'>('ALL');
    const [materialFilter, setMaterialFilter] = useState<number | 'ALL'>('ALL');

    // Data for filter dropdowns
    const [inventories, setInventories] = useState<{ id: number; name: string }[]>([]);
    const [materialsList, setMaterialsList] = useState<{ id: number; name: string; type: string }[]>([]);

    useEffect(() => {
        api.get('/inventories/').then(r => setInventories(r.data.results || r.data)).catch(console.error);
        api.get('/materials/').then(r => setMaterialsList(r.data.results || r.data)).catch(console.error);
    }, []);

    useEffect(() => {
        fetchItems();
    }, [directionFilter, typeFilter, categoryFilter, inventoryFilter, materialFilter]);

    const buildUrl = () => {
        let url = `/unified-transfers/?stock_keeper_id=${STOCK_KEEPER_ID}`;
        url += `&direction=${directionFilter}`;
        url += `&type=${typeFilter}`;
        url += `&category=${categoryFilter}`;
        if (inventoryFilter !== 'ALL') url += `&inventory_id=${inventoryFilter}`;
        if (materialFilter !== 'ALL') url += `&material_id=${materialFilter}`;
        return url;
    };

    const fetchItems = async () => {
        try {
            setLoading(true);
            setError(null);
            const url = buildUrl();
            const resp = await api.get<PaginatedResponse>(url);
            setItems(resp.data.results);
            setTotalCount(resp.data.count);
            setNextUrl(resp.data.next);
        } catch (err: any) {
            console.error('Error fetching unified transfers:', err);
            setError('Failed to load stock history.');
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (!nextUrl) return;
        try {
            setLoadingMore(true);
            const resp = await api.get<PaginatedResponse>(nextUrl);
            setItems(prev => [...prev, ...resp.data.results]);
            setNextUrl(resp.data.next);
        } catch (err: any) {
            console.error('Error loading more:', err);
        } finally {
            setLoadingMore(false);
        }
    };

    const clearFilters = () => {
        setDirectionFilter('ALL');
        setTypeFilter('ALL');
        setCategoryFilter('ALL');
        setInventoryFilter('ALL');
        setMaterialFilter('ALL');
    };

    const activeFilterCount = [
        directionFilter !== 'ALL',
        typeFilter !== 'ALL',
        categoryFilter !== 'ALL',
        inventoryFilter !== 'ALL',
        materialFilter !== 'ALL',
    ].filter(Boolean).length;

    // ── Render ─────────────────────────────────────────
    return (
        <div className="flex flex-col w-full">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ArrowLeftRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Stock History
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Transfers, purchases & manual additions — {totalCount} total records
                    </p>
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-lg flex items-center gap-2 transition-colors ${showFilters
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-white text-gray-600 dark:bg-zinc-800 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-zinc-700'
                        }`}
                >
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">Filters</span>
                    {activeFilterCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="mb-6 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Filters</h3>
                        <button onClick={clearFilters} className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
                            Clear All
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Category */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Category</label>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value as any)}
                                className="h-11 px-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="ALL">All Categories</option>
                                <option value="TRANSFER">↔ Transfers</option>
                                <option value="PURCHASE">🛒 Purchases</option>
                                <option value="DEFAULT">＋ Manual Additions</option>
                            </select>
                        </div>

                        {/* Direction */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-600 dark:text-gray-400">Direction</label>
                            <select
                                value={directionFilter}
                                onChange={(e) => setDirectionFilter(e.target.value as any)}
                                className="h-11 px-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="ALL">All Directions</option>
                                <option value="INCOMING">↓ Incoming (to Stock Keeper)</option>
                                <option value="OUTGOING">↑ Outgoing (from Stock Keeper)</option>
                            </select>
                        </div>

                        {/* Material Type */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-600 dark:text-gray-400">Material Type</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as any)}
                                className="h-11 px-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="ALL">All Types</option>
                                <option value="LANDP">L&P Materials (Length / Piece)</option>
                                <option value="AREAL">Areal Materials</option>
                            </select>
                        </div>

                        {/* Inventory Filter */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Inventory</label>
                            <select
                                value={inventoryFilter}
                                onChange={(e) => setInventoryFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                                className="h-11 px-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="ALL">All Inventories</option>
                                {inventories.map(inv => (
                                    <option key={inv.id} value={inv.id}>{inv.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Material Filter */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Material</label>
                            <select
                                value={materialFilter}
                                onChange={(e) => setMaterialFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                                className="h-11 px-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="ALL">All Materials</option>
                                {materialsList.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading stock history...</span>
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <span className="text-red-700 dark:text-red-300">{error}</span>
                    </div>
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700">
                    <ArrowLeftRight className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No records found</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
                        No stock history matches your current filters.
                    </p>
                    {activeFilterCount > 0 && (
                        <button
                            onClick={clearFilters}
                            className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => {
                        const catCfg = categoryConfig[item.category];
                        const CatIcon = catCfg.icon;

                        return (
                            <div
                                key={item.id}
                                className="overflow-hidden rounded-xl border bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
                            >
                                <div className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    {/* Left: Direction icon + info */}
                                    <div className="flex items-start gap-3">
                                        {/* Direction / Category icon */}
                                        <div className={`mt-0.5 p-2 rounded-lg ${
                                            item.category === 'purchase'
                                                ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                                : item.category === 'default'
                                                    ? 'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-400'
                                                    : item.direction === 'incoming'
                                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                                        : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                                        }`}>
                                            {item.category === 'purchase'
                                                ? <ShoppingCart className="w-5 h-5" />
                                                : item.category === 'default'
                                                    ? <Plus className="w-5 h-5" />
                                                    : item.direction === 'incoming'
                                                        ? <ArrowDownLeft className="w-5 h-5" />
                                                        : <ArrowUpRight className="w-5 h-5" />
                                            }
                                        </div>

                                        <div className="min-w-0">
                                            {/* Material name & badges */}
                                            <div className="font-semibold text-gray-900 dark:text-white text-base flex flex-wrap items-center gap-2">
                                                {item.materialName}
                                                {/* Type badge */}
                                                <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold tracking-wider ${item.type === 'landp'
                                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                                    : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                                                    }`}>
                                                    {item.type === 'landp' ? 'L&P' : 'Areal'}
                                                </span>
                                                {/* Category badge */}
                                                <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold tracking-wider flex items-center gap-1 ${catCfg.badgeClasses}`}>
                                                    <CatIcon className="w-3 h-3" />
                                                    {catCfg.label}
                                                </span>
                                            </div>

                                            {/* Details pills */}
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                {/* Amount / Dimensions */}
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gray-100 dark:bg-zinc-900 text-xs font-medium text-gray-700 dark:text-gray-300">
                                                    {item.type === 'landp' ? <Ruler className="w-3.5 h-3.5" /> : <Box className="w-3.5 h-3.5" />}
                                                    {item.detail}
                                                </span>

                                                {/* Price (for purchases/defaults) */}
                                                {item.price != null && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/20 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                                        {item.price.toLocaleString()} ETB
                                                    </span>
                                                )}

                                                {/* Purchase ID */}
                                                {item.purchaseId && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-50 dark:bg-purple-900/20 text-xs font-medium text-purple-700 dark:text-purple-400">
                                                        <Package className="w-3 h-3" />
                                                        PO #{item.purchaseId}
                                                    </span>
                                                )}

                                                {/* Direction flow label */}
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                                    item.category === 'purchase'
                                                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                                                        : item.category === 'default'
                                                            ? 'bg-gray-50 text-gray-600 dark:bg-zinc-700 dark:text-gray-300'
                                                            : item.direction === 'incoming'
                                                                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                                : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                                                }`}>
                                                    {item.direction === 'incoming' ? '↓' : '↑'}
                                                    {item.fromName} → {item.toName}
                                                </span>

                                                {/* Created by (for defaults) */}
                                                {item.createdBy && item.category === 'default' && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                        by {item.createdBy}
                                                    </span>
                                                )}

                                                {/* Date */}
                                                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(item.date).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Category + Direction badge */}
                                    <div className="flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100 dark:border-zinc-700">
                                        <span className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                                            item.category === 'purchase'
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                : item.category === 'default'
                                                    ? 'bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-gray-300'
                                                    : item.direction === 'incoming'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                        }`}>
                                            {item.category === 'purchase'
                                                ? <><ShoppingCart className="w-4 h-4" /> Purchase</>
                                                : item.category === 'default'
                                                    ? <><Plus className="w-4 h-4" /> Manual</>
                                                    : item.direction === 'incoming'
                                                        ? <><ArrowDownLeft className="w-4 h-4" /> Incoming</>
                                                        : <><ArrowUpRight className="w-4 h-4" /> Outgoing</>
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Load More */}
                    {nextUrl && (
                        <div className="pt-4 flex justify-center">
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="px-6 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
                            >
                                {loadingMore ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 dark:border-gray-400"></div>
                                        Loading...
                                    </>
                                ) : (
                                    'Load More'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
