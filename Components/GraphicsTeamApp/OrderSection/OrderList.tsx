"use client";
import { useState, useEffect } from "react";
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

  type FilterType = "ALL" | "ASSIGNED" | "FILLED" | "PENDING";
  const [activeFilter, setActiveFilter] = useState<FilterType>("ASSIGNED");

  // Get user data
  const getUserData = () => {
    try {
      return JSON.parse(localStorage.getItem('user_data') || '{}');
    } catch {
      return {};
    }
  };
  const userData = getUserData();
  const userId = userData.user_id; // Assuming user_id is active user ID

  const fetchOrders = async (pageNum: number = 1, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      let query = `/api/orders/?ordering=-created_at&p=${pageNum}`;

      // Apply filters
      if (activeFilter === "ASSIGNED" && userId) {
        query += `&designer=${userId}`;
      } else if (activeFilter === "FILLED") {
        query += `&is_filled=true`;
      } else if (activeFilter === "PENDING") {
        query += `&is_filled=false`;
      }
      // "ALL" doesn't need extra params

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
  };

  // Reset and fetch when filter changes
  useEffect(() => {
    setPage(1);
    fetchOrders(1, false);
  }, [activeFilter]);

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

  if (loading && !loadingMore && orders.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
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

      {/* Orders List */}
      <div className="space-y-3">
        {orders.map((order) => (
          <OrderCard
            key={order.order_code}
            order={order}
            onRefresh={() => fetchOrders(1, false)} // Refresh resets list
          />
        ))}
      </div>

      {/* Load More Button */}
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
          No orders found for this filter.
        </div>
      )}
    </div>
  );
};

export default OrderList;
