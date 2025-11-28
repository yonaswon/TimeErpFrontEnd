// MaintenanceApp.tsx
import { useState, useEffect } from "react";
import { Wrench, Clock, CheckCircle } from "lucide-react";
import { AssignedMaintenance } from "./AssignedMaintenance";
import { StartedMaintenance } from "./StartedMaintenance";
import { CompletedMaintenance } from "./CompletedMaintenance";

type TabType = "assigned" | "started" | "completed";

export const MaintenanceApp = () => {
  const [activeTab, setActiveTab] = useState<TabType>("assigned");
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // Get user data from localStorage
    const userDataStr = localStorage.getItem("user_data");
    if (userDataStr) {
      try {
        const user = JSON.parse(userDataStr);
        setUserData(user);
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, []);

  const tabs = [
    { id: "assigned" as TabType, label: "Assigned", icon: Clock },
    { id: "started" as TabType, label: "Started", icon: Wrench },
    { id: "completed" as TabType, label: "Completed", icon: CheckCircle },
  ];

  const renderContent = () => {
    if (!userData) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const commonProps = {
      userId: userData.id,
    };

    switch (activeTab) {
      case "assigned":
        return <AssignedMaintenance {...commonProps} />;
      case "started":
        return <StartedMaintenance {...commonProps} />;
      case "completed":
        return <CompletedMaintenance {...commonProps} />;
      default:
        return <AssignedMaintenance {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      {/* Top Navigation - Mobile First */}
      <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 sticky top-0 z-10">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-3 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700"
                }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">{renderContent()}</div>
    </div>
  );
};
