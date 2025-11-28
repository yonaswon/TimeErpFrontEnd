import {
  X,
  Package,
  Ruler,
  Square,
  MapPin,
  AlertTriangle,
  User,
} from "lucide-react";
import { Material } from "./types";
import { PersonalMaterialStatus } from "./PersonalMaterialStatus";

interface PersonalMaterialDetailsProps {
  material: Material;
  userInventoryName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PersonalMaterialDetails = ({
  material,
  userInventoryName,
  isOpen,
  onClose,
}: PersonalMaterialDetailsProps) => {
  if (!isOpen) return null;

  const getTypeIcon = (type: string) => {
    const icons = {
      L: <Ruler className="w-5 h-5" />,
      A: <Square className="w-5 h-5" />,
      P: <Square className="w-5 h-5" />,
    };
    return icons[type as keyof typeof icons] || <Package className="w-5 h-5" />;
  };

  const getTypeDisplay = (type: string) => {
    const types = {
      L: "Length Material",
      A: "Areal Material",
      P: "Piece Material",
    };
    return types[type as keyof typeof types] || type;
  };

  // Get available quantity in user's inventory (can be 0)
  const getAvailableInMyInventory = () => {
    const distribution = material.stats.inventory_distribution;

    if (Array.isArray(distribution)) {
      const myInventory = distribution.find(
        (inv) => inv.inventory__name === userInventoryName
      );
      return myInventory ? myInventory.unstarted : 0;
    } else if (typeof distribution === "object") {
      return distribution[userInventoryName] || 0;
    }

    return 0;
  };

  const availableInMyInventory = getAvailableInMyInventory();

  // Render user's inventory details (always show, even if 0)
  const renderMyInventoryDetails = () => {
    const distribution = material.stats.inventory_distribution;

    if (Array.isArray(distribution)) {
      const myInventory = distribution.find(
        (inv) => inv.inventory__name === userInventoryName
      );

      return (
        <div className="space-y-3">
          <div
            className={`flex justify-between items-center p-4 rounded-lg border ${
              availableInMyInventory > 0
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            }`}
          >
            <div>
              <div className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Your Inventory</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {userInventoryName}
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-2xl font-bold ${
                  availableInMyInventory > 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {availableInMyInventory}
              </div>
              <div
                className={`text-sm ${
                  availableInMyInventory > 0
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Available
              </div>
            </div>
          </div>

          {/* Detailed breakdown for areal materials */}
          {myInventory && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {myInventory.unstarted}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">
                  Unstarted
                </div>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {myInventory.started}
                </div>
                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                  In Progress
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
                  {myInventory.finished}
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  Finished
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // For length materials
    const myQuantity = distribution[userInventoryName] || 0;
    return (
      <div
        className={`flex justify-between items-center p-4 rounded-lg border ${
          myQuantity > 0
            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        }`}
      >
        <div>
          <div className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Your Inventory</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {userInventoryName}
          </div>
        </div>
        <div className="text-right">
          <div
            className={`text-2xl font-bold ${
              myQuantity > 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {myQuantity}
          </div>
          <div
            className={`text-sm ${
              myQuantity > 0
                ? "text-blue-700 dark:text-blue-300"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Available {material.type === "L" ? "meters" : "units"}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-3">
            <PersonalMaterialStatus
              material={material}
              userInventoryName={userInventoryName}
              size="lg"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {material.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {material.code_name || "No code name"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              {getTypeIcon(material.type)}
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {getTypeDisplay(material.type)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Type
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              <Package className="w-5 h-5" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {availableInMyInventory}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Available to You
                </div>
              </div>
            </div>

            {material.type === "A" && (
              <>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <Ruler className="w-5 h-5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {material.width} × {material.height}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Dimensions
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <Square className="w-5 h-5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {material.parsialy_available}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Total Area
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* My Inventory Details */}
          <div>
            <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <MapPin className="w-5 h-5" />
              <span>My Inventory</span>
            </h3>
            {renderMyInventoryDetails()}
          </div>

          {/* Threshold Warning */}
          {availableInMyInventory < material.min_threshold && (
            <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
              <div>
                <div className="font-medium text-red-800 dark:text-red-300">
                  Low Stock Warning
                </div>
                <div className="text-sm text-red-700 dark:text-red-400">
                  Available to you ({availableInMyInventory}) is below minimum
                  threshold ({material.min_threshold})
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
