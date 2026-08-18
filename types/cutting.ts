// types/cutting.ts
// Update in types/cutting.ts

export interface DxfFileType {
  id: number;
  dxf: string;
  date: string;
  preview_image?: string | null;
}

// DXF Layer types for layer selection UI
export interface DxfLayer {
  name: string;
  entity_count: number;
  color?: string;
  preview_image?: string; // base64 data URI (only from analyze_dxf_upload)
}

export interface DxfLayerData {
  layers: DxfLayer[];
  layer_count: number;
  selected_layers: string[];
}

export interface DxfAnalyzeResponse {
  layers: DxfLayer[];
  full_preview: string; // base64 data URI
  layer_count: number;
}

export interface DxfLayerNamesResponse {
  layers: { name: string; entity_count: number }[];
  layer_count: number;
}

// Search & Fit types (legacy)
export interface PlacementSuggestion {
  sheet_id: number;
  sheet_code: number;
  material_name: string;
  cutting_file_id: number;
  is_blank_sheet: boolean;
  position: { x: number; y: number };
  rotation: number;
  waste_reduction_pct: number;
  current_usage_pct: number;
  new_usage_pct: number;
  preview_image: string | null;
}

export interface SearchFitResponse {
  results: PlacementSuggestion[];
  sheets_searched: number;
}

// ─── Advanced Nesting types ───
export interface NestingResult {
  rank: number;
  sheet_id: number;
  sheet_code: number;
  material_name: string;
  cutting_file_id: number;
  is_blank_sheet: boolean;
  position: { x: number; y: number };
  rotation: number;
  design_width: number;
  design_height: number;
  current_usage_pct: number;
  new_usage_pct: number;
  waste_reduction_pct: number;
  score: number;
  compactness_score: number;
  edge_score: number;
  fragmentation_score: number;
  geometry_valid: boolean;
  outside_area_mm2: number;
  overlap_area_mm2: number;
  minimum_boundary_clearance_mm: number;
  minimum_occupied_clearance_mm: number;
  free_components_after: number;
  new_scrap_area_mm2: number;
  sliver_area_mm2: number;
  largest_reusable_area_mm2: number;
  largest_usable_rectangle_mm2: number;
  minimum_neck_width_mm: number;
  future_fit_probability: number;
  future_value_before: number;
  future_value_after: number;
  placed_parts?: number[][][];
  placed_geometry?: Array<{ outer: number[][]; holes: number[][][] }>;
  preview_image: string | null;
}

export interface NewSheetInfo {
  required: boolean;
  reason?: string | null;
  suggested_stock_size_cm?: [number, number] | null;
}

export interface NestingResultMeta {
  status?: 'ok' | 'new_sheet_required' | 'failed' | string;
  sheets_searched?: number;
  new_sheet?: NewSheetInfo;
  elapsed_ms?: number;
  error?: string | null;
  ranking_explanation?: string;
  mode?: 'fast' | 'accurate' | 'thorough' | string;
  rotation_policy?: 'free' | 'orthogonal' | 'step' | string;
  material_priority?: 'remnant_first' | 'speed_first' | 'perfect_fit' | string;
  cache_misses?: number;
  area_prefiltered?: number;
  screened_sheets?: number;
  refined_sheets?: number;
  search_phase?: 'screen' | 'refine' | 'search' | string;
  phase_completed?: number;
  phase_total?: number;
  candidates_found?: number;
  incomplete_chunks?: number;
  screen_elapsed_ms?: number;
  refine_elapsed_ms?: number;
  incomplete?: boolean;
  ai_review?: {
    status: 'completed' | 'failed' | 'skipped' | string;
    model?: string;
    review?: {
      summary?: string;
      candidates?: Array<{
        candidate_id: number;
        suspected_visual_violation: boolean;
        unusable_sliver_warning: boolean;
        ranking_observation: string;
        confidence: number;
      }>;
    };
  };
}

export interface NestingProgressUpdate {
  session_id: number;
  status: 'PENDING' | 'ANALYZING' | 'COMPUTING' | 'COMPLETED' | 'FAILED';
  progress_pct: number;
  progress_message: string;
  sheets_analyzed: number;
  total_sheets: number;
  results: NestingResult[] | null;
  result_meta?: NestingResultMeta | null;
  new_sheet?: NewSheetInfo | null;
  fit_status?: string | null;
  error_message: string | null;
}

export interface StartNestingResponse {
  session_id: number;
  status: string;
  message: string;
  ws_url: string;
  config?: {
    order_dxf_ids?: number[];
    kerf_mm?: number;
    edge_margin_mm?: number;
    part_gap_mm?: number;
    future_optimization?: boolean;
    rotation_step_deg?: number;
    mode?: 'fast' | 'accurate' | 'thorough';
    rotation_policy?: 'free' | 'orthogonal' | 'step';
    material_priority?: 'remnant_first' | 'speed_first' | 'perfect_fit';
    max_results?: number;
  };
}

export interface NestingApplyPrefill {
  material_id: number;
  sheet_id: number;
  sheet_code: number;
  cutting_file_id?: number;
  order_codes: number[];
  order_dxf_ids: number[];
  recommended_position_mm?: { x: number; y: number };
  recommended_rotation_deg?: number;
  use_existing_sheet?: boolean;
}

export interface ApplyNestingResponse {
  ok: boolean;
  session_id: number;
  applied_result: NestingResult;
  prefill: NestingApplyPrefill;
  message: string;
}

export interface CuttingFileOrderDxf {
  id: number;
  cutting_file: number;
  order: number;
  order_code: number;
  order_name: string;
  mockup_image: string | null;
  selected_dxf: number | null;
  dxf_file_detail: DxfFileType | null;
  usage_percentage: string | null;
  size_accuracy_percentage: string | null;
  dxf_width: string | null;
  dxf_height: string | null;
  detected_width: string | null;
  detected_height: string | null;
  is_active: boolean;
  analysis_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  analysis_notes: string | null;
  date: string;
  // DXF verification fields
  dxf_verification_status: 'PENDING' | 'MATCHED' | 'UNMATCHED' | 'ERROR';
  dxf_verification_score: string | null;
  // Coverage fields
  coverage_percent: string | null;
  matched_parts_count: number | null;
  total_parts_count: number | null;
}

export interface SheetAnalysisResponse {
  cutting_file_id: number;
  image: string | null;
  sheet_width: string | null;
  sheet_height: string | null;
  total_usage_percentage: string | null;
  analysis_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  analysis_error: string | null;
  previous_cutting_file: {
    id: number;
    image: string | null;
  } | null;
  active_selections: CuttingFileOrderDxf[];
  history_selections: CuttingFileOrderDxf[];
}

export interface CuttingFile {
  id: number;
  orders: Order[];
  on: EachArealMaterial | null;
  old_material_number: string | null;
  old_material: Material | null;
  crv3d: string;
  image: string;
  line_image: string | null;
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
  // Sheet usage analysis fields
  sheet_width: string | null;
  sheet_height: string | null;
  total_usage_percentage: string | null;
  analysis_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  analysis_error: string | null;
  previous_cutting_file: number | null;
  previous_cutting_file_image: string | null;
  previous_cutting_file_id: number | null;
  order_dxf_selections: CuttingFileOrderDxf[];
  // DXF-first fields
  dxf_file: string | null;
  dxf_layers_data: DxfLayerData | null;
  selected_layers: string[] | null;
  selected_layer_number: number | null;
  // History integrity
  history_integrity_status: 'PENDING' | 'MATCHED' | 'MISMATCHED' | 'N/A' | null;
  history_integrity_score: string | null;
  // Mass cutting file
  is_mass: boolean;
  mass_order_range_start: number | null;
  mass_order_range_end: number | null;
  order_count: number;
  mass_start_order_code?: number | null;
  mass_end_order_code?: number | null;
  mass_range_label?: string | null;
  is_outside_material?: boolean;
}
export interface Order {
  order_code: number;
  order_name?: string;
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
  dxf_files?: any[];
  dxf_file_ready?: boolean;
  duplicate_group?: string | null;
  duplicate_index?: number | null;
  duplicate_group_size?: number | null;
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
  height: string | null;
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
  height: string | null;
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
