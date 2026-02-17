"use client";
import { useState, useEffect } from "react";
import api from "@/api";
import MessageButton from "../Message/MessageButton";
import {
  Image as ImageIcon,
  User,
  DollarSign,
  Ruler,
  Package,
  Calendar,
  Clock,
  FileText,
  Layers,
  Edit2, // Added
  Check, // Added
  X,     // Added
  Loader2 // Added
} from "lucide-react";

interface ImageObj {
  id: number;
  image: string;
  date: string;
}

interface BomItem {
  id: number;
  material: {
    id: number;
    name: string;
    type: string;
    code_name: string;
    available: string;
    parsialy_available: string;
    min_threshold: number;
    width: number | null;
    height: number | null;
    date: string;
    stats: any;
  };
  amount: string | null;
  width: string | null;
  height: string | null;
  price_per_unit: string | null;
  total_price: string | null;
  estimated_price: string | null;
  date: string;
}

interface Modification {
  id: number;
  reference_images: ImageObj[];
  bom: BomItem[];
  price: number | null;
  price_with_vat: boolean;
  is_edit: boolean;
  request_status: string;
  mockup_image: string | null;
  note: string | null;
  width: string | null;
  height: string | null;
  telegram_message_id: number | null;
  started_date: string | null;
  requested_date: string;
  response_date: string | null;
  lead: number;
  mockup: number;
  prev_modification: number | null;
  is_original_mockup?: boolean;
}

interface EachModificationDisplayerProps {
  modification: Modification;
  isOriginalMockup?: boolean;
}

const Badge = ({
  children,
  variant = "gray",
}: {
  children: React.ReactNode;
  variant?: string;
}) => {
  const map: Record<string, string> = {
    gray: "bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-200",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    green:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    yellow:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    purple:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${map[variant] || map.gray
        }`}
    >
      {children}
    </span>
  );
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function EachModificationDisplayer({
  modification,
  isOriginalMockup = false,
}: EachModificationDisplayerProps) {
  const isReturned = modification.request_status === "RETURNED";
  const isStarted = modification.request_status === "STARTED";
  const isSent = modification.request_status === "SENT";

  // --- Price Editing State ---
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState<string>(modification.price ? String(modification.price) : "");
  const [vatInput, setVatInput] = useState<boolean>(modification.price_with_vat || false);
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [currentModification, setCurrentModification] = useState(modification); // Local state for optimistic/immediate updates

  // Sync local state if prop updates (e.g. from parent refresh)
  useEffect(() => {
    setCurrentModification(modification);
    setPriceInput(modification.price ? String(modification.price) : "");
    setVatInput(modification.price_with_vat || false);
  }, [modification]);

  const handleSavePrice = async () => {
    if (!priceInput) return; // Basic validation

    try {
      setIsSavingPrice(true);
      const endpoint = isOriginalMockup
        ? `/lead/mockups/${currentModification.id}/`
        : `/lead/modifications/${currentModification.id}/`;

      const payload = {
        price: parseFloat(priceInput),
        price_with_vat: vatInput,
      };

      const response = await api.patch(endpoint, payload);

      // Update local state with response data
      setCurrentModification({
        ...currentModification,
        price: response.data.price,
        price_with_vat: response.data.price_with_vat
      });

      setIsEditingPrice(false);
    } catch (error) {
      console.error("Failed to save price:", error);
      // Optional: Add error toast/notification here
      alert("Failed to save price. Please try again.");
    } finally {
      setIsSavingPrice(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingPrice(false);
    // Reset inputs to current known values
    setPriceInput(currentModification.price ? String(currentModification.price) : "");
    setVatInput(currentModification.price_with_vat || false);
  };

  return (
    <div className="space-y-3 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-2">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${isOriginalMockup
              ? "bg-linear-to-br from-purple-500 to-pink-600"
              : "bg-linear-to-br from-blue-500 to-cyan-600"
              }`}
          >
            {isOriginalMockup ? "M" : "R"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {isOriginalMockup ? "Original Mockup" : `Modification`}
              </span>
              <Badge variant={isOriginalMockup ? "purple" : "blue"}>
                {isOriginalMockup ? "ORIGINAL" : currentModification.request_status}
              </Badge>
              {currentModification.is_edit && !isOriginalMockup && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                  (Edit)
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" />
              {formatDate(currentModification.requested_date)}
            </div>
          </div>
        </div>

        {/* Add Message Button for each modification/mockup */}
        <MessageButton
          mockupId={isOriginalMockup ? currentModification.id : undefined}
          mockupModificationId={!isOriginalMockup ? currentModification.id : undefined}
          leadId={currentModification.lead}
        />
      </div>

      {/* Mockup Image at the top for RETURNED status */}
      {isReturned && currentModification.mockup_image && (
        <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
          <div className="p-2 bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-green-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {isOriginalMockup ? "Final Mockup" : "Modified Mockup"}
              </span>
            </div>
          </div>
          <div className="p-2">
            <img
              src={currentModification.mockup_image}
              alt={isOriginalMockup ? `Original Mockup` : `Modification`}
              className="w-full rounded max-h-48 object-contain"
            />
          </div>
        </div>
      )}

      {/* Status message for SENT/STARTED */}
      {(isSent || isStarted) && (
        <div className="text-center py-4">
          <div className="text-3xl mb-2">{isSent ? "📤" : "🔄"}</div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            {isSent ? "Request Sent" : "In Progress"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isSent
              ? "Waiting for designer to start working on this request"
              : "Designer is currently working on this request"}
          </p>
        </div>
      )}

      {/* Information displayed line by line */}
      <div className="space-y-2 text-sm">
        {/* Basic Information */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-zinc-700">
            <span className="font-medium text-gray-600 dark:text-gray-400">
              ID:
            </span>
            <span className="text-gray-900 dark:text-white">
              #{currentModification.id}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-zinc-700">
            <span className="font-medium text-gray-600 dark:text-gray-400">
              Status:
            </span>
            <span className="text-gray-900 dark:text-white">
              {currentModification.request_status}
            </span>
          </div>

          {/* Price Section with Edit/Add Logic */}
          <div className="py-1 border-b border-gray-100 dark:border-zinc-700">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                Price:
              </span>
              {!isEditingPrice && (
                <button
                  onClick={() => setIsEditingPrice(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                >
                  {currentModification.price ? <Edit2 className="w-3 h-3" /> : "Add Price"}
                  {currentModification.price ? "Edit" : ""}
                </button>
              )}
            </div>

            {isEditingPrice ? (
              <div className="flex items-center gap-2 mt-1 bg-gray-50 dark:bg-zinc-900 p-2 rounded-lg">
                <div className="flex-1">
                  <input
                    type="number"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder="Amount"
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                  />
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vatInput}
                      onChange={(e) => setVatInput(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Inc. VAT</span>
                  </label>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={handleSavePrice}
                    disabled={isSavingPrice}
                    className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded shadow-sm disabled:opacity-50"
                  >
                    {isSavingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSavingPrice}
                    className="p-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              currentModification.price ? (
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-gray-900 dark:text-white font-medium">
                    {currentModification.price} Birr
                  </span>
                  {currentModification.price_with_vat && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      VAT Inc.
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-right text-sm text-gray-400 italic">
                  No price set
                </div>
              )
            )}
          </div>

          {(currentModification.width || currentModification.height) && (
            <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-zinc-700">
              <span className="font-medium text-gray-600 dark:text-gray-400">
                Size:
              </span>
              <span className="text-gray-900 dark:text-white">
                {currentModification.width ? currentModification.width : "_"} ×{" "}
                {currentModification.height ? currentModification.height : "_"}
              </span>
            </div>
          )}

          {currentModification.prev_modification && (
            <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-zinc-700">
              <span className="font-medium text-gray-600 dark:text-gray-400">
                Based on:
              </span>
              <span className="text-blue-600 dark:text-blue-400">
                Mod #{currentModification.prev_modification}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-zinc-700">
            <span className="font-medium text-gray-600 dark:text-gray-400">
              Requested:
            </span>
            <span className="text-gray-900 dark:text-white">
              {formatDate(currentModification.requested_date)}
            </span>
          </div>

          {currentModification.started_date && (
            <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-zinc-700">
              <span className="font-medium text-gray-600 dark:text-gray-400">
                Started:
              </span>
              <span className="text-gray-900 dark:text-white">
                {formatDate(currentModification.started_date)}
              </span>
            </div>
          )}

          {currentModification.response_date && (
            <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-zinc-700">
              <span className="font-medium text-gray-600 dark:text-gray-400">
                Responded:
              </span>
              <span className="text-gray-900 dark:text-white">
                {formatDate(currentModification.response_date)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Notes - Always show if exists */}
      {currentModification.note && (
        <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700">
          <div className="p-2 bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-green-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {isOriginalMockup ? "Original Notes" : "Modification Notes"}
              </span>
            </div>
          </div>
          <div className="p-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {currentModification.note}
            </p>
          </div>
        </div>
      )}

      {/* Reference Images - Always show if exists */}
      {currentModification.reference_images.length > 0 && (
        <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700">
          <div className="p-2 bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {isOriginalMockup
                  ? "Reference Images"
                  : "Modification References"}
              </span>
              <Badge variant="blue">
                {currentModification.reference_images.length}
              </Badge>
            </div>
          </div>
          <div className="p-2">
            <div className="grid grid-cols-3 gap-1">
              {currentModification.reference_images.map((image) => (
                <div
                  key={image.id}
                  className="aspect-square bg-gray-200 dark:bg-zinc-800 rounded overflow-hidden border border-gray-300 dark:border-zinc-700"
                >
                  <img
                    src={image.image}
                    alt={`Reference ${image.id}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
