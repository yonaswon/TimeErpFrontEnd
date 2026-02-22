"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import api from "@/api";
import MessageBubble from "./MessageBubble";
import { useChatSocket } from "./useChatSocket";

interface Message {
  id: number;
  message: string;
  image: Array<{
    id: number;
    image: string;
    date: string;
  }>;
  mockup: number | null;
  mockup_modification: number | null;
  sender: number;
  date: string;
}

interface MessageListProps {
  mockupId?: number;
  mockupModificationId?: number;
  currentUserId?: number;
}

export default function MessageList({
  mockupId,
  mockupModificationId,
  currentUserId,
}: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (url?: string, isRefresh: boolean = false) => {
    try {
      if (url) {
        setLoadingMore(true);
      } else if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      let apiUrl = url;
      if (!apiUrl) {
        // Build the correct API URL based on what we have
        if (mockupModificationId) {
          apiUrl = `/lead/messages/?mockup_modification=${mockupModificationId}&ordering=-date`;
          console.log(
            "Fetching messages for modification:",
            mockupModificationId
          );
        } else if (mockupId) {
          apiUrl = `/lead/messages/?mockup=${mockupId}&ordering=-date`;
          console.log("Fetching messages for mockup:", mockupId);
        } else {
          console.error("No mockupId or mockupModificationId provided");
          return;
        }
      }

      const response = await api.get(apiUrl);
      const newMessages = response.data.results || response.data;

      if (url) {
        // Loading more - prepend to existing messages
        setMessages((prev) => [...newMessages.reverse(), ...prev]);
      } else {
        // Initial load or refresh - replace all messages
        setMessages(newMessages.reverse());
      }

      setNextPage(response.data.next);

      console.log(
        `Loaded ${newMessages.length} messages for:`,
        mockupModificationId
          ? `modification ${mockupModificationId}`
          : `mockup ${mockupId}`
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Refresh messages function (now mostly internal fallback)
  const refreshMessages = useCallback(() => {
    fetchMessages(undefined, true);
  }, [mockupId, mockupModificationId]); // Added dependencies

  useEffect(() => {
    fetchMessages();
  }, [mockupId, mockupModificationId]);

  // Handle incoming WebSocket messages
  const handleNewMessage = useCallback((newMessage: Message) => {
    console.log("WebSocket message received:", newMessage);
    setMessages((prev) => {
      // Prevent duplicates
      if (prev.some(m => m.id === newMessage.id)) return prev;
      return [...prev, newMessage];
    });
  }, []);

  // Connect to Django Channels WebSocket
  const { isConnected } = useChatSocket({
    mockupId,
    mockupModificationId,
    onMessageReceived: handleNewMessage
  });

  useEffect(() => {
    // Scroll to bottom when new messages are added (except when loading more)
    if (messagesEndRef.current && !loadingMore) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loadingMore]);

  // Listen for message sent event (keep as fallback for image uploads)
  useEffect(() => {
    const handleMessageSent = () => {
      // We rely primarily on WebSocket now, but this is a good fallback
    };
    window.addEventListener("messageSent", handleMessageSent);
    return () => {
      window.removeEventListener("messageSent", handleMessageSent);
    };
  }, []);

  const handleScroll = () => {
    if (!containerRef.current || !nextPage || loadingMore) return;

    const { scrollTop } = containerRef.current;
    // Load more when scrolling near the top
    if (scrollTop < 50) {
      fetchMessages(nextPage);
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric'
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#e5ddd5] dark:bg-[#0f0f0f]">
        <div className="px-4 py-2 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full text-gray-600 dark:text-gray-300 text-sm flex items-center gap-2 shadow-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading chat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative z-10 w-full max-w-3xl mx-auto">
      {/* Messages Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
      >
        {loadingMore && (
          <div className="flex justify-center py-2">
            <div className="px-3 py-1 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            </div>
          </div>
        )}

        {!isConnected && !loading && (
          <div className="flex justify-center mb-4">
            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 text-xs rounded-full backdrop-blur-sm shadow-sm inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              Reconnecting...
            </span>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm px-6 py-8 rounded-2xl text-center shadow-sm">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-gray-900 dark:text-white font-medium mb-1">No messages here yet...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Send a message or tap the greeting below.
              </p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="space-y-4">
              {/* Telegram Date Divider */}
              <div className="flex justify-center sticky top-2 z-10">
                <span className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-[#212121]/80 backdrop-blur-md rounded-full shadow-sm">
                  {date}
                </span>
              </div>

              {/* Date Messages */}
              <div className="space-y-1.5">
                {dateMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.sender === currentUserId}
                  />
                ))}
              </div>
            </div>
          ))
        )}

        <div ref={messagesEndRef} className="h-2" />
      </div>
    </div>
  );
}
