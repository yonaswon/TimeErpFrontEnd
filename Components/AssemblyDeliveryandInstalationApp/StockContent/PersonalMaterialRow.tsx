import { Material } from "./types";
import { PersonalMaterialStatus } from "./PersonalMaterialStatus";

interface PersonalMaterialRowProps {
  material: Material;
  userInventoryName: string;
  onClick: (material: Material) => void;
}

export const PersonalMaterialRow = ({
  material,
  userInventoryName,
  onClick,
}: PersonalMaterialRowProps) => {
  const getTypeDisplay = (type: string) => {
    const types = {
      L: "Length",
      A: "Areal",
      P: "Piece",
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

  // Get display text for available quantity
  const getAvailableText = () => {
    if (material.type === "A") {
      const areaPerPiece =
        parseFloat(material.width || "0") * parseFloat(material.height || "0");
      const totalArea = availableInMyInventory * areaPerPiece;
      return `${availableInMyInventory} pieces • ${totalArea.toFixed(1)} area`;
    }
    return `${availableInMyInventory} ${
      material.type === "L" ? "meters" : "pieces"
    }`;
  };

  return (
    <div
      onClick={() => onClick(material)}
      className="flex items-start justify-between p-4 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all duration-200 hover:shadow-md"
    >
      <div className="flex items-start space-x-4 flex-1 min-w-0">
        <PersonalMaterialStatus
          material={material}
          userInventoryName={userInventoryName}
          size="md"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {material.name}
            </h3>
            {material.code_name && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                {material.code_name}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>{getTypeDisplay(material.type)}</span>
            <span>•</span>
            <span
              className={`font-medium ${
                availableInMyInventory > 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {getAvailableText()}
            </span>
            {material.type === "A" && material.width && material.height && (
              <>
                <span>•</span>
                <span>
                  {material.width}×{material.height}
                </span>
              </>
            )}
          </div>

          {/* Inventory Badge */}
          <div className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-zinc-700 rounded-full">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              📦 {userInventoryName}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4 ml-4">
        <div className="text-right">
          <div
            className={`text-sm font-medium ${
              availableInMyInventory > 0
                ? "text-gray-900 dark:text-white"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {availableInMyInventory} avail
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {material.min_threshold} min
          </div>
        </div>

        <div className="text-gray-400 dark:text-gray-600 mt-1">
          <svg
            className="w-4 h-4"
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
  );
};
