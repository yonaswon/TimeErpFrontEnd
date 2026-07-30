"use client";
import { useState, useEffect } from "react";
import api from "@/api";
import { Order, Material, BomFormData, getBomEditMode } from "./types";

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

  const editMode = getBomEditMode(order.order_status);
  const isEditMode = order.boms.length > 0;
  const isAddOnly = editMode === "add_only";

  useEffect(() => {
    fetchMaterials();

    if (order.boms.length > 0) {
      setBomItems(
        order.boms.map((bom) => ({
          bom_id: bom.id,
          locked: isAddOnly,
          material:
            typeof bom.material === "object" && bom.material !== null
              ? bom.material.id
              : typeof bom.material === "number"
                ? bom.material
                : 0,
          amount: bom.amount != null ? String(bom.amount) : "",
          width: bom.width != null ? String(bom.width) : "",
          height: bom.height != null ? String(bom.height) : "",
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
  }, [order, isAddOnly]);

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

    if (editMode === "locked") {
      setError("Cannot edit BOMs after assembly is completed.");
      return;
    }

    const validationErrors: string[] = [];
    const itemsToValidate = isAddOnly
      ? bomItems.filter((item) => !item.locked)
      : bomItems;

    if (isAddOnly && itemsToValidate.length === 0) {
      setError(
        "No new materials to add. Existing amounts are locked after assembly started."
      );
      return;
    }

    itemsToValidate.forEach((item, index) => {
      const material = getSelectedMaterial(item.material);
      const label = isAddOnly ? `New item ${index + 1}` : `Item ${index + 1}`;

      if (!item.material || !material) {
        validationErrors.push(`${label}: Please select a material`);
        return;
      }

      if (material.type === "A") {
        if (!item.width || parseFloat(item.width) <= 0) {
          validationErrors.push(`${label}: Width required for Areal`);
        }
        if (!item.height || parseFloat(item.height) <= 0) {
          validationErrors.push(`${label}: Height required for Areal`);
        }
        if (item.amount && parseFloat(item.amount) > 0) {
          validationErrors.push(`${label}: Clear Amount for Areal`);
        }
      } else {
        if (!item.amount || parseFloat(item.amount) <= 0) {
          validationErrors.push(`${label}: Amount required`);
        }
        if (
          (item.width && parseFloat(item.width) > 0) ||
          (item.height && parseFloat(item.height) > 0)
        ) {
          validationErrors.push(`${label}: Clear Width/Height`);
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

      const mapItem = (item: BomFormData) => {
        const material = getSelectedMaterial(item.material);
        const base: Record<string, unknown> = {};
        if (item.bom_id) base.bom_id = item.bom_id;
        if (material?.type === "A") {
          return {
            ...base,
            material: item.material,
            amount: 0,
            width: parseFloat(item.width) || 0,
            height: parseFloat(item.height) || 0,
          };
        }
        return {
          ...base,
          material: item.material,
          amount: parseFloat(item.amount) || 0,
          width: 0,
          height: 0,
        };
      };

      const bomData = {
        boms_data: bomItems.map(mapItem),
      };

      if (isEditMode) {
        const response = await api.post(
          `/api/orders/${order.order_code}/editbom/`,
          bomData
        );
        const synced = response.data?.duplicates_synced;
        if (synced > 0) {
          alert(`BOM updated and synced to ${synced} duplicate order(s).`);
        }
      } else {
        const response = await api.post(
          `/api/orders/${order.order_code}/fillbom/`,
          bomData
        );
        const synced = response.data?.duplicates_synced;
        if (synced > 0) {
          alert(`BOM filled and synced to ${synced} duplicate order(s).`);
        }
      }

      onSuccess();
    } catch (err: any) {
      const data = err.response?.data;
      setError(
        data?.error || data?.message || data?.detail || "Failed to submit BOM"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBomItemChange = (
    index: number,
    field: keyof BomFormData,
    value: string
  ) => {
    if (bomItems[index]?.locked) return;
    const newBomItems = [...bomItems];

    if (field === "material") {
      newBomItems[index] = {
        material: parseInt(value),
        amount: "",
        width: "",
        height: "",
        locked: false,
      };
    } else {
      newBomItems[index] = { ...newBomItems[index], [field]: value };
    }

    setBomItems(newBomItems);
  };

  const addBomItem = () => {
    setBomItems([
      ...bomItems,
      { material: 0, amount: "", width: "", height: "", locked: false },
    ]);
  };

  const removeBomItem = (index: number) => {
    if (bomItems[index]?.locked) return;
    if (isAddOnly) {
      setBomItems(bomItems.filter((_, i) => i !== index));
      return;
    }
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

  const title = isAddOnly
    ? "Add materials"
    : isEditMode
      ? "Edit BOM"
      : "Fill BOM";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-[#1E293B] rounded-xl w-full max-w-2xl max-h-screen overflow-y-auto border border-[#E5E7EB] dark:border-[#334155]">
        <div className="flex justify-between items-center p-4 border-b border-[#E5E7EB] dark:border-[#334155] sticky top-0 bg-white dark:bg-[#1E293B] z-10">
          <h2 className="text-lg font-semibold text-[#111827] dark:text-[#F1F5F9]">
            {title} — ORD{String(order.order_code).padStart(4, "0")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] text-[#6B7280] dark:text-[#94A3B8] text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 pb-0">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-[#DC2626] dark:text-[#EF4444] rounded-lg text-base whitespace-pre-line">
              {error}
            </div>
          )}

          {order.duplicate_group && (order.duplicate_group_size ?? 0) > 1 && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
              <p className="text-amber-900 dark:text-amber-100 font-medium">
                {order.duplicate_group_size}× duplicate — same design
              </p>
              <p className="text-amber-800 dark:text-amber-200 mt-1">
                BOM will apply to all {order.duplicate_group_size} linked copies
                in this group.
              </p>
            </div>
          )}

          {isAddOnly && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-base">
              <p className="text-[#111827] dark:text-[#F1F5F9] font-medium">
                Assembly has started
              </p>
              <p className="text-[#6B7280] dark:text-[#94A3B8] mt-1 text-sm">
                Existing materials are locked. You can only add new materials.
                Stock for new lines is deducted when assembly clicks Complete.
              </p>
            </div>
          )}

          {isEditMode && !isAddOnly && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
              <p className="text-[#111827] dark:text-[#F1F5F9]">
                Editing — all previous items will be replaced
              </p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            {bomItems.map((item, index) => {
              const material = getSelectedMaterial(item.material);
              const type = material?.type || "";
              const isAreal = type === "A";
              const unit = getUnitLabel(type);
              const locked = !!item.locked;

              const usedMaterialIdsSet = new Set<number>();
              bomItems.forEach((bom, i) => {
                if (i !== index && bom.material > 0) {
                  usedMaterialIdsSet.add(bom.material);
                }
              });

              return (
                <div
                  key={item.bom_id ?? `new-${index}`}
                  className={`border rounded-xl p-4 ${
                    locked
                      ? "border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A]/60"
                      : "border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A]/50"
                  }`}
                >
                  <div className="flex justify-between items-center mb-3 gap-2">
                    <span className="text-sm font-medium text-[#111827] dark:text-[#F1F5F9]">
                      {locked ? "Existing" : `Item ${index + 1}`}
                      {material ? ` – ${material.name}` : ""}
                      {locked && (
                        <span className="ml-2 text-xs text-[#F59E0B]">
                          Locked
                        </span>
                      )}
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
                      {!locked && (isAddOnly || bomItems.length > 1) && (
                        <button
                          type="button"
                          onClick={() => removeBomItem(index)}
                          className="min-h-[44px] min-w-[44px] text-[#DC2626] dark:text-[#EF4444] text-xl leading-none"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#6B7280] dark:text-[#94A3B8] mb-2">
                      Material
                    </label>
                    {materialsLoading ? (
                      <div className="h-11 bg-gray-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
                    ) : (
                      <select
                        value={item.material}
                        disabled={locked}
                        onChange={(e) =>
                          handleBomItemChange(index, "material", e.target.value)
                        }
                        className="w-full h-11 px-3 text-base border border-[#E5E7EB] dark:border-[#334155] rounded-lg bg-white dark:bg-[#1E293B] text-[#111827] dark:text-[#F1F5F9] disabled:opacity-60"
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
                            >
                              {m.name} ({getMaterialTypeLabel(m.type)})
                              {disabled ? " — already used" : ""}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>

                  {material && (
                    <div className="grid grid-cols-2 gap-4">
                      {isAreal ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-[#6B7280] dark:text-[#94A3B8] mb-2">
                              Width (m)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.width}
                              disabled={locked}
                              onChange={(e) =>
                                handleBomItemChange(
                                  index,
                                  "width",
                                  e.target.value
                                )
                              }
                              className="w-full h-11 px-3 text-base border border-[#E5E7EB] dark:border-[#334155] rounded-lg bg-white dark:bg-[#1E293B] disabled:opacity-60"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#6B7280] dark:text-[#94A3B8] mb-2">
                              Height (m)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.height}
                              disabled={locked}
                              onChange={(e) =>
                                handleBomItemChange(
                                  index,
                                  "height",
                                  e.target.value
                                )
                              }
                              className="w-full h-11 px-3 text-base border border-[#E5E7EB] dark:border-[#334155] rounded-lg bg-white dark:bg-[#1E293B] disabled:opacity-60"
                              placeholder="0.00"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-[#6B7280] dark:text-[#94A3B8] mb-2">
                            Amount ({unit})
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.amount}
                            disabled={locked}
                            onChange={(e) =>
                              handleBomItemChange(
                                index,
                                "amount",
                                e.target.value
                              )
                            }
                            className="w-full h-11 px-3 text-base border border-[#E5E7EB] dark:border-[#334155] rounded-lg bg-white dark:bg-[#1E293B] disabled:opacity-60"
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {!material && !locked && (
                    <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-2">
                      Select material to show fields
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {(editMode === "free" || isAddOnly) && (
            <button
              type="button"
              onClick={addBomItem}
              className="w-full min-h-[44px] mb-6 text-base font-medium text-[#16A34A] dark:text-[#22C55E] border border-[#16A34A] dark:border-[#22C55E] rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition"
            >
              + Add Item
            </button>
          )}

          <div className="flex gap-4 justify-end py-4 border-t border-[#E5E7EB] dark:border-[#334155] sticky bottom-0 bg-white dark:bg-[#1E293B]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 text-base font-medium text-[#111827] dark:text-[#F1F5F9] bg-[#E5E7EB] dark:bg-[#334155] rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="min-h-[44px] px-4 text-base font-medium text-white bg-[#2563EB] rounded-lg hover:bg-[#1D4ED8] disabled:opacity-50"
            >
              {loading
                ? "Submitting..."
                : isAddOnly
                  ? "Add materials"
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
