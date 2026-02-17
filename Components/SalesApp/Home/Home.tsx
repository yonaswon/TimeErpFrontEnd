"use client";
import { useEffect, useState } from "react";
import StatisticsCard from "./StatisticsCard";
import FilterBar from "./FilterBar";
import LeadList from "./LeadList";
import DetailLead from "./DetailLead/DetailLead";
import CreateLeadOverlay from "./CreateLeadOverlay";

const Home = () => {
  const [activeTab, setActiveTab] = useState<
    "all" | "your" | "converted" | "allLeads"
  >("your");
  const [filters, setFilters] = useState({
    dateRange: "",
    status: "",
  });
  const [userId, setUserId] = useState<number | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [showCreateOverlay, setShowCreateOverlay] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user_data");
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        setUserId(parsedData.id);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleLeadClick = (leadId: number) => {
    setSelectedLeadId(leadId);
  };

  const handleCloseDetail = () => {
    setSelectedLeadId(null);
  };

  const tabs = [
    { id: "your", label: "Yours" },
    { id: "all", label: "Everyone" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-24 relative">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 shadow-sm">
        {/* Navigation Tabs - Horizontal Scroll */}
        <div className="px-4 py-3">
          <nav className="flex items-center justify-center space-x-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                  ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Filter Bar - Animated Expand */}
        {/* Filter Bar - Animated Expand */}
        <div className="px-4 pb-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <FilterBar onFilterChange={handleFilterChange} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-2 pt-2">
        {/* <StatisticsCard userId={userId} filters={filters} /> */}

        <LeadList
          activeTab={activeTab}
          filters={filters}
          userId={userId}
          showCreateOverlay={showCreateOverlay}
          onLeadClick={handleLeadClick}
        />
      </div>

      {/* Floating Action Button (FAB) for Create */}
      <button
        onClick={() => setShowCreateOverlay(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-200 z-20 group"
        aria-label="Create Lead"
      >
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Overlays */}
      {selectedLeadId && (
        <DetailLead leadId={selectedLeadId} onClose={handleCloseDetail} />
      )}

      {showCreateOverlay && (
        <CreateLeadOverlay
          onClose={() => setShowCreateOverlay(false)}
          onSuccess={() => {
            setShowCreateOverlay(false);
            // Refresh logic if needed
          }}
        />
      )}
    </div>
  );
};

export default Home;
