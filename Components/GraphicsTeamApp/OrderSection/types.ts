export interface Material {
  id: number;
  name: string;
  type: 'A' | 'L' | 'P';
  code_name: string;
  available: string;
  parsialy_available: string;
  min_threshold: number;
  width: string | null;
  height: string | null;
  date: string;
  stats: any;
}

export interface BomItem {
  id: number;
  amount: string;
  width: string;
  height: string;
  price_per_unit: string;
  total_price: string;
  estimated_price: string;
  date: string;
  material: number;
}

export interface Designer {
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

export interface Mockup {
  id: number;
  reference_images: Array<{
    id: number;
    image: string;
    date: string;
  }>;
  bom: any[];
  designer: Designer;
  name: string | null;
  request_status: string;
  note: string;
  price: number | null;
  price_with_vat: boolean;
  mockup_image: string;
  width: string;
  height: string | null;
  telegram_message_id: number | null;
  requested_date: string;
  first_response_date: string;
  date: string;
  lead: number;
  design_type: number;
}

export interface CuttingFile {
  id: number;
  crv3d: string;
  image: string;
  status: string;
  schedule_start_date: string;
  schedule_complate_date: string;
  start_date: string | null;
  complate_date: string | null;
  date: string;
  on: number;
  assigned_to: number;
  orders: number[];
}

export interface Order {
  order_code: number;
  boms: BomItem[];
  mockup: Mockup | null;
  mockup_modification: any | null;
  cutting_files: CuttingFile[];
  order_status: string;
  mockup_image: string | null;
  price: number;
  pre_accepted_date: string;
  pre_confirmed_date: string | null;
  cnc_started_date: string | null;
  cnc_completed_date: string | null;
  assembly_started_date: string | null;
  assembly_completed_date: string | null;
  dandi_date: string | null;
  rem_accepted_date: string | null;
  rem_confirmed_date: string | null;
  created_at: string;
  design_type: number;
}

export interface OrdersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}

export interface BomFormData {
  material: number;
  amount: string;
  width: string;
  height: string;
}