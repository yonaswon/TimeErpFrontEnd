import { CheckCircle, FileText, Zap } from 'lucide-react'
import { TabType } from '@/types/finance'
import RequestsContent from './Purchase Requests/PurchaseRequests'
import ActionsContent from './ActionContent'
import { PaymentConfirmations } from './PaymentRequests/PaymentConfirmations'

interface TabContentProps {
  activeTab: TabType
}


export const TabContent = ({ activeTab }: TabContentProps) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'payments':
        return <PaymentConfirmations/>
      case 'requests':
        return <RequestsContent />
      case 'actions':
        return <ActionsContent />
      default:
        return <PaymentConfirmations/>
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 border border-gray-200 dark:border-zinc-700">
      {renderContent()}
    </div>
  )
}