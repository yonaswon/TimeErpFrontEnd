import { X, Package, Ruler, Square, MapPin, AlertTriangle } from 'lucide-react'
import { Material } from './types'
import { MaterialStatus } from './MaterialStatus'

interface MaterialDetailsProps {
  material: Material
  isOpen: boolean
  onClose: () => void
}

export const MaterialDetails = ({ material, isOpen, onClose }: MaterialDetailsProps) => {
  if (!isOpen) return null

  const getTypeIcon = (type: string) => {
    const icons = {
      'L': <Ruler className="w-5 h-5" />,
      'A': <Square className="w-5 h-5" />,
      'P': <Square className="w-5 h-5" />
    }
    return icons[type as keyof typeof icons] || <Package className="w-5 h-5" />
  }

  const getTypeDisplay = (type: string) => {
    const types = {
      'L': 'Length Material',
      'A': 'Areal Material',
      'P': 'Piece Material'
    }
    return types[type as keyof typeof types] || type
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-3">
            <MaterialStatus material={material} size="lg" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {material.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {material.code_name || 'No code name'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              {getTypeIcon(material.type)}
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {getTypeDisplay(material.type)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Type</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              <Package className="w-5 h-5" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {material.available}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Available</div>
              </div>
            </div>

            {material.type === 'A' && (
              <>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <Ruler className="w-5 h-5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {material.width} × {material.height}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Dimensions</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <Square className="w-5 h-5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {material.parsialy_available}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Area</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Inventory Distribution */}
          <div>
            <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <MapPin className="w-5 h-5" />
              <span>Inventory Distribution</span>
            </h3>
            
            <div className="space-y-3">
              {material.stats.inventory_distribution.map((inventory, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {inventory.inventory__name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Total: {inventory.total} • Unstarted: {inventory.unstarted} • Started: {inventory.started}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    inventory.unstarted === inventory.total 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      : inventory.started > 0
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {inventory.finished > 0 ? 'Partially Used' : 'All Available'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {material.stats.total_pieces}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Total Pieces</div>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {material.stats.unstarted_pieces}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Unstarted</div>
            </div>
            
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {material.stats.started_pieces}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">In Progress</div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {material.stats.finished_pieces}
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">Finished</div>
            </div>
          </div>

          {/* Threshold Warning */}
          {parseFloat(material.available) < material.min_threshold && (
            <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
              <div>
                <div className="font-medium text-red-800 dark:text-red-300">
                  Low Stock Warning
                </div>
                <div className="text-sm text-red-700 dark:text-red-400">
                  Available ({material.available}) is below minimum threshold ({material.min_threshold})
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}