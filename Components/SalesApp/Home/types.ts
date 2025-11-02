export interface Lead {
  id: number
  name: string
  status: string
  customer_name: string
  customer_phonenumber: string
  design_type: string
  created_at: string
  converted_at: string | null
  sales: number
}