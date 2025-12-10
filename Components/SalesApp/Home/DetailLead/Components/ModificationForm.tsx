"use client";
import { useState, useEffect } from "react";
import api from "@/api";
import {
  Upload,
  Image as ImageIcon,
  X,
  FileText,
  DollarSign,
  Info,
} from "lucide-react";

interface ModificationFormProps {
  mockupId: number;
  leadId: number;
  previousModification?: number | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface ImagePreview {
  id: string;
  file: File;
  preview: string;
}

export default function ModificationForm({
  mockupId,
  leadId,
  previousModification = null,
  onCancel,
  onSuccess,
}: ModificationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    note: "",
    price_with_vat: false,
    reference_images: [] as number[],
    mockup: mockupId,
    lead: leadId,
    prev_modification: previousModification,
  });
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);

  useEffect(() => {
    // Set the required fields when component mounts
    setFormData((prev) => ({
      ...prev,
      mockup: mockupId,
      lead: leadId,
      prev_modification: previousModification,
    }));
  }, [mockupId, leadId, previousModification]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageUpload = async (files: FileList) => {
    const newImages: ImagePreview[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        const preview = URL.createObjectURL(file);
        newImages.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview,
        });
      }
    }

    setImagePreviews((prev) => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImagePreviews((prev) => prev.filter((img) => img.id !== id));
  };

  const uploadImages = async (): Promise<number[]> => {
    if (imagePreviews.length === 0) return [];

    const uploadedImageIds: number[] = [];

    for (const imagePreview of imagePreviews) {
      const formData = new FormData();
      formData.append("image", imagePreview.file);

      try {
        const response = await api.post("/lead/images/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        uploadedImageIds.push(response.data.id);
      } catch (error) {
        console.error("Error uploading image:", error);
        throw new Error("Failed to upload one or more images");
      }
    }

    return uploadedImageIds;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First upload all images
      const uploadedImageIds = await uploadImages();

      // Then create the modification with all required fields
      const submissionData = {
        ...formData,
        reference_images: uploadedImageIds,
        // Ensure all required fields are included
        mockup: mockupId,
        lead: leadId,
        prev_modification: previousModification,
      };

      console.log("Submitting modification data:", submissionData);

      await api.post("/lead/modifications/", submissionData);

      onSuccess();
    } catch (error: any) {
      console.error("Error creating modification:", error);
      const errorMessage = error.response?.data
        ? JSON.stringify(error.response.data)
        : "Failed to create modification";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-red-700 dark:text-red-400 text-sm font-medium mb-2">
            Error
          </div>
          <div className="text-red-600 dark:text-red-300 text-sm">{error}</div>
        </div>
      )}

      {/* Required Fields Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <div className="font-medium text-blue-800 dark:text-blue-300 mb-1">
              Modification Details
            </div>
            <div className="text-blue-700 dark:text-blue-400 space-y-1">
              <div>• Lead: #{leadId}</div>
              <div>• Mockup: MC-{mockupId}</div>
              {previousModification && (
                <div>• Based on modification: #{previousModification}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Reference Images
        </label>

        {/* Image Upload Area */}
        <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-zinc-500 transition-colors">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) =>
              e.target.files && handleImageUpload(e.target.files)
            }
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="text-gray-600 dark:text-gray-400">
              <span className="font-medium text-blue-600 dark:text-blue-400">
                Click to upload
              </span>{" "}
              or drag and drop
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

      {/* Note Field */}
      <div>
        <label
          htmlFor="note"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Modification Notes *
        </label>
        <textarea
          id="note"
          name="note"
          rows={4}
          value={formData.note}
          onChange={handleInputChange}
          placeholder="Describe what changes you want in this modification..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
          required
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Required field. Describe the changes you need.
        </p>
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
          disabled={loading || !formData.note.trim()}
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
              Create Modification
            </>
          )}
        </button>
      </div>
    </form>
  );
}
