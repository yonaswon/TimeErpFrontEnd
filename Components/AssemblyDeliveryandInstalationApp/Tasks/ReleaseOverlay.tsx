// Tasks/ReleaseOverlay.tsx
import { useState, useEffect } from "react";
import { X, Package, AlertCircle, CheckCircle, Camera } from "lucide-react";
import api from "@/api";

interface Material {
  id: number;
  name: string;
  type: "L" | "A" | "P";
  code_name: string;
}

interface Bom {
  id: number;
  material: Material; // Changed from number to Material object
  amount: string;
  width: string | null;
  height: string | null;
  released: boolean;
}

interface AssemblyAssignment {
  id: number;
  order: {
    order_code: number;
    boms: Bom[];
  };
}

interface ReleaseOverlayProps {
  task: any;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ReleaseItem {
  bom_id: number;
  material_id: number;
  amount: string;
  material_name: string;
  material_type: "L" | "P";
  material_code: string;
}

export const ReleaseOverlay = ({
  task,
  onClose,
  onSuccess,
}: ReleaseOverlayProps) => {
  const [selectedBoms, setSelectedBoms] = useState<number[]>([]);
  const [releaseItems, setReleaseItems] = useState<ReleaseItem[]>([]);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get unique materials from BOMs
  const getAvailableMaterials = () => {
    // Extract unique materials from BOMs and filter out areal materials
    const uniqueMaterials = new Map<number, Material>();

    task.order.boms.forEach((bom: Bom) => {
      if (
        bom.material &&
        bom.material.type !== "A" &&
        !uniqueMaterials.has(bom.material.id)
      ) {
        uniqueMaterials.set(bom.material.id, bom.material);
      }
    });

    return Array.from(uniqueMaterials.values());
  };

  const availableMaterials = getAvailableMaterials();

  // Calculate total length (only length materials, excluding pieces)
  const totalLength = releaseItems.reduce((total, item) => {
    if (item.material_type === "L") {
      return total + parseFloat(item.amount || "0");
    }
    return total;
  }, 0);

  const requiresProof = totalLength > 0.5;

  useEffect(() => {
    // Initialize release items when selected BOMs change
    const newReleaseItems = selectedBoms
      .map((bomId) => {
        const existing = releaseItems.find((item) => item.bom_id === bomId);
        if (existing) return existing;

        const bom = task.order.boms.find((b: Bom) => b.id === bomId);
        if (!bom || !bom.material) return null;

        return {
          bom_id: bomId,
          material_id: bom.material.id,
          amount: "",
          material_name: bom.material.name,
          material_type: bom.material.type as "L" | "P",
          material_code: bom.material.code_name || "N/A",
        };
      })
      .filter(Boolean) as ReleaseItem[];

    // Remove items that are no longer selected
    const filteredItems = newReleaseItems.filter((item) =>
      selectedBoms.includes(item.bom_id)
    );

    setReleaseItems(filteredItems);
  }, [selectedBoms, task.order.boms]);

  const handleBomToggle = (bomId: number) => {
    setSelectedBoms((prev) =>
      prev.includes(bomId)
        ? prev.filter((id) => id !== bomId)
        : [...prev, bomId]
    );
  };

  const handleAmountChange = (bomId: number, amount: string) => {
    setReleaseItems((prev) =>
      prev.map((item) => (item.bom_id === bomId ? { ...item, amount } : item))
    );
  };

  const handleProofImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofImage(file);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate inputs
      for (const item of releaseItems) {
        if (!item.amount || parseFloat(item.amount) <= 0) {
          throw new Error(
            `Please enter a valid amount for ${item.material_name}`
          );
        }
      }

      if (requiresProof && !proofImage) {
        throw new Error(
          "Proof image is required for additional releases over 0.5 meters total length"
        );
      }

      // Prepare form data
      const formData = new FormData();

      // Add releases data - using bom_id as expected by backend
      const releasesPayload = releaseItems.map((item) => ({
        bom_id: item.bom_id,
        amount: parseFloat(item.amount),
      }));

      console.log("Sending releases payload:", releasesPayload);

      formData.append("releases", JSON.stringify(releasesPayload));

      // Add proof image if provided
      if (proofImage) {
        formData.append("proof_image", proofImage);
      }

      // Send request to backend
      const response = await api.post(
        `/api/orders/${task.order.order_code}/additional_release/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess(true);

      // Call success callback after delay
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Release error:", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to submit release request"
      );
    } finally {
      setLoading(false);
    }
  };

  const getMaterialIcon = (type: "L" | "P" | "A") => {
    return type === "L" ? "📏" : "🧩";
  };

  const getUnit = (type: "L" | "P" | "A") => {
    return type === "L" ? "meters" : "pieces";
  };

  // Get first BOM ID for a material
  const getFirstBomIdForMaterial = (materialId: number) => {
    const boms = task.order.boms.filter(
      (bom: Bom) => bom.material.id === materialId
    );
    return boms[0]?.id;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-yellow-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Additional Material Release
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                ORD-{task.order.order_code}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Release Request Submitted
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {requiresProof
                  ? "Your additional release request has been submitted and is awaiting confirmation."
                  : "Additional materials have been released successfully."}
              </p>
            </div>
          ) : (
            <>
              {/* Available Materials Selection */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Select Materials for Additional Release
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableMaterials.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                      No materials available for additional release
                    </p>
                  ) : (
                    availableMaterials.map((material: Material) => {
                      const bomId = getFirstBomIdForMaterial(material.id);

                      return (
                        <label
                          key={material.id}
                          className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700/50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBoms.includes(bomId)}
                            onChange={() => handleBomToggle(bomId)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {material.name}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {getMaterialIcon(material.type)} {material.type}
                              </span>
                            </div>
                            {material.code_name && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Code: {material.code_name}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              Unit: {getUnit(material.type)}
                            </p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Amount Inputs for Selected Materials */}
              {selectedBoms.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Enter Additional Amounts
                  </h3>
                  <div className="space-y-3">
                    {releaseItems.map((item) => (
                      <div
                        key={item.bom_id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-700/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {item.material_name}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({getMaterialIcon(item.material_type)}{" "}
                              {item.material_type})
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Code: {item.material_code} • Unit:{" "}
                            {getUnit(item.material_type)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={item.amount}
                            onChange={(e) =>
                              handleAmountChange(item.bom_id, e.target.value)
                            }
                            placeholder="0.000"
                            className="w-24 px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-500 dark:text-gray-400 w-16">
                            {getUnit(item.material_type)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Length Warning (only for length materials) */}
                  {totalLength > 0.5 && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-yellow-800 dark:text-yellow-300 text-sm">
                          Total length exceeds 0.5m ({totalLength.toFixed(3)}m).
                          Proof image is required.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700 dark:text-blue-300">
                          Total Length:
                        </span>
                        <span className="ml-2 font-medium">
                          {totalLength.toFixed(3)}m
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700 dark:text-blue-300">
                          Total Pieces:
                        </span>
                        <span className="ml-2 font-medium">
                          {
                            releaseItems.filter(
                              (item) => item.material_type === "P"
                            ).length
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Proof Image Upload */}
              {(requiresProof || proofImage) && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Proof Image{" "}
                    {requiresProof && <span className="text-red-500">*</span>}
                  </h3>
                  <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      id="proof-image"
                      accept="image/*"
                      onChange={handleProofImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="proof-image"
                      className="cursor-pointer block"
                    >
                      {proofImage ? (
                        <div className="space-y-2">
                          <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {proofImage.name}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProofImage(null);
                            }}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Click to upload proof image
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Required for additional releases over 0.5m total
                            length
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-red-700 dark:text-red-300 text-sm">
                      {error}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || selectedBoms.length === 0}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4" />
                      <span>
                        {requiresProof
                          ? "Request Additional Release"
                          : "Release Additional Materials"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
