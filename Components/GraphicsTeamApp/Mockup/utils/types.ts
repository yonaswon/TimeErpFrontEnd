export interface ReferenceImage {
  id: number
  image: string
  date: string
}

// export interface Material {
//   id: number
//   name: string
//   type: string
//   code_name: string
//   available: string
//   parsialy_available: string
//   min_threshold: number
//   width: number
//   height: number
//   date: string
//   stats: any
// }

// export interface BOMItem {
//   id: number
//   material: Material
//   amount: string | null
//   width: string
//   height: string
//   price_per_unit: string
//   total_price: string
//   estimated_price: string
//   date: string
// }

export interface Designer {
  id: number
  telegram_id: number
  telegram_user_name: string
  role: Array<{
    id: number
    Name: string
    date: string
  }>
  first_name: string
}

export interface Modification {
  id: number
  reference_images: ReferenceImage[]
  bom: BOMItem[]
  price: number | null
  price_with_vat: boolean
  is_edit: boolean
  request_status: string
  mockup_image: string | null
  note: string | null
  width: string | null
  hieght: string | null
  telegram_message_id: string | null
  started_date: string | null
  requested_date: string
  response_date: string | null
  lead: number
  mockup: number
  prev_modification: number | null
}

export interface Mockup {
  id: number
  reference_images: ReferenceImage[]
  bom: BOMItem[]
  designer: Designer
  request_status: string
  note: string | null
  price: number | null
  price_with_vat: boolean
  mockup_image: string | null
  width: string | null
  hieght: string | null
  telegram_message_id: string | null
  requested_date: string
  first_response_date: string | null
  date: string
  lead: number
}

// Add these to your existing types.ts file

export interface Material {
  id: number
  name: string
  type: 'L' | 'A' | 'P'
  code_name: string
  available: string
  parsialy_available: string
  min_threshold: number
  width: number | null
  height: number | null
  lable: 'COLOR' | 'BG' | 'LED' | 'OL' | 'PS' | 'OTHER'
  date: string
  stats: any
}

export interface BOMItem {
  id?: number
  material: number
  amount: string | null
  width: string | null
  height: string | null
  price_per_unit: string | null
  total_price: string | null
  estimated_price: string | null
}

export interface MaterialsResponse {
  count: number
  next: string | null
  previous: string | null
  results: Material[]
}