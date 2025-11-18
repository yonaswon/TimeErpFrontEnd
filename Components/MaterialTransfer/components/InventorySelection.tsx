import React, { useEffect } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Inventory } from "../types";
import { useInventories } from "../hooks/useInventories";

interface InventorySelectionProps {
  fromInventoryId: number;
  setTransferState: (any: any) => void;
  onSelect: (inventory: Inventory) => void;
  onBack: () => void;
}

export const InventorySelection: React.FC<InventorySelectionProps> = ({
  fromInventoryId,
  setTransferState,
  onSelect,
  onBack,
}) => {
  const { inventories, loading, error } = useInventories();
  const [searchTerm, setSearchTerm] = React.useState("");

  const fromInventory = inventories.find((inv) => inv.id === fromInventoryId);
  const filteredInventories = inventories.filter(
    (inv) =>
      inv.id !== fromInventoryId &&
      inv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setTransferState((prev: any) => ({
      ...prev,
      fromInventory,
    }));
  }, [fromInventory, fromInventoryId]);

  if (loading) {
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
            Select Destination Inventory
          </h3>
          {fromInventory && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Transferring from <strong>{fromInventory.name}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search inventories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Inventory List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredInventories.map((inventory) => (
          <div
            key={inventory.id}
            onClick={() => onSelect(inventory)}
            className="p-4 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {inventory.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {inventory.type === "SM" ? "Stock Manager" : "Personal Stock"}
                </p>
              </div>
              <div className="text-gray-400 dark:text-gray-600">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}

        {filteredInventories.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No inventories found
          </div>
        )}
      </div>
    </div>
  );
};
