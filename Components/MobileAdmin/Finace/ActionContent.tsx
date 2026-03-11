'use client'

import { useState } from 'react'
import { DollarSign, Upload, Search, Settings, Plus, Receipt } from 'lucide-react'
import { AdminInWalletTransfer } from './Actions/AdminInWalletTransfer/AdminInWalletTransfer'
import { AdminReleaseToPityWallet } from './Actions/AdminReleaseToPityWallet/AdminReleaseToPityWallet'
import { RecordExpenseOverlay } from './Actions/RecordExpense/RecordExpenseOverlay'
import { ExpensesList } from './Actions/RecordExpense/ExpensesList'

const ActionsContent = () => {
  const [showTransfer, setShowTransfer] = useState(false)
  const [showReleasePity, setShowReleasePity] = useState(false)
  const [showRecordExpense, setShowRecordExpense] = useState(false)

  const actions = [
    { key: 'create-purchase', label: 'Create Purchase', icon: DollarSign },
    { key: 'record-expense', label: 'Record Expense', icon: Receipt },
    { key: 'wallet-transfer', label: 'Wallet Transfer', icon: Upload },
    { key: 'release-pity-wallet', label: 'Release to Pity Wallet', icon: Upload },
    { key: 'pity-purchase', label: 'Pity Purchase', icon: Search },
    { key: 'pity-cost', label: 'Pity Cost', icon: Settings },
  ]

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Admin Actions</h3>

        <div className="flex flex-col divide-y divide-gray-100 dark:divide-zinc-700">
          {actions.map((a) => {
            const Icon = a.icon
            return (
              <button
                key={a.key}
                onClick={() => {
                  if (a.key === 'wallet-transfer') setShowTransfer(true)
                  if (a.key === 'release-pity-wallet') setShowReleasePity(true)
                  if (a.key === 'record-expense') setShowRecordExpense(true)
                }}
                className="w-full text-left py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-700 px-2 rounded-md transition"
                type="button"
              >
                <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-zinc-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                  {a.key === 'create-purchase' ? <Plus size={18} /> : <Icon size={18} />}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 dark:text-gray-100">{a.label}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Tap to {a.label.toLowerCase()}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <ExpensesList />

      {/* Overlays */}
      <AdminInWalletTransfer open={showTransfer} onClose={() => setShowTransfer(false)} />
      <AdminReleaseToPityWallet open={showReleasePity} onClose={() => setShowReleasePity(false)} />
      <RecordExpenseOverlay open={showRecordExpense} onClose={() => setShowRecordExpense(false)} />
    </div>
  )
}

export default ActionsContent