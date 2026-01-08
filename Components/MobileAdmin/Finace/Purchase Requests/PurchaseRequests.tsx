"use client";

import { useState } from "react";
import { usePurchaseRequests } from "@/hooks/usePurchaseRequests";
import { Purchase } from "@/types/purchase";
import { PurchaseRequestCard } from "./PurchaseRequestCard";
import { PurchaseDetails } from "./PurchaseDetails";
import { ConfirmPayment } from "./ConfirmPayment";
import CompletedPurchases from "./CompletedPurchases";

import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileText,
  CheckCircle,
} from "lucide-react";

type TabType = "requests" | "done";

const RequestsContent = () => {
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [purchaseToConfirm, setPurchaseToConfirm] = useState<Purchase | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<TabType>("requests");

  const { purchases, loading, error, refetch } =
    usePurchaseRequests(currentPage);

  const handleViewDetails = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
  };

  const handleConfirm = (purchase: Purchase) => {
    setPurchaseToConfirm(purchase);
  };

  const handleConfirmationSuccess = () => {
    refetch(); // Refresh the list after successful confirmation
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const tabs = [
    { id: "requests", label: "Requests", icon: FileText },
    { id: "done", label: "Done Purchases", icon: CheckCircle },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Header with Tabs */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Purchase Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeTab === "requests"
              ? "Manage purchase requests from teams"
              : "View completed purchase orders"}
          </p>
        </div>
        {activeTab === "requests" && (
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span className="text-sm">Refresh</span>
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-zinc-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative
                ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }
              `}
            >
              <Icon size={16} />
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content based on active tab */}
      {activeTab === "requests" ? (
        <>
          {/* Purchase Requests List */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded mb-4"></div>
                  <div className="h-20 bg-gray-200 dark:bg-zinc-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : (
            <>
              {/* Purchases Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {purchases?.results.map((purchase) => (
                  <PurchaseRequestCard
                    key={purchase.id}
                    purchase={purchase}
                    onViewDetails={handleViewDetails}
                    onConfirm={handleConfirm}
                  />
                ))}
              </div>

              {/* Pagination */}
              {purchases && purchases.count > 0 && (
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-zinc-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {(currentPage - 1) * 10 + 1} to{" "}
                    {Math.min(currentPage * 10, purchases.count)} of{" "}
                    {purchases.count} requests
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!purchases.previous}
                      className="p-2 rounded-lg border border-gray-200 dark:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
                      {currentPage}
                    </span>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!purchases.next}
                      className="p-2 rounded-lg border border-gray-200 dark:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {purchases?.results.length === 0 && (
                <div className="text-center py-12">
                  <FileText
                    size={48}
                    className="mx-auto text-gray-400 dark:text-gray-600 mb-4"
                  />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No purchase requests
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    All requests have been processed.
                  </p>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        /* Done Purchases Section */
        <div className="bg-white rounded-xl ">
          <CompletedPurchases />
        </div>
      )}

      {/* Overlays */}
      {selectedPurchase && (
        <PurchaseDetails
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          onConfirm={handleConfirm}
        />
      )}

      {purchaseToConfirm && (
        <ConfirmPayment
          purchase={purchaseToConfirm}
          onClose={() => setPurchaseToConfirm(null)}
          onSuccess={handleConfirmationSuccess}
        />
      )}
    </div>
  );
};

export default RequestsContent;
