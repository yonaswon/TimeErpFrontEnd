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
  >("all");
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
    { id: "all", label: "All" },
    { id: "your", label: "Yours" },
    { id: "converted", label: "Done" },
    { id: "allLeads", label: "Everyone" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20 relative">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 shadow-sm">
        {/* Navigation Tabs - Horizontal Scroll */}
        <div className="px-4 py-3">
          <nav className="flex space-x-2 overflow-x-auto no-scrollbar scroll-smooth">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-none px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Filter Bar - Animated Expand */}
        {activeTab === "all" && (
          <div className="px-4 pb-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <FilterBar onFilterChange={handleFilterChange} />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="px-3 pt-3">
        {/* <StatisticsCard userId={userId} filters={filters} /> */}

        <LeadList
          activeTab={activeTab}
          filters={filters}
          userId={userId}
          showCreateOverlay = {showCreateOverlay}
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
