import { FormItem, PaymentEntry } from "../types"

interface ValidationParams {
  items: FormItem[]
  designTypes: any[]
  payments: PaymentEntry[]
  withInvoice: boolean
  invoiceImage: File | null
  location?: string
  deliveryDate?: string
}

export function useValidation() {
  const validateForm = (params: ValidationParams): string[] => {
    const errors: string[] = []
    const { items, designTypes, payments, location, deliveryDate } = params

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

    if (!location) {
      errors.push('Location is required')
    }
    if (!deliveryDate) {
      errors.push('Delivery date is required')
    }

    return errors
  }

  return { validateForm }
}