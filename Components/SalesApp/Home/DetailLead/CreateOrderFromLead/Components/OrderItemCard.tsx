"use client";
import { Upload } from "lucide-react";
import { FormItem } from "../types";

interface OrderItemCardProps {
  item: FormItem;
  index: number;
  designTypes: any[];
  materials: any[];
  onItemChange: (index: number, field: keyof FormItem, value: any) => void;
}

export default function OrderItemCard({
  item,
  index,
  designTypes,
  materials,
  onItemChange,
}: OrderItemCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-4">
      {/* Item Header */}
      <div className="flex items-start gap-4 mb-4">
        {/* Image */}
        <div className="shrink-0">
          <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-700 rounded-lg overflow-hidden flex items-center justify-center">
            {item.mockup_image ? (
              typeof item.mockup_image === "string" ? (
                <img
                  src={item.mockup_image}
                  alt="Mockup"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-xs text-gray-500 text-center p-2">
                  New image selected
                </div>
              )
            ) : (
              <div className="text-xs text-gray-500 text-center p-2">
                No image
              </div>
            )}
          </div>
          <label className="flex items-center gap-1 cursor-pointer text-xs text-blue-600 dark:text-blue-400 mt-2">
            <Upload className="w-3 h-3" />
            Replace
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                onItemChange(index, "mockup_image", e.target.files?.[0] || null)
              }
            />
          </label>
        </div>

        {/* Item Details */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Design Type
            </label>
            <select
              value={item.design_type}
              onChange={(e) =>
                onItemChange(index, "design_type", parseInt(e.target.value))
              }
              className="w-full p-2 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select design type</option>
              {designTypes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Price
            </label>
            <input
              type="number"
              value={item.price}
              min={0}
              step="1"
              onChange={(e) =>
                onItemChange(index, "price", parseFloat(e.target.value) || 0)
              }
              className="w-full p-2 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
              required
            />
          </div>
        </div>
      </div>

      {/* BOM Section */}
      {/* <BOMSection
        item={item}
        itemIndex={index}
        materials={materials}
        onItemChange={onItemChange}
      /> */}
    </div>
  );
}
