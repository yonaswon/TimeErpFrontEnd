import { Material } from "./types";
import { MaterialStatus } from "./MaterialStatus";

interface MaterialRowProps {
  material: Material;
  onClick: (material: Material) => void;
}

export const MaterialRow = ({ material, onClick }: MaterialRowProps) => {
  const getTypeDisplay = (type: string) => {
    const types = {
      L: "Length",
      A: "Areal",
      P: "Piece",
    };
    return types[type as keyof typeof types] || type;
  };

  const getAvailableText = (material: Material) => {
    if (material.type === "A") {
      return `${material.available} pieces • ${material.parsialy_available} area`;
    }
    return `${material.available} ${
      material.type === "L" ? "meters" : "pieces"
    }`;
  };

  // Helper function to render detailed inventory distribution
  const renderInventoryDistribution = () => {
    const distribution = material.stats.inventory_distribution;

    if (!distribution) {
      return (
        <div className="text-xs text-gray-400 dark:text-gray-500 italic">
          No inventory data
        </div>
      );
    }

    // For Areal materials (array format)
    if (Array.isArray(distribution)) {
      return (
        <div className="space-y-1">
          {distribution.slice(0, 2).map((inventory, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-gray-600 dark:text-gray-400 font-medium truncate max-w-[120px]">
                {inventory.inventory__name}
              </span>
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <span className="text-green-600 dark:text-green-400">
                  {inventory.unstarted} avail
                </span>
                <span>•</span>
                <span className="text-orange-500 dark:text-orange-400">
                  {inventory.started} started
                </span>
              </div>
            </div>
          ))}
          {distribution.length > 2 && (
            <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">
              +{distribution.length - 2} more locations
            </div>
          )}
        </div>
      );
    }

    // For Length materials (object format)
    const locations = Object.entries(distribution);
    return (
      <div className="space-y-1">
        {locations.slice(0, 2).map(([inventoryName, quantity]: any, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-xs"
          >
            <span className="text-gray-600 dark:text-gray-400 font-medium truncate max-w-[120px]">
              {inventoryName}
            </span>
            <span className="text-green-600 dark:text-green-400">
              {quantity} available
            </span>
          </div>
        ))}
        {locations.length > 2 && (
          <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">
            +{locations.length - 2} more locations
          </div>
        )}
      </div>
    );
  };

  // Get total count based on material type
  const getTotalCount = () => {
    if (material.type === "A") {
      return material.stats.total_pieces || 0;
    } else if (material.type === "L") {
      return material.stats.total_available || 0;
    }
    return 0;
  };

  // Get distribution summary for the header
  const getDistributionSummary = () => {
    const distribution = material.stats.inventory_distribution;

    if (!distribution) return null;

    if (Array.isArray(distribution)) {
      const totalLocations = distribution.length;
      const totalAvailable = distribution.reduce(
        (sum, inv) => sum + inv.unstarted,
        0
      );
      const totalStarted = distribution.reduce(
        (sum, inv) => sum + inv.started,
        0
      );

      return (
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <span>
            📦 {totalLocations} location{totalLocations !== 1 ? "s" : ""}
          </span>
          <span>•</span>
          <span className="text-green-600 dark:text-green-400">
            {totalAvailable} avail
          </span>
          {totalStarted > 0 && (
            <>
              <span>•</span>
              <span className="text-orange-500 dark:text-orange-400">
                {totalStarted} started
              </span>
            </>
          )}
        </div>
      );
    }

    // For Length materials
    const locations = Object.keys(distribution);
    const totalQuantity = Object.values(distribution).reduce(
      (sum: number, qty) => sum + Number(qty),
      0
    );

    return (
      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
        <span>
          📍 {locations.length} location{locations.length !== 1 ? "s" : ""}
        </span>
        <span>•</span>
        <span className="text-green-600 dark:text-green-400">
          {totalQuantity.toFixed(1)}m total
        </span>
      </div>
    );
  };

  return (
    <div
      onClick={() => onClick(material)}
      className="flex items-start justify-between p-4 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all duration-200 hover:shadow-md"
    >
      <div className="flex items-start space-x-4 flex-1 min-w-0">
        <MaterialStatus material={material} size="md" />

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

          {/* <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>{getTypeDisplay(material.type)}</span>
            <span>•</span>
            <span>{getAvailableText(material)}</span>
            {material.type === "A" && material.width && material.height && (
              <>
                <span>•</span>
                <span>
                  {material.width}×{material.height}
                </span>
              </>
            )}
          </div> */}

          {/* Distribution Summary */}
          {getDistributionSummary()}

          {/* Detailed Inventory Distribution */}
          <div className="mt-2">{renderInventoryDistribution()}</div>
        </div>
      </div>

      <div className="flex items-center space-x-4 ml-4">
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {getTotalCount()} total
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
