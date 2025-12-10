"use client";

import { useState, useEffect } from "react";
import {
  X,
  DollarSign,
  FileText,
  AlertCircle,
  Plus,
  Check,
  Tag,
  Settings,
} from "lucide-react";
import api from "@/api";

interface PityCostRecordCategory {
  id: number;
  name: string;
  date: string;
}

interface PityCostOverlayProps {
  open: boolean;
  onClose: () => void;
}

// Toast notification component
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "error" | "success" | "info";
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    success:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
  };

  const textColor = {
    error: "text-red-800 dark:text-red-400",
    success: "text-green-800 dark:text-green-400",
    info: "text-blue-800 dark:text-blue-400",
  };

  const iconColor = {
    error: "text-red-600 dark:text-red-400",
    success: "text-green-600 dark:text-green-400",
    info: "text-blue-600 dark:text-blue-400",
  };

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg border ${bgColor[type]} shadow-lg z-60 max-w-md animate-slide-in`}
    >
      <div className="flex items-start">
        <AlertCircle
          size={20}
          className={`mt-0.5 mr-3 shrink-0 ${iconColor[type]}`}
        />
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColor[type]}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

const PityCostOverlay = ({ open, onClose }: PityCostOverlayProps) => {
  const [categories, setCategories] = useState<PityCostRecordCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success" | "info";
  } | null>(null);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    total_amount: "",
    note: "",
    newCategoryName: "",
  });

  // Show toast notification
  const showToast = (
    message: string,
    type: "error" | "success" | "info" = "error"
  ) => {
    setToast({ message, type });
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get("/finance/pity-cost-record-category/");
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      showToast("Failed to load categories. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCategories();
      // Reset form
      setFormData({
        category: "",
        total_amount: "",
        note: "",
        newCategoryName: "",
      });
      setShowCreateCategory(false);
    }
  }, [open]);

  const handleCreateCategory = async () => {
    if (!formData.newCategoryName.trim()) {
      showToast("Please enter a category name", "error");
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post("/finance/pity-cost-record-category/", {
        name: formData.newCategoryName.trim(),
      });

      // Add new category to list and select it
      const newCategory = response.data;
      setCategories((prev) => [newCategory, ...prev]);
      setFormData((prev) => ({
        ...prev,
        category: newCategory.id.toString(),
        newCategoryName: "",
      }));
      setShowCreateCategory(false);

      showToast("Category created successfully!", "success");
    } catch (error: any) {
      console.error("Failed to create category:", error);
      const errorMessage =
        error.response?.data?.name?.[0] ||
        error.response?.data?.error ||
        "Failed to create category";
      showToast(`Error: ${errorMessage}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    // Validation checks
    if (!formData.category) {
      showToast("Please select or create a category", "error");
      return;
    }

    if (!formData.total_amount.trim()) {
      showToast("Please enter total amount", "error");
      return;
    }

    const totalAmount = parseFloat(formData.total_amount);
    if (totalAmount <= 0) {
      showToast("Total amount must be greater than zero", "error");
      return;
    }

    try {
      setSubmitting(true);

      // Prepare request data
      const requestData = {
        category: parseInt(formData.category),
        total_amount: formData.total_amount,
        note: formData.note.trim() || null,
      };

      // Create pity cost record
      const response = await api.post(
        "/finance/pity-cost-record/",
        requestData
      );

      if (response.status === 201) {
        showToast("Pity cost record created successfully!", "success");
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      console.error("Failed to create pity cost record:", error);

      let errorMessage = "Failed to create pity cost record";

      if (error.response?.data) {
        const data = error.response.data;

        if (typeof data === "string") {
          errorMessage = data;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (Array.isArray(data)) {
          errorMessage = data.map((err) => err.message || err).join(", ");
        } else if (typeof data === "object") {
          const messages = Object.values(data).flat();
          errorMessage = messages.join(", ");
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      showToast(`Error: ${errorMessage}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Main Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings
                size={20}
                className="text-blue-600 dark:text-blue-400"
              />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create Pity Cost
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors"
              disabled={submitting}
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>

              <div className="relative mb-2">
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  disabled={submitting}
                >
                  <option value="">Select a category</option>
                  {loading ? (
                    <option value="" disabled>
                      Loading categories...
                    </option>
                  ) : (
                    categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  )}
                </select>
                <Tag
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
              </div>

              {/* Create New Category Button */}
              {!showCreateCategory && (
                <button
                  onClick={() => setShowCreateCategory(true)}
                  disabled={submitting}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-dashed border-gray-300 dark:border-zinc-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                  <span>Create New Category</span>
                </button>
              )}

              {/* Create Category Form */}
              {showCreateCategory && (
                <div className="mt-2 p-4 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Create New Category
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category Name *
                      </label>
                      <input
                        type="text"
                        value={formData.newCategoryName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            newCategoryName: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter category name"
                        disabled={submitting}
                      />
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={handleCreateCategory}
                        disabled={
                          !formData.newCategoryName.trim() || submitting
                        }
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Creating..." : "Create Category"}
                      </button>
                      <button
                        onClick={() => setShowCreateCategory(false)}
                        disabled={submitting}
                        className="px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Category Display */}
              {formData.category && !showCreateCategory && (
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-400">
                        Selected:{" "}
                        {
                          categories.find(
                            (c) => c.id.toString() === formData.category
                          )?.name
                        }
                      </p>
                    </div>
                    <Check
                      size={20}
                      className="text-green-600 dark:text-green-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Total Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Amount (ETB) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.total_amount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      total_amount: e.target.value,
                    }))
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={submitting}
                />
                <DollarSign
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
              </div>
            </div>

            {/* Note Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Note
              </label>
              <div className="relative">
                <textarea
                  value={formData.note}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, note: e.target.value }))
                  }
                  className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Add any notes here..."
                  rows={3}
                  disabled={submitting}
                />
                <FileText
                  className="absolute left-3 top-3 transform text-gray-400"
                  size={16}
                />
              </div>
            </div>

            {/* Info Note */}
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start space-x-2">
                <AlertCircle
                  size={16}
                  className="text-yellow-600 dark:text-yellow-400 mt-0.5"
                />
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  This pity cost will automatically update the wallet balance.
                </p>
              </div>
            </div>
          </div>

          {/* Footer with Submit Button */}
          <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-700 p-4">
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  !formData.category || !formData.total_amount || submitting
                }
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Settings size={16} />
                    <span>Create Pity Cost</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default PityCostOverlay;
