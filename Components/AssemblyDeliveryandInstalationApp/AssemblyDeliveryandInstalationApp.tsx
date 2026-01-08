"use client";
import { useEffect, useState } from "react";
import { Home, Wrench, Truck, Package, User, Settings } from "lucide-react";
// Import your content components here
import { AssemblyTasksContent } from "./Tasks/AssemblyTasksContent";
import { DeliveryInstallationTeam } from "./DeliveryInstallation/DeliveryInstallationTeam";
// import { StockContent } from './Tasks/StockContent'
import PersonalStockContent from "./StockContent/PersonalStockContent";
import { MaintenanceApp } from "./Maintenance/MaintenanceApp";

type TabType =
  | "overview"
  | "assembly"
  | "delivery-installation"
  | "stock"
  | "maintenance"
  | "profile";

const AssemblyDeliveryandInstalationApp = ({
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
    }
  }, []);

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: Home },
    { id: "assembly" as TabType, label: "Assembly", icon: Wrench },
    {
      id: "delivery-installation" as TabType,
      label: "D&I",
      icon: Truck,
    },
    { id: "stock" as TabType, label: "Stock", icon: Package },
    { id: "maintenance" as TabType, label: "Maintenance", icon: Settings },
    { id: "profile" as TabType, label: "Profile", icon: null },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <AssemblyOverviewContent />;
      case "assembly":
        return <AssemblyTasksContent />;
      case "delivery-installation":
        return <DeliveryInstallationTeam />;
      case "stock":
        return <PersonalStockContent />;
      case "maintenance":
        return <MaintenanceApp />;
      case "profile":
        return (
          <AssemblyProfileContent
            user={user}
            userData={userData}
            selectedRole={selectedRole}
            onRoleSelect={onRoleSelect}
          />
        );
      default:
        return <AssemblyOverviewContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-20 transition-colors duration-300">
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

export default AssemblyDeliveryandInstalationApp;

const AssemblyOverviewContent = () => (
  <div className="space-y-4">
    {/* Assembly & Installation Stats */}
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Today's Operations
      </h2>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            6
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300">
            Assembly Tasks
          </div>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            4
          </div>
          <div className="text-xs text-green-700 dark:text-green-300">
            Deliveries
          </div>
        </div>
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            3
          </div>
          <div className="text-xs text-yellow-700 dark:text-yellow-300">
            Installations
          </div>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            8
          </div>
          <div className="text-xs text-purple-700 dark:text-purple-300">
            In Stock
          </div>
        </div>
      </div>
    </div>

    {/* Team Schedule */}
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Today's Schedule
      </h2>

      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Morning Assembly
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Office Furniture Sets
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-green-600 dark:text-green-400">
              08:00 AM
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              4 items
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Delivery Run #1
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Downtown Area
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              10:30 AM
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              3 stops
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Installation Team
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Commercial Client
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              02:00 PM
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              2 members
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Stock Levels */}
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Stock Overview
      </h2>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">
              Office Chairs
            </span>
            <span className="font-medium text-green-600 dark:text-green-400">
              75%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full"
              style={{ width: "75%" }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            45 units available
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Desks</span>
            <span className="font-medium text-yellow-600 dark:text-yellow-400">
              40%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
            <div
              className="bg-yellow-600 h-2 rounded-full"
              style={{ width: "40%" }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            20 units available
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">
              Storage Cabinets
            </span>
            <span className="font-medium text-red-600 dark:text-red-400">
              15%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full"
              style={{ width: "15%" }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            8 units available - Reorder needed
          </div>
        </div>
      </div>
    </div>

    {/* Quick Actions */}
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <button className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
          <div className="text-sm font-medium">Start Assembly</div>
          <div className="text-xs opacity-75">Begin new task</div>
        </button>
        <button className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
          <div className="text-sm font-medium">Schedule Delivery</div>
          <div className="text-xs opacity-75">Plan route</div>
        </button>
        <button className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
          <div className="text-sm font-medium">Update Stock</div>
          <div className="text-xs opacity-75">Inventory count</div>
        </button>
        <button className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
          <div className="text-sm font-medium">Report Issue</div>
          <div className="text-xs opacity-75">Quality concern</div>
        </button>
      </div>
    </div>
  </div>
);

const MaintenanceContent = () => (
  <div className="space-y-4">
    {/* Maintenance Stats */}
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Maintenance Overview
      </h2>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            3
          </div>
          <div className="text-xs text-orange-700 dark:text-orange-300">
            Pending Requests
          </div>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            1
          </div>
          <div className="text-xs text-red-700 dark:text-red-300">
            Urgent Issues
          </div>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            8
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300">
            Completed This Week
          </div>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            12
          </div>
          <div className="text-xs text-green-700 dark:text-green-300">
            Tools Available
          </div>
        </div>
      </div>
    </div>

    {/* Active Maintenance Tasks */}
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Active Maintenance Tasks
      </h2>

      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Assembly Line #3
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Motor malfunction - URGENT
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-red-600 dark:text-red-400">
              High Priority
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Started: 2h ago
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Delivery Van #2
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Brake inspection
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              Medium Priority
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Scheduled: Today
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Power Tools
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Routine maintenance
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Low Priority
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Due: This week
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Quick Maintenance Actions */}
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <button className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
          <div className="text-sm font-medium">Report Issue</div>
          <div className="text-xs opacity-75">New maintenance</div>
        </button>
        <button className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
          <div className="text-sm font-medium">Tool Checkout</div>
          <div className="text-xs opacity-75">Get equipment</div>
        </button>
        <button className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
          <div className="text-sm font-medium">Schedule PM</div>
          <div className="text-xs opacity-75">Preventive maintenance</div>
        </button>
        <button className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
          <div className="text-sm font-medium">Inventory</div>
          <div className="text-xs opacity-75">Spare parts</div>
        </button>
      </div>
    </div>

    {/* Maintenance Schedule */}
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Upcoming Maintenance
      </h2>

      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Monthly Equipment Check
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              All assembly tools
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Nov 30
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Next week
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Vehicle Service
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Delivery vans rotation
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Dec 5
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              2 weeks
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AssemblyProfileContent = ({
  user,
  userData,
  selectedRole,
  onRoleSelect,
}: any) => {
  return (
    <div className="flex flex-col items-center justify-center text-center mt-10 space-y-6">
      {/* Logout Button */}
      <button
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
        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg cursor-pointer transition-colors"
      >
        LOGOUT
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
          <div className="mt-4 p-4 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 max-w-sm">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Assembly & Installation Specialist
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage assembly tasks, handle deliveries, installations, and stock
              management operations.
            </p>
          </div>
        </>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          Unable to load Telegram user info.
        </p>
      )}

      {/* Performance Stats */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 max-w-sm w-full">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
          This Week's Performance
        </h3>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              18
            </div>
            <div className="text-xs text-green-700 dark:text-green-300">
              Assembled
            </div>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              12
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              Deliveries
            </div>
          </div>
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              8
            </div>
            <div className="text-xs text-yellow-700 dark:text-yellow-300">
              Installations
            </div>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              95%
            </div>
            <div className="text-xs text-purple-700 dark:text-purple-300">
              Satisfaction
            </div>
          </div>
        </div>
      </div>

      {/* Role Selection */}
      <div className="border-t border-gray-100 dark:border-zinc-700 w-full max-w-sm pt-4">
        <div className="px-4 py-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Select Role
          </p>
          {userData?.role && userData.role.length > 0 ? (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {userData.role.map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => onRoleSelect(r.Name)}
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
