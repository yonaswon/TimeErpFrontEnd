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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Messages
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-gray-500 dark:text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-hidden">
          <MessageList
            mockupId={mockupId}
            mockupModificationId={mockupModificationId}
            currentUserId={userData?.id}
            // refreshTrigger={refreshTrigger} // Add this prop
          />
        </div>

        {/* Message Input */}
        <MessageInput
          mockupId={mockupId}
          mockupModificationId={mockupModificationId}
          currentUserId={userData?.id}
          leadId={leadId}
        //   onMessageSent={handleMessageSent} // Add this prop
        />
      </div>
    </div>
  );
}
