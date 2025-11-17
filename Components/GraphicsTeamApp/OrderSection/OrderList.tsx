"use client";
import { useState, useEffect } from "react";
import api from "@/api";
import OrderCard from "./OrderCard";
import { Order, OrdersResponse } from "./types";

const OrderList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const fetchOrders = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const response: any = await api.get(
        `/api/orders/?ordering=-created_at&p=${pageNum}`
      );
      const data: OrdersResponse = response.data;

      setOrders(data.results);
      setHasNext(!!data.next);
      setHasPrev(!!data.previous);
      setError(null);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleNext = () => {
    if (hasNext) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchOrders(nextPage);
    }
  };

  const handlePrev = () => {
    if (hasPrev && page > 1) {
      const prevPage = page - 1;
      setPage(prevPage);
      fetchOrders(prevPage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 dark:text-red-400 mb-4">
          Error: {error}
        </div>
        <button
          onClick={() => fetchOrders()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Orders List */}
      <div className="space-y-3">
        {orders &&
          orders?.map((order) => (
            <OrderCard key={order.order_code} order={order} />
          ))}
      </div>

      {/* Pagination */}
      {orders.length > 0 && (
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-zinc-700">
          <button
            onClick={handlePrev}
            disabled={!hasPrev}
            className={`px-4 py-2 rounded-lg ${
              hasPrev
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400 cursor-not-allowed"
            } transition-colors`}
          >
            Previous
          </button>

          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page}
          </span>

          <button
            onClick={handleNext}
            disabled={!hasNext}
            className={`px-4 py-2 rounded-lg ${
              hasNext
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400 cursor-not-allowed"
            } transition-colors`}
          >
            Next
          </button>
        </div>
      )}

      {orders.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No orders found.
        </div>
      )}
    </div>
  );
};

export default OrderList;
