"use client";
import { useEffect, useState } from "react";
import api from "@/api";

interface Lead {
  id: number;
  name: string;
  status: string;
  customer_name: string;
  customer_phonenumber: string;
  design_type: { id: number; name: string };
  created_at: string;
  converted_at: string | null;
  sales: number;
  note?: string;
  customer_telegram?: string;
}

interface LeadListProps {
  activeTab: string;
  filters: any;
  userId: number | null;
  onLeadClick?: (leadId: number) => void;
}

const LeadList = ({
  activeTab,
  filters,
  userId,
  onLeadClick,
}: LeadListProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    // Reset state when filters or activeTab change
    setLeads([]);
    setNextPage(null);
    setHasMore(false);
    fetchLeads(true);
  }, [activeTab, filters, userId]);

  const fetchLeads = async (reset: boolean = false) => {
    if (!userId && activeTab === "your") {
      setLoading(false);
      return;
    }

    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      let url = "/lead/leads/?ordering=-created_at";
      let params: any = {};

      // Build params based on active tab
      if (activeTab === "your") {
        params.sales = userId?.toString();
      } else if (activeTab === "converted") {
        params.status = "CONVERTED";
      }
      // 'all' and 'allLeads' don't need additional filters

      // Add date filter if selected
      if (filters.dateRange) {
        if (filters.dateRange === "today") {
          params.created_today = "true";
        } else if (filters.dateRange === "yesterday") {
          params.created_yesterday = "true";
        } else if (filters.dateRange === "last_7_days") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          params.created_after = sevenDaysAgo.toISOString().split("T")[0];
        }
      }

      // Add status filter if selected
      if (filters.status) {
        params.status = filters.status;
      }

      // Use next page URL if available for pagination
      if (!reset && nextPage) {
        url = nextPage;
      } else {
        // Build URL with params for initial load
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
          if (params[key]) {
            queryParams.append(key, params[key]);
          }
        });
        if (queryParams.toString()) {
          url += `&${queryParams.toString()}`;
        }
      }

      const response = await api.get(url);
      const leadsData = response.data.results || response.data;
      
      if (reset) {
        setLeads(leadsData);
      } else {
        setLeads(prev => [...prev, ...leadsData]);
      }

      // Handle pagination
      setNextPage(response.data.next);
      setHasMore(!!response.data.next);

    } catch (error: any) {
      console.error("Error fetching leads:", error);
      setError("Failed to load leads. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchLeads(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      NEW: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      WARM: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      COLD: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
      CONVERTED:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      NEW: "New",
      WARM: "Warm",
      COLD: "Cold",
      CONVERTED: "Converted",
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm animate-pulse"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded w-16"></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 dark:text-red-400 mb-2">{error}</div>
        <button
          onClick={() => fetchLeads(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
          No leads found
        </div>
        <div className="text-sm text-gray-400 dark:text-gray-500">
          {activeTab === "your"
            ? "You don't have any leads yet"
            : activeTab === "converted"
            ? "No converted leads found"
            : "No leads match your criteria"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Leads List */}
      <div className="space-y-3">
        {leads.map((lead) => (
          <div
            key={lead.id}
            onClick={() => onLeadClick?.(lead.id)}
            className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-600"
          >
            {/* Header with Customer Name and Status */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {lead.customer_name || lead.name || "Unnamed Lead"}
                </h3>
                {lead.customer_phonenumber && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    📞 {lead.customer_phonenumber}
                  </div>
                )}
                {lead.customer_telegram && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    📱 {lead.customer_telegram}
                  </div>
                )}
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${getStatusColor(
                  lead.status
                )}`}
              >
                {getStatusText(lead.status)}
              </span>
            </div>

            {/* Design Type and Note Preview */}
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              <div className="font-medium">{lead.design_type?.name}</div>
              {lead.note && (
                <div className="mt-1 text-gray-500 dark:text-gray-500 line-clamp-2">
                  {lead.note}
                </div>
              )}
            </div>

            {/* Footer with Dates */}
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-500">
              <div className="flex items-center space-x-4">
                <span>Created: {getRelativeTime(lead.created_at)}</span>
                {lead.converted_at && (
                  <span className="text-green-600 dark:text-green-400">
                    Converted: {getRelativeTime(lead.converted_at)}
                  </span>
                )}
              </div>
              <div className="text-gray-400 dark:text-gray-600">
                ID: {lead.id}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLeadClick?.(lead.id);
                }}
                className="px-3 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                View Details
              </button>
              {lead.status !== "CONVERTED" && (
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1 text-xs bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900/30 transition-colors"
                >
                  Quick Action
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            {loadingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Loading...</span>
              </>
            ) : (
              <span>Load More</span>
            )}
          </button>
        </div>
      )}

      {/* End of results message */}
      {!hasMore && leads.length > 0 && (
        <div className="text-center py-4">
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            You've reached the end of the list
          </div>
          <div className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Showing {leads.length} leads
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadList;