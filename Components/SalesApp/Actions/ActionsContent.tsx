'use client'
import { useState } from 'react'
import RecordSales from './RecordSales'
import MaintenanceReport from './MaintenanceReport'

type ActionType = 'sales' | 'maintenance' | null

const ActionsContent = () => {
  const [activeAction, setActiveAction] = useState<ActionType>(null)

  const handleClose = () => setActiveAction(null)

  return (
    <div className="space-y-4">
      {/* Action Cards */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Sales Actions</h2>
        
        <div className="space-y-3">
          <button 
            onClick={() => setActiveAction('sales')}
            className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-left"
          >
            <div className="font-medium text-blue-900 dark:text-blue-100">Record Sales</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Record material sales to customers</div>
          </button>
          
          <button 
            onClick={() => setActiveAction('maintenance')}
            className="w-full p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700 transition-colors text-left"
          >
            <div className="font-medium text-orange-900 dark:text-orange-100">Maintenance Report</div>
            <div className="text-sm text-orange-700 dark:text-orange-300">Report maintenance issues</div>
          </button>
        </div>
      </div>

      {/* Overlay Forms */}
      {activeAction === 'sales' && (
        <RecordSales onClose={handleClose} />
      )}
      
      {activeAction === 'maintenance' && (
        <MaintenanceReport onClose={handleClose} />
      )}
    </div>
  )
}

export default ActionsContent