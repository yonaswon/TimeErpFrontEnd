"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import api from "@/api";
import OrderCard from "./OrderCard";
import { Order, OrdersResponse } from "./types";

const OrderList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  type FilterType = "ALL" | "ASSIGNED" | "FILLED" | "PENDING";
  const [activeFilter, setActiveFilter] = useState<FilterType>("ASSIGNED");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const getUserData = () => {
    try {
      return JSON.parse(localStorage.getItem('user_data') || '{}');
    } catch {
      return {};
    }
  };
  const userData = getUserData();
  const userId = userData.user_id;

  const fetchOrders = useCallback(async (pageNum: number = 1, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      let query = `/api/orders/?ordering=-created_at&p=${pageNum}`;

      if (activeFilter === "ASSIGNED" && userId) {
        query += `&designer=${userId}`;
      } else if (activeFilter === "FILLED") {
        query += `&is_filled=true`;
      } else if (activeFilter === "PENDING") {
        query += `&is_filled=false&hide_duplicate_siblings=true`;
      }

      if (debouncedSearch) {
        query += `&search=${encodeURIComponent(debouncedSearch)}`;
      }

      const response: any = await api.get(query);
      const data: OrdersResponse = response.data;

      if (isLoadMore) {
        setOrders(prev => [...prev, ...data.results]);
      } else {
        setOrders(data.results);
      }

      setHasNext(!!data.next);
      setError(null);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching orders");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeFilter, debouncedSearch, userId]);

  useEffect(() => {
    setOrders([]);
    setPage(1);
    fetchOrders(1, false);
  }, [activeFilter, debouncedSearch, fetchOrders]);

  const handleLoadMore = () => {
    if (hasNext) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchOrders(nextPage, true);
    }
  };

  const tabs: { id: FilterType; label: string }[] = [
    { id: "ASSIGNED", label: "Assigned to You" },
    { id: "ALL", label: "All Orders" },
    { id: "FILLED", label: "Filled" },
    { id: "PENDING", label: "Pending" },
  ];

  const isSearching = search.trim() !== debouncedSearch;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or order code…"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-10 pr-10 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isSearching && (
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">Searching…</p>
      )}

      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === tab.id
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && !loadingMore && orders.length === 0 ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error && orders.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-red-600 dark:text-red-400 mb-4">
            Error: {error}
          </div>
          <button
            onClick={() => fetchOrders(1, false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard
                key={order.order_code}
                order={order}
                onRefresh={() => fetchOrders(1, false)}
              />
            ))}
          </div>

          {hasNext && (
            <div className="flex justify-center pt-4 pb-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2 bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}

          {!loading && orders.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-zinc-800 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700">
              {debouncedSearch
                ? `No orders found for "${debouncedSearch}".`
                : "No orders found for this filter."}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderList;
