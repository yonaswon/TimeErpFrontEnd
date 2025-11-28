"use client";
import { Image as ImageIcon } from "lucide-react";

interface MessageImage {
  id: number;
  image: string;
  date: string;
}

interface Message {
  id: number;
  message: string;
  image: MessageImage[];
  sender: number;
  date: string;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl p-3 ${
          isOwn
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-bl-none'
        }`}
      >
        {/* Message Text */}
        {message.message && (
          <p className="text-sm whitespace-pre-wrap wrap-break-words mb-2">
            {message.message}
          </p>
        )}

        {/* Message Images */}
        {message.image && message.image.length > 0 && (
          <div className="space-y-2 mb-2">
            {message.image.map((img) => (
              <div key={img.id} className="rounded-lg overflow-hidden border border-gray-300 dark:border-zinc-600">
                <img
                  src={img.image}
                  alt="Message attachment"
                  className="max-w-full max-h-48 object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'} text-right`}>
          {formatTime(message.date)}
        </div>
      </div>
    </div>
  );
}