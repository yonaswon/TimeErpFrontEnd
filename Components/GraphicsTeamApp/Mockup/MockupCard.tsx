import { Mockup, Modification } from "./utils/types";
import { getStatusIcon, getStatusColor } from "./utils/statusUtils";
import ModificationItem from "./ModificationItem";
import { Play, Upload, Image as ImageIcon, MessageSquare } from "lucide-react";
import MessageButton from "@/Components/SalesApp/Home/DetailLead/Message/MessageButton";

interface MockupCardProps {
  mockup: Mockup;
  modifications: Modification[];
  onStartMockup: (mockupId: number) => void;
  onStartModification: (modificationId: number) => void;
  onShowSubmitOverlay: (mockup: Mockup) => void;
  onShowSubmitModificationOverlay: (modification: Modification) => void;
}

const MockupCard = ({
  mockup,
  modifications,
  onStartMockup,
  onStartModification,
  onShowSubmitOverlay,
  onShowSubmitModificationOverlay,
}: MockupCardProps) => {
  return (
    <div className="flex border-l-4 rounded-xl overflow-hidden shadow-sm dark:shadow-none mb-4">
      {/* Colored side stripe for status */}
      <div
        className={`${getStatusColor(mockup.request_status).split(" ")[1]} w-1`}
      />

      {/* Card content */}
      <div className="flex-1 bg-white dark:bg-zinc-900 p-3 flex flex-col gap-2">
        {/* Header: ID + Status + Date */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">
              MC-{mockup.id}
            </span>
            {getStatusIcon(mockup.request_status)}
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(mockup.requested_date).toLocaleDateString()}
          </span>
        </div>

        {/* Lead + counts */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Lead #{mockup.lead}</span>
          <div className="flex items-center gap-2">
            {mockup.note && <MessageSquare size={14} />}
            {mockup.reference_images.length > 0 && <ImageIcon size={14} />}
          </div>
        </div>

        {/* Compact Dimensions */}
        {(mockup.width || mockup.hieght) && (
          <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
            {mockup.width && <span>W:{mockup.width}"</span>}
            {mockup.hieght && <span>H:{mockup.hieght}"</span>}
          </div>
        )}

        {mockup.id && (
          <MessageButton
            mockupId={mockup.id}
            mockupModificationId={undefined}
            leadId={mockup.lead}
          />
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-1">
          {mockup.request_status === "SENT" && (
            <button
              onClick={() => onStartMockup(mockup.id)}
              className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-full"
            >
              <Play size={12} /> Start
            </button>
          )}
          {mockup.request_status === "STARTED" && (
            <button
              onClick={() => onShowSubmitOverlay(mockup)}
              className="flex items-center gap-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-full"
            >
              <Upload size={12} /> Submit
            </button>
          )}
        </div>

        {/* Modifications (compact timeline) */}
        {mockup.request_status === "RETURNED" && modifications.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            {modifications.map((mod, idx) => (
              <ModificationItem
                key={mod.id}
                modification={mod}
                isLast={idx === modifications.length - 1}
                onStartModification={onStartModification}
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
