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

export type TabType = 'payments' | 'requests' | 'actions'


export interface PurchaseListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Purchase[]
}


// types/finance.ts

// More specific status types
export type PurchaseStatus = 'P' | 'D' | 'C' // IN PROGRESS | DONE PURCHASED | CANCELLED
export type RequestStatus = 'NS' | 'S' | 'C' | 'R' // NOT SENT | SENT | CONFIRMED | REJECTED
export type WalletType = 'A' | 'F' // ADMIN | FINANCE
export type AccountType = 'C' | 'P' // CURRENT | PERSONAL

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

export interface Material {
  id: number
  name: string
  type: string
  type_display: string
  available: string
}

export interface Account {
  id: number
  bank: string
  available_amount: string
  account_number: string
  account_type: AccountType
  account_name: string
  deleted: boolean
  date: string
}

export interface EachPurchaseMaterial {
  id: number
  material: Material
  amount: string
  price: string
  total_price: string
  date: string
}

export interface Purchase {
  id: number
  created_by: User
  each_material_purchase: EachPurchaseMaterial[]
  from_account: Account | null
  from_wallet: WalletType
  total_amount: string
  to_account_number: string | null
  to_account_name: string | null
  invoice: boolean
  invoice_image: string | null
  status: PurchaseStatus
  request_status: RequestStatus
  payment_screenshot: string | null
  confirmed_by: number | null
  payment_code: string | null
  telegram_message_id: number | null
  is_deleted: boolean
  finalized_date: string | null
  date: string
  finalized_by: number | null
}

export interface PurchaseResponse {
  count: number
  next: string | null
  previous: string | null
  results: Purchase[]
}