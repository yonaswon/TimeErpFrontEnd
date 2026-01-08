"use client";

import React from "react";
import { Maintenance } from "./types/release";
import {
  Wrench,
  Calendar,
  User,
  Phone,
  AlertTriangle,
  Shield,
  FileText,
} from "lucide-react";

interface DetailMaintenanceProps {
  maintenance: Maintenance;
}

export const DetailMaintenance: React.FC<DetailMaintenanceProps> = ({
  maintenance,
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not scheduled";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    if (status === "COMPLETED")
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (status === "IN_PROGRESS")
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    if (status === "SCHEDULED")
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  };

  return (
    <div className="space-y-4">
      {/* Maintenance Header */}
      <div className="flex items-center justify-between">
        <div>
          <h5 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Maintenance MTN-{maintenance.id}
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Posted by: @{maintenance.posted_by.telegram_user_name}
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            maintenance.status
          )}`}
        >
          {maintenance.status || "Not Assigned"}
        </span>
      </div>

      {/* Client Info */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-gray-200 dark:border-zinc-700">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-blue-500" />
          <h6 className="font-medium text-gray-900 dark:text-white">
            Client Information
          </h6>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-gray-500 dark:text-gray-400">Name</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {maintenance.client_name}
            </div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">Contact</div>
            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {maintenance.client_contact}
            </div>
          </div>
        </div>
      </div>

      {/* Issue Details */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-gray-200 dark:border-zinc-700">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <h6 className="font-medium text-gray-900 dark:text-white">
            Reported Issue
          </h6>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {maintenance.reported_issue}
        </p>
      </div>

      {/* Warranty & Payment Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Warranty
            </span>
          </div>
          <div
            className={`text-sm font-medium ${
              maintenance.under_warranty
                ? "text-green-600 dark:text-green-400"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {maintenance.under_warranty ? "Under Warranty" : "Out of Warranty"}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Payment
            </span>
          </div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {maintenance.payment_status || "Not Specified"}
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-2">
        <h6 className="text-sm font-semibold text-gray-900 dark:text-white">
          Schedule
        </h6>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              Scheduled Start
            </span>
            <span className="font-medium">
              {formatDate(maintenance.scheduled_start_date)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              Scheduled End
            </span>
            <span className="font-medium">
              {formatDate(maintenance.scheduled_end_date)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              Actual Start
            </span>
            <span className="font-medium">
              {formatDate(maintenance.started)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Actual End</span>
            <span className="font-medium">{formatDate(maintenance.end)}</span>
          </div>
        </div>
      </div>

      {/* Related Order */}
      {maintenance.order && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
            Related Order: ORD-{maintenance.order.order_code}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            Price:{" "}
            {new Intl.NumberFormat("en-US").format(maintenance.order.price)} ETB
          </div>
        </div>
      )}
    </div>
  );
};
