'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import SelectionStep from './SelectionStep'
import OrderFormStep from './OrderFormStep'

interface CreateOrderOverlayProps {
  leadId: number
  leadData: any
  onClose: () => void
  onSuccess: () => void
}

interface SelectedItem {
  id: number
  type: 'mockup' | 'modification'
  mockup_image: string | null
  design_type?: number
  bom?: any[]
  price?: number
  note?: string
  width?: string | null
  hieght?: string | null
}

export default function CreateOrderOverlay({ leadId, leadData, onClose, onSuccess }: CreateOrderOverlayProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])

  const handleSelectionComplete = (items: SelectedItem[]) => {
    setSelectedItems(items)
    setCurrentStep(2)
  }

  const handleBackToSelection = () => {
    setCurrentStep(1)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Minimal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-gray-500'
              }`}>
                1
              </div>
              <span className={currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'}>Select</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-gray-500'
              }`}>
                2
              </div>
              <span className={currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'}>Order</span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors text-gray-500 dark:text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {currentStep === 1 ? (
            <SelectionStep
              leadId={leadId}
              onSelectionComplete={handleSelectionComplete}
              onClose={onClose}
            />
          ) : (
            <OrderFormStep
              leadId={leadId}
              leadData={leadData}
              selectedItems={selectedItems}
              onBack={handleBackToSelection}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}