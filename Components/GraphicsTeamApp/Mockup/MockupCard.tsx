import { Mockup, Modification } from "./utils/types";
import { getStatusIcon, getStatusColor } from "./utils/statusUtils";
import ModificationItem from "./ModificationItem";
import { Play, Upload, Image as ImageIcon, MessageSquare, Loader2 } from "lucide-react";
import MessageButton from "@/Components/SalesApp/Home/DetailLead/Message/MessageButton";

interface MockupCardProps {
  mockup: Mockup;
  modifications: Modification[];
  onStartMockup: (mockupId: number) => void;
  onStartModification: (modificationId: number) => void;
  onShowSubmitOverlay: (mockup: Mockup) => void;
  onShowSubmitModificationOverlay: (modification: Modification) => void;
  isStarting?: boolean;
  startingModificationId?: number | null;
}

const MockupCard = ({
  mockup,
  modifications,
  onStartMockup,
  onStartModification,
  onShowSubmitOverlay,
  onShowSubmitModificationOverlay,
  onShowDetail,
  isStarting = false,
  startingModificationId = null,
}: MockupCardProps & { onShowDetail: (mockup: Mockup) => void }) => {
  return (
    // Make the entire card clickable EXCEPT the action buttons
    <div
      onClick={() => onShowDetail(mockup)}
      className="flex border-l-4 rounded-xl overflow-hidden shadow-sm dark:shadow-none mb-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors border-none ring-1 ring-gray-100 dark:ring-zinc-700"
    >
      {/* Colored side stripe for status */}
      <div
        className={`${getStatusColor(mockup.request_status).split(" ")[1]} w-1`}
      />

      {/* Card content */}
      <div className="flex-1 bg-white dark:bg-zinc-900 p-3 flex flex-col gap-2">
        {/* Header: ID + Status + Date */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 tracking-wide uppercase">
                MC-{mockup.id}
              </span>
              {mockup.name && (
                <span className="font-bold text-gray-900 dark:text-white text-base">
                  {mockup.name}
                </span>
              )}
              {getStatusIcon(mockup.request_status)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">{mockup.ordered_by}</span>
              <span>•</span>
              <span>{mockup.lead_name}</span>
            </div>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
            {new Date(mockup.requested_date).toLocaleDateString()}
          </span>
        </div>

        {/* Lead + counts */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded text-[10px]">Lead #{mockup.lead}</span>
          <div className="flex items-center gap-2">
            {mockup.note && <MessageSquare size={14} className="text-gray-400" />}
            {mockup.reference_images.length > 0 && <ImageIcon size={14} className="text-gray-400" />}
          </div>
        </div>

        {/* Compact Dimensions */}
        {(mockup.width || mockup.height) && (
          <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
            {mockup.width && <span>W:{mockup.width}"</span>}
            {mockup.height && <span>H:{mockup.height}"</span>}
          </div>
        )}

        {/* Mockup Image Preview - NEW */}
        {mockup.mockup_image && (
          <div className="mt-2 relative aspect-video w-full rounded-lg overflow-hidden border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800">
            <img
              src={mockup.mockup_image}
              alt={mockup.name || "Mockup Preview"}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Message Button - prevent card click propagation */}
        {mockup.id && (
          <div onClick={(e) => e.stopPropagation()}>
            <MessageButton
              mockupId={mockup.id}
              mockupModificationId={undefined}
              leadId={mockup.lead}
            />
          </div>
        )}

        {/* Action buttons - prevent card click propagation */}
        <div className="flex gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
          {mockup.request_status === "SENT" && (
            <button
              onClick={() => onStartMockup(mockup.id)}
              disabled={isStarting}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-full shadow-sm hover:shadow active:scale-95 transition-all"
            >
              {isStarting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
              {isStarting ? "Starting..." : "Start"}
            </button>
          )}
          {mockup.request_status === "STARTED" && (
            <button
              onClick={() => onShowSubmitOverlay(mockup)}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-full shadow-sm hover:shadow active:scale-95 transition-all"
            >
              <Upload size={12} /> Submit
            </button>
          )}
        </div>

        {/* Modifications (compact timeline) */}
        {mockup.request_status === "RETURNED" && modifications.length > 0 && (
          <div className="mt-3 flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Updates</span>
            {modifications.map((mod, idx) => (
              <ModificationItem
                key={mod.id}
                modification={mod}
                isLast={idx === modifications.length - 1}
                onStartModification={onStartModification}
                isStarting={startingModificationId === mod.id}
                onShowSubmitModificationOverlay={
                  onShowSubmitModificationOverlay
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MockupCard;
