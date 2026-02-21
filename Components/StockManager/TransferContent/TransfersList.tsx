import { useState, useEffect } from 'react';
import {
    ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
    Package, Ruler, Box, Clock, AlertCircle, Filter, X
} from 'lucide-react';
import api from '@/api';

// ── Types ──────────────────────────────────────────────
interface LandPTransfer {
    id: number;
    from_inventory: number;
    from_inventory_name: string;
    to_inventory: number;
    to_inventory_name: string;
    material: number;
    material_name: string;
    amount: string;
    date: string;
}

interface EachMaterialInfo {
    id: number;
    material_name: string;
    current_width: string;
    current_height: string;
    code: string;
}

interface ArealTransfer {
    id: number;
    from_inventory: number;
    from_inventory_name: string;
    to_inventory: number;
    to_inventory_name: string;
    each_materials_info: EachMaterialInfo[];
    width_at_transfer: string;
    height_at_transfer: string;
    is_full_at_transfer: boolean;
    date: string;
}

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Unified display item
interface TransferItem {
    id: string; // unique key
    type: 'landp' | 'areal';
    direction: 'incoming' | 'outgoing';
    fromName: string;
    toName: string;
    materialName: string;
    detail: string; // amount or dimensions
    date: string;
    raw: LandPTransfer | ArealTransfer;
}

const STOCK_KEEPER_ID = 2;

// ── Component ──────────────────────────────────────────
export const TransfersList = () => {
    const [items, setItems] = useState<TransferItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination cursors
    const [landpNext, setLandpNext] = useState<string | null>(null);
    const [arealNext, setArealNext] = useState<string | null>(null);

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [directionFilter, setDirectionFilter] = useState<'ALL' | 'INCOMING' | 'OUTGOING'>('ALL');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'LANDP' | 'AREAL'>('ALL');

    useEffect(() => {
        fetchTransfers();
    }, [directionFilter, typeFilter]);

    const buildUrl = (base: string) => {
        let url = `${base}?ordering=-date`;
        if (directionFilter === 'INCOMING') url += `&to_inventory=${STOCK_KEEPER_ID}`;
        if (directionFilter === 'OUTGOING') url += `&from_inventory=${STOCK_KEEPER_ID}`;
        // If ALL, show both directions involving inventory 2
        return url;
    };

    const getDirection = (fromId: number, toId: number): 'incoming' | 'outgoing' => {
        return toId === STOCK_KEEPER_ID ? 'incoming' : 'outgoing';
    };

    const mapLandpToItem = (t: LandPTransfer): TransferItem => ({
        id: `lp-${t.id}`,
        type: 'landp',
        direction: getDirection(t.from_inventory, t.to_inventory),
        fromName: t.from_inventory_name,
        toName: t.to_inventory_name,
        materialName: t.material_name,
        detail: `${t.amount} meter`,
        date: t.date,
        raw: t,
    });

    const mapArealToItem = (t: ArealTransfer): TransferItem => ({
        id: `ar-${t.id}`,
        type: 'areal',
        direction: getDirection(t.from_inventory, t.to_inventory),
        fromName: t.from_inventory_name,
        toName: t.to_inventory_name,
        materialName: t.each_materials_info?.[0]?.material_name || 'Areal Material',
        detail: `${t.width_at_transfer}×${t.height_at_transfer} cm${t.each_materials_info?.length > 1 ? ` (${t.each_materials_info.length} pcs)` : ''}`,
        date: t.date,
        raw: t,
    });

    const fetchTransfers = async () => {
        try {
            setLoading(true);
            setError(null);

            const all: TransferItem[] = [];

            // Fetch L&P transfers
            if (typeFilter !== 'AREAL') {
                const landpUrl = buildUrl('/landp-transfers/');
                const resp = await api.get<PaginatedResponse<LandPTransfer>>(landpUrl);
                const filtered = directionFilter === 'ALL'
                    ? resp.data.results.filter(t => t.from_inventory === STOCK_KEEPER_ID || t.to_inventory === STOCK_KEEPER_ID)
                    : resp.data.results;
                all.push(...filtered.map(mapLandpToItem));
                setLandpNext(resp.data.next);
            } else {
                setLandpNext(null);
            }

            // Fetch Areal transfers
            if (typeFilter !== 'LANDP') {
                const arealUrl = buildUrl('/areal-transfers/');
                const resp = await api.get<PaginatedResponse<ArealTransfer>>(arealUrl);
                const filtered = directionFilter === 'ALL'
                    ? resp.data.results.filter(t => t.from_inventory === STOCK_KEEPER_ID || t.to_inventory === STOCK_KEEPER_ID)
                    : resp.data.results;
                all.push(...filtered.map(mapArealToItem));
                setArealNext(resp.data.next);
            } else {
                setArealNext(null);
            }

            // Sort merged by date desc
            all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setItems(all);
        } catch (err: any) {
            console.error('Error fetching transfers:', err);
            setError('Failed to load transfers.');
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        try {
            setLoadingMore(true);
            const more: TransferItem[] = [];

            if (landpNext && typeFilter !== 'AREAL') {
                const resp = await api.get<PaginatedResponse<LandPTransfer>>(landpNext);
                const filtered = directionFilter === 'ALL'
                    ? resp.data.results.filter(t => t.from_inventory === STOCK_KEEPER_ID || t.to_inventory === STOCK_KEEPER_ID)
                    : resp.data.results;
                more.push(...filtered.map(mapLandpToItem));
                setLandpNext(resp.data.next);
            }

            if (arealNext && typeFilter !== 'LANDP') {
                const resp = await api.get<PaginatedResponse<ArealTransfer>>(arealNext);
                const filtered = directionFilter === 'ALL'
                    ? resp.data.results.filter(t => t.from_inventory === STOCK_KEEPER_ID || t.to_inventory === STOCK_KEEPER_ID)
                    : resp.data.results;
                more.push(...filtered.map(mapArealToItem));
                setArealNext(resp.data.next);
            }

            more.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setItems(prev => [...prev, ...more]);
        } catch (err: any) {
            console.error('Error loading more:', err);
        } finally {
            setLoadingMore(false);
        }
    };

    const hasMore = landpNext || arealNext;

    const clearFilters = () => {
        setDirectionFilter('ALL');
        setTypeFilter('ALL');
    };

    // ── Render ─────────────────────────────────────────
    return (
        <div className="flex flex-col w-full">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ArrowLeftRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Stock Transfers
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Material movements in & out of stock keeper
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading transfers...</span>
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No transfers found</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
                        No material transfers match your current filters.
                    </p>
                    {showFilters && (
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
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="overflow-hidden rounded-xl border bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
                        >
                            <div className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                {/* Left: Direction icon + info */}
                                <div className="flex items-start gap-3">
                                    {/* Direction icon */}
                                    <div className={`mt-0.5 p-2 rounded-lg ${item.direction === 'incoming'
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                        : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                                        }`}>
                                        {item.direction === 'incoming'
                                            ? <ArrowDownLeft className="w-5 h-5" />
                                            : <ArrowUpRight className="w-5 h-5" />
                                        }
                                    </div>

                                    <div className="min-w-0">
                                        {/* Material name & type badge */}
                                        <div className="font-semibold text-gray-900 dark:text-white text-base flex flex-wrap items-center gap-2">
                                            {item.materialName}
                                            <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold tracking-wider ${item.type === 'landp'
                                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                                : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                                                }`}>
                                                {item.type === 'landp' ? 'L&P' : 'Areal'}
                                            </span>
                                        </div>

                                        {/* Details pills */}
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            {/* Amount / Dimensions */}
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gray-100 dark:bg-zinc-900 text-xs font-medium text-gray-700 dark:text-gray-300">
                                                {item.type === 'landp' ? <Ruler className="w-3.5 h-3.5" /> : <Box className="w-3.5 h-3.5" />}
                                                {item.detail}
                                            </span>

                                            {/* Direction flow label */}
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${item.direction === 'incoming'
                                                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                                                }`}>
                                                {item.direction === 'incoming' ? '↓' : '↑'}
                                                {item.fromName} → {item.toName}
                                            </span>

                                            {/* Date */}
                                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                <Clock className="w-3 h-3" />
                                                {new Date(item.date).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Direction badge */}
                                <div className="flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100 dark:border-zinc-700">
                                    <span className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${item.direction === 'incoming'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                        }`}>
                                        {item.direction === 'incoming'
                                            ? <><ArrowDownLeft className="w-4 h-4" /> Incoming</>
                                            : <><ArrowUpRight className="w-4 h-4" /> Outgoing</>
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Load More */}
                    {hasMore && (
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
                                    'Load More Transfers'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
