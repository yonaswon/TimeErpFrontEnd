"use client";
import { useEffect, useState } from "react";
import api from "@/api";
import { Plus, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import EachModificationDisplayer from "./EachModificationDisplayer";
import CreateModificationOverlay from "./CreateModificationOverlay";
import MessageButton from "../Message/MessageButton";

// --- INTERFACES ---
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
  hieght: string | null;
  telegram_message_id: number | null;
  started_date: string | null;
  requested_date: string;
  response_date: string | null;
  lead: number;
  mockup: number;
  prev_modification: number | null;
}

interface Mockup {
  id: number;
  reference_images: ImageObj[];
  bom: any[];
  designer: any;
  request_status: string;
  note: string;
  price: number | null;
  price_with_vat: boolean;
  mockup_image: string | null;
  width: string | null;
  hieght: string | null;
  telegram_message_id: number | null;
  requested_date: string;
  first_response_date: string | null;
  date: string;
  lead: number;
}

interface UnifiedTimelineDisplayerProps {
  mockupId: number;
  canCreateModification: boolean;
  leadId: number;
  mockup: Mockup;
}

// --- UTILITY COMPONENTS ---
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
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        map[variant] || map.gray
      }`}
    >
      {children}
    </span>
  );
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case "SENT":
      return "blue";
    case "STARTED":
      return "yellow";
    case "RETURNED":
      return "green";
    case "CONVERTED":
      return "purple";
    default:
      return "gray";
  }
};

// Convert Mockup to Modification-like object
const mockupToTimelineItem = (mockup: Mockup): any => {
  return {
    id: mockup.id,
    reference_images: mockup.reference_images,
    bom: mockup.bom,
    price: mockup.price,
    price_with_vat: mockup.price_with_vat,
    is_edit: false,
    request_status: mockup.request_status,
    mockup_image: mockup.mockup_image,
    note: mockup.note,
    width: mockup.width,
    hieght: mockup.hieght,
    telegram_message_id: mockup.telegram_message_id,
    started_date: mockup.first_response_date,
    requested_date: mockup.requested_date,
    response_date: mockup.date,
    lead: mockup.lead,
    mockup: mockup.id,
    prev_modification: null,
    is_original_mockup: true,
  };
};
// Updated TimelineItem component with corrected logic
const TimelineItem = ({
  item,
  isLast,
  isActive,
  onToggle,
  isOriginalMockup = false,
  shouldShowRequestButton = false,
  onRequestModification = () => {},
}: {
  item: any;
  isLast: boolean;
  isActive: boolean;
  onToggle: () => void;
  isOriginalMockup?: boolean;
  shouldShowRequestButton?: boolean;
  onRequestModification?: () => void;
}) => {
  const requestedDate = new Date(item.requested_date).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  );

  const displayStatus = isOriginalMockup ? "ORIGINAL" : item.request_status;
  const statusVariant = isOriginalMockup
    ? "purple"
    : getStatusVariant(item.request_status);

  // Show request button only for the active item when conditions are met
  const showRequestButton = shouldShowRequestButton && isActive;

  return (
    <div className="relative">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute top-8 left-4 w-0.5 h-full bg-gray-200 dark:bg-zinc-700 transform -translate-y-4"></div>
      )}

      <div className="flex items-start mb-4">
        {/* Timeline Dot/Icon */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white z-10 shrink-0 border-4 border-white dark:border-zinc-800 ${
            isOriginalMockup ? "bg-purple-600" : "bg-blue-600"
          }`}
        >
          <span className="text-xs font-bold">
            {isOriginalMockup ? "M" : "R"}
            {item.id}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 ml-4 -mt-1">
          {/* Header/Toggle Button */}
          <button
            onClick={onToggle}
            className="w-full flex justify-between items-center text-left py-2 px-3 rounded-lg bg-gray-50 dark:bg-zinc-700/50 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors border border-transparent dark:border-zinc-700"
          >
            <div className="flex flex-col">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {isOriginalMockup
                  ? "Original Mockup"
                  : `Modification #${item.id}`}
                <Badge variant={statusVariant}>{displayStatus}</Badge>
                {item.is_edit && !isOriginalMockup && (
                  <span className="ml-2 font-medium text-yellow-600 dark:text-yellow-400 text-xs">
                    (Edit)
                  </span>
                )}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Requested on {requestedDate}
                {isOriginalMockup && (
                  <span className="ml-2 font-medium text-purple-600 dark:text-purple-400">
                    (Base Design)
                  </span>
                )}
              </p>
            </div>
            {isActive ? (
              <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
            )}
          </button>

          {/* Collapsible Body */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isActive ? "max-h-[2000px] opacity-100 pt-3" : "max-h-0 opacity-0"
            }`}
          >
            <div className="pl-3 pr-1 pb-1">
              <EachModificationDisplayer
                modification={item}
                isOriginalMockup={isOriginalMockup}
              />

              {/* Request Modification Button - Only when latest item is returned */}
              {showRequestButton && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-zinc-700">
                  <button
                    onClick={onRequestModification}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Request Modification
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default function UnifiedTimelineDisplayer({
  mockupId,
  leadId,
  mockup,
}: UnifiedTimelineDisplayerProps) {
  const [modifications, setModifications] = useState<Modification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openItemId, setOpenItemId] = useState<number | null>(null);
  const [showCreateOverlay, setShowCreateOverlay] = useState(false);

  useEffect(() => {
    fetchModifications();
  }, [mockupId]);

  const fetchModifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(
        `/lead/modifications/?mockup=${mockupId}&ordering=-requested_date`
      );
      const modificationsData = response.data.results || response.data;
      setModifications(modificationsData);

      // Auto-open the latest item
      if (modificationsData.length > 0) {
        setOpenItemId(modificationsData[0].id); // Latest modification
      } else if (mockup) {
        setOpenItemId(mockup.id); // Original mockup
      } else {
        setOpenItemId(null);
      }
    } catch (error: any) {
      console.error("Error fetching modifications:", error);
      setError("Failed to load timeline");
    } finally {
      setLoading(false);
    }
  };

  const handleModificationCreated = () => {
    setShowCreateOverlay(false);
    fetchModifications();
  };

  const handleToggle = (id: number) => {
    setOpenItemId(openItemId === id ? null : id);
  };

  const getAllTimelineItems = () => {
    const allItems = [];

    // Add modifications first (newest to oldest)
    if (modifications.length > 0) {
      allItems.push(
        ...modifications.map((mod) => ({ ...mod, type: "modification" }))
      );
    }

    // Add original mockup at the end
    if (mockup) {
      allItems.push({ ...mockupToTimelineItem(mockup), type: "mockup" });
    }

    return allItems;
  };

  const timelineItems = getAllTimelineItems();
  const latestItem = timelineItems[0];

  // UPDATED LOGIC: Show request button if:
  // 1. Latest item is the original mockup AND it's returned, OR
  // 2. Latest item is a modification AND it's returned
  const shouldShowRequestButton =
    (latestItem?.type === "mockup" &&
      latestItem.request_status === "RETURNED") ||
    (latestItem?.type === "modification" &&
      latestItem.request_status === "RETURNED");

  // Determine display status
  const displayStatus = latestItem?.request_status || "SENT";
  //   const timelineItems = getAllTimelineItems();
  //   const latestItem = timelineItems[0];

  //   // Determine display status: if latest modification exists and is not returned, show "SENT"
  //   const displayStatus =
  //     latestItem?.type === "modification" &&
  //     latestItem.request_status !== "RETURNED"
  //       ? "SENT"
  //       : latestItem?.request_status || "SENT";

  // Check if latest item is a modification and is returned
  const isLatestModificationReturned =
    latestItem?.type === "modification" &&
    latestItem.request_status === "RETURNED";

  // --- Loading, Error States ---
  if (loading) {
    return (
      <div className="flex items-center justify-center space-x-3 py-6">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-gray-900 dark:text-white">Loading timeline...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <div className="text-red-500 font-medium mb-2">Error</div>
        <div className="text-gray-600 dark:text-gray-300 mb-4">{error}</div>
        <button
          onClick={fetchModifications}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Header - REMOVED the "New Modification" button from here */}

      <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-700 pb-3">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Status:
          </p>
          <Badge variant={getStatusVariant(displayStatus)}>
            {displayStatus}
          </Badge>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ({timelineItems.length} items in timeline)
          </p>
        </div>

        {/* Add Message Button */}
        {/* <MessageButton
          mockupId={mockupId}
          mockupModificationId={
            latestItem?.type === "modification" ? latestItem.id : undefined
          }
          leadId={leadId}
        /> */}
      </div>
      {/* Timeline Content */}
      {timelineItems.map((item, index) => (
        <TimelineItem
          key={`${item.type}-${item.id}`}
          item={item}
          isLast={index === timelineItems.length - 1}
          isActive={openItemId === item.id}
          onToggle={() => handleToggle(item.id)}
          isOriginalMockup={item.type === "mockup"}
          shouldShowRequestButton={index === 0 && shouldShowRequestButton} // Only show on latest item
          onRequestModification={() => setShowCreateOverlay(true)}
        />
      ))}
      {/* Create Modification Overlay */}
      {showCreateOverlay && (
        <CreateModificationOverlay
          mockupId={mockupId}
          leadId={leadId}
          previousModification={
            modifications.length > 0 ? modifications[0].id : null
          }
          onClose={() => setShowCreateOverlay(false)}
          onSuccess={handleModificationCreated}
        />
      )}
    </div>
  );
}
