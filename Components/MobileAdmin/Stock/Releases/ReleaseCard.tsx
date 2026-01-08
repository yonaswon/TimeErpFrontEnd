"use client";

import React from "react";
import { Release } from "./types/release";
import {
  Package,
  CheckCircle,
  XCircle,
  ExternalLink,
  Calendar,
  User,
  Warehouse,
  TrendingUp,
} from "lucide-react";

interface ReleaseCardProps {
  release: Release;
  onClick: () => void;
}

export const ReleaseCard: React.FC<ReleaseCardProps> = ({
  release,
  onClick,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "ORDER":
        return release.order ? `ORD-${release.order}` : "Order";
      case "MAINTENANCE":
        return release.maintenance
          ? `MTN-${release.maintenance}`
          : "Maintenance";
      case "SALES":
        return "Sales";
      case "ADD":
        return "Additional";
      case "TRANSFER":
        return "Transfer";
      case "WASTE":
        return "Waste";
      case "DAMAGED":
        return "Damaged";
      default:
        return reason;
    }
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
      case "WASTE":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getMaterialTypeIcon = (type: string) => {
    switch (type) {
      case "A":
        return <TrendingUp className="w-3 h-3" />;
      case "L":
        return "📏";
      default:
        return <Package className="w-3 h-3" />;
    }
  };

  return (
    <div
      className="bg-white dark:bg-zinc-800 rounded-xl p-4 active:scale-[0.98] transition-all duration-200 cursor-pointer hover:shadow-md border border-gray-100 dark:border-zinc-700"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {release.material.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  {getMaterialTypeIcon(release.material.type)}
                  <span>{release.material.code_name}</span>
                </span>
                <span>•</span>
                <span>{formatDate(release.date)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getReasonColor(
              release.reason
            )}`}
          >
            {getReasonLabel(release.reason)}
          </span>
          <div className="flex items-center gap-1">
            {release.confirmed ? (
              <CheckCircle className="w-3 h-3 text-green-500" />
            ) : (
              <XCircle className="w-3 h-3 text-yellow-500" />
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {release.confirmed ? "Confirmed" : "Pending"}
            </span>
          </div>
        </div>
      </div>

      {/* Amount and Inventory Info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 dark:bg-zinc-700 rounded-lg p-2">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {release.amount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {release.material.type === "A" ? "m²" : "m"}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
              <Warehouse className="w-3 h-3" />
              <span>From Inventory</span>
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              #{release.inventory || "N/A"}
            </div>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors">
          <ExternalLink className="w-4 h-4" />
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 dark:border-zinc-700">
        <div className="flex items-center gap-1.5 text-xs">
          <User className="w-3 h-3 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-300">
            Released by ID
          </span>
          {/* <span className="font-medium ml-auto">
            {release.released_by || "N/A"}
          </span> */}
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-300">Time</span>
          <span className="font-medium ml-auto">
            {formatDate(release.date)}
          </span>
        </div>
      </div>

      {release.proof_image && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700">
          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Proof image available</span>
          </div>
        </div>
      )}
    </div>
  );
};
