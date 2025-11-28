// types/maintenance.ts
export interface User {
  id: number;
  telegram_id: number;
  telegram_user_name: string;
  role: Array<{
    id: number;
    Name: string;
    date: string;
  }>;
  first_name: string;
}

export interface Material {
  id: number;
  name: string;
  type: "L" | "A" | "P";
  code_name: string;
  available: string;
  parsialy_available: string;
  min_threshold: number;
  width: string | null;
  height: string | null;
  date: string;
  stats: any;
}

export interface Bom {
  id: number;
  material: Material;
  amount: string;
  width: string;
  height: string;
  price_per_unit: string | null;
  total_price: string | null;
  estimated_price: string | null;
  released: boolean;
  release_date: string;
  date: string;
}

export interface Order {
  order_code: number;
  boms: Bom[];
  mockup: any;
  order_status: string;
  price: number;
  created_at: string;
  client_name?: string;
  client_contact?: string;
  mockup_modification:any
}

export interface OrdersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}

export interface Account {
  id: number;
  bank: string;
  available_amount: string;
  account_number: string;
  account_type: "C" | "P";
  account_name: string;
  deleted: boolean;
  date: string;
}

export interface MaintenanceFormData {
  order: number | null;
  client_name: string;
  client_contact: string;
  reported_issue: string;
  image: File | null;
  under_warranty: boolean;
  payment_amount: string;
  invoice: boolean;
  invoice_image: File | null;
  method: "BANK" | "CASH" | "CHECK";
  account: number | null;
  additional_image: File | null;
  note: string;
  confirmation_image:any,
}