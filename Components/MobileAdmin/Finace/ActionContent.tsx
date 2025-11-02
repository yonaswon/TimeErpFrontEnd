'use client'

import { useState } from 'react'
import { DollarSign, Upload, Search, Settings, Plus } from 'lucide-react'
import { AdminInWalletTransfer } from './Actions/AdminInWalletTransfer/AdminInWalletTransfer'

const ActionsContent = () => {
  const [showTransfer, setShowTransfer] = useState(false)

  const actions = [
    { key: 'create-purchase', label: 'Create Purchase', icon: DollarSign },
    { key: 'wallet-transfer', label: 'Wallet Transfer', icon: Upload },
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
                }}
                className="w-full text-left py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-700 px-2 rounded-md transition"
                type="button"
              >
                <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-zinc-700 flex items-center justify-center">
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

      {/* Admin Wallet Transfer Overlay */}
      <AdminInWalletTransfer open={showTransfer} onClose={() => setShowTransfer(false)} />
    </div>
  )
}

export default ActionsContent