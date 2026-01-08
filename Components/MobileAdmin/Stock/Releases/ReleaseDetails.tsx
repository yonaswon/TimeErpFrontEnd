"use client";

import React, { useState, useEffect } from "react";
import {
  Release,
  Order,
  Maintenance,
  MaterialSalesRecord,
} from "./types/release";
import { DetailOrderDisplayer } from "./DetailOrderDisplayer";
import { DetailMaintenance } from "./DetailMaintenance";
import { DetailProductSalesDisplayer } from "./DetailProductSalesDisplayer";
import {
  X,
  Package,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  FileImage,
  AlertCircle,
  Database,
  List,
  TrendingUp,
} from "lucide-react";
import api from "@/api";

interface ReleaseDetailsProps {
  release: Release;
  onClose: () => void;
  onRefresh?: () => void;
}

export const ReleaseDetails: React.FC<ReleaseDetailsProps> = ({
  release,
  onClose,
  onRefresh,
}) => {
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [maintenanceData, setMaintenanceData] = useState<Maintenance | null>(
    null
  );
  const [salesData, setSalesData] = useState<MaterialSalesRecord | null>(null);
  const [relatedReleases, setRelatedReleases] = useState<Release[]>([]);
  const [materialHistory, setMaterialHistory] = useState<Release[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRelatedData = async () => {
    if (loadingDetail) return;

    try {
      setLoadingDetail(true);
      setError(null);

      // Fetch related data based on reason
      if (release.reason === "ORDER" && release.order) {
        const [orderResponse] = await Promise.all([
          api.get<Order>(`/api/orders/${release.order}/`),
          fetchRelatedReleases(),
          fetchMaterialHistory(),
        ]);
        setOrderData(orderResponse.data);
      } else if (release.reason === "MAINTENANCE" && release.maintenance) {
        const [maintenanceResponse] = await Promise.all([
          api.get<Maintenance>(`/api/maintenance/${release.maintenance}/`),
          fetchRelatedReleases(),
          fetchMaterialHistory(),
        ]);
        setMaintenanceData(maintenanceResponse.data);
      } else if (release.reason === "SALES") {
        // For sales, we might need to fetch from a different endpoint
        await Promise.all([
          fetchSalesRecord(),
          fetchRelatedReleases(),
          fetchMaterialHistory(),
        ]);
      } else {
        // For other reasons like ADD, TRANSFER, etc.
        await Promise.all([fetchRelatedReleases(), fetchMaterialHistory()]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch related data");
      console.error("Error fetching related data:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchRelatedReleases = async () => {
    try {
      setLoadingRelated(true);
      let endpoint = "";

      if (release.reason === "ORDER" && release.order) {
        endpoint = `/api/release/?order=${release.order}&ordering=-date`;
      } else if (release.reason === "MAINTENANCE" && release.maintenance) {
        endpoint = `/api/release/?maintenance=${release.maintenance}&ordering=-date`;
      } else {
        // For other reasons, fetch releases for the same material
        endpoint = `/api/release/?material=${release.material.id}&ordering=-date`;
      }

      const response = await api.get<{ results: Release[] }>(endpoint);
      // Filter out the current release
      const filtered = response.data.results.filter((r) => r.id !== release.id);
      setRelatedReleases(filtered.slice(0, 5)); // Limit to 5 most recent
    } catch (err) {
      console.error("Error fetching related releases:", err);
    } finally {
      setLoadingRelated(false);
    }
  };

  const fetchMaterialHistory = async () => {
    try {
      const response = await api.get<{ results: Release[] }>(
        `/api/release/?material=${release.material.id}&ordering=-date`
      );
      // Get last 10 releases of this material
      setMaterialHistory(response.data.results.slice(0, 10));
    } catch (err) {
      console.error("Error fetching material history:", err);
    }
  };

  const fetchSalesRecord = async () => {
    try {
      // Adjust this endpoint based on your actual API
      const response = await api.get<MaterialSalesRecord>(
        `/api/material-sales-record/`
      );
      setSalesData(response.data);
    } catch (err) {
      console.error("Error fetching sales record:", err);
    }
  };

  React.useEffect(() => {
    fetchRelatedData();
  }, [release]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case "ORDER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "SALES":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "ADD":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const formatAmount = (amount: string, type: string) => {
    return `${amount} ${type === "A" ? "m²" : "m"}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-2xl transform rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-2xl transition-all max-h-[90vh]">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-6 py-4 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Release #{release.id} Details
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(release.date)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6 space-y-6 max-h-[calc(90vh-120px)]">
            {/* Release Info */}
            <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Material
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {release.material.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Code: {release.material.code_name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Amount
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatAmount(release.amount, release.material.type)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Type: {release.material.type}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Reason
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getReasonColor(
                        release.reason
                      )}`}
                    >
                      {release.reason}
                    </span>
                    {release.order && release.reason === "ORDER" && (
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        Order #{release.order}
                      </span>
                    )}
                    {release.maintenance &&
                      release.reason === "MAINTENANCE" && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">
                          Maintenance #{release.maintenance}
                        </span>
                      )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Status
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {release.confirmed ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          Confirmed
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-yellow-500" />
                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                          Pending
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Inventory
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    #{release.inventory || "Not specified"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Released By
                  </div>
                  {/* <div className="font-medium text-gray-900 dark:text-white">
                    User ID: {release.released_by}
                  </div> */}
                </div>
              </div>
            </div>

            {/* Proof Image */}
            {release.proof_image && (
              <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileImage className="w-5 h-5 text-gray-500" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Proof Image
                  </h4>
                </div>
                <div className="rounded-lg overflow-hidden bg-black">
                  <img
                    src={release.proof_image}
                    alt="Release proof"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                </div>
                <a
                  href={release.proof_image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Open full image →
                </a>
              </div>
            )}

            {/* Material History */}
            {materialHistory.length > 0 && (
              <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-gray-500" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Material History (Last 10 releases)
                  </h4>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {materialHistory.map((historyRelease) => (
                    <div
                      key={historyRelease.id}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        historyRelease.id === release.id
                          ? "bg-blue-100 dark:bg-blue-900/30"
                          : "bg-white dark:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            historyRelease.id === release.id
                              ? "bg-blue-500"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatAmount(
                              historyRelease.amount,
                              historyRelease.material.type
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(historyRelease.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getReasonColor(
                          historyRelease.reason
                        )}`}
                      >
                        {historyRelease.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Releases */}
            {relatedReleases.length > 0 && (
              <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-5 h-5 text-gray-500" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Related Releases ({relatedReleases.length})
                  </h4>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {relatedReleases.map((relatedRelease) => (
                    <div
                      key={relatedRelease.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-800"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {relatedRelease.material.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatAmount(
                            relatedRelease.amount,
                            relatedRelease.material.type
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(relatedRelease.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Data Section */}
            <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-gray-500" />
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Related Information
                </h4>
              </div>

              {loadingDetail ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Loading details...
                  </p>
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {error}
                  </p>
                </div>
              ) : (
                <>
                  {release.reason === "ORDER" && orderData && (
                    <DetailOrderDisplayer order={orderData} />
                  )}

                  {release.reason === "MAINTENANCE" && maintenanceData && (
                    <DetailMaintenance maintenance={maintenanceData} />
                  )}

                  {release.reason === "SALES" && salesData && (
                    <DetailProductSalesDisplayer salesRecord={salesData} />
                  )}

                  {release.reason === "ADD" && (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-2">
                        <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        Additional material release
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        This release was made to supplement existing materials.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-6 py-4 rounded-b-xl">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-sm"
              >
                Close
              </button>
              {onRefresh && (
                <button
                  onClick={() => {
                    onRefresh();
                    onClose();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Refresh List
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
