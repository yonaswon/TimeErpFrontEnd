import { useState } from "react";
import { Purchase, Account } from "@/types/purchase";
import { useAccounts } from "@/hooks/useAccounts";
import { X, Upload, CheckCircle, AlertCircle } from "lucide-react";
import api from "@/api";

interface ConfirmPaymentProps {
  purchase: Purchase;
  onClose: () => void;
  onSuccess: () => void;
}

export const ConfirmPayment = ({
  purchase,
  onClose,
  onSuccess,
}: ConfirmPaymentProps) => {
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountType = purchase.invoice ? "C" : "P";
  const {
    accounts,
    loading: accountsLoading,
    error: accountsError,
  } = useAccounts(accountType);

  const handleSubmit = async () => {
    if (!selectedAccount) {
      setError("Please select an account");
      return;
    }

    if (!paymentScreenshot) {
      setError("Please upload payment screenshot");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("account_id", selectedAccount);
      formData.append("payment_screenshot", paymentScreenshot);

      // Use the new payment confirmation endpoint
      await api.post(
        `/finance/purchase/${purchase.id}/paymentconfirmation/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error confirming payment:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to confirm payment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Confirm Payment
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Request #{purchase.id} • {formatAmount(purchase.total_amount)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select {purchase.invoice ? "Current" : "Personal"} Account
            </label>
            {accountsLoading ? (
              <div className="animate-pulse h-10 bg-gray-200 dark:bg-zinc-700 rounded"></div>
            ) : accountsError ? (
              <div className="text-red-600 dark:text-red-400 text-sm">
                {accountsError}
              </div>
            ) : (
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
              >
                <option value="">Select an account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.bank} - {account.account_name} (
                    {account.account_number})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Payment Screenshot Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Screenshot
            </label>
            <div className="flex items-center gap-2">
              <Upload size={16} className="text-gray-500" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setPaymentScreenshot(e.target.files?.[0] || null)
                }
                className="flex-1 text-sm bg-red-600"
              />
            </div>
            {paymentScreenshot && (
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                ✓ {paymentScreenshot.name}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-zinc-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedAccount || !paymentScreenshot}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <CheckCircle size={16} />
            {submitting ? "Confirming..." : "Confirm Payment"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function
const formatAmount = (amount: string) => {
  return `Birr ${parseFloat(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
