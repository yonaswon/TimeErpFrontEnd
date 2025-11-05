'use client'
import { ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import CreateOrderOverlay from './CreateOrderOverlay'

interface CreateOrderButtonProps {
  leadId: number
  leadData: any
}

export default function CreateOrderButton({ leadId, leadData }: CreateOrderButtonProps) {
  const [showOverlay, setShowOverlay] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowOverlay(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
      >
        <ShoppingCart className="w-4 h-4" />
        Create Order
      </button>

      {showOverlay && (
        <CreateOrderOverlay
          leadId={leadId}
          leadData={leadData}
          onClose={() => setShowOverlay(false)}
          onSuccess={() => {
            setShowOverlay(false)
            // You can add refresh logic here later
          }}
        />
      )}
    </>
  )
}