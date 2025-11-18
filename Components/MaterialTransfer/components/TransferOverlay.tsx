import React from "react";
import { X } from "lucide-react";
import {
  Inventory,
  Material,
  EachArealMaterial,
  TransferState,
} from "../types";
import { InventorySelection } from "./InventorySelection";
import { MaterialSelection } from "./MaterialSelection";
import { ArealMaterialSelection } from "./ArealMaterialSelection";
import { AmountInput } from "./AmountInput";
import { ConfirmationStep } from "./ConfirmationStep";

interface TransferOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  fromInventoryId: number;
}

export const TransferOverlay: React.FC<TransferOverlayProps> = ({
  isOpen,
  onClose,
  fromInventoryId,
}) => {
  const [transferState, setTransferState] = React.useState<TransferState>({
    fromInventory: null,
    toInventory: null,
    selectedMaterials: [],
    selectedArealMaterials: [],
    amount: "",
    currentStep: 0,
  });

  const steps = ["Inventory", "Material", "Details", "Confirm"];

  if (!isOpen) return null;

  const renderStep = () => {
    switch (transferState.currentStep) {
      case 0:
        return (
          <InventorySelection
            fromInventoryId={fromInventoryId}
            setTransferState={setTransferState}
            onSelect={(toInventory) => {
              setTransferState((prev) => ({
                ...prev,
                toInventory,
                currentStep: 1,
              }));
            }}
            onBack={onClose}
          />
        );
      case 1:
        return (
          <MaterialSelection
            fromInventory={transferState.fromInventory!}
            toInventory={transferState.toInventory!}
            onSelect={(materials) => {
              setTransferState((prev) => ({
                ...prev,
                selectedMaterials: materials,
                currentStep: 2,
              }));
            }}
            onBack={() =>
              setTransferState((prev) => ({ ...prev, currentStep: 0 }))
            }
          />
        );
      case 2:
        const selectedMaterial = transferState.selectedMaterials[0];
        if (selectedMaterial.type === "A") {
          return (
            <ArealMaterialSelection
              fromInventory={transferState.fromInventory!}
              material={selectedMaterial}
              onSelect={(materials) => {
                setTransferState((prev) => ({
                  ...prev,
                  selectedArealMaterials: materials,
                  currentStep: 3,
                }));
              }}
              onBack={() =>
                setTransferState((prev) => ({ ...prev, currentStep: 1 }))
              }
            />
          );
        } else {
          return (
            <AmountInput
              material={selectedMaterial}
              fromInventory={transferState.fromInventory!}
              onConfirm={(amount) => {
                setTransferState((prev) => ({
                  ...prev,
                  amount,
                  currentStep: 3,
                }));
              }}
              onBack={() =>
                setTransferState((prev) => ({ ...prev, currentStep: 1 }))
              }
            />
          );
        }
      case 3:
        // Confirmation step - implement based on your needs
        return (
          <ConfirmationStep
            transferState={transferState}
            onSubmit={handleSubmitTransfer}
            onBack={() =>
              setTransferState((prev) => ({ ...prev, currentStep: 2 }))
            }
          />
        );
      default:
        return null;
    }
  };
  const handleSubmitTransfer = async () => {
    // Implement transfer submission logic here
    // Then close the overlay
    setTransferState({
      fromInventory: null,
      toInventory: null,
      selectedMaterials: [],
      selectedArealMaterials: [],
      amount: "",
      currentStep: 0,
    });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Material Transfer
            </h2>
            <div className="flex space-x-1">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full ${
                    index === transferState.currentStep
                      ? "bg-blue-500"
                      : index < transferState.currentStep
                      ? "bg-green-500"
                      : "bg-gray-300 dark:bg-zinc-600"
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};
