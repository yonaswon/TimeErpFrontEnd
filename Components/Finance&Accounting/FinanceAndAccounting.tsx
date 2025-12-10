"use client";

import { useEffect, useState } from "react";
import { BarChart3, Zap, Package, ShoppingCart } from "lucide-react";
import ActionsContent from "./Actions/Actions";
import { OverviewContent } from "./Overview/OverviewContent";
import OrdersContent from "./Orders/OrdersContent";

type TabType = "overview" | "actions" | "stock" | "orders" | "profile";

const FinanceAndAccounting = ({
  userData,
  selectedRole,
  onRoleSelect,
}: any) => {
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
    { id: "actions" as TabType, label: "Actions", icon: Zap },
    { id: "stock" as TabType, label: "Stock", icon: Package },
    { id: "orders" as TabType, label: "Orders", icon: ShoppingCart },
    { id: "profile" as TabType, label: "Profile", icon: null },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewContent />;
      case "actions":
        return <ActionsContent />;
      case "stock":
        return <StockContent />;
      case "orders":
        return <OrdersContent />;
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
        return <OverviewContent />;
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

          // ✅ Other Tabs
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

export default FinanceAndAccounting;

// ----------------------------
// 🧾 Content Components
// ----------------------------

const StockContent = () => (
  <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
      Stock Management
    </h2>
    <p className="text-gray-600 dark:text-gray-300 text-sm">
      Manage and track your available stock efficiently.
    </p>
  </div>
);

// const OrdersContent = () => (
//   <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
//     <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
//       Orders
//     </h2>
//     <p className="text-gray-600 dark:text-gray-300 text-sm">
//       View and manage your orders here.
//     </p>
//   </div>
// );

const ProfileContent = ({
  user,
  userData,
  selectedRole,
  onRoleSelect,
}: any) => {
  return (
    <div className="flex flex-col items-center justify-center text-center mt-10">
      <div
        onClick={() => {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user_data");

          // Close Telegram Mini App
          if (
            typeof window !== "undefined" &&
            window?.Telegram?.WebApp?.close
          ) {
            window.Telegram.WebApp.close();
          } else {
            // Fallback: reload the page if not in Telegram
            window.location.reload();
          }
        }}
      >
        LOGOUT
      </div>
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
      {/* Roles Section */}
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
    </div>
  );
};
