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
import MaintenanceContent from "./MaintenanceContent";
import ProductSalesContent from "./ProductSalesContent";
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

      let url = pageUrl || "/api/order-container/?ordering=-created_at";

      // 🔍 FIX: If URL is absolute, extract relative path
      if (url.startsWith("http")) {
        try {
          const urlObj = new URL(url);
          url = urlObj.pathname + urlObj.search;
        } catch (e) {
          console.error("Failed to parse pagination URL:", e);
        }
      }

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
      {/* Top Navigation - Segmented Control */}
      <div className="sticky top-0 z-10 bg-gray-50 dark:bg-zinc-900/95 backdrop-blur-sm pt-2 pb-2 px-4 border-b border-gray-200 dark:border-zinc-800">
        <div className="bg-gray-200/50 dark:bg-zinc-800 p-1 rounded-xl flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-zinc-700/50"
                  }`}
              >
                <Icon size={16} className={isActive ? "text-blue-600 dark:text-blue-400" : ""} />
                <span className="truncate">{tab.label}</span>
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
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center space-x-3 shrink-0">
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

        {activeTab === "maintenance" && <MaintenanceContent />}

        {activeTab === "product-sales" && <ProductSalesContent />}
      </div>

      {/* Order Detail Overlay */}
      {selectedOrder && (
        <OrderDetail order={selectedOrder} onClose={handleCloseDetails} />
      )}
    </div>
  );
};

export default OrdersContent;
