"use client";
import { useEffect, useState } from "react";
import { Modification } from "./utils/types";
import { X, Upload, DollarSign } from "lucide-react";
import api from "@/api";

interface SubmitModificationOverlayProps {
  modification: Modification;
  onClose: () => void;
  onSuccess: () => void;
}

const SubmitModificationOverlay = ({
  modification,
  onClose,
  onSuccess,
}: SubmitModificationOverlayProps) => {
  const [mockupImage, setMockupImage] = useState<File | null>(null);
  const [mockupImagePreview, setMockupImagePreview] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMockupImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setMockupImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!mockupImage) {
      alert("Please upload a mockup image");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("mockup_image", mockupImage);
      formData.append("request_status", "RETURNED");

      // Convert price to integer if it exists
      if (price) {
        formData.append(
          "price",
          Math.round(parseFloat(price) * 100).toString()
        ); // Convert to cents/piasters
      }

      console.log("Submitting modification data:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      await api.post(
        `/lead/modifications/${modification.id}/return_modification/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      onSuccess();
    } catch (err: any) {
      console.error("Error submitting modification:", err);
      if (err.response?.data) {
        alert(
          `Failed to submit modification: ${JSON.stringify(err.response.data)}`
        );
      } else {
        alert("Failed to submit modification. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700 sticky top-0 bg-white dark:bg-zinc-800 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Submit Modification #{modification.id}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Returned Date: {new Date().toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-xl transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Mockup Image Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mockup Image *
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
              {mockupImagePreview ? (
                <div className="space-y-3">
                  <img
                    src={mockupImagePreview}
                    alt="Mockup preview"
                    className="max-h-64 mx-auto rounded-lg shadow-md"
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
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      Upload your mockup image
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                      PNG, JPG, JPEG up to 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="mockup-upload"
                  />
                  <label
                    htmlFor="mockup-upload"
                    className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors font-medium"
                  >
                    Choose File
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Price Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Price
            </label>
            <div className="max-w-xs">
              <div className="relative">
                <DollarSign
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex space-x-3 p-6 border-t border-gray-200 dark:border-zinc-700 sticky bottom-0 bg-white dark:bg-zinc-800">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all duration-200 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!mockupImage || submitting}
            className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 font-medium"
          >
            {submitting ? "Submitting..." : "Submit Modification"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitModificationOverlay;
