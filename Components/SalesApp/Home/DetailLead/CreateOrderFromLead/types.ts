export interface Material {
  id: number
  name: string
  type: 'L' | 'A' | 'P' // L: Length, A: Areal, P: Piece
  code_name: string
  available: number
}

export interface BomItem {
  id?: number
  material: number
  amount: string
  width: string
  height: string
  price_per_unit: string
  total_price: string
  estimated_price: string
  _tempId?: string
}

export interface FormItem {
  id: number
  type: 'mockup' | 'modification'
  name?: string | null
  mockup_image: string | File | null
  design_type: number
  price: number
  note: string
  original_boms: any[]
  boms: BomItem[]
}

export interface Account {
  id: number
  bank: string
  available_amount: string
  account_number: string
  account_type: string
  account_name: string
  deleted: boolean
  date: string
}

export interface Wallet {
  id: number
  name: string
  invoice_balance: string
  non_invoice_balance: string
  date: string
}