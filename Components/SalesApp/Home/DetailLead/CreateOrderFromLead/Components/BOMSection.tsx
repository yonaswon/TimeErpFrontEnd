'use client'
import { Plus, Trash2 } from 'lucide-react'
import { FormItem, Material } from '../types'

interface BOMSectionProps {
  item: FormItem
  itemIndex: number
  materials: Material[]
  onItemChange: (index: number, field: keyof FormItem, value: any) => void
}

export default function BOMSection({ item, itemIndex, materials, onItemChange }: BOMSectionProps) {
  const handleBomChange = (bomIndex: number, field: string, value: string) => {
    const newItems = [...item.boms]
    const bom = newItems[bomIndex]
    
    // @ts-ignore
    bom[field] = value === '' ? '0' : value
    onItemChange(itemIndex, 'boms', newItems)
  }

  const handleMaterialChange = (bomIndex: number, materialId: number) => {
    const newItems = [...item.boms]
    const bom:any = newItems[bomIndex]
    const selectedMaterial = materials.find(m => m.id === materialId)
    
    bom.material = materialId
    bom.material_obj = selectedMaterial
    
    // Reset fields when material changes
    bom.amount = '0'
    bom.width = '0'
    bom.height = '0'

    onItemChange(itemIndex, 'boms', newItems)
  }

  const addBom = () => {
    const newBoms = [...item.boms, {
      material: materials.length > 0 ? materials[0].id : 0,
      material_obj: materials[0],
      amount: '0',
      width: '0',
      height: '0',
      price_per_unit: '0',
      total_price: '0',
      estimated_price: '0',
      _tempId: Math.random().toString(36).substr(2, 9)
    }]
    onItemChange(itemIndex, 'boms', newBoms)
  }

  const removeBom = (bomIndex: number) => {
    const newBoms = item.boms.filter((_, index) => index !== bomIndex)
    onItemChange(itemIndex, 'boms', newBoms)
  }

  const getMaterialType = (bom: any): 'L' | 'A' | 'P' | null => {
    return bom.material_obj?.type || materials.find(m => m.id === bom.material)?.type || null
  }

  return (
    <div className="border-t border-gray-200 dark:border-zinc-700 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
          Bill of Materials {item.original_boms.length > 0 && `(${item.original_boms.length} from lead)`}
        </h4>
        <button 
          type="button" 
          onClick={addBom}
          className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
        >
          <Plus className="w-3 h-3" /> Add BOM
        </button>
      </div>

      <div className="space-y-3">
        {item.boms.map((bom, bomIndex) => {
          const materialType = getMaterialType(bom)
          const isAreal = materialType === 'A'
          const isLengthOrPiece = materialType === 'L' || materialType === 'P'

          return (
            <div key={bom._tempId} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-zinc-700 rounded">
              {/* Material Selection */}
              <div className="md:col-span-2">
                <label className="text-xs font-medium">Material *</label>
                <select
                  value={bom.material}
                  onChange={(e) => handleMaterialChange(bomIndex, parseInt(e.target.value))}
                  className="w-full p-1 text-xs border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-600"
                  required
                >
                  <option value="">Select material</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name} ({material.code_name}) - {material.type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Field (for Length and Piece materials) */}
              {isLengthOrPiece && (
                <div className="md:col-span-2">
                  <label className="text-xs font-medium">
                    Amount * ({materialType === 'L' ? 'Length' : 'Pieces'})
                  </label>
                  <input
                    type="number"
                    value={bom.amount}
                    step="0.001"
                    min="0"
                    onChange={(e) => handleBomChange(bomIndex, 'amount', e.target.value)}
                    className="w-full p-1 text-xs border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-600"
                    placeholder="0"
                    required
                  />
                </div>
              )}

              {/* Width Field (for Areal materials) */}
              {isAreal && (
                <div>
                  <label className="text-xs font-medium">Width *</label>
                  <input
                    type="number"
                    value={bom.width}
                    step="0.001"
                    min="0"
                    onChange={(e) => handleBomChange(bomIndex, 'width', e.target.value)}
                    className="w-full p-1 text-xs border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-600"
                    placeholder="0"
                    required
                  />
                </div>
              )}

              {/* Height Field (for Areal materials) */}
              {isAreal && (
                <div>
                  <label className="text-xs font-medium">Height *</label>
                  <input
                    type="number"
                    value={bom.height}
                    step="0.001"
                    min="0"
                    onChange={(e) => handleBomChange(bomIndex, 'height', e.target.value)}
                    className="w-full p-1 text-xs border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-600"
                    placeholder="0"
                    required
                  />
                </div>
              )}

              {/* Remove Button */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeBom(bomIndex)}
                  className="w-full p-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Show original BOMs from lead as reference */}
      {item.original_boms.length > 0 && (
        <div className="mt-4">
          <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Original BOMs from Lead:
          </h5>
          <div className="space-y-2">
            {item.original_boms.map((originalBom: any, index: number) => {
              const originalMaterial = materials.find(m => m.id === (originalBom.material?.id || originalBom.material))
              const isAreal = originalMaterial?.type === 'A'
              const isLengthOrPiece = originalMaterial?.type === 'L' || originalMaterial?.type === 'P'

              return (
                <div key={index} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-zinc-600 p-2 rounded">
                  <div className="font-medium">{originalMaterial?.name} ({originalMaterial?.code_name})</div>
                  {isLengthOrPiece && originalBom.amount && (
                    <div>Amount: {originalBom.amount}</div>
                  )}
                  {isAreal && originalBom.width && originalBom.height && (
                    <div>Size: {originalBom.width} x {originalBom.height}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}