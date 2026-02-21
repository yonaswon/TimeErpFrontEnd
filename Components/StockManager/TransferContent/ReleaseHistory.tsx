import { useState, useEffect } from 'react';
import { Package, Clock, User, Ruler, Box, Filter, CheckCircle, AlertCircle, X, Search, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import api, { base_url } from '@/api';

interface Material {
    id: number;
    name: string;
    type: 'L' | 'A' | 'P';
    code_name: string;
}

interface Release {
    id: number;
    reason: string;
    material: number;
    material_name: string;
    material_type: 'L' | 'P';
    amount: string;
    proof_image: string | null;
    inventory: number;
    inventory_name: string;
    released_by_name: string;
    confirmed: boolean;
    confirmed_by_name?: string | null;
    confirmed_date?: string | null;
    date: string;
    order?: number;
}

interface ApiResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Release[];
}

interface UserAcc {
    id: number;
    username: string;
}

export const ReleaseHistory = () => {
    const [releases, setReleases] = useState<Release[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedReleaseId, setExpandedReleaseId] = useState<number | null>(null);

    // Pagination
    const [nextPage, setNextPage] = useState<string | null>(null);

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'UNCONFIRMED'>('ALL');
    const [userFilter, setUserFilter] = useState<number | 'ALL'>('ALL');
    const [dateFilter, setDateFilter] = useState<string>('');
    const [orderFilter, setOrderFilter] = useState<string>('');

    // Data for filters
    const [users, setUsers] = useState<UserAcc[]>([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchReleases();
    }, [statusFilter, userFilter, dateFilter, orderFilter]);

    const fetchUsers = async () => {
        try {
            const resp = await api.get('/auth/users/');
            setUsers(resp.data);
        } catch (e) {
            console.error("Failed to load users", e);
        }
    };

    const fetchReleases = async () => {
        try {
            setLoading(true);
            setError(null);

            let url = '/api/release/?ordering=-date';

            if (statusFilter === 'CONFIRMED') url += '&confirmed=true';
            if (statusFilter === 'UNCONFIRMED') url += '&confirmed=false';
            if (userFilter !== 'ALL') url += `&released_by=${userFilter}`;
            if (dateFilter) url += `&date=${dateFilter}`;
            if (orderFilter) url += `&order=${orderFilter}`;

            const response = await api.get<ApiResponse>(url);
            setReleases(response.data.results);
            setNextPage(response.data.next);
        } catch (err: any) {
            console.error('Error fetching release history:', err);
            setError('Failed to load release history.');
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (!nextPage) return;
        try {
            setLoadingMore(true);
            const response = await api.get<ApiResponse>(nextPage);
            setReleases([...releases, ...response.data.results]);
            setNextPage(response.data.next);
        } catch (err: any) {
            console.error('Error loading more:', err);
        } finally {
            setLoadingMore(false);
        }
    };

    const clearFilters = () => {
        setStatusFilter('ALL');
        setUserFilter('ALL');
        setDateFilter('');
        setOrderFilter('');
    };

    const toggleExpandRelease = (releaseId: number) => {
        setExpandedReleaseId(expandedReleaseId === releaseId ? null : releaseId);
    };

    // Helper function to resolve absolute URL for images
    const resolveMediaUrl = (url: string | null | undefined) => {
        if (!url) return undefined;
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        const cleanBaseUrl = base_url.replace(/\/$/, '');
        const cleanUrl = url.replace(/^\//, '');
        return `${cleanBaseUrl}/${cleanUrl}`;
    };

    const getMaterialIcon = (type: 'L' | 'P') => {
        return type === 'L' ? <Ruler className="w-4 h-4" /> : <Box className="w-4 h-4" />;
    };

    const getUnit = (type: string) => {
        if (type === 'L') return 'meter';
        if (type === 'P') return 'pics';
        return 'pcs';
    };

    return (
        <div className="flex flex-col w-full">
            {/* Mobile-friendly Header with Filters Toggle */}
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Release History
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Browse all past and pending stock releases
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

            {/* Expandable Advanced Filters */}
            {showFilters && (
                <div className="mb-6 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Search className="w-4 h-4" />
                            Advanced Filters
                        </h3>
                        <button onClick={clearFilters} className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
                            Clear All
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Status Filter */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-600 dark:text-gray-400">Confirmation</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="h-11 px-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="UNCONFIRMED">Pending / Unconfirmed</option>
                            </select>
                        </div>

                        {/* User Filter */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-600 dark:text-gray-400">Released By</label>
                            <select
                                value={userFilter}
                                onChange={(e) => setUserFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                                className="h-11 px-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="ALL">All Users</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.username}</option>
                                ))}
                            </select>
                        </div>

                        {/* Order Filter */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-600 dark:text-gray-400">Order ID</label>
                            <input
                                type="number"
                                placeholder="e.g. 1952"
                                value={orderFilter}
                                onChange={(e) => setOrderFilter(e.target.value)}
                                className="h-11 px-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400"
                            />
                        </div>

                        {/* Date Filter */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-600 dark:text-gray-400">Date (YYYY-MM-DD)</label>
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="h-11 px-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading history...</span>
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <span className="text-red-700 dark:text-red-300">{error}</span>
                    </div>
                </div>
            ) : releases.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700">
                    <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No releases found</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
                        We couldn't find any releases matching your current filters.
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
                <div className="space-y-4">
                    {releases.map((release) => {
                        const isExpanded = expandedReleaseId === release.id;
                        return (
                            <div
                                key={release.id}
                                className={`overflow-hidden rounded-xl border transition-colors ${release.confirmed
                                    ? 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700'
                                    : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800/50'
                                    }`}
                            >
                                <div className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 p-2 rounded-lg ${release.confirmed ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'}`}>
                                            {getMaterialIcon(release.material_type)}
                                        </div>

                                        <div>
                                            {/* Title & Proof Image Toggle */}
                                            <div className="font-semibold text-gray-900 dark:text-white text-base flex flex-wrap items-center gap-2">
                                                {release.material_name}
                                                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                                    ({release.amount} {getUnit(release.material_type)})
                                                </span>

                                                {release.proof_image && (
                                                    <button
                                                        onClick={() => toggleExpandRelease(release.id)}
                                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center text-xs bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded transition-colors"
                                                    >
                                                        <ImageIcon className="w-3 h-3 mr-1" />
                                                        {isExpanded ? 'Hide Proof' : 'View Proof'}
                                                        {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Info Pills Layout (Mobile Friendly) */}
                                            <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gray-100 dark:bg-zinc-900 text-xs font-medium text-gray-700 dark:text-gray-300">
                                                    <User className="w-3.5 h-3.5" />
                                                    Released by: <strong>{release.released_by_name}</strong>
                                                </span>

                                                {release.order && (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-purple-50 dark:bg-purple-900/20 text-xs font-medium text-purple-700 dark:text-purple-300">
                                                        <Package className="w-3.5 h-3.5" />
                                                        ORD-{release.order}
                                                    </span>
                                                )}

                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gray-100 dark:bg-zinc-900 text-xs font-medium text-gray-700 dark:text-gray-300">
                                                    <Box className="w-3.5 h-3.5" />
                                                    {release.inventory_name}
                                                </span>

                                                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 ml-1">
                                                    {new Date(release.date).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Badge & Confirmation Details */}
                                    <div className="flex-shrink-0 pt-3 sm:pt-0 border-t sm:border-0 border-gray-100 dark:border-zinc-700 flex flex-col items-start sm:items-end gap-2">
                                        <span className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${release.confirmed
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            {release.confirmed ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                            {release.confirmed ? 'Confirmed' : 'Pending'}
                                        </span>
                                        {release.confirmed && release.confirmed_by_name && (
                                            <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400 sm:items-end mt-1">
                                                <span>by <strong>{release.confirmed_by_name}</strong></span>
                                                {release.confirmed_date && (
                                                    <span>{new Date(release.confirmed_date).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Image Area */}
                                {isExpanded && release.proof_image && (
                                    <div className="border-t border-gray-100 dark:border-zinc-700 p-4 bg-gray-50 dark:bg-zinc-900/50">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium flex items-center">
                                            Proof Image for Release
                                        </p>
                                        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex justify-center p-2">
                                            <img
                                                src={resolveMediaUrl(release.proof_image)}
                                                alt={`Proof for ${release.material_name}`}
                                                className="w-full h-auto max-w-[800px] max-h-[600px] object-contain rounded"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    (e.target as HTMLImageElement).parentElement!.innerHTML =
                                                        '<div class="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400"><span class="flex flex-col items-center"><svg class="w-8 h-8 mb-2 opacity-50" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>Image failed to load</span></div>';
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Load More Button */}
                    {nextPage && (
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
                                    'Load More Releases'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
