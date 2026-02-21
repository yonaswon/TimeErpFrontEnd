// StockRecord Types

export interface Inventory {
    id: number;
    name: string;
    type: string;
}

export interface Material {
    id: number;
    name: string;
    type: 'L' | 'A' | 'P';
    lable: string;
    code_name: string | null;
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

export interface MaterialsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Material[];
}

export interface LandPRecord {
    id: number;
    created_by: number | null;
    created_by_username: string;
    inventory: number;
    inventory_name: string;
    material: number;
    material_name: string;
    price: string;
    first_amount: string;
    current_amount: string;
    is_active: boolean;
    created_at: string;
}

export interface ArealRecord {
    id: number;
    created_by: number | null;
    created_by_username: string;
    inventory: number;
    inventory_name: string;
    material: number;
    material_name: string;
    price: string;
    width: string;
    height: string;
    amount: string;
    confirmed: boolean;
    updated_at: string;
    created_at: string;
    each_materials: EachArealMaterial[];
}

export interface EachArealMaterial {
    id: number;
    material: number;
    material_name: string;
    areal_material_record: number | null;
    code: number;
    inventory: number | null;
    inventory_name: string;
    current_width: string;
    current_height: string;
    started: boolean;
    finished: boolean;
    date: string;
}

export const MATERIAL_TYPE_CHOICES = [
    { value: 'L', label: 'Length' },
    { value: 'A', label: 'Areal' },
    { value: 'P', label: 'Piece' },
] as const;

export const MATERIAL_LABEL_CHOICES = [
    { value: 'COLOR', label: 'COLOR' },
    { value: 'BG', label: 'BACKGROUND' },
    { value: 'LED', label: 'LED' },
    { value: 'OL', label: 'LIGHT' },
    { value: 'PS', label: 'POWER SUPPLY' },
    { value: 'OTHER', label: 'OTHER' },
] as const;
