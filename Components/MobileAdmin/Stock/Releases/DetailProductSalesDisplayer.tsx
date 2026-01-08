"use client";

import React from "react";
import { MaterialSalesRecord } from "./types/release";
import {
  ShoppingBag,
  Calendar,
  User,
  Phone,
  Bell,
  MessageSquare,
} from "lucide-react";

interface DetailProductSalesDisplayerProps {
  salesRecord: MaterialSalesRecord;
}

export const DetailProductSalesDisplayer: React.FC<
  DetailProductSalesDisplayerProps
> = ({ salesRecord }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Sales Header */}
      <div className="flex items-center justify-between">
        <div>
          <h5 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Sales Record #{salesRecord.id}
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Recorded by: @{salesRecord.recorded_by.telegram_user_name}
          </p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(salesRecord.date)}
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-gray-200 dark:border-zinc-700">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-green-500" />
          <h6 className="font-medium text-gray-900 dark:text-white">
            Customer Information
          </h6>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Name
            </div>
            <div className="font-medium text-gray-900 dark:text-white">
              {salesRecord.customer_name}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Contact
            </div>
            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {salesRecord.customer_contact}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Status */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className={`rounded-lg p-3 ${
            salesRecord.order_notification_sent
              ? "bg-green-50 dark:bg-green-900/20"
              : "bg-yellow-50 dark:bg-yellow-900/20"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Bell
              className={`w-4 h-4 ${
                salesRecord.order_notification_sent
                  ? "text-green-500"
                  : "text-yellow-500"
              }`}
            />
            <span className="text-sm font-medium">Order Notification</span>
          </div>
          <div
            className={`text-xs ${
              salesRecord.order_notification_sent
                ? "text-green-600 dark:text-green-400"
                : "text-yellow-600 dark:text-yellow-400"
            }`}
          >
            {salesRecord.order_notification_sent ? "Sent ✓" : "Pending"}
          </div>
          {salesRecord.order_group_message_id && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Message ID: {salesRecord.order_group_message_id}
            </div>
          )}
        </div>

        <div
          className={`rounded-lg p-3 ${
            salesRecord.finance_notification_sent
              ? "bg-green-50 dark:bg-green-900/20"
              : "bg-yellow-50 dark:bg-yellow-900/20"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare
              className={`w-4 h-4 ${
                salesRecord.finance_notification_sent
                  ? "text-green-500"
                  : "text-yellow-500"
              }`}
            />
            <span className="text-sm font-medium">Finance Notification</span>
          </div>
          <div
            className={`text-xs ${
              salesRecord.finance_notification_sent
                ? "text-green-600 dark:text-green-400"
                : "text-yellow-600 dark:text-yellow-400"
            }`}
          >
            {salesRecord.finance_notification_sent ? "Sent ✓" : "Pending"}
          </div>
          {salesRecord.finance_group_message_id && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Message ID: {salesRecord.finance_group_message_id}
            </div>
          )}
        </div>
      </div>

      {/* Sales Representative Info */}
      <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Sales Representative
            </div>
            <div className="font-medium text-gray-900 dark:text-white">
              @{salesRecord.recorded_by.telegram_user_name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {salesRecord.recorded_by.role?.map((r:any) => r.Name).join(", ")}
            </div>
          </div>
        </div>
      </div>

      {/* Empty Releases Note */}
      {salesRecord.release && salesRecord.release.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
          <div className="text-sm text-yellow-800 dark:text-yellow-300">
            No specific material releases recorded for this sale.
          </div>
        </div>
      )}
    </div>
  );
};
