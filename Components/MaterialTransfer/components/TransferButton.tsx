import React from "react";
import { Truck, ArrowRight } from "lucide-react";

interface TransferButtonProps {
  fromInventoryId: number;
  onClick: (fromInventoryId: number) => void;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export const TransferButton: React.FC<TransferButtonProps> = ({
  fromInventoryId,
  onClick,
  className = "",
  variant = "primary",
  size = "md",
}) => {
  const baseClasses = `
    inline-flex items-center justify-center
    font-semibold rounded-xl
    transition-all duration-300 ease-out
    focus:outline-none focus:ring-4 focus:ring-blue-500/30
    hover:scale-105 active:scale-95
    group relative overflow-hidden
  `;

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-500 to-blue-600
      hover:from-blue-600 hover:to-blue-700
      text-white shadow-lg shadow-blue-500/25
      hover:shadow-xl hover:shadow-blue-500/35
    `,
    secondary: `
      bg-gradient-to-r from-emerald-500 to-emerald-600
      hover:from-emerald-600 hover:to-emerald-700
      text-white shadow-lg shadow-emerald-500/25
      hover:shadow-xl hover:shadow-emerald-500/35
    `,
    outline: `
      border-2 border-blue-500
      bg-transparent text-blue-600 dark:text-blue-400
      hover:bg-blue-500 hover:text-white
      dark:hover:bg-blue-500 dark:hover:text-white
      shadow-lg shadow-blue-500/10
      hover:shadow-xl hover:shadow-blue-500/20
    `,
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm gap-2",
    md: "px-6 py-3 text-base gap-3",
    lg: "px-8 py-4 text-lg gap-4",
  };

  return (
    <button
      onClick={() => onClick(fromInventoryId)}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {/* Animated background shine effect */}
      <div className="absolute inset-0 -translate-x-full bg-ginear-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000" />

      {/* Icons and text */}
      <Truck className="w-4 h-4 transition-transform group-hover:scale-110" />
      <span className="relative z-10 flex items-center gap-2">
        Transfer Materials
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </span>
    </button>
  );
};
