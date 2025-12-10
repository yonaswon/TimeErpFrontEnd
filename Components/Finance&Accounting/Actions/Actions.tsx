"use client";

import { useState } from "react";
import { DollarSign, Upload, Search, Settings, Plus } from "lucide-react";
import CreatePurchaseOverlay from "./createpurchase/CreatePurchaseOverlay";
import { InWalletTransfer } from "./InWalletTransfer/InWalletTransferOverlay";
import PityPurchaseOverlay from "./pitypurchase/PityPurchaseOverlay"; // Add this import
import PityCostOverlay from "./pitypurchase/PityCostOverlay";

const ActionsContent = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showPityPurchase, setShowPityPurchase] = useState(false); // Add this state
  const [showPityCost, setShowPityCost] = useState(false); // Add this state

  // In your actions array, update the pity-cost action:
  // ... other actions
  const actions = [
    { key: "create-purchase", label: "Create Purchase", icon: DollarSign },
    { key: "wallet-transfer", label: "Wallet Transfer", icon: Upload },
    { key: "pity-purchase", label: "Pity Purchase", icon: Search },
    {
      key: "pity-cost",
      label: "Pity Cost",
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Actions
        </h3>

        <div className="flex flex-col divide-y divide-gray-100 dark:divide-zinc-700">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.key}
                onClick={() => {
                  if (a.key === "create-purchase") setShowCreate(true);
                  if (a.key === "wallet-transfer") setShowTransfer(true);
                  if (a.key === "pity-purchase") setShowPityPurchase(true); // Add this
                  if (a.key === "pity-cost") setShowPityCost(true); // Add this
                }}
                className="w-full text-left py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-700 px-2 rounded-md transition"
                type="button"
              >
                <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-zinc-700 flex items-center justify-center">
                  {a.key === "create-purchase" ? (
                    <Plus size={18} />
                  ) : (
                    <Icon size={18} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 dark:text-gray-100">
                    {a.label}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Tap to {a.label.toLowerCase()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Create Purchase Overlay */}
      <CreatePurchaseOverlay
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />

      {/* Wallet Transfer Overlay */}
      <InWalletTransfer
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
      />

      {/* Pity Purchase Overlay */}
      <PityPurchaseOverlay
        open={showPityPurchase}
        onClose={() => setShowPityPurchase(false)}
      />
      <PityCostOverlay
        open={showPityCost}
        onClose={() => setShowPityCost(false)}
      />
    </div>
  );
};

export default ActionsContent;
