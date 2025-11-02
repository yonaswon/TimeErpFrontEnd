import { CheckCircle, FileText, Zap } from 'lucide-react'
import { TabType } from '@/types/finance'
import RequestsContent from './Purchase Requests/PurchaseRequests'
import ActionsContent from './ActionContent'

interface TabContentProps {
  activeTab: TabType
}

const PaymentsContent = () => (
  <div className="space-y-3">
    <div className="text-center py-8">
      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Payment Confirmations
      </h3>
      <p className="text-gray-500 dark:text-gray-400">
        Review and confirm pending payments
      </p>
    </div>
  </div>
)


export const TabContent = ({ activeTab }: TabContentProps) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'payments':
        return <PaymentsContent />
      case 'requests':
        return <RequestsContent />
      case 'actions':
        return <ActionsContent />
      default:
        return <PaymentsContent />
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 border border-gray-200 dark:border-zinc-700">
      {renderContent()}
    </div>
  )
}