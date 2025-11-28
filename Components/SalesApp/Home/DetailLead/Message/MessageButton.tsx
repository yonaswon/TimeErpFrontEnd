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
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        Message
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