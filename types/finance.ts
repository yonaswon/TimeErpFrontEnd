export interface Wallet {
  id: number
  name: string
  invoice_balance: string
  non_invoice_balance: string
  date: string
}

export interface Material {
  id: number
  name: string
  type: string
  type_display: string
  available: string
}

export interface EachPurchaseMaterial {
  id: number
  material: Material
  amount: string
  price: string
  total_price: string
  date: string
}

export interface User {
  id: number
  telegram_id: number
  telegram_user_name: string
  role: Array<{
    id: number
    Name: string
    date: string
  }>
  first_name: string
}

export interface Purchase {
  id: number
  created_by: User
  each_material_purchase: EachPurchaseMaterial[]
  from_account: any
  total_amount: string
  to_account_number: number
  to_account_name: string
  invoice: boolean
  invoice_image: string | null
  status: string
  request_status: string
  payment_screenshot: string | null
  payment_code: string | null
  is_deleted: boolean
  date: string
}

export interface PurchaseListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Purchase[]
}