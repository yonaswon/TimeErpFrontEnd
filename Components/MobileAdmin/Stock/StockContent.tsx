"use client";
import React, { useState } from "react";
import { TransferButton, TransferOverlay } from "@/Components/MaterialTransfer";
import { AddMaterialButton } from "./AddMaterialButton";
import { AddMaterialOverlay } from "./AddMaterialOverlay";

const TransfersContent = () => {
  const [showTransfer, setShowTransfer] = useState(false);
  const fromInventoryId = 1; // This would come from your props/context

  return (
    <div>
      {/* Your existing component content */}

      <TransferButton
        fromInventoryId={fromInventoryId}
        onClick={() => setShowTransfer(true)}
        className="your-custom-classes"
      />

      <TransferOverlay
        isOpen={showTransfer}
        onClose={() => setShowTransfer(false)}
        fromInventoryId={fromInventoryId}
      />
    </div>
  );
};

const StockContent = () => {
  const [showAddMaterial, setShowAddMaterial] = useState(false);

  const handleMaterialAdded = () => {
    // Refresh your materials list or show success message
    console.log("Material added successfully!");
    // You can trigger a refresh of your materials list here
  };
  return (
    <div>
      <TransfersContent />
      <AddMaterialButton onClick={() => setShowAddMaterial(true)} />
      <AddMaterialOverlay
        isOpen={showAddMaterial}
        onClose={() => setShowAddMaterial(false)}
        onSuccess={handleMaterialAdded}
      />
    </div>
  );
};

export default StockContent;
