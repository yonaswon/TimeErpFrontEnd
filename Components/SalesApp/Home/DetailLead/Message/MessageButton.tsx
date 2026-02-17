"use client";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import MessageOverlay from "./MessageOverlay";

interface MessageButtonProps {
  mockupId?: number;
  mockupModificationId?: number;
  leadId: number;
}

export default function MessageButton({
  mockupId,
  mockupModificationId,
  leadId
}: MessageButtonProps) {
  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowOverlay(true)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-full transition-colors"
        title="Send Message"
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      {showOverlay && (
        <MessageOverlay
          mockupId={mockupId}
          mockupModificationId={mockupModificationId}
          leadId={leadId}
          onClose={() => setShowOverlay(false)}
        />
      )}
    </>
  );
}