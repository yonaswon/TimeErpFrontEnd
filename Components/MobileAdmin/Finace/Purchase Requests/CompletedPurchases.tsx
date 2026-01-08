"use client";

import React, { useState, useEffect } from "react";
import { Purchase } from "@/types/purchase";
import CompletedPurchaseDetails from "./CompletedPurchaseDetails";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle,
  ExternalLink,
  Banknote,
  Calendar,
  User,
  Package,
} from "lucide-react";
import api from "@/api";

interface PurchaseData {
  count: number;
  next: string | null;
  previous: string | null;
  results: Purchase[];
}

const CompletedPurchases = () => {
  const [purchaseData, setPurchaseData] = useState<PurchaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [currentUrl, setCurrentUrl] = useState("/finance/purchase/?status=D");

  const fetchPurchases = async (url: string = currentUrl) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(url);
      setPurchaseData(response.data);
      setCurrentUrl(url);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to fetch completed purchases"
      );
      console.error("Error fetching purchases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handlePageChange = (url: string | null) => {
    if (url) {
      fetchPurchases(url);
    }
  };

  const handleNextPage = () => {
    if (purchaseData?.next) {
      setCurrentPage((prev) => prev + 1);
      handlePageChange(purchaseData.next);
    }
  };

  const handlePrevPage = () => {
    if (purchaseData?.previous) {
      setCurrentPage((prev) => prev - 1);
      handlePageChange(purchaseData.previous);
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "D":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "P":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "C":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "D":
        return "Completed";
      case "P":
        return "Pending";
      case "C":
        return "Confirmed";
      default:
        return status;
    }
  };

  // Function to render material list
  const renderMaterialList = (purchase: Purchase) => {
    const materials = purchase.each_material_purchase;
    const hasMore = materials.length > 3;
    const displayMaterials = hasMore ? materials.slice(0, 3) : materials;

    return (
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Package className="w-3 h-3" />
          <span className="font-medium">Materials:</span>
        </div>
        <div className="space-y-1">
          {displayMaterials.map((materialPurchase) => (
            <div
              key={materialPurchase.id}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-gray-600 dark:text-gray-300 truncate max-w-[140px]">
                {materialPurchase.material.name}
              </span>
              <span className="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap ml-2">
                {materialPurchase.amount}×
              </span>
            </div>
          ))}
          {hasMore && (
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium pt-1">
              + {materials.length - 3} more materials
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading && !purchaseData) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700 animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded mb-3"></div>
              <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-zinc-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
          <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Error Loading Purchases
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => fetchPurchases()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!purchaseData?.results?.length) {
    return (
      <div className="text-center py-12">
        <CheckCircle
          size={48}
          className="mx-auto text-green-400 dark:text-green-600 mb-4"
        />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Completed Purchases
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          All purchases are still pending or in progress.
        </p>
      </div>
    );
  }

  return (
    <div className="">
      {/* Purchase Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ">
        {purchaseData.results.map((purchase) => (
          <div
            key={purchase.id}
            className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 hover:shadow-lg cursor-pointer group"
            onClick={() => setSelectedPurchase(purchase)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Purchase #{purchase.id}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {purchase.from_account.bank}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                  purchase.status
                )}`}
              >
                {getStatusText(purchase.status)}
              </span>
            </div>

            {/* Material List Section */}
            {renderMaterialList(purchase)}

            <div className="space-y-2 mb-4 mt-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">
                  {purchase.created_by.telegram_user_name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">
                  {formatDate(purchase.date)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Banknote className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(purchase.total_amount)}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-zinc-700 pt-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    To Account
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {purchase.to_account_name}
                  </p>
                </div>
                <button className="p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {purchaseData.count > 0 && (
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-zinc-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(currentPage - 1) * 10 + 1} to{" "}
            {Math.min(currentPage * 10, purchaseData.count)} of{" "}
            {purchaseData.count} completed purchases
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={!purchaseData.previous}
              className="p-2 rounded-lg border border-gray-200 dark:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
              Page {currentPage}
            </span>

            <button
              onClick={handleNextPage}
              disabled={!purchaseData.next}
              className="p-2 rounded-lg border border-gray-200 dark:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Details Overlay */}
      {selectedPurchase && (
        <CompletedPurchaseDetails
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          onRefresh={() => fetchPurchases()}
        />
      )}
    </div>
  );
};

export default CompletedPurchases;
