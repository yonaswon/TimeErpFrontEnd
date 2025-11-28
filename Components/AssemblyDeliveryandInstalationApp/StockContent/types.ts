export interface InventoryDistribution {
  inventory__name: string;
  total: number;
  unstarted: number;
  started: number;
  finished: number;
}

export interface MaterialStats {
  inventory_distribution: InventoryDistribution[] | { [key: string]: number };
  total_pieces?: number;
  unstarted_pieces?: number;
  started_pieces?: number;
  finished_pieces?: number;
  total_area_available?: number;
  total_available?: number;
  partially_available?: number;
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
  stats: MaterialStats;
}

export interface MaterialsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Material[];
}

export interface UserData {
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