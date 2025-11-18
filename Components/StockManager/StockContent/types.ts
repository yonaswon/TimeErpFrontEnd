// types.ts
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
  stats: {
    inventory_distribution: any; // Use any for now to avoid type errors
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
