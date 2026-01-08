"use client";

import React from "react";
import { Order } from "./types/release";
import { 
  Package, 
  Calendar, 
  User, 
  Image as ImageIcon,
  DollarSign,
  Scissors,
  Truck
} from "lucide-react";

interface DetailOrderDisplayerProps {
  order: Order;
}

export const DetailOrderDisplayer: React.FC<DetailOrderDisplayerProps> = ({ order }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not started";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    if (status.includes("CONFIRMED")) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (status.includes("ACCEPTED")) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    if (status.includes("STARTED")) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    if (status.includes("COMPLETED")) return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  };

  return (
    <div className="space-y-4">
      {/* Order Header */}
      <div className="flex items-center justify-between">
        <div>
          <h5 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-4 h-4" />
            Order ORD-{order.order_code}
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Designer: @{order.mockup.designer.telegram_user_name}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
          {order.order_status}
        </span>
      </div>

      {/* Mockup Image */}
      {order.mockup.mockup_image && (
        <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-900">
          <div className="p-3 bg-gray-200 dark:bg-zinc-800 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mockup Design</span>
          </div>
          <img 
            src={order.mockup.mockup_image} 
            alt="Order mockup"
            className="w-full h-48 object-contain"
          />
        </div>
      )}

      {/* Order Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Price</span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(order.price)}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Created</span>
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {formatDate(order.created_at)}
          </div>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="space-y-2">
        <h6 className="text-sm font-semibold text-gray-900 dark:text-white">Progress Timeline</h6>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Pre-Accepted</span>
            <span className="font-medium">{formatDate(order.pre_accepted_date)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">CNC Started</span>
            <span className="font-medium">{formatDate(order.cnc_started_date)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">CNC Completed</span>
            <span className="font-medium">{formatDate(order.cnc_completed_date)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Assembly Started</span>
            <span className="font-medium">{formatDate(order.assembly_started_date)}</span>
          </div>
        </div>
      </div>

      {/* Materials Used */}
      <div>
        <h6 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Materials ({order.boms.length})
        </h6>
        <div className="space-y-2">
          {order.boms.slice(0, 3).map((bom:any) => (
            <div key={bom.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">{bom.material.name}</span>
              <span className="font-medium">{bom.amount} {bom.material.type === "A" ? "m²" : "m"}</span>
            </div>
          ))}
          {order.boms.length > 3 && (
            <div className="text-xs text-blue-600 dark:text-blue-400">
              + {order.boms.length - 3} more materials
            </div>
          )}
        </div>
      </div>
    </div>
  );
};