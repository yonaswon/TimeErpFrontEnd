'use client'
import { Image as ImageIcon, DollarSign, Ruler, Package, Calendar, FileText } from 'lucide-react'

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
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function EachModificationDisplayer({ modification }: EachModificationDisplayerProps) {
  return (
    <div className="space-y-6">
      {/* Modification Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Modification #{modification.id}
            </h2>
            <Badge variant={getStatusVariant(modification.request_status)}>
              {modification.request_status}
            </Badge>
            {modification.is_edit && (
              <Badge variant="yellow">
                Edit Request
              </Badge>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            {modification.note || 'No description provided'}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium">
            <DollarSign className="w-4 h-4" />
            Price
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {modification.price ? `$${modification.price}` : 'Not set'}
          </div>
          {modification.price_with_vat && (
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Includes VAT</div>
          )}
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
            <Ruler className="w-4 h-4" />
            Dimensions
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {modification.width && modification.hieght 
              ? `${modification.width} × ${modification.hieght}`
              : 'Not set'
            }
          </div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm font-medium">
            <Package className="w-4 h-4" />
            BOM Items
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {modification.bom?.length || 0}
          </div>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm font-medium">
            <Calendar className="w-4 h-4" />
            Requested
          </div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
            {formatDate(modification.requested_date)}
          </div>
        </div>
      </div>

      {/* Reference Images Section */}
      {modification.reference_images.length > 0 && (
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Reference Images ({modification.reference_images.length})
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {modification.reference_images.map((image) => (
              <div key={image.id} className="bg-gray-100 dark:bg-zinc-900 rounded-lg h-32 flex items-center justify-center overflow-hidden">
                <img 
                  src={image.image} 
                  alt={`Reference ${image.id}`}
                  className="max-h-full max-w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mockup Image */}
      {modification.mockup_image && (
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Modified Mockup
          </h3>
          <div className="bg-gray-100 dark:bg-zinc-900 rounded-lg h-64 flex items-center justify-center overflow-hidden">
            <img 
              src={modification.mockup_image} 
              alt={`Modification ${modification.id}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      )}

      {/* BOM Section */}
      {modification.bom && modification.bom.length > 0 && (
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Bill of Materials ({modification.bom.length})
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-600">
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Material</th>
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Amount</th>
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Dimensions</th>
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Price/Unit</th>
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {modification.bom.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-zinc-700">
                    <td className="py-3 px-2">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.material.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.material.code_name}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-300">
                      {item.amount ?? '—'}
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-300">
                      {item.width && item.height ? `${item.width} × ${item.height}` : '—'}
                    </td>
                    <td className="py-3 px-2">
                      {item.price_per_unit ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          ${item.price_per_unit}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {item.total_price ? (
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${item.total_price}
                        </span>
                      ) : item.estimated_price ? (
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          ${item.estimated_price}*
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Timeline Info */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timeline</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-500 dark:text-gray-400">Requested Date</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {formatDate(modification.requested_date)}
            </div>
          </div>
          
          <div>
            <div className="text-gray-500 dark:text-gray-400">Started Date</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {formatDate(modification.started_date)}
            </div>
          </div>
          
          <div>
            <div className="text-gray-500 dark:text-gray-400">Response Date</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {formatDate(modification.response_date)}
            </div>
          </div>
        </div>
      </div>

      {/* Previous Modification Info */}
      {modification.prev_modification && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
            <FileText className="w-4 h-4" />
            <span className="font-medium">Based on Modification</span>
          </div>
          <div className="text-sm text-gray-900 dark:text-white">
            This modification is based on modification #{modification.prev_modification}
          </div>
        </div>
      )}
    </div>
  )
}