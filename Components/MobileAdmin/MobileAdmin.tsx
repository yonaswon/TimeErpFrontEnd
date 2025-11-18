"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  Package,
  Wrench,
  UserCircle2,
  MessageCircle,
  Bot,
} from "lucide-react";
import FinanceContent from "./Finace/FinanceContent";
import StockContent from "./Stock/StockContent";

type TabType = "finance" | "stock" | "workshop" | "profile" | "ai";

const AdminMobile = ({ userData, selectedRole, onRoleSelect }: any) => {
  const [activeTab, setActiveTab] = useState<TabType>("finance");
  const [user, setUser] = useState<any>(null);

  // ✅ Telegram Mini App setup
  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      setUser(tg.initDataUnsafe?.user);
      tg.expand();
    }
  }, []);

  const tabs = [
    { id: "finance" as TabType, label: "Finance", icon: Wallet },
    { id: "stock" as TabType, label: "Stock", icon: Package },
    { id: "workshop" as TabType, label: "Workshop", icon: Wrench },
    { id: "ai" as TabType, label: "AI", icon: Bot },
    { id: "profile" as TabType, label: "Profile", icon: null },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "finance":
        return <FinanceContent />;
      case "stock":
        return <StockContent />;
      case "workshop":
        return <WorkshopContent />;
      case "ai":
        return <AIChatContent />;
      case "profile":
        return (
          <ProfileContent
            user={user}
            userData={userData}
            selectedRole={selectedRole}
            onRoleSelect={onRoleSelect}
          />
        );
      default:
        return <FinanceContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 transition-colors duration-300">
      <div className="flex-1 p-3">{renderContent()}</div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 flex justify-around py-2 z-20">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          if (tab.id === "profile") {
            const imageUrl = user?.username
              ? `https://t.me/i/userpic/160/${user.username}.jpg`
              : "https://telegram.org/img/t_logo.png";

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center flex-1 py-1"
              >
                <img
                  src={imageUrl}
                  alt="Profile"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://telegram.org/img/t_logo.png";
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                    isActive
                      ? "border-blue-500 scale-110"
                      : "border-transparent"
                  }`}
                />
                <span
                  className={`text-xs ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  Profile
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 ${
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {Icon && <Icon size={20} />}
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminMobile;

// ---------------------------
// 📊 Tab Content Components
// ---------------------------

const ScrollableMenu = ({ items }: { items: string[] }) => (
  <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
    {items.map((item) => (
      <button
        key={item}
        className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 rounded-full text-sm font-medium whitespace-nowrap hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
      >
        {item}
      </button>
    ))}
  </div>
);

import { OrderContainersList } from "../OrderContainer/OrderContainersList";

const WorkshopContent = () => (
  <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
    <ScrollableMenu items={["Active Jobs", "Pending Jobs"]} />
    <OrderContainersList />
  </div>
);

import { AdminUserManager } from "../Admin/AdminUserManager/AdminUserManager";
import { useTheme } from "next-themes";

const ProfileContent = ({
  user,
  onRoleSelect,
  userData,
  selectedRole,
}: any) => {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex flex-col items-center justify-center text-center mt-10">
      <div
        onClick={() => {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user_data");

          if (
            typeof window !== "undefined" &&
            window?.Telegram?.WebApp?.close
          ) {
            window.Telegram.WebApp.close();
          } else {
            window.location.reload();
          }
        }}
        className="mb-4 text-sm text-red-500 font-medium cursor-pointer hover:underline"
      >
        LOGOUT
      </div>
      <button
        onClick={() => {
          setTheme(theme === "light" ? "dark" : "light");
        }}
        className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between"
      >
        <span>Toggle Theme</span>
        <span className="text-sm bg-gray-200 dark:bg-zinc-600 px-2 py-1 rounded">
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </span>
      </button>

      {user ? (
        <>
          <img
            src={`https://t.me/i/userpic/320/${user.username}.jpg`}
            alt="Profile"
            className="w-24 h-24 rounded-full border-2 border-blue-500 mb-3"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://telegram.org/img/t_logo.png";
            }}
          />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user.first_name} {user.last_name || ""}
          </h2>
          {user.username && (
            <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
          )}
        </>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          Unable to load Telegram user info.
        </p>
      )}
      <div className="border-t border-gray-100 dark:border-zinc-700">
        <div className="px-4 py-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Select Role
          </p>
          {userData?.role && userData.role.length > 0 ? (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {userData.role.map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => {
                    onRoleSelect(r.Name);
                  }}
                  className={`w-full text-left flex items-center space-x-2 text-sm px-2 py-1 rounded transition-colors ${
                    selectedRole === r.Name
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      selectedRole === r.Name ? "bg-green-500" : "bg-gray-400"
                    }`}
                  ></div>
                  <span>{r.Name}</span>
                  {selectedRole === r.Name && (
                    <span className="text-xs">⭐</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No roles assigned
            </p>
          )}
        </div>
      </div>
      <AdminUserManager />
    </div>
  );
};

// ---------------------------
// 🤖 AI Chat Content Component
// ---------------------------

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

const AIChatContent = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI assistant. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Simulate API call with error
    setTimeout(() => {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "❌ API key disabled. Cannot access vector database. Please check your configuration and try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    }, 2000);
  };

  const chatHistory = [
    { id: "1", title: "Order status inquiry", date: "2024-01-15" },
    { id: "2", title: "Stock level check", date: "2024-01-14" },
    { id: "3", title: "Payment confirmation", date: "2024-01-13" },
    { id: "4", title: "Delivery schedule", date: "2024-01-12" },
  ];

  return (
    <div className="h-full flex bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
      {/* Sidebar - Chat History */}
      {sidebarOpen && (
        <div className="w-64 bg-gray-50 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Chat History
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className="p-3 border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-white text-sm">
                  {chat.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {chat.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                AI Assistant
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Powered by AI • {isLoading ? "Thinking..." : "Online"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isLoading ? "bg-yellow-500" : "bg-green-500"
              }`}
            ></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isLoading ? "Processing..." : "Available"}
            </span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-100 dark:bg-zinc-700 text-gray-900 dark:text-white rounded-bl-none"
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div
                  className={`text-xs mt-2 ${
                    message.role === "user"
                      ? "text-blue-100"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-zinc-700 text-gray-900 dark:text-white rounded-2xl rounded-bl-none p-4 max-w-[80%]">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-zinc-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <SendIcon />
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            AI assistant may produce inaccurate information about orders and
            stock
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Send Icon component
const SendIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
    />
  </svg>
);
