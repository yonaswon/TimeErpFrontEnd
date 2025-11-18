import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Material } from "./types";

interface MaterialStatusProps {
  material: Material;
  size?: "sm" | "md" | "lg";
}

export const MaterialStatus = ({
  material,
  size = "md",
}: MaterialStatusProps) => {
  const available = parseFloat(material.available);
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
      icon: <AlertTriangle className="w-3 h-3 text-white" />,
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
      title={`Available: ${available}, Threshold: ${threshold} (${status})`}
    >
      {size !== "sm" && config.icon}
    </div>
  );
};
