"use client";
import StockContent from "./StockContent/StockContent";
import { useEffect, useState } from "react";
import { BarChart3, Package, RefreshCw, User } from "lucide-react";
import TransfersContent from "./TransferContent/TransfersContent";
import { ReleaseManager } from "./TransferContent/ReleaseManager";
import { GlobalProfile } from "../GlobalComponents/GlobalProfile/GlobalProfile";
type TabType = "overview" | "stock" | "transfers" | "profile";

const StockManager = ({ userData, selectedRole, onRoleSelect }: any) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [user, setUser] = useState<any>(null);

  // ✅ Get Telegram user info (Mini App context)
  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      setUser(tg.initDataUnsafe?.user);
      tg.expand();
      // Sync dark mode with Telegram theme
      // document.documentElement.classList.toggle('dark', tg.colorScheme === 'dark')
    }
  }, []);

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: BarChart3 },
    { id: "stock" as TabType, label: "Stock", icon: Package },
    { id: "transfers" as TabType, label: "Transfers", icon: RefreshCw },
    { id: "profile" as TabType, label: "Profile", icon: null },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <StockOverviewContent />;
      case "stock":
        return <StockContent />;
      case "transfers":
        return (
          <>
            <TransfersContent />
            <ReleaseManager />
          </>
        );
      case "profile":
        return (
          <GlobalProfile
            user={user}
            userData={userData}
            selectedRole={selectedRole}
            onRoleSelect={onRoleSelect}
          />
        );
      default:
        return <StockOverviewContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 transition-colors duration-300">
      {/* Main Content */}
      <div className="flex-1 p-3">{renderContent()}</div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 flex justify-around py-2 z-20">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          // ✅ Profile Tab with User Image
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
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${isActive
                    ? "border-blue-500 scale-110"
                    : "border-transparent"
                    }`}
                />
                <span
                  className={`text-xs ${isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                    }`}
                >
                  Profile
                </span>
              </button>
            );
          }

          // ✅ Other Tabs
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive
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

export default StockManager;

// ----------------------------
// 🧾 Content Components
// ----------------------------

const StockOverviewContent = () => (
  <div className="space-y-4">
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Stock Overview
      </h2>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            156
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            Total Items
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            23
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">
            Low Stock
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 dark:text-white">
          Recent Activity
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-zinc-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              White LED added
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              2 hours ago
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-zinc-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              8mm Acrylic updated
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              5 hours ago
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Removed local ProfileContent in favor of GlobalProfile
