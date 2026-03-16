"use client";

import { useState, useEffect } from "react";
import {
    X,
    Search,
    Merge,
    Loader,
    AlertTriangle,
    Package,
    Phone,
    MapPin,
    Check,
} from "lucide-react";
import api from "@/api";

interface ContainerMergeProps {
    targetContainer: any;
    onClose: () => void;
    onMergeComplete: () => void;
}

const ContainerMerge = ({
    targetContainer,
    onClose,
    onMergeComplete,
}: ContainerMergeProps) => {
    const [containers, setContainers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedContainer, setSelectedContainer] = useState<any>(null);
    const [confirming, setConfirming] = useState(false);
    const [merging, setMerging] = useState(false);
    const [mergeError, setMergeError] = useState<string | null>(null);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchContainers = async (pageUrl?: string, isLoadMore = false) => {
        try {
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setError(null);

            let url =
                pageUrl || "/api/order-container/?ordering=-created_at&page_size=20";

            if (url.startsWith("http")) {
                try {
                    const urlObj = new URL(url);
                    url = urlObj.pathname + urlObj.search;
                } catch (e) {
                    console.error("Failed to parse pagination URL:", e);
                }
            }

            const response = await api.get(url);
            const results = (response.data.results || []).filter(
                (c: any) => c.id !== targetContainer.id
            );

            if (isLoadMore) {
                setContainers((prev) => [...prev, ...results]);
            } else {
                setContainers(results);
            }
            setNextPage(response.data.next);
        } catch (err: any) {
            setError(err.message || "Failed to fetch containers");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchContainers();
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (!query) {
            fetchContainers();
        }
    };

    const handleSearchSubmit = () => {
        const searchUrl = `/api/order-container/?ordering=-created_at&page_size=20&search=${encodeURIComponent(
            searchQuery
        )}`;
        fetchContainers(searchUrl);
    };

    const handleSelect = (container: any) => {
        setSelectedContainer(container);
        setConfirming(true);
        setMergeError(null);
    };

    const handleConfirmMerge = async () => {
        if (!selectedContainer) return;
        setMerging(true);
        setMergeError(null);

        try {
            await api.post(
                `/api/order-container/${targetContainer.id}/merge_container/`,
                { source_container_id: selectedContainer.id }
            );
            onMergeComplete();
        } catch (err: any) {
            const msg =
                err.response?.data?.error ||
                err.message ||
                "Failed to merge containers";
            setMergeError(msg);
        } finally {
            setMerging(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
        }).format(new Date(dateString));
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[999]">
            <div className="bg-white dark:bg-zinc-900 w-full h-[80vh] mb-16 sm:mb-0 sm:h-[90vh] sm:max-w-lg sm:rounded-xl shadow-2xl flex flex-col overflow-hidden border sm:border border-gray-200 dark:border-zinc-800 rounded-xl">
                {/* Header */}
                <div className="shrink-0 p-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <Merge
                                    size={20}
                                    className="text-blue-600 dark:text-blue-400"
                                />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Merge Container
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Select a container to merge into{" "}
                                    <span className="font-semibold">
                                        &quot;{targetContainer.client}&quot;
                                    </span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={16}
                        />
                        <input
                            type="text"
                            placeholder="Search by client, contact, location..."
                            value={searchQuery}
                            onChange={handleSearch}
                            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 dark:border-zinc-600 rounded-lg bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Confirmation View */}
                {confirming && selectedContainer ? (
                    <div className="flex flex-col flex-1 min-h-0">
                        <div className="flex-1 overflow-y-auto p-4 pb-2">
                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle
                                        size={20}
                                        className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                                            Confirm Merge
                                        </p>
                                        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                                            This will move all orders from{" "}
                                            <span className="font-bold">
                                                &quot;{selectedContainer.client}&quot;
                                            </span>{" "}
                                            into{" "}
                                            <span className="font-bold">
                                                &quot;{targetContainer.client}&quot;
                                            </span>
                                            . The source container and its payments will be{" "}
                                            <span className="font-bold text-red-600 dark:text-red-400">
                                                permanently deleted
                                            </span>
                                            .
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Source container info */}
                            <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4 mb-4">
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                    Merging From (Will Be Deleted)
                                </p>
                                <p className="font-bold text-gray-900 dark:text-white text-base mb-1">
                                    {selectedContainer.client}
                                </p>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    <Phone size={12} />
                                    <span>{selectedContainer.contact}</span>
                                    <span className="mx-1">•</span>
                                    <MapPin size={12} />
                                    <span>{selectedContainer.location}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedContainer.orders?.map((o: any) => (
                                        <span
                                            key={o.order_code}
                                            className="font-mono text-xs bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded"
                                        >
                                            ORD-{o.order_code}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex justify-center my-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Merge
                                        size={16}
                                        className="text-blue-600 dark:text-blue-400 rotate-90"
                                    />
                                </div>
                            </div>

                            {/* Target container info */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
                                    Merging Into (Will Keep)
                                </p>
                                <p className="font-bold text-gray-900 dark:text-white text-base mb-1">
                                    {targetContainer.client}
                                </p>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    <Phone size={12} />
                                    <span>{targetContainer.contact}</span>
                                    <span className="mx-1">•</span>
                                    <MapPin size={12} />
                                    <span>{targetContainer.location}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {targetContainer.orders?.map((o: any) => (
                                        <span
                                            key={o.order_code}
                                            className="font-mono text-xs bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded"
                                        >
                                            ORD-{o.order_code}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {mergeError && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {mergeError}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Sticky Action Buttons */}
                        <div className="shrink-0 p-4 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setConfirming(false);
                                        setSelectedContainer(null);
                                        setMergeError(null);
                                    }}
                                    disabled={merging}
                                    className="flex-1 py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleConfirmMerge}
                                    disabled={merging}
                                    className="flex-1 py-3 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {merging ? (
                                        <>
                                            <Loader size={16} className="animate-spin" />
                                            Merging...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} />
                                            Confirm Merge
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Container List */
                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader
                                    size={32}
                                    className="animate-spin text-blue-600 mb-3"
                                />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Loading containers...
                                </p>
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                                    {error}
                                </p>
                                <button
                                    onClick={() => fetchContainers()}
                                    className="text-sm text-red-600 dark:text-red-400 font-medium hover:underline"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : containers.length === 0 ? (
                            <div className="text-center py-12">
                                <Package
                                    size={48}
                                    className="mx-auto text-gray-300 dark:text-zinc-600 mb-3"
                                />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No other containers found
                                </p>
                            </div>
                        ) : (
                            <>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                    Select a container to merge its orders into &quot;
                                    {targetContainer.client}&quot;
                                </p>
                                <div className="space-y-3">
                                    {containers.map((container) => (
                                        <button
                                            key={container.id}
                                            onClick={() => handleSelect(container)}
                                            className="w-full text-left bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all active:scale-[0.98]"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                                                        {container.client}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        Container #{container.id} •{" "}
                                                        {formatDate(container.created_at)}
                                                    </p>
                                                </div>
                                                <span className="text-xs font-mono bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded shrink-0 ml-2">
                                                    {container.orders?.length || 0} orders
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                <span className="flex items-center gap-1">
                                                    <Phone size={11} />
                                                    {container.contact}
                                                </span>
                                                <span className="flex items-center gap-1 truncate">
                                                    <MapPin size={11} className="shrink-0" />
                                                    <span className="truncate">
                                                        {container.location}
                                                    </span>
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-1">
                                                {container.orders?.slice(0, 5).map((o: any) => (
                                                    <span
                                                        key={o.order_code}
                                                        className="font-mono text-[10px] bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded"
                                                    >
                                                        ORD-{o.order_code}
                                                    </span>
                                                ))}
                                                {(container.orders?.length || 0) > 5 && (
                                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 px-1.5 py-0.5">
                                                        +{container.orders.length - 5} more
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Load More */}
                                {nextPage && !loadingMore && (
                                    <div className="flex justify-center mt-4">
                                        <button
                                            onClick={() => fetchContainers(nextPage, true)}
                                            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                        >
                                            Load More
                                        </button>
                                    </div>
                                )}
                                {loadingMore && (
                                    <div className="flex justify-center items-center py-4">
                                        <Loader
                                            size={20}
                                            className="animate-spin text-blue-600 mr-2"
                                        />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Loading more...
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContainerMerge;
