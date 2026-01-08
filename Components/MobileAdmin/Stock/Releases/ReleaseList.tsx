"use client";

import React, { useState, useEffect } from "react";
import api from "@/api";
import { Release, ReleasesResponse } from "./types/release";
import { ReleaseCard } from "./ReleaseCard";
import { ReleaseDetails } from "./ReleaseDetails";
import { Package, RefreshCw, ChevronDown } from "lucide-react";

export const ReleaseList = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchReleases = async (url?: string) => {
    try {
      if (url) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const endpoint = url || "/api/release/?ordering=-date";
      const response = await api.get<ReleasesResponse>(endpoint);

      if (url) {
        // Append to existing releases for load more
        setReleases((prev) => [...prev, ...response.data.results]);
      } else {
        // Initial load
        setReleases(response.data.results);
      }

      setNextUrl(response.data.next);
      setHasMore(!!response.data.next);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch releases");
      console.error("Error fetching releases:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const handleLoadMore = () => {
    if (nextUrl && !loadingMore) {
      fetchReleases(nextUrl);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
    }).format(amount);
  };

  // Function to group releases by date (day)
  const groupReleasesByDate = () => {
    const groups: { [key: string]: Release[] } = {};

    releases.forEach((release) => {
      const date = new Date(release.date);
      const dateKey = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(release);
    });

    return groups;
  };

  const releaseGroups = groupReleasesByDate();
  const releaseDates = Object.keys(releaseGroups);

  if (loading && releases.length === 0) {
    return (
      <div className="w-full space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-800 rounded-xl p-4 animate-pulse"
          >
            <div className="h-5 bg-gray-200 dark:bg-zinc-700 rounded mb-3"></div>
            <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error && releases.length === 0) {
    return (
      <div className="w-full text-center py-8 px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
          <Package className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          Error Loading Releases
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => fetchReleases()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  if (releases.length === 0) {
    return (
      <div className="w-full text-center py-8 px-4">
        <Package
          size={40}
          className="mx-auto text-gray-400 dark:text-gray-600 mb-3"
        />
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          No Releases Found
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No material releases have been recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Material Releases
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {releases.length} releases loaded
          </p>
        </div>
        <button
          onClick={() => fetchReleases()}
          className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Releases List Grouped by Date */}
      <div className="space-y-6">
        {releaseDates.map((date) => (
          <div key={date} className="space-y-3">
            {/* Date Header */}
            <div className="sticky top-0 z-10 bg-gray-50 dark:bg-zinc-900/80 backdrop-blur-sm py-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {date}
              </h3>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {releaseGroups[date].length} releases
              </div>
            </div>

            {/* Releases for this date */}
            <div className="space-y-3">
              {releaseGroups[date].map((release) => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  onClick={() => setSelectedRelease(release)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-zinc-700">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">
                  Loading more releases...
                </span>
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" />
                <span className="text-sm font-medium">Load More Releases</span>
              </>
            )}
          </button>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
            Showing {releases.length} of many releases
          </p>
        </div>
      )}

      {!hasMore && releases.length > 0 && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
            <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All {releases.length} releases loaded
          </p>
        </div>
      )}

      {/* Details Overlay */}
      {selectedRelease && (
        <ReleaseDetails
          release={selectedRelease}
          onClose={() => setSelectedRelease(null)}
          onRefresh={() => fetchReleases()}
        />
      )}
    </div>
  );
};
