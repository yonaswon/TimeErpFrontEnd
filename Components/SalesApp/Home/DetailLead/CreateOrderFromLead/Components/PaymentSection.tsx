'use client'
import { useState, useEffect } from 'react'
import { Upload } from 'lucide-react'
import api from '@/api'
import { Account, Wallet } from '../types'

interface PaymentSectionProps {
  withInvoice: boolean
  setWithInvoice: (value: boolean) => void
  paymentMethod: string
  setPaymentMethod: (value: string) => void
  selectedWallet: number | null
  setSelectedWallet: (value: number | null) => void
  selectedAccount: number | null
  setSelectedAccount: (value: number | null) => void
  paymentScreenshot: File | null
  setPaymentScreenshot: (value: File | null) => void
  invoiceImage: File | null
  setInvoiceImage: (value: File | null) => void
  paymentNote: string
  setPaymentNote: (value: string) => void
  wallets: Wallet[]
  accounts: Account[]
  setAccounts: (accounts: Account[]) => void
}

export default function PaymentSection({
  withInvoice,
  setWithInvoice,
  paymentMethod,
  setPaymentMethod,
  selectedWallet,
  setSelectedWallet,
  selectedAccount,
  setSelectedAccount,
  paymentScreenshot,
  setPaymentScreenshot,
  invoiceImage,
  setInvoiceImage,
  paymentNote,
  setPaymentNote,
  wallets,
  accounts,
  setAccounts
}: PaymentSectionProps) {
  // Effect to handle automatic wallet selection and account fetching/clearing
  useEffect(() => {
    // 1. Automatic Wallet Selection based on paymentMethod
    if (paymentMethod === 'BANK' || paymentMethod === 'CHECK') {
      setSelectedWallet(1); // Wallet ID 1 for Bank/Check
    } else if (paymentMethod === 'CASH') {
      setSelectedWallet(2); // Wallet ID 2 for Cash
    } else {
      setSelectedWallet(null); // Clear wallet if no method selected
    }

    // 2. Fetch accounts when payment method or invoice selection changes
    const fetchAccounts = async () => {
      try {
        const accountType = withInvoice ? 'C' : 'P';
        const response = await api.get(`/finance/account/?account_type=${accountType}&deleted=false`);
        const accountsData = response.data.results || response.data;
        setAccounts(accountsData);
      } catch (err) {
        console.error('Failed to fetch accounts', err);
        setAccounts([]);
      }
    };

    // 3. Conditional account fetching and clearing
    // Accounts are only relevant for BANK/CHECK methods (which map to wallet ID 1)
    if (paymentMethod === 'BANK' || paymentMethod === 'CHECK') {
      fetchAccounts();
    } else {
      setAccounts([]); // Clear accounts if not BANK/CHECK
    }

    // Always clear selected account if payment method is not BANK/CHECK
    if (!(paymentMethod === 'BANK' || paymentMethod === 'CHECK')) {
      setSelectedAccount(null);
    }
  }, [withInvoice, paymentMethod, setAccounts, setSelectedAccount, setSelectedWallet]);

  const handlePaymentScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentScreenshot(e.target.files?.[0] || null)
  }

  const handleInvoiceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInvoiceImage(e.target.files?.[0] || null)
  }

  const currentWallet = wallets.find(w => w.id === selectedWallet);

  return (
    <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payment Information</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={withInvoice}
              onChange={(e) => setWithInvoice(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            With Invoice
          </label>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method *</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
            required
          >
            <option value="">Select payment method</option>
            <option value="BANK">Bank Transfer</option>
            <option value="CASH">Cash</option>
            <option value="CHECK">Check</option>
          </select>
        </div>
      </div>

      {/* Wallet Display (automatically selected based on method) */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Wallet</label>
        <div className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-gray-50 dark:bg-zinc-700 text-gray-900 dark:text-white">
          {currentWallet ? `${currentWallet.name} #${currentWallet.id}` : 'No wallet selected'}
        </div>
      </div>

      {/* Account Selection (only for Wallet ID 1, i.e., BANK or CHECK methods) */}
      {selectedWallet === 1 && (
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Account *</label>
          <select
            value={selectedAccount || ''}
            onChange={(e) => setSelectedAccount(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
            required={selectedWallet === 1} // Required only when this section is visible
          >
            <option value="">Select account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.bank} - {account.account_number} ({account.account_name})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Payment Screenshot (only for Wallet ID 1, i.e., BANK or CHECK methods) */}
      {selectedWallet === 1 && (
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Screenshot *</label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-blue-600 dark:text-blue-400 border border-blue-600 rounded-lg px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
              <Upload className="w-4 h-4" />
              {paymentScreenshot ? 'Change Screenshot' : 'Upload Screenshot'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePaymentScreenshotChange}
                required={selectedWallet === 1} // Required only when this section is visible
              />
            </label>
            {paymentScreenshot && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-600">{paymentScreenshot.name}</span>
                <button
                  type="button"
                  onClick={() => setPaymentScreenshot(null)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Required for BANK and CHECK payments. Upload a screenshot of the payment confirmation.
          </p>
        </div>
      )}

      {/* Invoice Image (only when withInvoice is true, now optional) */}
      {withInvoice && (
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Image</label> {/* Removed '*' as it's optional */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-blue-600 dark:text-blue-400 border border-blue-600 rounded-lg px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
              <Upload className="w-4 h-4" />
              {invoiceImage ? 'Change Invoice' : 'Upload Invoice'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInvoiceImageChange}
              // 'required' attribute removed as per instructions
              />
            </label>
            {invoiceImage && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-600">{invoiceImage.name}</span>
                <button
                  type="button"
                  onClick={() => setInvoiceImage(null)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Upload the invoice document (optional). {/* Updated description */}
          </p>
        </div>
      )}

      {/* Payment Note */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Note</label>
        <textarea
          value={paymentNote}
          onChange={(e) => setPaymentNote(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
          rows={2}
          placeholder="Add any payment notes..."
        />
      </div>
    </div>
  )
}