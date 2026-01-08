export interface Material {
  id: number;
  name: string;
  type: string;
  code_name: string;
  available: string;
  parsialy_available: string;
  min_threshold: number;
  width: string | null;
  height: string | null;
  date: string;
  stats: any;
}

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

export interface Release {
  id: number;
  material: Material;
  reason: 'ORDER' | 'ADD' | 'MAINTENANCE' | 'SALES' | 'TRANSFER' | 'WASTE' | 'DAMAGED';
  amount: string;
  proof_image: string | null;
  confirmed: boolean;
  date: string;
  order: number | null;
  maintenance: number | null;
  inventory: number | null;
  released_by: number | User;
  each_areal_material: any[];
}

export interface ReleasesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Release[];
}

export interface Order {
  order_code: number;
  boms: Array<{
    id: number;
    material: Material;
    amount: string;
    width: string;
    height: string;
    price_per_unit: string | null;
    total_price: string | null;
    estimated_price: string | null;
    released: boolean;
    release_date: string | null;
    date: string;
  }>;
  mockup: {
    id: number;
    reference_images: Array<{ id: number; image: string; date: string }>;
    bom: any[];
    designer: User;
    name: string;
    request_status: string;
    note: string;
    price: number;
    price_with_vat: boolean;
    mockup_image: string;
    width: string;
    height: string;
    telegram_message_id: number;
    requested_date: string;
    first_response_date: string;
    date: string;
    lead: number;
    design_type: number;
  };
  mockup_modification: any | null;
  cutting_files: Array<{
    id: number;
    on: any;
    assigned_to: User;
    crv3d: string;
    image: string;
    status: string;
    schedule_start_date: string;
    schedule_complate_date: string;
    start_date: string;
    complate_date: string;
    date: string;
    orders: number[];
  }>;
  releases: Array<{
    id: number;
    reason: string;
    material: number;
    material_name: string;
    material_type: string;
    amount: string;
    proof_image: string | null;
    inventory: number;
    inventory_name: string;
    released_by: number;
    released_by_name: string;
    confirmed: boolean;
    date: string;
  }>;
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

export interface Maintenance {
  id: number;
  order: Order;
  posted_by: User;
  boms: any[];
  assigned_to: User | null;
  client_name: string;
  client_contact: string;
  reported_issue: string;
  image: string;
  under_warranty: boolean;
  payment_status: string | null;
  status: string;
  scheduled_start_date: string | null;
  scheduled_end_date: string | null;
  started: string | null;
  end: string | null;
  order_notification_sent: boolean;
  finance_notification_sent: boolean;
  order_group_message_id: string;
  finance_group_message_id: string;
  created_at: string;
}

export interface MaterialSalesRecord {
  id: number;
  release: any[];
  recorded_by: User;
  customer_name: string;
  customer_contact: string;
  date: string;
  order_group_message_id: string | null;
  finance_group_message_id: string | null;
  order_notification_sent: boolean;
  finance_notification_sent: boolean;
}