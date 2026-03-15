"use client";
import React, { useState } from "react";
import { TransferOverlay } from "@/Components/MaterialTransfer";
import { AddMaterialOverlay } from "./AddMaterialOverlay";
import { ReleaseList } from "./Releases/ReleaseList";
import { useSidebar } from "@/Components/GlobalComponents/SideBar/SidebarContext";
import { PackagePlus, ArrowRightLeft, ListMinus, Table2, Database } from "lucide-react";
import DesktopStockContent from "@/Components/StockManager/StockContent/StockContent";
import StockRecord from "@/Components/StockRecord/StockRecord";

interface MenuButtonProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  primary?: boolean;
}

const MenuButton: React.FC<MenuButtonProps> = ({ icon: Icon, title, description, onClick, primary = false }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center p-4 rounded-xl border transition-all duration-200 min-h-[44px] text-left
      ${primary
        ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20"
        : "bg-white border-gray-200 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700/80"
      }`}
  >
    <div
      className={`p-3 rounded-lg mr-4 flex-shrink-0 ${primary
          ? "bg-white/20 text-white"
          : "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
        }`}
    >
      <Icon className="w-6 h-6" />
    </div>
    <div className="flex flex-col">
      <span
        className={`font-medium text-base ${primary ? "text-white" : "text-gray-900 dark:text-slate-100"
          }`}
      >
        {title}
      </span>
      <span
        className={`text-sm mt-0.5 ${primary ? "text-blue-100" : "text-gray-500 dark:text-slate-400"
          }`}
      >
        {description}
      </span>
    </div>
  </button>
);

const StockContent = () => {
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const { openSidebar } = useSidebar();
  const fromInventoryId = 1; // This would come from your props/context

  const handleMaterialAdded = () => {
    // Refresh your materials list or show success message
    console.log("Material added successfully!");
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <MenuButton
        icon={PackagePlus}
        title="Add Material"
        description="Register new stock items"
        primary
        onClick={() => setShowAddMaterial(true)}
      />

      <MenuButton
        icon={ArrowRightLeft}
        title="Transfer Materials"
        description="Move stock between inventories"
        onClick={() => setShowTransfer(true)}
      />

      <MenuButton
        icon={ListMinus}
        title="Releases"
        description="View material release history"
        onClick={() => openSidebar(<ReleaseList />, "Releases")}
      />

      <MenuButton
        icon={Table2}
        title="Stock Table"
        description="Detailed stock management table"
        onClick={() => openSidebar(<DesktopStockContent />, "Stock Table")}
      />

      <MenuButton
        icon={Database}
        title="Default Records"
        description="Access standard stock records"
        onClick={() => openSidebar(<StockRecord />, "Stock Records")}
      />

      <TransferOverlay
        isOpen={showTransfer}
        onClose={() => setShowTransfer(false)}
        fromInventoryId={fromInventoryId}
      />

      <AddMaterialOverlay
        isOpen={showAddMaterial}
        onClose={() => setShowAddMaterial(false)}
        onSuccess={handleMaterialAdded}
      />
    </div>
  );
};

export default StockContent;
