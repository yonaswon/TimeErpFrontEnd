"use client";

import React, { useState, useEffect } from "react";
import api from "@/api";
import {
  Package,
  Filter,
  ChevronDown,
  CheckCircle,
  XCircle,
  Warehouse,
  PlusCircle,
  Edit,
  History,
  List,
} from "lucide-react";
import ReleaseEditOverlay from "./ReleaseEditOverlay";
import AddBomOverlay from "./AddBomOverlay";

interface Release {
  id: number;
  material: {
    id: number;
    name: string;
    type: string;
    code_name: string;
    available: string;
    parsialy_available: string;
    min_threshold: number;
    width: string | null;
    height: string | null;
    date: string;
    stats: any;
  };
  reason:
  | "ORDER"
  | "ADD"
  | "MAINTENANCE"
  | "SALES"
  | "TRANSFER"
  | "WASTE"
  | "DAMAGED";
  amount: string;
  proof_image: string | null;
  confirmed: boolean;
  date: string;
  order: number;
  maintenance: number | null;
  inventory: number;
  released_by: number;
  each_areal_material: any[];
  // New fields
  is_edited: boolean;
  l_and_p_material_records_for_eidt: any[];
}

interface Bom {
  id: number;
  material: {
    id: number;
    name: string;
    code_name: string;
    type: string;
  };
  amount: string | null;
  width: string | null;
  height: string | null;
  released: boolean;
}

interface OrderDetailResponse {
  boms: Bom[];
}

interface ReleasesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Release[];
}

const ReleaseContent = ({ id }: { id: number }) => {
  const [activeTab, setActiveTab] = useState<"releases" | "boms">("releases");

  const [releases, setReleases] = useState<Release[]>([]);
  const [boms, setBoms] = useState<Bom[]>([]);
  const [selectedBomIds, setSelectedBomIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [releasingBoms, setReleasingBoms] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Overlays
  const [editOverlayOpen, setEditOverlayOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [addBomOverlayOpen, setAddBomOverlayOpen] = useState(false);

  // Filter states
  const [reasonFilter, setReasonFilter] = useState<string>("ALL");
  const [inventoryFilter, setInventoryFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [availableInventories, setAvailableInventories] = useState<number[]>([]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchReleases(), fetchBoms()]);
    setLoading(false);
  };

  const fetchReleases = async (url?: string, append: boolean = false) => {
    try {
      if (url) {
        setLoadingMore(true);
      }
      setError(null);

      const endpoint = url || `/api/release/?order=${id}`;
      const response = await api.get<ReleasesResponse>(endpoint);

      if (append) {
        setReleases((prev) => [...prev, ...response.data.results]);
      } else {
        setReleases(response.data.results);
        const inventories = [
          ...new Set(response.data.results.map((r) => r.inventory)),
        ];
        setAvailableInventories(inventories);
      }

      setNextUrl(response.data.next);
      setHasMore(!!response.data.next);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch releases");
      console.error("Error fetching releases:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchBoms = async () => {
    try {
      const resp = await api.get<OrderDetailResponse>(`/api/orders/${id}/`);
      setBoms(resp.data.boms || []);
    } catch (err) {
      console.error("Failed to fetch BOMs", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleEditRelease = (release: Release) => {
    setSelectedRelease(release);
    setEditOverlayOpen(true);
  };

  const handleUpdateRelease = async (
    newAmount: any
  ): Promise<{ success: boolean; message: string }> => {
    if (!selectedRelease)
      return { success: false, message: "No release selected" };

    try {
      const response = await api.post(
        `/api/release/${selectedRelease.id}/edit_release/`,
        { amount: newAmount }
      );

      // Update the release in the list
      setReleases((prev) =>
        prev.map((release) =>
          release.id === selectedRelease.id
            ? {
              ...release,
              amount: newAmount,
              is_edited: true,
              l_and_p_material_records_for_eidt:
                response.data.landp_record || [],
            }
            : release
        )
      );

      setEditOverlayOpen(false);
      return { success: true, message: "Release updated successfully" };
    } catch (error: any) {
      const msg =
        typeof error.response?.data?.error === "string"
          ? error.response.data.error
          : error.message || "Failed to update release";
      return {
        success: false,
        message: msg,
      };
    }
  };

  const handleReleaseSelectedBoms = async () => {
    if (selectedBomIds.length === 0) return;
    try {
      setReleasingBoms(true);
      await api.post(`/api/orders/${id}/release_boms/`, {
        bom_ids: selectedBomIds,
      });
      setSelectedBomIds([]);
      // Refresh
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to release BOMs");
    } finally {
      setReleasingBoms(false);
    }
  };

  const toggleBomSelection = (bomId: number) => {
    setSelectedBomIds((prev) =>
      prev.includes(bomId)
        ? prev.filter((i) => i !== bomId)
        : [...prev, bomId]
    );
  };

  const handleLoadMore = () => {
    if (nextUrl && !loadingMore) {
      fetchReleases(nextUrl, true);
    }
  };

  const handleFilterChange = () => {
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setReasonFilter("ALL");
    setInventoryFilter("ALL");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case "ORDER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "ADD":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "SALES":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "ORDER":
        return "Order";
      case "ADD":
        return "Additional";
      case "MAINTENANCE":
        return "Maintenance";
      case "SALES":
        return "Sales";
      default:
        return reason;
    }
  };

  // Filter releases based on selected filters
  const filteredReleases = releases.filter((release) => {
    if (reasonFilter !== "ALL" && release.reason !== reasonFilter) {
      return false;
    }
    if (
      inventoryFilter !== "ALL" &&
      release.inventory.toString() !== inventoryFilter
    ) {
      return false;
    }
    return true;
  });

  const formatAmount = (amount: string, type: string) => {
    return `${amount} ${type === "A" ? "m²" : "m"}`;
  };

  const renderReleasesList = () => {
    if (loading && releases.length === 0) {
      return (
        <div className="space-y-3 p-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-800 rounded-xl p-4 animate-pulse"
            >
              <div className="h-5 bg-gray-200 dark:bg-zinc-700 rounded mb-3 w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded mb-2 w-2/3"></div>
              <div className="h-8 bg-gray-200 dark:bg-zinc-700 rounded"></div>
            </div>
          ))}
        </div>
      );
    }

    if (error && releases.length === 0) {
      return (
        <div className="text-center py-8 px-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <Package className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Releases
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => fetchReleases()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (releases.length === 0) {
      return (
        <div className="text-center py-8 px-4">
          <Package className="mx-auto text-gray-400 dark:text-gray-600 w-10 h-10 mb-3" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            No Releases Found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No releases have been recorded for this order yet.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4 p-4">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-4 border border-blue-200 dark:border-blue-800/50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-blue-900 dark:text-blue-300">
              ORD-{id}
            </h2>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Order Releases: {releases.length} total releases
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Filters
              </h3>
              <button
                onClick={handleResetFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Reset All
              </button>
            </div>

            {/* Reason Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Release Reason
              </label>
              <div className="flex gap-2">
                {["ALL", "ORDER", "ADD"].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setReasonFilter(reason)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${reasonFilter === reason
                        ? reason === "ALL"
                          ? "bg-gray-800 text-white dark:bg-gray-700"
                          : getReasonColor(reason)
                        : "bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-gray-300"
                      }`}
                  >
                    {reason === "ALL" ? "All" : getReasonLabel(reason)}
                  </button>
                ))}
              </div>
            </div>

            {/* Inventory Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Inventory
              </label>
              <div className="relative">
                <select
                  value={inventoryFilter}
                  onChange={(e) => setInventoryFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg text-gray-900 dark:text-white text-sm"
                >
                  <option value="ALL">All Inventories</option>
                  {availableInventories.map((invId) => (
                    <option key={invId} value={invId.toString()}>
                      Inventory #{invId}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={handleFilterChange}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Apply Filters
            </button>
          </div>
        )}

        {/* Filter Summary */}
        {(reasonFilter !== "ALL" || inventoryFilter !== "ALL") && (
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600 dark:text-gray-400">
              Showing {filteredReleases.length} of {releases.length} releases
            </div>
            <button
              onClick={handleResetFilters}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Releases List */}
        <div className="space-y-3">
          {filteredReleases.map((release) => (
            <div
              key={release.id}
              className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {release.material.name}
                    </h3>
                    {release.is_edited && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        <History className="w-3 h-3 mr-1" />
                        Edited
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{release.material.code_name}</span>
                    <span>•</span>
                    <span>{formatDate(release.date)}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getReasonColor(
                      release.reason
                    )}`}
                  >
                    {getReasonLabel(release.reason)}
                  </span>
                  <div className="flex items-center gap-1">
                    {release.confirmed ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-yellow-500" />
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {release.confirmed ? "Confirmed" : "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Amount
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatAmount(release.amount, release.material.type)}
                    </div>
                    {release.is_edited && (
                      <button
                        onClick={() => handleEditRelease(release)}
                        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="Edit release"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Inventory
                  </div>
                  <div className="flex items-center gap-1">
                    <Warehouse className="w-3 h-3 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      #{release.inventory}
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit button for non-edited releases */}
              {!release.is_edited && (
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => handleEditRelease(release)}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Release
                  </button>
                </div>
              )}

              {/* Additional Info */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-zinc-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Release #{release.id}
                </div>
                {release.proof_image && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    Proof available
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && filteredReleases.length > 0 && (
          <div className="pt-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-sm font-medium">Loading more...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Load More Releases</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* No results after filtering */}
        {filteredReleases.length === 0 && releases.length > 0 && (
          <div className="text-center py-8 px-4">
            <Filter className="mx-auto text-gray-400 dark:text-gray-600 w-10 h-10 mb-3" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              No matching releases
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Try changing your filter settings
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderBomsList = () => {
    if (loading) {
      return (
        <div className="space-y-3 p-4">
          <div className="h-20 bg-gray-200 dark:bg-zinc-700 animate-pulse rounded-xl" />
          <div className="h-20 bg-gray-200 dark:bg-zinc-700 animate-pulse rounded-xl" />
        </div>
      );
    }

    return (
      <div className="space-y-4 p-4 relative h-full flex flex-col">
        <div className="bg-linear-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-xl p-4 border border-green-200 dark:border-green-800/50 flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-green-900 dark:text-green-300">
                Order BOMs
              </h2>
              <p className="text-sm text-green-700 dark:text-green-400">
                {boms.filter((b) => !b.released).length} Unreleased / {boms.length} Total
              </p>
            </div>
            <button
              onClick={() => setAddBomOverlayOpen(true)}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <PlusCircle className="w-5 h-5" />
              Add BOM
            </button>
          </div>
        </div>

        {boms.length === 0 ? (
          <div className="text-center py-8 px-4 flex-1">
            <List className="mx-auto text-gray-400 w-10 h-10 mb-3" />
            <p className="text-sm text-gray-500">No BOMs found for this order.</p>
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-y-auto pb-20">
            {boms.map((bom) => (
              <div
                key={bom.id}
                onClick={() => {
                  if (!bom.released) toggleBomSelection(bom.id);
                }}
                className={`flex items-center p-4 rounded-xl border transition-colors ${bom.released
                    ? "bg-gray-50 border-gray-200 dark:bg-zinc-800/50 dark:border-zinc-700 opacity-70"
                    : selectedBomIds.includes(bom.id)
                      ? "bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-700 cursor-pointer"
                      : "bg-white border-gray-200 dark:bg-zinc-800 dark:border-zinc-700 hover:border-blue-300 cursor-pointer"
                  }`}
              >
                {!bom.released && (
                  <div className="mr-3">
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center ${selectedBomIds.includes(bom.id)
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300 dark:border-zinc-600"
                        }`}
                    >
                      {selectedBomIds.includes(bom.id) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {bom.material.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block sm:inline">
                      ({bom.material.code_name})
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {bom.material.type === "A" ? (
                      <span>
                        {bom.width}m × {bom.height}m
                      </span>
                    ) : (
                      <span>
                        {bom.amount} {bom.material.type === "L" ? "m" : "pcs"}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  {bom.released ? (
                    <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Released
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-1 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                      Unreleased
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedBomIds.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 max-w-sm mx-auto z-10">
            <button
              onClick={handleReleaseSelectedBoms}
              disabled={releasingBoms}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl shadow-xl hover:bg-blue-700 transition font-bold disabled:opacity-75 flex items-center justify-center gap-2"
            >
              {releasingBoms ? "Releasing..." : `Release Selected (${selectedBomIds.length})`}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 dark:bg-zinc-900">
      <div className="flex border-b border-gray-200 dark:border-zinc-800 shrink-0">
        <button
          onClick={() => setActiveTab("releases")}
          className={`flex-1 flex justify-center py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "releases"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
        >
          Releases History
        </button>
        <button
          onClick={() => setActiveTab("boms")}
          className={`flex-1 flex justify-center py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "boms"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
        >
          Order BOMs
        </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full max-w-full">
        {activeTab === "releases" ? renderReleasesList() : renderBomsList()}
      </div>

      {editOverlayOpen && selectedRelease && (
        <ReleaseEditOverlay
          release={selectedRelease}
          isOpen={editOverlayOpen}
          onClose={() => setEditOverlayOpen(false)}
          onUpdate={handleUpdateRelease}
        />
      )}

      {addBomOverlayOpen && (
        <AddBomOverlay
          orderId={id}
          isOpen={addBomOverlayOpen}
          onClose={() => setAddBomOverlayOpen(false)}
          onSuccess={() => fetchData()}
        />
      )}
    </div>
  );
};

export default ReleaseContent;