"use client";
import { Check, CheckCheck } from "lucide-react";
import { base_url } from "@/api";

interface MessageImage {
  id: number;
  image: string;
  date: string;
}

interface UserDetail {
  id: number;
  username: string;
  first_name: string;
}

interface Message {
  id: number;
  message: string;
  image: MessageImage[];
  sender: number;
  sender_details?: UserDetail;
  date: string;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getFullImageUrl = (imagePath: string) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    // ensure no double slashes if base_url ends with one
    const cleanBaseUrl = base_url.replace(/\/$/, "");
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${cleanBaseUrl}${cleanPath}`;
  };

  // Telegram light/dark colors
  const ownBg = "bg-[#d9fdd3] dark:bg-[#005c4b]";
  const ownText = "text-[#111b21] dark:text-[#e9edef]";
  const theirBg = "bg-white dark:bg-[#202c33]";
  const theirText = "text-[#111b21] dark:text-[#e9edef]";

  // Get sender name display
  const senderName = message.sender_details?.username
    ? `@${message.sender_details.username}`
    : (message.sender_details?.first_name || `User #${message.sender}`);

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`relative min-w-[60px] max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-1.5 shadow-sm ${isOwn ? `${ownBg} ${ownText} rounded-br-sm` : `${theirBg} ${theirText} rounded-bl-sm`
          }`}
      >
        {/* SVG Tail */}
        {isOwn ? (
          <svg viewBox="0 0 8 13" width="8" height="13" className="absolute -right-2 bottom-0 text-[#d9fdd3] dark:text-[#005c4b] fill-current">
            <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
          </svg>
        ) : (
          <svg viewBox="0 0 8 13" width="8" height="13" className="absolute -left-2 bottom-0 text-white dark:text-[#202c33] fill-current">
            <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" transform="scale(-1, 1) translate(-8, 0)" />
          </svg>
        )}

        {/* Sender Name (Only on incoming group chats) */}
        {!isOwn && (
          <div className="text-xs font-semibold text-blue-500 dark:text-blue-400 mb-0.5">
            {senderName}
          </div>
        )}

        {/* Message Images - Telegram Grid Layout Style */}
        {message.image && message.image.length > 0 && (
          <div className={`grid gap-1 mb-1 mt-1 ${message.image.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} rounded-xl overflow-hidden`}>
            {message.image.map((img) => (
              <img
                key={img.id}
                src={getFullImageUrl(img.image)}
                alt="Attachment"
                className="w-full h-auto max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(getFullImageUrl(img.image), '_blank')}
              />
            ))}
          </div>
        )}

        {/* Message Text & Timestamp Flex */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          {message.message && (
            <span className="text-[15px] leading-5 whitespace-pre-wrap break-words inline-block">
              {message.message}
            </span>
          )}

          {/* Timestamp and Checkmarks */}
          <div className={`flex items-center gap-1 text-[11px] float-right ${isOwn ? 'text-green-700/70 dark:text-white/60' : 'text-gray-500/80 dark:text-white/50'} mt-1 ml-auto select-none`}>
            {formatTime(message.date)}
            {isOwn && (
              <CheckCheck className="w-3.5 h-3.5 text-blue-500 dark:text-[#53bdeb]" /> // Real-time means sent successfully
            )}
          </div>
        </div>
      </div>
    </div>
  );
}