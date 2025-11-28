"use client";
import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  User,
  Phone,
  FileText,
  Image,
  Calendar,
  Shield,
  CreditCard,
  Upload,
  Package,
} from "lucide-react";
import api from "@/api";
import { OrderSearchOverlay } from "./OrderSearchOverlay";
import { MaintenanceFormData, Order, Account } from "./maintenance";

interface MaintenanceReportProps {
  onClose: () => void;
}

export const MaintenanceReport: React.FC<MaintenanceReportProps> = ({
  onClose,
}) => {
  const [showOrderSearch, setShowOrderSearch] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const [formData, setFormData] = useState<MaintenanceFormData>({
    order: null,
    client_name: "",
    client_contact: "",
    reported_issue: "",
    image: null,
    under_warranty: false,
    payment_amount: "",
    invoice: false,
    invoice_image: null,
    method: "BANK",
    account: null,
    additional_image: null,
    confirmation_image: null, // Added confirmation_image field
    note: "",
  });

  // Calculate warranty status
  const calculateWarrantyStatus = (orderDate: string) => {
    const orderCreated = new Date(orderDate);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return orderCreated >= threeMonthsAgo;
  };

  // Fetch accounts based on invoice status
  const fetchAccounts = async (isInvoice: boolean) => {
    setLoadingAccounts(true);
    try {
      const accountType = isInvoice ? "C" : "P";
      const response = await api.get<Account[]>(
        `/finance/account/?account_type=${accountType}&deleted=false`
      );
      setAccounts(response.data);

      // Auto-select first account if available
      if (response.data.length > 0 && !formData.account) {
        setFormData((prev) => ({ ...prev, account: response.data[0].id }));
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Handle order selection
  const handleOrderSelect = (
    order: Order,
    clientInfo: { name: string; contact: string }
  ) => {
    setSelectedOrder(order);
    const isUnderWarranty = calculateWarrantyStatus(order.created_at);

    setFormData((prev) => ({
      ...prev,
      order: order.order_code,
      client_name: clientInfo.name,
      client_contact: clientInfo.contact,
      under_warranty: isUnderWarranty,
    }));
  };

  // Handle form input changes
  const handleInputChange = (field: keyof MaintenanceFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Fetch accounts when invoice status changes
    if (field === "invoice") {
      fetchAccounts(value);
    }

    // Set wallet based on payment method
    if (field === "method") {
      if (value === "CASH") {
        // Wallet ID 2 for cash
        setFormData((prev) => ({ ...prev, wallet: 2 }));
      } else {
        // Wallet ID 1 for non-cash
        setFormData((prev) => ({ ...prev, wallet: 1 }));
      }
    }
  };

  // Handle file uploads
  const handleFileUpload = (
    field:
      | "image"
      | "invoice_image"
      | "additional_image"
      | "confirmation_image",
    file: File | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  // Submit maintenance request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.client_name.trim()) {
        throw new Error("Client name is required");
      }
      if (!formData.reported_issue.trim()) {
        throw new Error("Reported issue is required");
      }
      if (!formData.under_warranty && !formData.payment_amount) {
        throw new Error(
          "Payment amount is required for non-warranty maintenance"
        );
      }
      if (formData.invoice && !formData.invoice_image) {
        throw new Error("Invoice image is required when invoice is selected");
      }
      if (formData.method !== "CASH" && !formData.account) {
        throw new Error("Account is required for non-cash payments");
      }
      // Require confirmation image for non-cash payments
      if (formData.method !== "CASH" && !formData.confirmation_image) {
        throw new Error("Confirmation image is required for non-cash payments");
      }

      // Prepare form data for submission
      const submitData = new FormData();

      // Basic maintenance data
      submitData.append("order", formData.order?.toString() || "");
      submitData.append("client_name", formData.client_name);
      submitData.append("client_contact", formData.client_contact);
      submitData.append("reported_issue", formData.reported_issue);
      submitData.append("under_warranty", formData.under_warranty.toString());
      submitData.append("status", "NA"); // NOT ASSIGNED

      // Add maintenance image
      if (formData.image) {
        submitData.append("image", formData.image);
      }

      // Payment data if not under warranty
      if (!formData.under_warranty) {
        submitData.append("payment_amount", formData.payment_amount);
        submitData.append("method", formData.method);
        submitData.append("wallet", formData.method === "CASH" ? "2" : "1");
        submitData.append("reason", "MAINTENANCE");
        submitData.append("invoice", formData.invoice.toString());

        // Add payment images
        if (formData.invoice && formData.invoice_image) {
          submitData.append("invoice_image", formData.invoice_image);
        }

        if (formData.account) {
          submitData.append("account", formData.account.toString());
        }

        if (formData.additional_image) {
          submitData.append("additional_image", formData.additional_image);
        }

        // Add confirmation image for non-cash payments
        if (formData.method !== "CASH" && formData.confirmation_image) {
          submitData.append("confirmation_image", formData.confirmation_image);
        }

        if (formData.note) {
          submitData.append("note", formData.note);
        }
      }

      // Submit to API
      const response = await api.post("/api/maintenance/", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Success - close and reset
      onClose();
    } catch (err: any) {
      console.error("Error submitting maintenance request:", err);
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === "object") {
          const errorMessages = Object.values(errorData).flat();
          setError(errorMessages.join(", "));
        } else {
          setError(errorData.toString());
        }
      } else {
        setError(err.message || "Failed to submit maintenance request");
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize accounts on component mount
  useEffect(() => {
    fetchAccounts(formData.invoice);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Maintenance Report
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Order Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Order (Optional)
            </label>
            {selectedOrder ? (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Order #{selectedOrder.order_code}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {selectedOrder.client_name} • {selectedOrder.order_status}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrder(null);
                      handleInputChange("order", null);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowOrderSearch(true)}
                className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg hover:border-gray-400 dark:hover:border-zinc-500 transition-colors text-gray-500 dark:text-gray-400"
              >
                <Package className="w-6 h-6 mx-auto mb-2" />
                <p>Select Order (Optional)</p>
              </button>
            )}
          </div>

          {/* Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Client Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) =>
                    handleInputChange("client_name", e.target.value)
                  }
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Client Contact
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.client_contact}
                  onChange={(e) =>
                    handleInputChange("client_contact", e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Reported Issue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reported Issue *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <textarea
                value={formData.reported_issue}
                onChange={(e) =>
                  handleInputChange("reported_issue", e.target.value)
                }
                required
                rows={4}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe the maintenance issue..."
              />
            </div>
          </div>

          {/* Issue Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Issue Image (Optional)
            </label>
            <div className="relative">
              <Image className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleFileUpload("image", e.target.files?.[0] || null)
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>

          {/* Warranty Status */}
          <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Warranty Status
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedOrder && (
                      <>
                        Order created:{" "}
                        {new Date(
                          selectedOrder.created_at
                        ).toLocaleDateString()}{" "}
                        •
                        {calculateWarrantyStatus(selectedOrder.created_at)
                          ? " Under Warranty"
                          : " Out of Warranty"}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={formData.under_warranty}
                  onChange={(e) =>
                    handleInputChange("under_warranty", e.target.checked)
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Under Warranty
                </span>
              </label>
            </div>
          </div>

          {/* Payment Section - Only show if not under warranty */}
          {!formData.under_warranty && (
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Payment Information</span>
              </h3>

              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Amount *
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.payment_amount}
                  onChange={(e) =>
                    handleInputChange("payment_amount", e.target.value)
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.000"
                />
              </div>

              {/* Invoice Checkbox */}
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.invoice}
                    onChange={(e) =>
                      handleInputChange("invoice", e.target.checked)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    With Invoice
                  </span>
                </label>
              </div>

              {/* Invoice Image - Only show if invoice is checked */}
              {formData.invoice && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Invoice Image *
                  </label>
                  <div className="relative">
                    <Upload className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileUpload(
                          "invoice_image",
                          e.target.files?.[0] || null
                        )
                      }
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method *
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => handleInputChange("method", e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="BANK">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CHECK">Check</option>
                </select>
              </div>

              {/* Account Selection - Only show for non-cash payments */}
              {formData.method !== "CASH" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account *
                  </label>
                  <select
                    value={formData.account || ""}
                    onChange={(e) =>
                      handleInputChange("account", parseInt(e.target.value))
                    }
                    required
                    disabled={loadingAccounts}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="">Select Account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.bank} - {account.account_number}
                      </option>
                    ))}
                  </select>
                  {loadingAccounts && (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500 mt-2" />
                  )}
                </div>
              )}

              {/* Confirmation Image - Required for non-cash payments */}
              {formData.method !== "CASH" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirmation Image *
                  </label>
                  <div className="relative">
                    <Upload className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileUpload(
                          "confirmation_image",
                          e.target.files?.[0] || null
                        )
                      }
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Upload payment confirmation screenshot or photo
                  </p>
                </div>
              )}

              {/* Additional Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Payment Image (Optional)
                </label>
                <div className="relative">
                  <Image className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileUpload(
                        "additional_image",
                        e.target.files?.[0] || null
                      )
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Note (Optional)
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => handleInputChange("note", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Order Search Overlay */}
      <OrderSearchOverlay
        isOpen={showOrderSearch}
        onClose={() => setShowOrderSearch(false)}
        onSelect={handleOrderSelect}
      />
    </div>
  );
};

export default MaintenanceReport;
