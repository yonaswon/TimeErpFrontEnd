'use client'
import { useState } from 'react'
import CreateOrderOverlay from './CreateOrderOverlay'

interface CreateOrderButtonProps {
  leadId: number
  leadData: any
}

export default function CreateOrderButton({ leadId, leadData }: CreateOrderButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSuccess = () => {
    setIsOpen(false)
    // You might want to refresh the lead data or show a success message
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
      >
        Create Order
      </button>

      {isOpen && (
        <CreateOrderOverlay
          leadId={leadId}
          leadData={leadData}
          onClose={() => setIsOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}