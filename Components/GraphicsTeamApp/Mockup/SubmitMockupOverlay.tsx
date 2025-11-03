"use client";
import { useEffect, useState } from "react";
import { Mockup, Material, BOMItem, MaterialsResponse } from "./utils/types";
import {
  X,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Loader2,
} from "lucide-react";
import api from "@/api";

interface SubmitMockupOverlayProps {
  mockup: Mockup;
  onClose: () => void;
}

interface BomRow {
  id: string;
  material?: Material;
  amount?: string;
  width?: string;
  height?: string;
}

const SubmitMockupOverlay = ({ mockup, onClose }: SubmitMockupOverlayProps) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [errorMaterials, setErrorMaterials] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [bomRows, setBomRows] = useState<BomRow[]>([
    {
      id: Date.now().toString(),
      amount: "",
      width: "",
      height: "",
    },
  ]);
  const [mockupImage, setMockupImage] = useState<File | null>(null);
  const [mockupImagePreview, setMockupImagePreview] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [priceWithVat, setPriceWithVat] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch materials with pagination
  const fetchMaterials = async (url?: string) => {
    try {
      if (url) {
        setLoadingMore(true);
      } else {
        setLoadingMaterials(true);
      }

      setErrorMaterials(null);

      const response = await api.get(url || "/materials/");
      const data: MaterialsResponse = response.data;

      if (url) {
        // Append to existing materials for load more
        setMaterials((prev) => [...prev, ...data.results]);
      } else {
        // Replace materials for initial load
        setMaterials(data.results || []);
      }

      setNextUrl(data.next);
    } catch (err) {
      console.error("Error fetching materials:", err);
      setErrorMaterials("Failed to load materials. Please try again.");
    } finally {
      setLoadingMaterials(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const loadMoreMaterials = () => {
    if (nextUrl) {
      fetchMaterials(nextUrl);
    }
  };

  const addBomRow = () => {
    setBomRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        amount: "",
        width: "",
        height: "",
      },
    ]);
  };

  const removeBomRow = (id: string) => {
    // Don't remove if it's the only row
    if (bomRows.length > 1) {
      setBomRows((prev) => prev.filter((row) => row.id !== id));
    }
  };

  const updateBomRow = (id: string, key: keyof BomRow, value: any) => {
    setBomRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: value } : row))
    );
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMockupImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setMockupImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSubmit = async () => {
    if (!mockupImage) {
      alert("Please upload a mockup image");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("mockup_image", mockupImage);
      formData.append("request_status", "RETURNED");

      // Convert price to integer if it exists
      if (price) {
        formData.append(
          "price",
          Math.round(parseFloat(price) * 100).toString()
        ); // Convert to cents/piasters
      }
      formData.append("price_with_vat", priceWithVat.toString());

      // Add BOM data - convert each item individually
      const bomData = bomRows
        .filter((row) => row.material)
        .map((row) => {
          const bomItem: any = {
            material: row.material!.id,
          };

          // Handle amount for Piece (P) and Length (L) materials
          if (row.material!.type !== "A" && row.amount) {
            bomItem.amount = parseFloat(row.amount) || null;
          }

          // Handle width and height for Areal (A) materials
          if (row.material!.type === "A") {
            if (row.width) bomItem.width = parseFloat(row.width) || null;
            if (row.height) bomItem.height = parseFloat(row.height) || null;
          }

          return bomItem;
        });

      // Append each BOM item individually
      bomData.forEach((bomItem, index) => {
        Object.entries(bomItem).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(`bom[${index}].${key}`, value.toString());
          }
        });
      });

      console.log("Submitting form data:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      await api.post(`/lead/mockups/${mockup.id}/return_mockup/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      onClose();
    } catch (err: any) {
      console.error("Error submitting mockup:", err);
      if (err.response?.data) {
        alert(`Failed to submit mockup: ${JSON.stringify(err.response.data)}`);
      } else {
        alert("Failed to submit mockup. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };
  const renderMaterialDropdown = (row: BomRow) => {
    if (loadingMaterials && materials.length === 0) {
      return (
        <div className="flex items-center space-x-2 py-2 text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading materials...</span>
        </div>
      );
    }

    if (errorMaterials && materials.length === 0) {
      return <div className="text-red-500 text-sm py-2">{errorMaterials}</div>;
    }

    if (materials.length === 0) {
      return (
        <div className="text-gray-500 text-sm py-2">No materials available</div>
      );
    }

    return (
      <select
        value={row.material?.id || ""}
        onChange={(e) => {
          const mat = materials.find((m) => m.id === parseInt(e.target.value));
          updateBomRow(row.id, "material", mat);
        }}
        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      >
        <option value="">Select Material</option>
        {materials.map((mat) => (
          <option key={mat.id} value={mat.id}>
            {mat.name} ({mat.type}) - Stock: {mat.available}
          </option>
        ))}
      </select>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700 sticky top-0 bg-white dark:bg-zinc-800 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Submit Mockup #{mockup.id}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Returned Date: {new Date().toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-xl transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Mockup Image Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mockup Image *
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
              {mockupImagePreview ? (
                <div className="space-y-3">
                  <img
                    src={mockupImagePreview}
                    alt="Mockup preview"
                    className="max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <button
                    onClick={() => {
                      setMockupImage(null);
                      setMockupImagePreview("");
                    }}
                    className="text-red-500 hover:text-red-600 text-sm font-medium"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="mx-auto text-gray-400" size={48} />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      Upload your mockup image
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                      PNG, JPG, JPEG up to 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="mockup-upload"
                  />
                  <label
                    htmlFor="mockup-upload"
                    className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors font-medium"
                  >
                    Choose File
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Price Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Pricing
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Total Price
                </label>
                <div className="relative">
                  <DollarSign
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                  VAT Inclusion
                </label>
                <div className="flex items-center space-x-3 p-3 border border-gray-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-700">
                  <input
                    type="checkbox"
                    id="price-with-vat"
                    checked={priceWithVat}
                    onChange={(e) => setPriceWithVat(e.target.checked)}
                    className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="price-with-vat"
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    Price includes VAT
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* BOM Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Bill of Materials
            </h3>

            <div className="overflow-x-auto border border-gray-200 dark:border-zinc-700 rounded-lg">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-700/50 border-b border-gray-200 dark:border-zinc-600">
                    <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Material
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Dimensions/Amount
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bomRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors"
                    >
                      {/* Material Column */}
                      <td className="py-4 px-4 min-w-[200px]">
                        {renderMaterialDropdown(row)}
                      </td>

                      {/* Dimensions/Amount Column */}
                      <td className="py-4 px-4 min-w-[200px]">
                        {row.material ? (
                          row.material.type === "A" ? (
                            <div className="flex space-x-3">
                              <div className="flex-1">
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Width
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={row.width || ""}
                                  onChange={(e) =>
                                    updateBomRow(
                                      row.id,
                                      "width",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Width"
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Height
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={row.height || ""}
                                  onChange={(e) =>
                                    updateBomRow(
                                      row.id,
                                      "height",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Height"
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm"
                                />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                {row.material.type === "P"
                                  ? "Pieces"
                                  : "Length"}
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={row.amount || ""}
                                onChange={(e) =>
                                  updateBomRow(row.id, "amount", e.target.value)
                                }
                                placeholder={
                                  row.material.type === "P"
                                    ? "Pieces"
                                    : "Length"
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm"
                              />
                            </div>
                          )
                        ) : (
                          <span className="text-gray-400 text-sm">
                            Select material first
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => removeBomRow(row.id)}
                          disabled={bomRows.length <= 1}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                          title="Remove row"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Row Button at Bottom */}
            <div className="flex justify-center">
              <button
                onClick={addBomRow}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
              >
                <Plus size={16} />
                <span>Add Another Row</span>
              </button>
            </div>

            {/* Load More Button for Materials */}
            {nextUrl && (
              <div className="text-center">
                <button
                  onClick={loadMoreMaterials}
                  disabled={loadingMore}
                  className="px-4 py-2 text-sm text-blue-500 hover:text-blue-600 disabled:text-gray-400 transition-colors"
                >
                  {loadingMore ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Loading more materials...</span>
                    </div>
                  ) : (
                    "Load More Materials"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex space-x-3 p-6 border-t border-gray-200 dark:border-zinc-700 sticky bottom-0 bg-white dark:bg-zinc-800">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all duration-200 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!mockupImage || submitting}
            className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 font-medium"
          >
            {submitting ? "Submitting..." : "Submit Mockup"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitMockupOverlay;
