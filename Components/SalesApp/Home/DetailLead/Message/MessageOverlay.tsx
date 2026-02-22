"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

interface MessageOverlayProps {
  mockupId?: number;
  mockupModificationId?: number;
  leadId: number;
  onClose: () => void;
}


interface UserData {
  id: number;
  first_name: string;
  // Add other user fields as needed
}

export default function MessageOverlay({
  mockupId,
  mockupModificationId,
  leadId,
  onClose,
}: MessageOverlayProps) {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem("user_data");
    if (storedUserData) {
      try {
        setUserData(JSON.parse(storedUserData));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleMessageSent = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-[#0f0f0f] z-[9999] flex flex-col w-full h-full sm:w-[100vw] sm:h-[100vh]">
      {/* Telegram Style Header */}
      <div className="flex items-center justify-between p-3 bg-white dark:bg-[#212121] shadow-sm shrink-0 border-b border-gray-200 dark:border-[#0f0f0f]/50">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Avatar and Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg overflow-hidden shrink-0">
              {leadId.toString().substring(0, 2)}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-[16px] text-gray-900 dark:text-gray-100 leading-tight">
                {mockupModificationId ? 'Mod Chat' : 'Design Chat'}
              </span>
              <span className="text-sm text-blue-500 dark:text-blue-400 leading-tight">
                {mockupModificationId ? `Modification #${mockupModificationId}` : `Mockup #${mockupId}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages List Area (Scrollable) */}
      <div className="flex-1 overflow-hidden relative bg-[#e5ddd5] dark:bg-[#0f0f0f]">
        {/* Telegram-like Background Pattern applied via pseudo-element if needed, or simple color here */}
        <MessageList
          mockupId={mockupId}
          mockupModificationId={mockupModificationId}
          refreshTrigger={refreshTrigger}
          currentUserId={userData?.id}
        />
      </div>

      {/* Message Input Bottom Bar */}
      <div className="shrink-0 p-3 bg-white dark:bg-[#212121] border-t border-gray-200 dark:border-[#0f0f0f]/50">
        <MessageInput
          mockupId={mockupId}
          mockupModificationId={mockupModificationId}
          currentUserId={userData?.id}
          leadId={leadId}
          onMessageSent={handleMessageSent}
        />
      </div>
    </div>
  );
}
