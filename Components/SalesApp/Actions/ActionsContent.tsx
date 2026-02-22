'use client'
import { useState } from 'react'
import { ShoppingBag, Wrench, Package, ChevronRight } from 'lucide-react'
import RecordSales from './RecordSales'
import MaintenanceReport from './MaintenanceReport'
import DirectOrderOverlay from './CreateOrder/DirectOrderOverlay'

type ActionType = 'sales' | 'maintenance' | 'createOrder' | null

const ActionsContent = () => {
  const [activeAction, setActiveAction] = useState<ActionType>(null)

  const handleClose = () => setActiveAction(null)

  return (
    <div className="space-y-4">
      {/* Action Cards */}
      <div className="grid gap-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white px-1">Quick Actions</h2>

        <button
          onClick={() => setActiveAction('sales')}
          className="group relative flex items-center p-5 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all duration-300 text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />

          <div className="relative flex-1">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <ShoppingBag size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Record New Sale</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Log material sales & payments</p>
              </div>
            </div>
          </div>
          <ChevronRight className="text-gray-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors" />
        </button>

        <button
          onClick={() => setActiveAction('maintenance')}
          className="group relative flex items-center p-5 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all duration-300 text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />

          <div className="relative flex-1">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Wrench size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Maintenance Report</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Report issues & request fixes</p>
              </div>
            </div>
          </div>
          <ChevronRight className="text-gray-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors" />
        </button>

        <button
          onClick={() => setActiveAction('createOrder')}
          className="group relative flex items-center p-5 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-sm hover:shadow-md transition-all duration-300 text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />

          <div className="relative flex-1">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Package size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Create Order</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Create order container directly</p>
              </div>
            </div>
          </div>
          <ChevronRight className="text-gray-300 dark:text-zinc-600 group-hover:text-emerald-500 transition-colors" />
        </button>
      </div>

      {/* Overlay Forms */}
      {activeAction === 'sales' && (
        <RecordSales onClose={handleClose} />
      )}

      {activeAction === 'maintenance' && (
        <MaintenanceReport onClose={handleClose} />
      )}

      {activeAction === 'createOrder' && (
        <DirectOrderOverlay onClose={handleClose} />
      )}
    </div>
  )
}

export default ActionsContent