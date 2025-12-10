import { useState, useRef, useEffect } from "react";
import {
  X,
  Save,
  Loader,
  AlertCircle,
  Image as ImageIcon,
  Package,
  Trash2,
  Type,
} from "lucide-react";
import api from "@/api";

interface OrderEditProps {
  order: any;
  onClose: () => void;
  onUpdate: (updatedOrder: any) => void;
}

interface DesignType {
  id: number;
  name: string;
  date: string;
}

const OrderEdit = ({ order, onClose, onUpdate }: OrderEditProps) => {
  const [formData, setFormData] = useState({
    mockup_image: null as File | null,
    remove_mockup_image: false,
    design_type: order.design_type || null, // always ID
  });

  const [designTypes, setDesignTypes] = useState<DesignType[]>([]);
  const [loadingDesignTypes, setLoadingDesignTypes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    order.mockup_image || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch design types
  useEffect(() => {
    const fetchDesignTypes = async () => {
      try {
        setLoadingDesignTypes(true);
        const response = await api.get("/lead/design-types/");
        setDesignTypes(response.data);

        // always store the ID directly
        if (order.design_type) {
          setFormData((prev) => ({
            ...prev,
            design_type: order.design_type, // FIX
          }));
        }
      } catch (err) {
        setError("Failed to load design types");
      } finally {
        setLoadingDesignTypes(false);
      }
    };

    fetchDesignTypes();
  }, [order.design_type]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Image size should be less than 10MB");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        mockup_image: file,
        remove_mockup_image: false,
      }));
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      mockup_image: null,
      remove_mockup_image: true,
    }));
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDesignTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      design_type: Number(e.target.value), // always ID
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();

      if (formData.mockup_image) {
        formDataToSend.append("mockup_image", formData.mockup_image);
      }

      if (formData.remove_mockup_image) {
        formDataToSend.append("mockup_image", "");
      }

      // Only send design_type if user changed it (compare IDs only)
      if (formData.design_type !== order.design_type) {
        formDataToSend.append("design_type", String(formData.design_type));
      }

      const response = await api.patch(
        `/api/orders/${order.order_code}/`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      onUpdate(response.data);
      setSuccess(true);
      setTimeout(() => handleClose(), 1200);
    } catch (err: any) {
      if (err.response?.data) {
        const errors = Object.entries(err.response.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");
        setError(errors);
      } else {
        setError(err.message || "Failed to update order");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    onClose();
  };

  // Get current design type name
  const getCurrentDesignTypeName = () => {
    const type = designTypes.find((t) => t.id === order.design_type);
    return type?.name || "N/A";
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden border border-gray-200 dark:border-zinc-800">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Order
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ORD-{order.order_code}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-emerald-500" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Order updated successfully!
              </p>
            </div>
          )}

          {/* Design Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Type size={18} className="inline mr-2 text-blue-600" />
              Design Type *
            </label>

            <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
              <div className="text-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Current Design Type:
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {getCurrentDesignTypeName()}
                </p>
              </div>
            </div>

            <select
              name="design_type"
              value={formData.design_type || ""}
              onChange={handleDesignTypeChange}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg"
            >
              <option value="">Select a design type...</option>
              {designTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Image Preview & Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              <ImageIcon size={18} className="inline mr-2 text-blue-600" />
              Order Mockup Image
            </label>

            <div className="space-y-4">
              {previewUrl ? (
                <div className="relative group">
                  <img
                    src={previewUrl}
                    alt="mockup"
                    className="w-full h-48 object-contain rounded-lg border-2 border-gray-200 dark:border-zinc-700"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.open(previewUrl, "_blank")}
                      className="p-2 bg-white text-gray-800 rounded-lg"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-2 bg-red-500 text-white rounded-lg"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg p-8 text-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="text-sm text-gray-500">Click to upload</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-5 py-2.5 bg-gray-100 rounded-lg"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                (!formData.mockup_image &&
                  !formData.remove_mockup_image &&
                  formData.design_type === order.design_type)
              }
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={18} /> Saving...
                </>
              ) : (
                <>
                  <Save size={18} /> Update Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderEdit;
