'use client'
import { useState, useEffect } from 'react'
import api from '@/api'
import { Upload, Image as ImageIcon, X, FileText, Ruler, User, Info } from 'lucide-react'

interface MockupFormProps {
  leadId: number
  onCancel: () => void
  onSuccess: () => void
}

interface ImagePreview {
  id: string
  file: File
  preview: string
}

interface Designer {
  id: number
  telegram_id: number
  telegram_user_name: string | null
  first_name: string
  role: Array<{
    id: number
    Name: string
    date: string
  }>
}

export default function MockupForm({ leadId, onCancel, onSuccess }: MockupFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [designers, setDesigners] = useState<Designer[]>([])
  const [loadingDesigners, setLoadingDesigners] = useState(true)
  const [formData, setFormData] = useState({
    designer: '',
    note: '',
    width: '',
    height: '',
    reference_images: [] as number[],
    lead: leadId
  })
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([])

  useEffect(() => {
    fetchDesigners()
  }, [])

  const fetchDesigners = async () => {
    try {
      setLoadingDesigners(true)
      const response = await api.get('/core/teams/')
      setDesigners(response.data.results || response.data)
    } catch (error: any) {
      console.error('Error fetching designers:', error)
      setError('Failed to load designers')
    } finally {
      setLoadingDesigners(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageUpload = async (files: FileList) => {
    const newImages: ImagePreview[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file)
        newImages.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview
        })
      }
    }
    
    setImagePreviews(prev => [...prev, ...newImages])
  }

  const removeImage = (id: string) => {
    setImagePreviews(prev => prev.filter(img => img.id !== id))
  }

  const uploadImages = async (): Promise<number[]> => {
    if (imagePreviews.length === 0) return []

    const uploadedImageIds: number[] = []
    
    for (const imagePreview of imagePreviews) {
      const formData = new FormData()
      formData.append('image', imagePreview.file)
      
      try {
        const response = await api.post('/lead/images/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        uploadedImageIds.push(response.data.id)
      } catch (error) {
        console.error('Error uploading image:', error)
        throw new Error('Failed to upload one or more images')
      }
    }
    
    return uploadedImageIds
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // First upload all images
      const uploadedImageIds = await uploadImages()
      
      // Then create the mockup with all required fields
      const submissionData = {
        ...formData,
        reference_images: uploadedImageIds,
        lead: leadId,
        designer: parseInt(formData.designer)
      }

      console.log('Submitting mockup data:', submissionData)

      await api.post('/lead/mockups/', submissionData)
      
      onSuccess()
    } catch (error: any) {
      console.error('Error creating mockup:', error)
      const errorMessage = error.response?.data 
        ? JSON.stringify(error.response.data)
        : 'Failed to create mockup request'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-red-700 dark:text-red-400 text-sm font-medium mb-2">Error</div>
          <div className="text-red-600 dark:text-red-300 text-sm">{error}</div>
        </div>
      )}

      {/* Required Fields Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <div className="font-medium text-blue-800 dark:text-blue-300 mb-1">Mockup Request Details</div>
            <div className="text-blue-700 dark:text-blue-400 space-y-1">
              <div>• Lead: #{leadId}</div>
              <div>• This will create a new mockup request for designers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Designer Selection */}
      <div>
        <label htmlFor="designer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Designer *
        </label>
        {loadingDesigners ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">Loading designers...</div>
          </div>
        ) : (
          <select
            id="designer"
            name="designer"
            value={formData.designer}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
          >
            <option value="">Select a designer</option>
            {designers.map((designer) => (
              <option key={designer.id} value={designer.id}>
                {designer.first_name} 
                {designer.telegram_user_name && ` (@${designer.telegram_user_name})`}
              </option>
            ))}
          </select>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Required field. Select which designer should work on this mockup.
        </p>
      </div>

      {/* Note Field */}
      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notes *
        </label>
        <textarea
          id="note"
          name="note"
          rows={4}
          value={formData.note}
          onChange={handleInputChange}
          placeholder="Describe what you want in this mockup... Include details about design, colors, style, etc."
          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
          required
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Required field. Provide clear instructions for the designer.
        </p>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="width" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Width (optional)
          </label>
          <div className="relative">
            <input
              type="number"
              id="width"
              name="width"
              value={formData.width}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Ruler className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="height" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Height (optional)
          </label>
          <div className="relative">
            <input
              type="number"
              id="height"
              name="height"
              value={formData.height}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Ruler className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Reference Images (optional)
        </label>
        
        {/* Image Upload Area */}
        <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-zinc-500 transition-colors">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="text-gray-600 dark:text-gray-400">
              <span className="font-medium text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              PNG, JPG, GIF up to 10MB each
            </div>
          </label>
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selected Images ({imagePreviews.length})
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {imagePreviews.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.preview}
                    alt="Preview"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !formData.designer || !formData.note.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Create Mockup Request
            </>
          )}
        </button>
      </div>
    </form>
  )
}