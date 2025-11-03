'use client'
import { Image as ImageIcon, DollarSign, Ruler, Package, Calendar, FileText, Clock } from 'lucide-react'

interface Modification {
  id: number
  reference_images: Array<{
    id: number
    image: string
    date: string
  }>
  bom: Array<{
    id: number
    material: {
      id: number
      name: string
      type: string
      code_name: string
      available: string
      parsialy_available: string
      min_threshold: number
      width: number | null
      height: number | null
      date: string
      stats: any
    }
    amount: string | null
    width: string | null
    height: string | null
    price_per_unit: string | null
    total_price: string | null
    estimated_price: string | null
    date: string
  }>
  price: number | null
  price_with_vat: boolean
  is_edit: boolean
  request_status: string
  mockup_image: string | null
  note: string | null
  width: string | null
  hieght: string | null
  telegram_message_id: number | null
  started_date: string | null
  requested_date: string
  response_date: string | null
  lead: number
  mockup: number
  prev_modification: number | null
}

interface EachModificationDisplayerProps {
  modification: Modification
}

const Badge = ({ children, variant = 'gray' }: { children: React.ReactNode; variant?: string }) => {
  const map: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-200',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${map[variant] || map.gray}`}>
      {children}
    </span>
  )
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'SENT': return 'blue'
    case 'STARTED': return 'yellow'
    case 'RETURNED': return 'green'
    case 'CONVERTED': return 'purple'
    default: return 'gray'
  }
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function EachModificationDisplayer({ modification }: EachModificationDisplayerProps) {
  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-linear-to-b from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            M{modification.id}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Mod #{modification.id}</span>
              <Badge variant={getStatusVariant(modification.request_status)}>
                {modification.request_status}
              </Badge>
              {modification.is_edit && (
                <Badge variant="yellow">
                  Edit
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(modification.requested_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
            </div>
          </div>
        </div>
      </div>

      {/* Modified Mockup Image */}
      {modification.mockup_image && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
          <div className="p-2 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Modified Mockup</span>
            </div>
          </div>
          <div className="p-2">
            <img
              src={modification.mockup_image}
              alt={`Modification ${modification.id}`}
              className="w-full rounded max-h-48 object-contain"
            />
          </div>
        </div>
      )}

      {/* Key Stats - Compact Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-2 border border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Price</span>
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-white">
            {modification.price ? `$${modification.price}` : "—"}
          </div>
          {modification.price_with_vat && (
            <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">With VAT</div>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg p-2 border border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
            <Ruler className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Size</span>
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-white">
            {modification.width && modification.hieght ? `${modification.width}×${modification.hieght}` : "—"}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg p-2 border border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
            <Package className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">BOM</span>
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-white">
            {modification.bom?.length || 0}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg p-2 border border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Status</span>
          </div>
          <Badge variant={getStatusVariant(modification.request_status)}>
            {modification.request_status}
          </Badge>
        </div>
      </div>

      {/* Notes */}
      {modification.note && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
          <div className="p-2 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-green-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Modification Notes</span>
            </div>
          </div>
          <div className="p-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {modification.note}
            </p>
          </div>
        </div>
      )}

      {/* BOM Items - Compact List */}
      {modification.bom && modification.bom.length > 0 && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
          <div className="p-2 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Materials</span>
              <Badge variant="purple">{modification.bom.length}</Badge>
            </div>
          </div>
          <div className="p-2 space-y-1">
            {modification.bom.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-1.5 bg-gray-50 dark:bg-zinc-900 rounded text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {item.material.name}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                    {item.material.code_name && <span>{item.material.code_name}</span>}
                    {item.amount && <span>• Qty: {item.amount}</span>}
                    {item.width && item.height && <span>• {item.width}×{item.height}</span>}
                  </div>
                </div>
                <div className="text-right ml-2">
                  {item.total_price ? (
                    <div className="text-green-600 dark:text-green-400 font-bold text-sm">
                      ${item.total_price}
                    </div>
                  ) : item.estimated_price ? (
                    <div className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                      ${item.estimated_price}*
                    </div>
                  ) : null}
                  {item.price_per_unit && (
                    <div className="text-gray-500 dark:text-gray-400 text-[10px]">
                      ${item.price_per_unit}/unit
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reference Images */}
      {modification.reference_images.length > 0 && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
          <div className="p-2 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Reference Images</span>
              <Badge variant="purple">{modification.reference_images.length}</Badge>
            </div>
          </div>
          <div className="p-2">
            <div className="grid grid-cols-3 gap-1">
              {modification.reference_images.map((image) => (
                <div
                  key={image.id}
                  className="aspect-square bg-gray-100 dark:bg-zinc-900 rounded overflow-hidden"
                >
                  <img
                    src={image.image}
                    alt={`Reference ${image.id}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Timeline Info */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
        <div className="p-2 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Timeline</span>
          </div>
        </div>
        <div className="p-2 space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400">Requested:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Date(modification.requested_date).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}
            </span>
          </div>
          {modification.started_date && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Started:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {new Date(modification.started_date).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}
              </span>
            </div>
          )}
          {modification.response_date && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Response:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {new Date(modification.response_date).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Previous Modification Info */}
      {modification.prev_modification && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 p-2">
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">Based on Modification</span>
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300">
            Modification #{modification.prev_modification}
          </div>
        </div>
      )}
    </div>
  )
}