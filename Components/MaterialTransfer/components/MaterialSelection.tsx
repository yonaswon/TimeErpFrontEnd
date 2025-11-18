import React from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Material, Inventory } from "../types";
import { useMaterials } from "../hooks/useMaterials";
import { MaterialCard } from "./MaterialCard";
import { LoadMoreButton } from "./LoadMoreButton";

interface MaterialSelectionProps {
  fromInventory: Inventory;
  toInventory: Inventory;
  onSelect: (materials: Material[]) => void;
  onBack: () => void;
}
export const MaterialSelection: React.FC<MaterialSelectionProps> = ({
  fromInventory,
  toInventory,
  onSelect,
  onBack,
}) => {
  // Add this check at the start
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
  const [selectedMaterials, setSelectedMaterials] = React.useState<Material[]>(
    []
  );
  const [searchTerm, setSearchTerm] = React.useState("");
  const {
    materials,
    loading,
    error,
    nextPage,
    loadMore,
    getAvailableInInventory,
  } = useMaterials(fromInventory.id);

  const filteredMaterials = materials
    .filter(
      (material) =>
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.code_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((material) => {
      const available = getAvailableInInventory(material, fromInventory.name);
      return available > 0;
    });

  const handleMaterialSelect = (material: Material) => {
    setSelectedMaterials([material]); // Only allow single selection for now
  };

  const handleContinue = () => {
    if (selectedMaterials.length > 0) {
      onSelect(selectedMaterials);
    }
  };

  if (loading && materials.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

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
            Select Material
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            From <strong>{fromInventory.name}</strong> to{" "}
            <strong>{toInventory.name}</strong>
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search materials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Material List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredMaterials.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            fromInventory={fromInventory}
            isSelected={selectedMaterials.some((m) => m.id === material.id)}
            onSelect={()=>handleMaterialSelect(material)}
            getAvailableInInventory={getAvailableInInventory}
          />
        ))}

        {filteredMaterials.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No materials found
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
          Continue with {selectedMaterials[0].name}
        </button>
      )}
    </div>
  );
};
