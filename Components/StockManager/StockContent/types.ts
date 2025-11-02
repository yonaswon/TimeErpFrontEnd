export interface Material {
  id: number
  name: string
  type: 'L' | 'A' | 'P'
  type_display: string
  code_name: string
  available: string
  parsialy_available: string
  min_threshold: number
  width?: number
  height?: number
  date: string
  stats: {
    inventory_distribution: Array<{
      inventory__name: string
      total: number
      unstarted: number
      started: number
      finished: number
    }>
    total_pieces: number
    unstarted_pieces: number
    started_pieces: number
    finished_pieces: number
    total_area_available: number
  }
}

export interface MaterialsResponse {
  count: number
  next: string | null
  previous: string | null
  results: Material[]
}