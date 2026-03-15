"use client";

import { useState, useEffect } from "react";
import { Purchase, PurchaseListResponse } from "@/types/purchase";
import { PurchaseRequestCard } from "./PurchaseRequestCard";
import { PurchaseDetails } from "./PurchaseDetails";
import { ConfirmPayment } from "./ConfirmPayment";
import CompletedPurchases from "./CompletedPurchases";
import api from "@/api";

import {
  FileText,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Clock,
  Package,
} from "lucide-react";

type PurchaseTab = "requests" | "inprogress" | "done";

const RequestsContent = () => {
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [purchaseToConfirm, setPurchaseToConfirm] = useState<Purchase | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<PurchaseTab>("requests");

  // Requests state
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const getApiUrl = (tab: PurchaseTab) => {
    switch (tab) {
      case "requests":
        return "/finance/purchase/?request_status=S&status=P&is_deleted=false";
      case "inprogress":
        return "/finance/purchase/?request_status=C&status=P&is_deleted=false";
      default:
        return "";
    }
  };

  const fetchPurchases = async (loadMore = false) => {
    if (activeTab === "done") return;

    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const url = loadMore && nextUrl ? nextUrl : getApiUrl(activeTab);
      const response = await api.get<PurchaseListResponse>(url);

      if (loadMore) {
        setPurchases((prev) => [...prev, ...response.data.results]);
      } else {
        setPurchases(response.data.results);
      }
      setNextUrl(response.data.next);
      setTotalCount(response.data.count);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to fetch purchase requests"
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "done") {
      setPurchases([]);
      setNextUrl(null);
      fetchPurchases();
    }
  }, [activeTab]);

  const handleViewDetails = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
  };

  const handleConfirm = (purchase: Purchase) => {
    setPurchaseToConfirm(purchase);
  };

  const handleConfirmationSuccess = () => {
    setPurchases([]);
    setNextUrl(null);
    fetchPurchases();
  };

  const tabs = [
    { id: "requests" as PurchaseTab, label: "Requests", icon: FileText },
    { id: "inprogress" as PurchaseTab, label: "In Progress", icon: Clock },
    { id: "done" as PurchaseTab, label: "Done", icon: CheckCircle },
  ];

  const getTabClass = (tab: PurchaseTab) => {
    if (activeTab === tab) {
      return "flex-1 py-2.5 text-sm font-semibold text-[#2563EB] dark:text-[#3B82F6] border-b-2 border-[#2563EB] dark:border-[#3B82F6] transition-colors flex items-center justify-center space-x-1.5";
    }
    return "flex-1 py-2.5 text-sm font-medium text-[#6B7280] dark:text-[#94A3B8] border-b-2 border-transparent hover:text-[#111827] dark:hover:text-[#F1F5F9] transition-colors flex items-center justify-center space-x-1.5";
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#111827] dark:text-[#F1F5F9]">
          Purchase Management
        </h2>
        {activeTab !== "done" && (
          <span className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
            {totalCount} total
          </span>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-[#E5E7EB] dark:border-[#334155]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={getTabClass(tab.id)}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === "done" ? (
        <CompletedPurchases />
      ) : (
        <>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-10 h-10 rounded-full border-3 border-[#2563EB] border-t-transparent animate-spin" />
              <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
                Loading purchases...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-[#DC2626] dark:text-[#EF4444]" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-[#111827] dark:text-[#F1F5F9]">
                  Something went wrong
                </p>
                <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
                  {error}
                </p>
              </div>
              <button
                onClick={() => fetchPurchases()}
                className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#F9FAFB] dark:bg-[#1E293B] flex items-center justify-center">
                <Package className="w-7 h-7 text-[#6B7280] dark:text-[#94A3B8]" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-semibold text-[#111827] dark:text-[#F1F5F9]">
                  No purchases here
                </h3>
                <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
                  {activeTab === "requests"
                    ? "No pending requests right now"
                    : "No purchases in progress"}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {purchases.map((purchase) => (
                  <PurchaseRequestCard
                    key={purchase.id}
                    purchase={purchase}
                    onViewDetails={handleViewDetails}
                    onConfirm={handleConfirm}
                    showConfirm={activeTab === "requests"}
                  />
                ))}
              </div>

              {/* Load More */}
              {nextUrl && (
                <div className="flex justify-center pt-2 pb-4">
                  <button
                    onClick={() => fetchPurchases(true)}
                    disabled={loadingMore}
                    className="w-full px-5 py-3 bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#E5E7EB] dark:hover:bg-[#334155] text-[#111827] dark:text-[#F1F5F9] rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 border border-[#E5E7EB] dark:border-[#334155]"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <span>Load More</span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </>
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
