"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  Plus,
  Upload,
  DollarSign,
  Package,
  FileText,
  AlertCircle,
  Check,
  ChevronDown,
} from "lucide-react";
import api from "@/api";

interface PityMaterial {
  id: number;
  name: string;
  description: string;
  unit: "Piece" | "Meter" | "Other";
  date: string;
}

interface PityPurchaseOverlayProps {
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
    error: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800",
    success:
      "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800",
    info: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
  };

  const textColor = {
    error: "text-red-800 dark:text-red-300",
    success: "text-green-800 dark:text-green-300",
    info: "text-blue-800 dark:text-blue-300",
  };

  const iconColor = {
    error: "text-red-600 dark:text-red-400",
    success: "text-green-600 dark:text-green-400",
    info: "text-blue-600 dark:text-blue-400",
  };

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-xl border ${bgColor[type]} shadow-xl z-60 max-w-md animate-slide-in backdrop-blur-md`}
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
          className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

const PityPurchaseOverlay = ({ open, onClose }: PityPurchaseOverlayProps) => {
  const [materials, setMaterials] = useState<PityMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<PityMaterial | null>(
    null
  );

  // Dropdown specific state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showCreateMaterial, setShowCreateMaterial] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    price: "",
    invoice: false,
    invoiceImage: null as File | null,
    newMaterialName: "",
    newMaterialDescription: "",
    newMaterialUnit: "Piece" as "Piece" | "Meter" | "Other",
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success" | "info";
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show toast notification
  const showToast = (
    message: string,
    type: "error" | "success" | "info" = "error"
  ) => {
    setToast({ message, type });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch materials
  const fetchMaterials = async (query = "") => {
    try {
      setLoading(true);
      const params = query ? { search: query } : {};
      const response = await api.get("/finance/pity-material/", { params });
      setMaterials(response.data.results || response.data);
    } catch (error) {
      console.error("Failed to fetch materials:", error);
      showToast("Failed to load materials. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMaterials();
      // Reset form
      setFormData({
        amount: "",
        price: "",
        invoice: false,
        invoiceImage: null,
        newMaterialName: "",
        newMaterialDescription: "",
        newMaterialUnit: "Piece",
      });
      setSelectedMaterial(null);
      setSearchQuery("");
      setShowCreateMaterial(false);
      setIsDropdownOpen(false);
    }
  }, [open]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchMaterials(query);
  };

  const handleSelectMaterial = (material: PityMaterial) => {
    setSelectedMaterial(material);
    setShowCreateMaterial(false);
    setIsDropdownOpen(false);
  };

  const handleCreateMaterial = async () => {
    if (!formData.newMaterialName.trim()) {
      showToast("Please enter a material name", "error");
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post("/finance/pity-material/", {
        name: formData.newMaterialName.trim(),
        description: formData.newMaterialDescription.trim(),
        unit: formData.newMaterialUnit,
      });

      // Add new material to list and select it
      const newMaterial = response.data;
      setMaterials((prev) => [newMaterial, ...prev]);
      setSelectedMaterial(newMaterial);
      setShowCreateMaterial(false);

      // Reset new material form
      setFormData((prev) => ({
        ...prev,
        newMaterialName: "",
        newMaterialDescription: "",
      }));

      showToast("Material created successfully!", "success");
    } catch (error: any) {
      console.error("Failed to create material:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to create material";
      showToast(`Error: ${errorMessage}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    // Validation checks
    if (!selectedMaterial) {
      showToast("Please select or create a material", "error");
      return;
    }

    if (!formData.amount.trim()) {
      showToast("Please enter amount", "error");
      return;
    }

    if (!formData.price.trim()) {
      showToast("Please enter price", "error");
      return;
    }

    const amount = parseFloat(formData.amount);
    const price = parseFloat(formData.price);

    if (amount <= 0 || price <= 0) {
      showToast("Amount and price must be greater than zero", "error");
      return;
    }

    if (formData.invoice && !formData.invoiceImage) {
      showToast("Please upload an invoice image for invoice purchase", "error");
      return;
    }

    try {
      setSubmitting(true);

      // Prepare form data
      const formDataToSend = new FormData();
      formDataToSend.append("pity_material", selectedMaterial.id.toString());
      formDataToSend.append("amount", formData.amount);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("invoice", formData.invoice.toString());

      if (formData.invoice && formData.invoiceImage) {
        formDataToSend.append("invoice_image", formData.invoiceImage);
      }

      // Create material record
      const response = await api.post(
        "/finance/each-pity-material-record/",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 201) {
        showToast("Pity purchase created successfully!", "success");
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      console.error("Failed to create pity purchase:", error);

      let errorMessage = "Failed to create purchase";

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

  const calculateTotal = () => {
    const amount = parseFloat(formData.amount) || 0;
    const price = parseFloat(formData.price) || 0;
    return amount * price;
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

      {/* Main Overlay with Glassmorphism */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/20 dark:border-zinc-800">
          {/* Header */}
          <div className="sticky top-0 bg-white/90 dark:bg-zinc-900/95 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 p-4 flex items-center justify-between z-20">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <Package
                  size={20}
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pity Material Purchase
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              disabled={submitting}
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-5">
            {/* --- MATERIAL SELECTION (Dropdown Style) --- */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Material Selection
              </label>

              {showCreateMaterial ? (
                // Create New Material Form (In-place)
                <div className="p-4 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50/50 dark:bg-zinc-800/50">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Create New Material
                    </h3>
                    <button
                      onClick={() => setShowCreateMaterial(false)}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        value={formData.newMaterialName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            newMaterialName: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Material Name *"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <textarea
                        value={formData.newMaterialDescription}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            newMaterialDescription: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Description"
                        rows={2}
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <select
                        value={formData.newMaterialUnit}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            newMaterialUnit: e.target.value as
                              | "Piece"
                              | "Meter"
                              | "Other",
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        disabled={submitting}
                      >
                        <option value="Piece">Piece</option>
                        <option value="Meter">Meter</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <button
                      onClick={handleCreateMaterial}
                      disabled={!formData.newMaterialName.trim() || submitting}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {submitting ? "Creating..." : "Save Material"}
                    </button>
                  </div>
                </div>
              ) : (
                // Custom Dropdown Trigger
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() =>
                      !submitting && setIsDropdownOpen(!isDropdownOpen)
                    }
                    disabled={submitting}
                    className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl transition-all duration-200 text-left ${
                      isDropdownOpen
                        ? "border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-zinc-900"
                        : "border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-750"
                    }`}
                  >
                    {selectedMaterial ? (
                      <span className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedMaterial.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedMaterial.unit}
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">
                        Select a material...
                      </span>
                    )}
                    <ChevronDown
                      size={18}
                      className={`text-gray-400 transition-transform ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute z-30 w-full mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden animate-slide-in-down">
                      {/* Search inside dropdown */}
                      <div className="p-2 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
                        <div className="relative">
                          <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={14}
                          />
                          <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Options List */}
                      <div className="max-h-56 overflow-y-auto">
                        {loading ? (
                          <div className="p-4 text-center text-xs text-gray-500">
                            Loading...
                          </div>
                        ) : materials.length === 0 ? (
                          <div className="p-4 text-center text-xs text-gray-500">
                            No materials found
                          </div>
                        ) : (
                          materials.map((material) => (
                            <button
                              key={material.id}
                              onClick={() => handleSelectMaterial(material)}
                              className={`w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex justify-between items-center group ${
                                selectedMaterial?.id === material.id
                                  ? "bg-blue-50 dark:bg-blue-900/10"
                                  : ""
                              }`}
                            >
                              <div>
                                <p
                                  className={`text-sm font-medium ${
                                    selectedMaterial?.id === material.id
                                      ? "text-blue-700 dark:text-blue-400"
                                      : "text-gray-700 dark:text-gray-200"
                                  }`}
                                >
                                  {material.name}
                                </p>
                                {material.description && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px]">
                                    {material.description}
                                  </p>
                                )}
                              </div>
                              {selectedMaterial?.id === material.id && (
                                <Check size={14} className="text-blue-600" />
                              )}
                            </button>
                          ))
                        )}
                      </div>

                      {/* Footer Create Action */}
                      <div className="p-2 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setShowCreateMaterial(true);
                          }}
                          className="w-full flex items-center justify-center space-x-2 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-zinc-700 border border-transparent hover:border-blue-100 dark:hover:border-zinc-600 rounded-lg transition-all"
                        >
                          <Plus size={14} />
                          <span>Create New Material</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* --- Amount and Price --- */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Amount *
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0"
                    min="0"
                    step="1"
                    disabled={submitting}
                  />
                  <Package
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
                    size={16}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Price (ETB) *
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={submitting}
                  />
                  <DollarSign
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
                    size={16}
                  />
                </div>
              </div>
            </div>

            {/* Total Calculation */}
            {formData.amount && formData.price && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50 flex justify-between items-center shadow-sm">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Total Amount
                </span>
                <span className="text-xl font-bold text-blue-900 dark:text-blue-200">
                  ETB {calculateTotal().toLocaleString()}
                </span>
              </div>
            )}

            {/* Invoice Checkbox */}
            <div className="flex items-center space-x-3 p-1">
              <input
                type="checkbox"
                id="invoice"
                checked={formData.invoice}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    invoice: e.target.checked,
                  }))
                }
                className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                disabled={submitting}
              />
              <label
                htmlFor="invoice"
                className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer select-none"
              >
                This is an invoice purchase
                <FileText size={14} className="ml-2 text-gray-400" />
              </label>
            </div>

            {/* Invoice Image Upload */}
            {formData.invoice && (
              <div className="animate-slide-in">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Invoice Image *
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    formData.invoiceImage
                      ? "border-blue-400 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800"
                      : "border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (!file.type.startsWith("image/")) {
                          showToast("Please upload an image file", "error");
                          return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                          showToast("File size must be less than 5MB", "error");
                          return;
                        }
                        setFormData((prev) => ({
                          ...prev,
                          invoiceImage: file,
                        }));
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                    disabled={submitting}
                  />

                  {formData.invoiceImage ? (
                    <div className="space-y-3">
                      <div className="relative inline-block">
                        <img
                          src={URL.createObjectURL(formData.invoiceImage)}
                          alt="Invoice"
                          className="mx-auto h-32 object-contain rounded-lg shadow-sm bg-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              invoiceImage: null,
                            }))
                          }
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formData.invoiceImage.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={submitting}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Change Image
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={submitting}
                      className="w-full flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50"
                    >
                      <div className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-full mb-1">
                        <Upload size={24} />
                      </div>
                      <span className="text-sm font-medium">
                        Click to upload invoice image
                      </span>
                      <span className="text-xs opacity-70">
                        Supports JPG, PNG (Max 5MB)
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Info Note */}
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
              <div className="flex items-start space-x-3">
                <AlertCircle
                  size={18}
                  className="text-yellow-600 dark:text-yellow-500 mt-0.5"
                />
                <p className="text-xs leading-relaxed text-yellow-700 dark:text-yellow-400">
                  This purchase will automatically create a Pity Cost Record and
                  update the wallet balance.
                </p>
              </div>
            </div>
          </div>

          {/* Footer with Submit Button */}
          <div className="sticky bottom-0 bg-white/90 dark:bg-zinc-900/95 backdrop-blur-md border-t border-gray-100 dark:border-zinc-800 p-4 z-20">
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  !selectedMaterial ||
                  !formData.amount ||
                  !formData.price ||
                  submitting ||
                  (formData.invoice && !formData.invoiceImage)
                }
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 disabled:opacity-50 disabled:shadow-none flex items-center justify-center space-x-2 font-medium"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    <span>Confirm Purchase</span>
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
        @keyframes slide-in-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .animate-slide-in-down {
          animation: slide-in-down 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default PityPurchaseOverlay;
