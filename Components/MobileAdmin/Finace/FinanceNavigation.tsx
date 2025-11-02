import { CheckCircle, FileText, Zap } from 'lucide-react'
import { TabType } from '@/types/finance'

interface FinanceNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export const FinanceNavigation = ({ activeTab, onTabChange }: FinanceNavigationProps) => {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden mb-4">
      <div className="flex">
        <button
          onClick={() => onTabChange('payments')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 transition-colors ${
            activeTab === 'payments'
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Payments</span>
        </button>

        <button
          onClick={() => onTabChange('requests')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 transition-colors ${
            activeTab === 'requests'
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">Requests</span>
        </button>

        <button
          onClick={() => onTabChange('actions')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 transition-colors ${
            activeTab === 'actions'
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span className="text-sm font-medium">Actions</span>
        </button>
      </div>
    </div>
  )
}