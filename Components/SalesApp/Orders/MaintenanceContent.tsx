"use client";

import { useState, useEffect } from "react";
import { Search, Filter, RefreshCw, Loader, AlertCircle } from "lucide-react";
import MaintenanceCard from "./MaintenanceCard";
import MaintenanceDetail from "./MaintenanceDetail";
import api from "@/api";

const MaintenanceContent = () => {
    const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null);

    // Pagination state
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchMaintenance = async (pageUrl?: string, isLoadMore = false) => {
        try {
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setError(null);

            let url = pageUrl || "/api/maintenance/?ordering=-created_at";

            // If url is absolute, extract the relative part
            if (url.startsWith('http')) {
                try {
                    const urlObj = new URL(url);
                    url = urlObj.pathname + urlObj.search;
                } catch (e) {
                    console.error("Failed to parse pagination URL", e);
                }
            }

            const response = await api.get(url);

            if (isLoadMore) {
                setMaintenanceRecords((prev) => [...prev, ...response.data.results]);
            } else {
                setMaintenanceRecords(response.data.results || []);
            }

            setNextPage(response.data.next);
        } catch (err: any) {
            console.error("Fetch error:", err);
            const errorMessage =
                err.response?.data?.message || err.message || "Failed to fetch maintenance records";
            setError(errorMessage);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMaintenance();
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchSubmit = () => {
        const searchUrl = `/api/maintenance/?ordering=-created_at&search=${encodeURIComponent(
            searchQuery
        )}`;
        fetchMaintenance(searchUrl);
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchMaintenance();
    };

    const handleLoadMore = () => {
        if (nextPage) {
            fetchMaintenance(nextPage, true);
        }
    };

    return (
        <div className="w-full">
            {/* Header with Search and Refresh */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white shrink-0">
                    Maintenance Requests
                </h1>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-3 md:mt-0">
                    <div className="relative flex-grow min-w-[140px]">
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={16}
                        />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={handleSearch}
                            onKeyPress={(e) =>
                                e.key === "Enter" && handleSearchSubmit()
                            }
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleSearchSubmit}
                            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <Search size={16} />
                            <span className="hidden sm:inline text-sm">Search</span>
                        </button>

                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                            title="Reload"
                        >
                            <RefreshCw
                                size={16}
                                className={refreshing ? "animate-spin" : ""}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-red-600 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && !refreshing ? (
                <div className="flex justify-center py-12">
                    <Loader className="animate-spin text-blue-600" size={32} />
                </div>
            ) : (
                <>
                    {/* List */}
                    <div className="grid gap-4 mb-6">
                        {maintenanceRecords.length > 0 ? (
                            maintenanceRecords.map((item) => (
                                <MaintenanceCard
                                    key={item.id}
                                    maintenance={item}
                                    onViewDetails={setSelectedMaintenance}
                                />
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <AlertCircle size={48} className="mx-auto mb-3 opacity-50" />
                                <p>No maintenance records found</p>
                            </div>
                        )}
                    </div>

                    {/* Load More */}
                    {nextPage && (
                        <div className="flex justify-center">
                            <button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loadingMore && <Loader className="animate-spin" size={16} />}
                                <span>Load More</span>
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Detail Modal */}
            {selectedMaintenance && (
                <MaintenanceDetail
                    maintenance={selectedMaintenance}
                    onClose={() => setSelectedMaintenance(null)}
                    onUpdate={handleRefresh}
                />
            )}
        </div>
    );
};

export default MaintenanceContent;
