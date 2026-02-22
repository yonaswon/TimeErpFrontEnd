'use client'
import { Upload, Trash2 } from 'lucide-react'

interface DirectOrderItemProps {
    index: number
    item: {
        mockup_image: File | null
        design_type: number
        price: number
        note: string
    }
    designTypes: any[]
    onItemChange: (index: number, field: string, value: any) => void
    onRemove: (index: number) => void
    canRemove: boolean
}

export default function DirectOrderItem({
    index,
    item,
    designTypes,
    onItemChange,
    onRemove,
    canRemove,
}: DirectOrderItemProps) {
    return (
        <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4 relative">
            {/* Remove Button */}
            {canRemove && (
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="absolute top-3 right-3 p-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}

            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                Order #{index + 1}
            </div>

            <div className="flex items-start gap-4">
                {/* Image Upload */}
                <div className="shrink-0">
                    <label className="cursor-pointer group">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-zinc-700 rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-zinc-600 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-colors">
                            {item.mockup_image ? (
                                <img
                                    src={URL.createObjectURL(item.mockup_image)}
                                    alt="Mockup"
                                    className="w-full h-full object-cover rounded-xl"
                                    onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-blue-500 transition-colors">
                                    <Upload className="w-5 h-5" />
                                    <span className="text-[10px] font-medium">Upload</span>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => onItemChange(index, 'mockup_image', e.target.files?.[0] || null)}
                        />
                    </label>
                    {item.mockup_image && (
                        <button
                            type="button"
                            onClick={() => onItemChange(index, 'mockup_image', null)}
                            className="mt-1 text-[10px] text-red-500 hover:text-red-700 w-full text-center"
                        >
                            Remove image
                        </button>
                    )}
                </div>

                {/* Item Details */}
                <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Design Type *
                            </label>
                            <select
                                value={item.design_type}
                                onChange={(e) => onItemChange(index, 'design_type', parseInt(e.target.value))}
                                className="w-full p-2 text-sm border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                                required
                            >
                                <option value="">Select design type</option>
                                {designTypes.map((d: any) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Price *
                            </label>
                            <input
                                type="number"
                                value={item.price || ''}
                                min={0}
                                step="1"
                                onChange={(e) => onItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                                className="w-full p-2 text-sm border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                                placeholder="0"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Note
                        </label>
                        <input
                            type="text"
                            value={item.note}
                            onChange={(e) => onItemChange(index, 'note', e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                            placeholder="Optional note for this order..."
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
