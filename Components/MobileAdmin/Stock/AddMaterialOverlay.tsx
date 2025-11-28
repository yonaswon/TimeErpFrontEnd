import React, { useState } from "react";
import { X, Loader2, Package } from "lucide-react";
import api from "@/api";

interface AddMaterialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MaterialFormData {
  lable: string;
  name: string;
  type: string;
  code_name: string;
  min_threshold: number;
  width: string;
  height: string;
}

export const AddMaterialOverlay: React.FC<AddMaterialOverlayProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<MaterialFormData>({
    lable: "OTHER",
    name: "",
    type: "L",
    code_name: "",
    min_threshold: 0,
    width: "",
    height: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labelOptions = [
    { value: "COLOR", label: "COLOR" },
    { value: "BG", label: "BACKGROUND" },
    { value: "LED", label: "LED" },
    { value: "OL", label: "LIGHT" },
    { value: "PS", label: "POWER SUPPLY" },
    { value: "OTHER", label: "OTHER" },
  ];

  const typeOptions = [
    { value: "L", label: "Length" },
    { value: "A", label: "Areal" },
    { value: "P", label: "Piece" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "min_threshold" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error("Material name is required");
      }

      // Prepare data for API
      const submitData: any = {
        lable: formData.lable,
        name: formData.name.trim(),
        type: formData.type,
        code_name: formData.code_name.trim() || null,
        min_threshold: formData.min_threshold,
        available: 0, // Default to 0
        parsialy_available: 0, // Default to 0
      };

      // Add width and height only for Areal materials
      if (formData.type === "A") {
        if (!formData.width || !formData.height) {
          throw new Error("Width and height are required for Areal materials");
        }
        submitData.width = parseFloat(formData.width);
        submitData.height = parseFloat(formData.height);
      } else {
        // Clear width and height for non-areal materials
        submitData.width = null;
        submitData.height = null;
      }

      // Make API request
      await api.post("/materials/", submitData);

      // Reset form and close overlay
      setFormData({
        lable: "OTHER",
        name: "",
        type: "L",
        code_name: "",
        min_threshold: 0,
        width: "",
        height: "",
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error adding material:", err);
      if (err.response?.data) {
        // Handle Django validation errors
        const errorData = err.response.data;
        if (typeof errorData === "object") {
          const errorMessages = Object.values(errorData).flat();
          setError(errorMessages.join(", "));
        } else {
          setError(errorData.toString());
        }
      } else {
        setError(err.message || "Failed to add material. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        lable: "OTHER",
        name: "",
        type: "L",
        code_name: "",
        min_threshold: 0,
        width: "",
        height: "",
      });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-zinc-700/50 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-zinc-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100/80 dark:bg-green-900/50 rounded-xl backdrop-blur-sm">
              <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add New Material
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create a new material entry
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors disabled:opacity-50 text-gray-500 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50/80 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-xl backdrop-blur-sm">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Label Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Label *
            </label>
            <select
              name="lable"
              value={formData.lable}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2.5 border border-gray-200/80 dark:border-zinc-700/80 rounded-xl bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
            >
              {labelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Type Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2.5 border border-gray-200/80 dark:border-zinc-700/80 rounded-xl bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Material Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Enter material name"
              className="w-full px-3 py-2.5 border border-gray-200/80 dark:border-zinc-700/80 rounded-xl bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
            />
          </div>

          {/* Code Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Code Name
            </label>
            <input
              type="text"
              name="code_name"
              value={formData.code_name}
              onChange={handleInputChange}
              placeholder="Enter code name (optional)"
              className="w-full px-3 py-2.5 border border-gray-200/80 dark:border-zinc-700/80 rounded-xl bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
            />
          </div>

          {/* Min Threshold Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Minimum Threshold *
            </label>
            <input
              type="number"
              name="min_threshold"
              value={formData.min_threshold}
              onChange={handleInputChange}
              required
              min="0"
              placeholder="Enter minimum threshold"
              className="w-full px-3 py-2.5 border border-gray-200/80 dark:border-zinc-700/80 rounded-xl bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
            />
          </div>

          {/* Width and Height for Areal Materials */}
          {formData.type === "A" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Width *
                </label>
                <input
                  type="number"
                  name="width"
                  value={formData.width}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-gray-200/80 dark:border-zinc-700/80 rounded-xl bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Height *
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-gray-200/80 dark:border-zinc-700/80 rounded-xl bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300/50 dark:border-zinc-600/50 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 backdrop-blur-sm transition-all disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-green-600/90 hover:bg-green-600 text-white rounded-xl backdrop-blur-sm shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Material"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
