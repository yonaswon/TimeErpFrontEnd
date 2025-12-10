"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Wrench,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Loader,
  Package,
} from "lucide-react";
import OrderCard from "./OrderCard";
import OrderDetail from "./OrderDetail";
import api from "@/api";

type OrdersTabType = "orders" | "maintenance" | "product-sales";

const OrdersContent = () => {
  const [activeTab, setActiveTab] = useState<OrdersTabType>("orders");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Pagination state
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch orders from API
  const fetchOrders = async (pageUrl?: string, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const url = pageUrl || "/api/order-container/?ordering=-created_at";
      const response = await api.get(url);

      if (isLoadMore) {
        // Append new orders to existing ones
        setOrders((prev) => [...prev, ...response.data.results]);
      } else {
        // Replace orders for new search or initial load
        setOrders(response.data.results || []);
      }

      setNextPage(response.data.next);
      setTotalCount(response.data.count);
      setCurrentPage((prev) => (isLoadMore ? prev + 1 : 1));
    } catch (err: any) {
      console.error("Fetch error:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to fetch orders";
      setError(errorMessage);

      if (!isLoadMore) {
        setOrders([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Initial load and refresh
  useEffect(() => {
    fetchOrders();
  }, []);

  const tabs = [
    { id: "orders" as OrdersTabType, label: "Orders", icon: ShoppingCart },
    { id: "maintenance" as OrdersTabType, label: "Maintenance", icon: Wrench },
    {
      id: "product-sales" as OrdersTabType,
      label: "Product Sales",
      icon: TrendingUp,
    },
  ];

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
    fetchOrders();
  };

  const handleMenuClick = (order: any) => {
    // Handle menu actions
    console.log("Menu clicked for order:", order.id);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleLoadMore = () => {
    if (nextPage) {
      fetchOrders(nextPage, true);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Debounced search - you can implement proper debounce if needed
    if (!query) {
      fetchOrders();
    }
  };

  const handleSearchSubmit = () => {
    // Trigger search when user presses enter or search button
    const searchUrl = `/api/order-container/?ordering=-created_at&search=${encodeURIComponent(
      searchQuery
    )}`;
    fetchOrders(searchUrl);
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.contact?.includes(searchQuery) ||
      order.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show loading state
  if (loading && !refreshing) {
    return (
      <div className="w-full bg-gray-50 dark:bg-zinc-900 min-h-screen p-4">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 dark:bg-zinc-900 min-h-screen transition-colors duration-300">
      {/* Top Navigation */}
      <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 sticky top-0 z-10">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 min-w-max flex-1 justify-center border-b-2 transition-colors duration-200 ${
                  isActive
                    ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full p-4">
        {activeTab === "orders" && (
          <div className="w-full">
            {/* Header with Search and Refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Orders
                </h1>
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-sm px-2 py-1 rounded-full">
                  {totalCount.toLocaleString()}
                </span>
                {currentPage > 1 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Page {currentPage}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={handleSearch}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleSearchSubmit()
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleSearchSubmit}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  <Search size={18} />
                  <span>Search</span>
                </button>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    size={18}
                    className={refreshing ? "animate-spin" : ""}
                  />
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600 dark:text-red-400 text-sm">
                      {error}
                    </span>
                  </div>
                  <button
                    onClick={() => fetchOrders()}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Orders List */}
            <div className="grid gap-4 mb-6">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onViewDetails={handleViewDetails}
                  onMenuClick={handleMenuClick}
                />
              ))}
            </div>

            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-gray-500 dark:text-gray-400">
                  Loading more orders...
                </span>
              </div>
            )}

            {/* Load More Button */}
            {nextPage && !loadingMore && (
              <div className="flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Loader size={18} />
                  <span>Load More Orders</span>
                </button>
              </div>
            )}

            {/* No Orders Message */}
            {orders.length === 0 && !loading && !error && (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <Package size={64} className="mx-auto opacity-50" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                  No orders found
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "There are no orders to display"}
                </p>
              </div>
            )}

            {/* End of Results */}
            {!nextPage && orders.length > 0 && (
              <div className="text-center py-6">
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  You've reached the end of the orders list
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  Showing {orders.length} of {totalCount.toLocaleString()}{" "}
                  orders
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "maintenance" && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Wrench size={64} className="mx-auto opacity-50" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              Maintenance tab coming soon...
            </p>
          </div>
        )}

        {activeTab === "product-sales" && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <TrendingUp size={64} className="mx-auto opacity-50" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              Product Sales tab coming soon...
            </p>
          </div>
        )}
      </div>

      {/* Order Detail Overlay */}
      {selectedOrder && (
        <OrderDetail order={selectedOrder} onClose={handleCloseDetails} />
      )}
    </div>
  );
};

export default OrdersContent;
