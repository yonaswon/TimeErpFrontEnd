import { Material } from './types'
import { MaterialStatus } from './MaterialStatus'

interface MaterialRowProps {
  material: Material
  onClick: (material: Material) => void
}

export const MaterialRow = ({ material, onClick }: MaterialRowProps) => {
  const getTypeDisplay = (type: string) => {
    const types = {
      'L': 'Length',
      'A': 'Areal', 
      'P': 'Piece'
    }
    return types[type as keyof typeof types] || type
  }

  const getAvailableText = (material: Material) => {
    if (material.type === 'A') {
      return `${material.available} pieces • ${material.parsialy_available} area`
    }
    return `${material.available} ${material.type === 'L' ? 'meters' : 'pieces'}`
  }

  return (
    <div 
      onClick={() => onClick(material)}
      className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all duration-200 hover:shadow-md"
    >
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <MaterialStatus material={material} size="md" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {material.name}
            </h3>
            {material.code_name && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                {material.code_name}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
            <span>{getTypeDisplay(material.type)}</span>
            <span>•</span>
            <span>{getAvailableText(material)}</span>
            {material.type === 'A' && material.width && material.height && (
              <>
                <span>•</span>
                <span>{material.width}×{material.height}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4 ml-4">
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {material.stats.total_pieces} total
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {material.min_threshold} min
          </div>
        </div>
        
        <div className="text-gray-400 dark:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  )
}