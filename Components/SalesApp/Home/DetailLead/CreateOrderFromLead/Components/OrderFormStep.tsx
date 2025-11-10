"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useFormData } from "../hooks/useFormData";
import { useValidation } from "../hooks/useValidation";
import OrderItemCard from "./OrderItemCard";
import ContainerDetails from "./ContainerDetails";
import PaymentSection from "./PaymentSection";
import { useOrderForm } from "../hooks/useOrderForm";

interface OrderFormStepProps {
  leadId: number;
  leadData: any;
  selectedItems: any[];
  onBack: () => void;
  onSuccess: () => void;
  onClose: () => void;
}

export default function OrderFormStep({
  leadId,
  leadData,
  selectedItems,
  onBack,
  onSuccess,
  onClose,
}: OrderFormStepProps) {
  const { designTypes, materials, wallets, loading } = useFormData();
  const { validateForm } = useValidation();

  const {
    items,
    totalPayment,
    advancePayment,
    remainingPayment,
    containerNote,
    specialRequirement,
    orderDifficulty,
    withInvoice,
    paymentMethod,
    selectedAccount,
    selectedWallet,
    paymentScreenshot,
    invoiceImage,
    paymentNote,
    accounts,
    submitting,
    // Setters
    setContainerNote,
    setSpecialRequirement,
    setOrderDifficulty,
    setWithInvoice,
    setPaymentMethod,
    setSelectedAccount,
    setSelectedWallet,
    setPaymentScreenshot,
    setInvoiceImage,
    setPaymentNote,
    setAccounts,
    // Handlers
    handleItemChange,
    handleTotalPaymentChange,
    handleAdvancePaymentChange,
    handleSubmit,
  } = useOrderForm({
    leadId,
    leadData,
    selectedItems,
    designTypes,
    materials,
    wallets,
    onSuccess,
    validateForm,
  });

  // Set default wallet
  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      setSelectedWallet(wallets[0].id);
    }
  }, [wallets, selectedWallet, setSelectedWallet]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading form data...
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 space-y-6 max-h-[80vh] overflow-y-auto"
    >
      {/* Items List */}
      <div className="space-y-6">
        {items.map((item, index) => (
          <OrderItemCard
            key={item.id}
            item={item}
            index={index}
            designTypes={designTypes}
            materials={materials}
            onItemChange={handleItemChange}
          />
        ))}
      </div>

      {/* Container Details */}
      <ContainerDetails
        totalPayment={totalPayment}
        advancePayment={advancePayment}
        remainingPayment={remainingPayment}
        containerNote={containerNote}
        specialRequirement={specialRequirement}
        orderDifficulty={orderDifficulty}
        onTotalPaymentChange={handleTotalPaymentChange}
        onAdvancePaymentChange={handleAdvancePaymentChange}
        onContainerNoteChange={setContainerNote}
        onSpecialRequirementChange={setSpecialRequirement}
        onOrderDifficultyChange={setOrderDifficulty}
      />

      {/* Payment Section */}
      <PaymentSection
        withInvoice={withInvoice}
        setWithInvoice={setWithInvoice}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        selectedWallet={selectedWallet}
        setSelectedWallet={setSelectedWallet}
        selectedAccount={selectedAccount}
        setSelectedAccount={setSelectedAccount}
        paymentScreenshot={paymentScreenshot}
        setPaymentScreenshot={setPaymentScreenshot}
        invoiceImage={invoiceImage}
        setInvoiceImage={setInvoiceImage}
        paymentNote={paymentNote}
        setPaymentNote={setPaymentNote}
        wallets={wallets}
        accounts={accounts}
        setAccounts={setAccounts}
      />

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Selection
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded font-medium"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Orders...
            </>
          ) : (
            "Create Orders"
          )}
        </button>
      </div>
    </form>
  );
}