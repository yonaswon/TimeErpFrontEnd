"use client";

import React, { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle, Package } from "lucide-react";

interface Release {
  id: number;
  material: {
    id: number;
    name: string;
    type: string;
    code_name: string;
    available: string;
    parsialy_available: string;
    min_threshold: number;
    width: string | null;
    height: string | null;
    date: string;
    stats: any;
  };
  reason:
    | "ORDER"
    | "ADD"
    | "MAINTENANCE"
    | "SALES"
    | "TRANSFER"
    | "WASTE"
    | "DAMAGED";
  amount: string;
  proof_image: string | null;
  confirmed: boolean;
  date: string;
  order: number;
  maintenance: number | null;
  inventory: number;
  released_by: number;
  each_areal_material: any[];
  is_edited: boolean;
  l_and_p_material_records_for_eidt: any[];
}

interface ReleaseEditOverlayProps {
  release: Release;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (newAmount: any) => Promise<{ success: boolean; message: string }>;
}

const ReleaseEditOverlay: React.FC<ReleaseEditOverlayProps> = ({
  release,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [newAmount, setNewAmount] = useState<string>(release.amount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | null;
    text: string;
  }>({ type: null, text: "" });

  useEffect(() => {
    setNewAmount(release.amount);
    setMessage({ type: null, text: "" });
  }, [release]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentAmount = parseFloat(release.amount);
    const enteredAmount = parseFloat(newAmount);

    if (isNaN(enteredAmount)) {
      setMessage({ type: "error", text: "Please enter a valid number" });
      return;
    }

    if (enteredAmount === currentAmount) {
      setMessage({ type: "error", text: "New amount cannot be the same as current amount" });
      return;
    }

    if (enteredAmount > currentAmount) {
      setMessage({ 
        type: "error", 
        text: "Cannot increase release amount. Please create an additional release instead." 
      });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: null, text: "" });

    try {
      const result = await onUpdate(newAmount);
      
      if (result.success) {
        setMessage({ 
          type: "success", 
          text: "Release amount updated successfully!" 
        });
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: "An unexpected error occurred. Please try again." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAmount = (amount: string, type: string) => {
    return `${amount} ${type === "A" ? "m²" : "m"}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Edit Release
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Release #{release.id}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Material Info */}
          <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              {release.material.name}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400 mb-1">
                  Code
                </div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {release.material.code_name}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400 mb-1">
                  Type
                </div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {release.material.type === "A" ? "Area (m²)" : "Length (m)"}
                </div>
              </div>
            </div>
          </div>

          {/* Current Amount */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/50">
            <div className="text-sm text-blue-700 dark:text-blue-400 mb-2">
              Current Release Amount
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
              {formatAmount(release.amount, release.material.type)}
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Release Amount
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  ({release.material.type === "A" ? "in m²" : "in meters"})
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  step="0.01"
                  min="0.01"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg text-gray-900 dark:text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new amount"
                  disabled={isSubmitting}
                  required
                />
                <div className="absolute right-3 top-3 text-gray-500 dark:text-gray-400">
                  {release.material.type === "A" ? "m²" : "m"}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Enter a value less than current amount ({release.amount} {release.material.type === "A" ? "m²" : "m"})
              </div>
            </div>

            {/* Validation Messages */}
            {message.type && (
              <div
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  message.type === "success"
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-sm">{message.text}</div>
              </div>
            )}

            {/* Edit Rules Info */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-100 dark:border-yellow-800/50">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-400 mb-2 text-sm">
                Edit Rules
              </h4>
              <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-500">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5"></div>
                  <span>New amount must be less than current amount</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5"></div>
                  <span>Difference will be added to inventory as available material</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5"></div>
                  <span>This action cannot be undone</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors font-medium disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting || 
                  parseFloat(newAmount) >= parseFloat(release.amount) ||
                  newAmount === release.amount
                }
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </div>
                ) : (
                  "Update Release"
                )}
              </button>
            </div>
          </form>

          {/* Additional Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-4 border-t border-gray-100 dark:border-zinc-700">
            Inventory #{release.inventory} • Order #{release.order}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReleaseEditOverlay;