"use client";
import React, { useState, useEffect } from "react";
import { TransferButton, TransferOverlay } from "@/Components/MaterialTransfer";
import { FileSpreadsheet } from "lucide-react";
import { GenerateExcelSidebar } from "./GenerateExcelSidebar";

const TransfersContent = () => {
  const [showTransfer, setShowTransfer] = useState(false);
  const [showExcel, setShowExcel] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const fromInventoryId = 2;

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const user = window.Telegram.WebApp.initDataUnsafe?.user;
      if (user?.username) setTelegramUsername(user.username);
    }
  }, []);

  return (
    <div>
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

      {/* Generate Excel button — below Transfer button */}
      <button
        onClick={() => setShowExcel(true)}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-600 dark:bg-green-600 text-white font-medium text-base hover:bg-green-700 dark:hover:bg-green-700 transition-colors shadow-sm"
      >
        <FileSpreadsheet size={20} />
        Generate Excel Report
      </button>

      <GenerateExcelSidebar
        isOpen={showExcel}
        onClose={() => setShowExcel(false)}
        telegramUsername={telegramUsername}
      />
    </div>
  );
};

export default TransfersContent;
