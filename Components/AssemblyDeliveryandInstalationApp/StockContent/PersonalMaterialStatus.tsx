import { AlertTriangle, CheckCircle, Info, Package, X } from "lucide-react";
import { Material } from "./types";

interface PersonalMaterialStatusProps {
  material: Material;
  userInventoryName: string;
  size?: "sm" | "md" | "lg";
}

export const PersonalMaterialStatus = ({
  material,
  userInventoryName,
  size = "md",
}: PersonalMaterialStatusProps) => {
  // Get available quantity in user's inventory (can be 0)
  const getAvailableInMyInventory = () => {
    const distribution = material.stats.inventory_distribution;
    
    if (Array.isArray(distribution)) {
      const myInventory = distribution.find(inv => inv.inventory__name === userInventoryName);
      return myInventory ? myInventory.unstarted : 0;
    } else if (typeof distribution === 'object') {
      return distribution[userInventoryName] || 0;
    }
    
    return 0;
  };

  const available = getAvailableInMyInventory();
  const threshold = material.min_threshold;

  const getStatus = () => {
    if (available === 0) return "out-of-stock";
    if (available < threshold) return "critical";
    if (available <= threshold + 1) return "warning";
    return "good";
  };

  const status = getStatus();

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-6 h-6",
  };

  const statusConfig = {
    "out-of-stock": {
      color: "bg-red-500 border-red-600",
      icon: <X className="w-3 h-3 text-white" />,
    },
    critical: {
      color: "bg-red-400 border-red-500",
      icon: <AlertTriangle className="w-3 h-3 text-white" />,
    },
    warning: {
      color: "bg-yellow-400 border-yellow-500",
      icon: <Info className="w-3 h-3 text-white" />,
    },
    good: {
      color: "bg-green-400 border-green-500",
      icon: <CheckCircle className="w-3 h-3 text-white" />,
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        ${config.color} 
        border-2 rounded-full flex items-center justify-center
        transition-all duration-200 hover:scale-110
      `}
      title={`Available in ${userInventoryName}: ${available}, Threshold: ${threshold} (${status})`}
    >
      {size !== "sm" && config.icon}
    </div>
  );
};