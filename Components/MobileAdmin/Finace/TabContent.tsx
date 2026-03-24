import { CheckCircle, FileText, Zap } from 'lucide-react'
import { TabType } from '@/types/finance'
import RequestsContent from './Purchase Requests/PurchaseRequests'
import ActionsContent from './ActionContent'
import { PaymentConfirmations } from './PaymentRequests/PaymentConfirmations'
import PaymentSuggestionsList from './PaymentRequests/PaymentSuggestionsList'

interface TabContentProps {
  activeTab: TabType
}


export const TabContent = ({ activeTab }: TabContentProps) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'payments':
        return <PaymentConfirmations />
      case 'requests':
        return <RequestsContent />
      case 'actions':
        return <ActionsContent />
      case 'edits':
        return <PaymentSuggestionsList />
      default:
        return <PaymentConfirmations />
    }
  }

  return (
    <div>
      {renderContent()}
    </div>
  )
}