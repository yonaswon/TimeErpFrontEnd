import { FormItem } from "../types"

interface ValidationParams {
  items: FormItem[]
  designTypes: any[]
  materials: any[]
  selectedWallet: number | null
  paymentMethod: string
  selectedAccount: number | null
  paymentScreenshot: File | null
  withInvoice: boolean
  invoiceImage: File | null
}

export function useValidation() {
  const validateForm = (params: ValidationParams): string[] => {
    const errors: string[] = []
    const { items, designTypes, materials, selectedWallet, paymentMethod, selectedAccount, paymentScreenshot, withInvoice, invoiceImage } = params

    if (designTypes.length === 0) {
      errors.push('Design types are not loaded yet')
    }
   

    items.forEach((item, index) => {
      if (!item.design_type) {
        errors.push(`Design type is required for item ${index + 1}`)
      }
      if (!item.price && item.price !== 0) {
        errors.push(`Price is required for item ${index + 1}`)
      }
      if (item.price < 0) {
        errors.push(`Price cannot be negative for item ${index + 1}`)
      }
    })

    if (!selectedWallet) {
      errors.push('Wallet selection is required')
    }
    if (!paymentMethod) {
      errors.push('Payment method is required')
    }
    if ((paymentMethod === 'BANK' || paymentMethod === 'CHECK') && !selectedAccount) {
      errors.push('Account selection is required for bank or check payments')
    }
    if ((paymentMethod === 'BANK' || paymentMethod === 'CHECK') && !paymentScreenshot) {
      errors.push('Payment screenshot is required for BANK and CHECK payments')
    }
    
    return errors
  }

  return { validateForm }
}