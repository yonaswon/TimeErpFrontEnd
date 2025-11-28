"use client";
import { useEffect, useState, useRef } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import api from "@/api";
import MessageBubble from "./MessageBubble";

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

  // Refresh messages function
  const refreshMessages = () => {
    fetchMessages(undefined, true);
  };

  useEffect(() => {
    fetchMessages();
  }, [mockupId, mockupModificationId]);

  useEffect(() => {
    // Scroll to bottom when new messages are added (except when loading more)
    if (messagesEndRef.current && !loadingMore) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loadingMore]);

  // Listen for message sent event
  useEffect(() => {
    const handleMessageSent = () => {
      console.log("Message sent event received, refreshing...");
      // Small delay to ensure the message is saved on the server
      setTimeout(() => {
        refreshMessages();
      }, 500);
    };

    window.addEventListener("messageSent", handleMessageSent);
    return () => {
      window.removeEventListener("messageSent", handleMessageSent);
    };
  }, []);

  const handleScroll = () => {
    if (!containerRef.current || !nextPage || loadingMore) return;

    const { scrollTop } = containerRef.current;
    if (scrollTop === 0) {
      fetchMessages(nextPage);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading messages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Refresh Button Header */}
      <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {messages.length} message{messages.length !== 1 ? "s" : ""}
          {mockupModificationId && ` for Modification #${mockupModificationId}`}
          {mockupId && !mockupModificationId && ` for Mockup #${mockupId}`}
        </div>
        <button
          onClick={refreshMessages}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Messages Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          </div>
        )}

        {refreshing && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-center h-full">
            <div>
              <div className="text-4xl mb-2">💬</div>
              <p>No messages yet</p>
              <p className="text-sm">
                {mockupModificationId
                  ? `Send a message about Modification #${mockupModificationId}`
                  : `Send a message about Mockup #${mockupId}`}
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender === currentUserId}
            />
          ))
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
