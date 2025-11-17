"use client";
import { useState, useEffect } from "react";
import api from "@/api";
import { Order, Material, BomFormData } from "./types";

interface BomFormOverlayProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

const BomFormOverlay = ({ order, onClose, onSuccess }: BomFormOverlayProps) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bomItems, setBomItems] = useState<BomFormData[]>([]);

  const isEditMode = order.boms.length > 0;

  useEffect(() => {
    fetchMaterials();

    if (order.boms.length > 0) {
      setBomItems(
        order.boms.map((bom) => ({
          material: bom.material,
          amount: bom.amount || "",
          width: bom.width || "",
          height: bom.height || "",
        }))
      );
    } else {
      setBomItems([
        {
          material: 0,
          amount: "",
          width: "",
          height: "",
        },
      ]);
    }
  }, [order]);

  const fetchMaterials = async () => {
    try {
      setMaterialsLoading(true);
      const response: any = await api.get("/materials/");
      setMaterials(response?.data?.results || response?.results || []);
    } catch (err: any) {
      setError("Failed to fetch materials");
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: string[] = [];

    bomItems.forEach((item, index) => {
      const material = getSelectedMaterial(item.material);

      if (!item.material || !material) {
        validationErrors.push(`Item ${index + 1}: Please select a material`);
        return;
      }

      if (material.type === "A") {
        if (!item.width || parseFloat(item.width) <= 0) {
          validationErrors.push(`Item ${index + 1}: Width required for Areal`);
        }
        if (!item.height || parseFloat(item.height) <= 0) {
          validationErrors.push(`Item ${index + 1}: Height required for Areal`);
        }
        if (item.amount && parseFloat(item.amount) > 0) {
          validationErrors.push(`Item ${index + 1}: Clear Amount for Areal`);
        }
      } else {
        if (!item.amount || parseFloat(item.amount) <= 0) {
          validationErrors.push(`Item ${index + 1}: Amount required`);
        }
        if (
          (item.width && parseFloat(item.width) > 0) ||
          (item.height && parseFloat(item.height) > 0)
        ) {
          validationErrors.push(`Item ${index + 1}: Clear Width/Height`);
        }
      }
    });

    if (validationErrors.length > 0) {
      setError(validationErrors.join("\n"));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const bomData = {
        boms_data: bomItems.map((item) => {
          const material = getSelectedMaterial(item.material);
          if (material?.type === "A") {
            return {
              material: item.material,
              amount: 0,
              width: parseFloat(item.width) || 0,
              height: parseFloat(item.height) || 0,
            };
          }
          return {
            material: item.material,
            amount: parseFloat(item.amount) || 0,
            width: 0,
            height: 0,
          };
        }),
      };

      if (isEditMode) {
        await api.post(`/api/orders/${order.order_code}/editbom/`, bomData);
      } else {
        await api.post(`/api/orders/${order.order_code}/fillbom/`, bomData);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit BOM");
    } finally {
      setLoading(false);
    }
  };

  const handleBomItemChange = (
    index: number,
    field: keyof BomFormData,
    value: string
  ) => {
    const newBomItems = [...bomItems];

    if (field === "material") {
      const selectedMaterial = materials.find((m) => m.id === parseInt(value));
      newBomItems[index] = {
        material: parseInt(value),
        amount: "",
        width: "",
        height: "",
      };

  
    } else {
      newBomItems[index] = { ...newBomItems[index], [field]: value };
    }

    setBomItems(newBomItems);
  };

  const addBomItem = () => {
    setBomItems([
      ...bomItems,
      { material: 0, amount: "", width: "", height: "" },
    ]);
  };

  const removeBomItem = (index: number) => {
    if (bomItems.length > 1) {
      setBomItems(bomItems.filter((_, i) => i !== index));
    }
  };

  const getMaterialTypeLabel = (type: string) => {
    switch (type) {
      case "A":
        return "Areal";
      case "L":
        return "Length";
      case "P":
        return "Piece";
      default:
        return type;
    }
  };

  const getSelectedMaterial = (materialId: number) => {
    return materials.find((m) => m.id === materialId);
  };

  const getUnitLabel = (materialType: string) => {
    switch (materialType) {
      case "A":
        return "sheets";
      case "L":
        return "meters";
      case "P":
        return "pcs";
      default:
        return "units";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-800 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-700 sticky top-0 bg-white dark:bg-zinc-800 z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditMode ? "Edit" : "Fill"} BOM — ORD
            {String(order.order_code).padStart(4, "0")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 pb-0">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          {isEditMode && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
              <p className="text-blue-900 dark:text-blue-100">
                Editing — all previous items will be replaced
              </p>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-6 mb-6">
            {bomItems.map((item, index) => {
              const material = getSelectedMaterial(item.material);
              const type = material?.type || "";
              const isAreal = type === "A";
              const unit = getUnitLabel(type);

              // Materials used by other rows (excluding current row)
              const usedMaterialIdsSet = new Set<number>();
              bomItems.forEach((bom, i) => {
                if (i !== index && bom.material > 0) {
                  usedMaterialIdsSet.add(bom.material);
                }
              });

              return (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-zinc-700 rounded-lg p-4 bg-gray-50 dark:bg-zinc-900/50"
                >
                  {/* Header Row */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Item {index + 1}
                      {material ? ` – ${material.name}` : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      {material && (
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${
                            isAreal
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                              : type === "L"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
                          }`}
                        >
                          {getMaterialTypeLabel(type)}
                        </span>
                      )}
                      {bomItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBomItem(index)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 text-xl leading-none"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Material Select */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Material
                    </label>
                    {materialsLoading ? (
                      <div className="h-9 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse"></div>
                    ) : (
                      <select
                        value={item.material}
                        onChange={(e) =>
                          handleBomItemChange(index, "material", e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                      >
                        <option value={0}>-- Select a material --</option>
                        {materials.map((m) => {
                          const disabled =
                            usedMaterialIdsSet.has(m.id) &&
                            m.id !== item.material;
                          return (
                            <option
                              key={m.id}
                              value={m.id}
                              disabled={disabled}
                              className={disabled ? "opacity-50" : ""}
                            >
                              {m.name} ({getMaterialTypeLabel(m.type)})
                              {disabled ? " — already used" : ""}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>

                  {/* Conditional Fields */}
                  {material && (
                    <div className="grid grid-cols-2 gap-3">
                      {isAreal ? (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Width (m)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.width}
                              onChange={(e) =>
                                handleBomItemChange(
                                  index,
                                  "width",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Height (m) 
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.height}
                              onChange={(e) =>
                                handleBomItemChange(
                                  index,
                                  "height",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
                              placeholder="0.00"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Amount ({unit})
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) =>
                              handleBomItemChange(
                                index,
                                "amount",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {!material && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Select material to show fields
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Button */}
          <button
            type="button"
            onClick={addBomItem}
            className="w-full py-2 mb-6 text-sm font-medium text-green-600 dark:text-green-400 border border-green-600 dark:border-green-400 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition"
          >
            + Add Item
          </button>

          {/* Footer */}
          <div className="flex gap-3 justify-end py-4 border-t border-gray-200 dark:border-zinc-700 sticky bottom-0 bg-white dark:bg-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-zinc-700 rounded hover:bg-gray-300 dark:hover:bg-zinc-600"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? "Submitting..."
                : isEditMode
                ? "Update BOM"
                : "Submit BOM"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BomFormOverlay;
