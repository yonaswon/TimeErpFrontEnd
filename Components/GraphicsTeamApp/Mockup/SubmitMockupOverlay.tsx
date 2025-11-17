"use client";
import { useState } from "react";
import { X, Upload, DollarSign, Loader2 } from "lucide-react";
import api from "@/api";
import { Mockup } from "./utils/types";

interface SubmitMockupOverlayProps {
  mockup: Mockup;
  onClose: () => void;
  onSuccess: () => void;
}

const SubmitMockupOverlay = ({
  mockup,
  onClose,
  onSuccess,
}: SubmitMockupOverlayProps) => {
  const [mockupImage, setMockupImage] = useState<File | null>(null);
  const [mockupImagePreview, setMockupImagePreview] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMockupImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setMockupImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!mockupImage) return alert("Please upload a mockup image");
    if (!price) return alert("Please enter a price");

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("mockup_image", mockupImage);
      formData.append("request_status", "RETURNED");
      formData.append("price", Math.round(parseFloat(price) * 100).toString());
      formData.append("price_with_vat", "false"); // static false

      await api.post(`/lead/mockups/${mockup.id}/return_mockup/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error submitting mockup:", err);
      alert("Failed to submit mockup. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl p-6 md:p-8 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Submit Mockup #{mockup.id}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Returned on {new Date().toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Mockup Upload */}
        <div className="space-y-3 mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mockup Image <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
            {mockupImagePreview ? (
              <div className="space-y-3">
                <img
                  src={mockupImagePreview}
                  alt="Mockup preview"
                  className="max-h-64 mx-auto rounded-lg shadow-md object-contain"
                />
                <button
                  onClick={() => {
                    setMockupImage(null);
                    setMockupImagePreview("");
                  }}
                  className="text-red-500 hover:text-red-600 text-sm font-medium"
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="mx-auto text-gray-400" size={48} />
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Upload your mockup image
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                  PNG, JPG, JPEG up to 10MB
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="mockup-upload"
                />
                <label
                  htmlFor="mockup-upload"
                  className="inline-block px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors font-medium"
                >
                  Choose File
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Price Input */}
        <div className="space-y-3 mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Price <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DollarSign
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="number"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter total price"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all duration-200 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!mockupImage || !price || submitting}
            className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 font-medium"
          >
            {submitting ? (
              <span className="flex items-center justify-center space-x-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Submitting...</span>
              </span>
            ) : (
              "Submit Mockup"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitMockupOverlay;
