"use client";
import React, { useState } from "react";
import { TransferButton, TransferOverlay } from "@/Components/MaterialTransfer";

const TransfersContent = () => {
  const [showTransfer, setShowTransfer] = useState(false);
  const fromInventoryId = 2; // This would come from your props/context

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

export default TransfersContent;
