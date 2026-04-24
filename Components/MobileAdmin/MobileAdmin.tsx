"use client";

import { useEffect, useState } from "react";
import { Wallet, Package, Home, Bot, BarChart2 } from "lucide-react";
import FinanceContent from "./Finace/FinanceContent";
import StockContent from "./Stock/StockContent";
import MobileAnalyticsContent from "./MobileAnalyticsContent";
import MobileHomeContent from "./MobileHomeContent";
import AiChat from "@/Components/AdminDashBoard/Ai/AiChat";
import { GlobalProfile } from "../GlobalComponents/GlobalProfile/GlobalProfile";

type TabType = "home" | "finance" | "stock" | "ai" | "profile";

const AdminMobile = ({ userData, selectedRole, onRoleSelect }: any) => {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [showFullDashboard, setShowFullDashboard] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      setUser(tg.initDataUnsafe?.user);
      tg.expand();
    }
  }, []);

  const tabs = [
    { id: "home" as TabType, label: "Home", icon: Home },
    { id: "finance" as TabType, label: "Finance", icon: Wallet },
    { id: "stock" as TabType, label: "Stock", icon: Package },
    { id: "ai" as TabType, label: "AI", icon: Bot },
    { id: "profile" as TabType, label: "Profile", icon: null },
  ];

  const renderContent = () => {
    if (showFullDashboard) {
      return (
        <div>
          <button
            onClick={() => setShowFullDashboard(false)}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 px-4 pt-3 pb-1"
          >
            ← Back to Home
          </button>
          <MobileAnalyticsContent />
        </div>
      );
    }
    switch (activeTab) {
      case "home":
        return <MobileHomeContent onShowFullDashboard={() => setShowFullDashboard(true)} />;
      case "finance":
        return <FinanceContent />;
      case "stock":
        return <StockContent />;
      case "ai":
        return <AiChat onClose={() => setActiveTab("home")} />;
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
        return <MobileHomeContent onShowFullDashboard={() => setShowFullDashboard(true)} />;
    }
  };

  // Reset full dashboard when switching tabs
  const handleTabChange = (id: TabType) => {
    setShowFullDashboard(false);
    setActiveTab(id);
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col transition-colors duration-300 ${activeTab === "ai" ? "overflow-hidden h-screen pb-0" : "pb-16"}`}>
      <div className={`flex-1 ${activeTab === "ai" ? "p-0 h-full" : ""}`}>{renderContent()}</div>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 flex justify-around py-2 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:shadow-none ${activeTab === "ai" ? "hidden" : ""}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id && !showFullDashboard;
          const Icon = tab.icon;

          if (tab.id === "profile") {
            const imageUrl = user?.username
              ? `https://t.me/i/userpic/160/${user.username}.jpg`
              : "https://telegram.org/img/t_logo.png";
            return (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                className="flex flex-col items-center justify-center flex-1 py-1 transition-transform active:scale-95">
                <img src={imageUrl} alt="Profile"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://telegram.org/img/t_logo.png"; }}
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${isActive ? "border-blue-500 scale-110 shadow-sm shadow-blue-500/30" : "border-transparent opacity-70"}`}
                />
                <span className={`text-[11px] mt-1 font-medium transition-colors ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}>
                  Profile
                </span>
              </button>
            );
          }

          return (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 active:scale-95 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}>
              <div className={`relative transition-transform duration-300 ${isActive ? "scale-110" : ""}`}>
                {Icon && <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />}
              </div>
              <span className={`text-[11px] mt-1 font-medium ${isActive ? "opacity-100" : "opacity-80"}`}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminMobile;
