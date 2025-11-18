import React, { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Material, Inventory, EachArealMaterial } from "../types";
import { useEachArealMaterials } from "../hooks/useEachArealMaterials";
import { ArealMaterialCard } from "./ArealMaterialCard";
import { LoadMoreButton } from "./LoadMoreButton";

interface ArealMaterialSelectionProps {
  fromInventory: Inventory;
  material: Material;
  onSelect: (materials: EachArealMaterial[]) => void;
  onBack: () => void;
}

export const ArealMaterialSelection: React.FC<ArealMaterialSelectionProps> = ({
  fromInventory,
  material,
  onSelect,
  onBack,
}) => {
  if (!fromInventory) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 dark:text-red-400 mb-4">
          Source inventory not found
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const [selectedMaterials, setSelectedMaterials] = useState<
    EachArealMaterial[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { materials, loading, error, nextPage, loadMore } =
    useEachArealMaterials(fromInventory.id, material.id);

  // -----------------------------------------------------
  // 🔍 FILTER MATERIALS SAFELY USING useMemo (faster, clean)
  // -----------------------------------------------------
  const filteredMaterials = useMemo(() => {
    if (!materials) return [];

    const term = searchTerm.toLowerCase();

    return materials.filter(
      (item) =>
        item.material_name.toLowerCase().includes(term) ||
        item.code.toString().includes(searchTerm)
    );
  }, [materials, searchTerm]);

  // -----------------------------------------------------
  // Select / Unselect
  // -----------------------------------------------------
  const handleMaterialSelect = (materialItem: EachArealMaterial) => {
    setSelectedMaterials((prev) => {
      const exists = prev.some((m) => m.id === materialItem.id);
      return exists
        ? prev.filter((m) => m.id !== materialItem.id)
        : [...prev, materialItem];
    });
  };

  const handleContinue = () => {
    if (selectedMaterials.length > 0) {
      onSelect(selectedMaterials);
    }
  };

  // -----------------------------------------------------
  // Loading
  // -----------------------------------------------------
  if (loading && (!materials || materials.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  // -----------------------------------------------------
  // Error
  // -----------------------------------------------------
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 dark:text-red-400 mb-4">{error}</div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // -----------------------------------------------------
  // MAIN UI
  // -----------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Select {material.name} Pieces
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose pieces to transfer
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search by code or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Selected Count */}
      {selectedMaterials.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {selectedMaterials.length} piece
            {selectedMaterials.length !== 1 ? "s" : ""} selected
          </p>
        </div>
      )}

      {/* Material List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredMaterials.map((materialItem) => (
          <ArealMaterialCard
            key={materialItem.id}
            material={materialItem}
            isSelected={selectedMaterials.some((m) => m.id === materialItem.id)}
            onSelect={handleMaterialSelect}
          />
        ))}

        {filteredMaterials.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No pieces found
          </div>
        )}
      </div>

      {/* Load More */}
      {nextPage && <LoadMoreButton onClick={loadMore} loading={loading} />}

      {/* Continue Button */}
      {selectedMaterials.length > 0 && (
        <button
          onClick={handleContinue}
          className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          Transfer {selectedMaterials.length} Piece
          {selectedMaterials.length !== 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
};
