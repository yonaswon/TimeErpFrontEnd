// types/cutting.ts
// Update in types/cutting.ts
export interface CuttingFile {
  id: number;
  orders: Order[];
  on: EachArealMaterial;
  crv3d: string;
  image: string;
  status: 'NOT-ASSIGNED' | 'ASSIGNED' | 'STARTED' | 'COMPLATED';
  assigned_to: {
    id: number;
    telegram_id: number;
    telegram_user_name: string;
    role: Role[];
    first_name: string;
  } | null;
  schedule_start_date: string | null;
  schedule_complate_date: string | null;
  start_date: string | null;
  complate_date: string | null;
  date: string;
}
export interface Order {
  order_code: number;
  boms: Bom[];
  mockup: Mockup | null;
  mockup_modification: MockupModification | null;
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
  cutting_files: CuttingFile[];
}

export interface Bom {
  id: number;
  amount: string;
  width: string;
  height: string;
  price_per_unit: string;
  total_price: string;
  estimated_price: string;
  date: string;
  material: Material;
}

export interface Mockup {
  id: number;
  reference_images: ReferenceImage[];
  bom: any[];
  designer: Designer;
  request_status: string;
  note: string;
  price: number | null;
  price_with_vat: boolean;
  mockup_image: string;
  width: string;
  hieght: string | null;
  telegram_message_id: string | null;
  requested_date: string;
  first_response_date: string;
  date: string;
  lead: number;
  design_type: number;
}

export interface MockupModification {
  id: number;
  reference_images: any[];
  bom: any[];
  price: number;
  price_with_vat: boolean;
  is_edit: boolean;
  request_status: string;
  mockup_image: string;
  note: string;
  width: string | null;
  hieght: string | null;
  telegram_message_id: string | null;
  started_date: string | null;
  requested_date: string;
  response_date: string;
  lead: number;
  mockup: number;
  prev_modification: number | null;
}

export interface ReferenceImage {
  id: number;
  image: string;
  date: string;
}

export interface Designer {
  id: number;
  telegram_id: number;
  telegram_user_name: string;
  role: Role[];
  first_name: string;
}

export interface Role {
  id: number;
  Name: string;
  date: string;
}

export interface EachArealMaterial {
  id: number;
  material: number;
  material_name: string;
  areal_material_record: number;
  code: number;
  inventory: number;
  inventory_name: string;
  current_width: string;
  current_height: string;
  started: boolean;
  finished: boolean;
  date: string;
}

export interface Material {
  id: number;
  name: string;
  type: string;
  code_name: string;
  available: string;
  parsialy_available: string;
  min_threshold: number;
  width: number;
  height: number;
  date: string;
  stats: any;
}

export interface CuttingFileResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CuttingFile[];
}

export interface MaterialResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Material[];
}

export interface EachArealMaterialResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: EachArealMaterial[];
}

export interface OrderResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}