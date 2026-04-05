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

export type TabType = 'payments' | 'requests' | 'actions' | 'edits'


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


// types/finance.ts
// export interface TabType = 'payments' | 'requests' | 'actions';

export interface OrderSummary {
  order_code: number;
  order_name: string | null;
  mockup_image: string | null;
  order_status: string;
}

export interface MaintenanceSummary {
  id: number;
  order: number | null;
  old_order_code: number | null;
  client_name: string | null;
  client_contact: string | null;
  reported_issue: string | null;
  status: string;
  under_warranty: boolean;
}

export interface Payment {
  id: number;
  order_container: {
    id: number;
    client: string;
    contact: string;
    location: string;
    delivery_date: string;
    invoice: boolean;
    full_payment: number;
    special_requerment: string;
    advance_payment: string;
    remaining_payment: string;
    instalation_service: boolean;
    order_difficulty: string;
    note: string;
    delivery_service: boolean;
    created_at: string;
    updated_at: string | null;
    posted_by: number;
    lead: number;
    orders: OrderSummary[];
  } | null;
  maintenance: MaintenanceSummary | null;
  material_sales_recored: any;
  additional_image: string | null;
  accepted_by: {
    id: number;
    telegram_id: number;
    telegram_user_name: string;
    role: Array<{
      id: number;
      Name: string;
      date: string;
    }>;
    first_name: string;
  };
  wallet: {
    id: number;
    name: string;
    invoice_balance: string;
    non_invoice_balance: string;
    date: string;
  };
  confirmed_by: any | null;
  amount: string;
  invoice: boolean;
  invoice_image: string | null;
  method: string;
  reason: string;
  status: 'P' | 'C';
  confirmation_image: string | null;
  confirmed_at: string | null;
  note: string;
  with_holding_tax?: boolean;
  with_holding_tax_amount?: number;
  with_holding_tax_image?: string | null;
  created_at: string;
  account: number | null;
  transaction_id: string | null;
}

export interface PaymentResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Payment[];
}