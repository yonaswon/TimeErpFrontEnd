export interface Inventory {
  id: number;
  name: string;
  type: 'SM' | 'PS';
  admins: Array<{
    id: number;
    username: string;
    email: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: number;
  name: string;
  type: 'L' | 'A' | 'P';
  code_name: string;
  available: string;
  parsialy_available: string;
  min_threshold: number;
  width: string | null;
  height: string | null;
  date: string;
  stats: {
    inventory_distribution: any;
    total_pieces?: number;
    unstarted_pieces?: number;
    started_pieces?: number;
    finished_pieces?: number;
    total_area_available?: number;
    total_available?: number;
    partially_available?: number;
  };
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

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TransferState {
  fromInventory: Inventory | null;
  toInventory: Inventory | null;
  selectedMaterials: Material[];
  selectedArealMaterials: EachArealMaterial[];
  amount: string;
  currentStep: number;
}

export type TransferStep = 'inventory' | 'material' | 'details' | 'confirmation';