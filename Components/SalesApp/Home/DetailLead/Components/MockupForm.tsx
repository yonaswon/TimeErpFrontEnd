"use client";
import { useState, useEffect } from "react";
import api from "@/api";
import { Upload, X, FileText, Ruler, Info, Tag } from "lucide-react";

interface MockupFormProps {
  leadId: number;
  onCancel: () => void;
  onSuccess: () => void;
}

interface ImagePreview {
  id: string;
  file: File;
  preview: string;
}

interface Designer {
  id: number;
  telegram_id: number;
  telegram_user_name: string | null;
  first_name: string;
  role: Array<{
    id: number;
    Name: string;
    date: string;
  }>;
}

interface DesignType {
  id: number;
  name: string;
  date: string;
}

export default function MockupForm({
  leadId,
  onCancel,
  onSuccess,
}: MockupFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [designTypes, setDesignTypes] = useState<DesignType[]>([]);
  const [loadingDesigners, setLoadingDesigners] = useState(true);
  const [loadingDesignTypes, setLoadingDesignTypes] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    designer: "",
    design_type: "",
    note: "",
    width: "",
    height: "",
    reference_images: [] as number[],
    lead: leadId,
  });
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);

  useEffect(() => {
    fetchDesigners();
    fetchDesignTypes();
  }, []);

  const fetchDesigners = async () => {
    try {
      setLoadingDesigners(true);
      const response = await api.get("/core/teams/");
      setDesigners(response.data.results || response.data);
    } catch (error: any) {
      console.error("Error fetching designers:", error);
      setError("Failed to load designers");
    } finally {
      setLoadingDesigners(false);
    }
  };

  const fetchDesignTypes = async () => {
    try {
      setLoadingDesignTypes(true);
      const response = await api.get("/lead/design-types/");
      setDesignTypes(response.data);
    } catch (error: any) {
      console.error("Error fetching design types:", error);
      setError("Failed to load design types");
    } finally {
      setLoadingDesignTypes(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
      const uploadedImageIds = await uploadImages();

      const submissionData = {
        ...formData,
        reference_images: uploadedImageIds,
        lead: leadId,
        designer: parseInt(formData.designer),
        design_type: formData.design_type
          ? parseInt(formData.design_type)
          : null,
      };

      await api.post("/lead/mockups/", submissionData);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating mockup:", error);
      const errorMessage = error.response?.data
        ? JSON.stringify(error.response.data)
        : "Failed to create mockup request";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-md transition-all"
    >
      {/* Image Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
          Reference Images (optional)
        </label>

        <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-xl p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
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
          <label htmlFor="image-upload" className="cursor-pointer block">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                Click to upload
              </span>{" "}
              or drag and drop images
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              PNG, JPG, GIF up to 10MB each
            </p>
          </label>
        </div>

        {imagePreviews.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {imagePreviews.map((image) => (
              <div
                key={image.id}
                className="relative group rounded-lg overflow-hidden"
              >
                <img
                  src={image.preview}
                  alt="Preview"
                  className="w-full h-28 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-semibold">Mockup Request for Lead #{leadId}</p>
          <p>This will create a new mockup request for the design team.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-300 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
            Mockup Name (optional)
          </label>
          <div className="relative">
            <Tag className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Give your mockup a name..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
            />
          </div>
        </div>

        {/* Designer */}
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
            Designer *
          </label>
          {loadingDesigners ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Loading designers...
            </div>
          ) : (
            <select
              name="designer"
              value={formData.designer}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
            >
              <option value="">Select designer</option>
              {designers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.first_name}
                  {d.telegram_user_name && ` (@${d.telegram_user_name})`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Design Type */}
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
            Design Type (optional)
          </label>
          {loadingDesignTypes ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Loading types...
            </div>
          ) : (
            <select
              name="design_type"
              value={formData.design_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
            >
              <option value="">Select type</option>
              {designTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Width & Height */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
              Width (optional)
            </label>
            <div className="relative">
              <input
                type="number"
                name="width"
                value={formData.width}
                onChange={handleInputChange}
                placeholder="Width"
                className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
              />
              <Ruler className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
              Height (optional)
            </label>
            <div className="relative">
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                placeholder="Height"
                className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
              />
              <Ruler className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
          Notes *
        </label>
        <textarea
          name="note"
          rows={4}
          value={formData.note}
          onChange={handleInputChange}
          placeholder="Describe what you want in this mockup..."
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !formData.designer || !formData.note.trim()}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Create Mockup
            </>
          )}
        </button>
      </div>
    </form>
  );
}
