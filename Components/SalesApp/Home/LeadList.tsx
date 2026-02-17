"use client";
import { useEffect, useState } from "react";
import api from "@/api";
import { Loader2, Check, X, Flame, Snowflake } from "lucide-react";

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
  showCreateOverlay: any;
}

const LeadList = ({
  activeTab,
  filters,
  userId,
  onLeadClick,
  showCreateOverlay,
}: LeadListProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);

  const [hasMore, setHasMore] = useState(false);
  const [updatingLeadId, setUpdatingLeadId] = useState<number | null>(null);

  const handleStatusChange = async (
    e: React.MouseEvent,
    leadId: number,
    newStatus: string
  ) => {
    e.stopPropagation();
    if (updatingLeadId) return;

    try {
      setUpdatingLeadId(leadId);
      // Optimistic update
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );

      await api.patch(`/lead/leads/${leadId}/`, { status: newStatus });
    } catch (error) {
      console.error("Failed to update status:", error);
      // Revert on failure
      fetchLeads(true);
    } finally {
      setUpdatingLeadId(null);
    }
  };

  useEffect(() => {
    setLeads([]);
    setNextPage(null);
    setHasMore(false);
    fetchLeads(true);
  }, [activeTab, filters, userId, showCreateOverlay]);

  // useEffect(() => {
  //   if (!showCreateOverlay) {
  //     if (leads){
  //       setLeads([])
  //     }
  //     fetchLeads();
  //   }
  // }, [showCreateOverlay]);

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

      if (activeTab === "your") {
        params.sales = userId?.toString();
      } else if (activeTab === "converted") {
        params.status = "CONVERTED";
      }

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

      if (filters.status) {
        params.status = filters.status;
      }

      if (!reset && nextPage) {
        url = nextPage;

        // 🔍 FIX: Extract relative path if URL is absolute
        if (url.startsWith("http")) {
          try {
            const urlObj = new URL(url);
            url = urlObj.pathname + urlObj.search;
          } catch (e) {
            console.error("Failed to parse pagination URL:", e);
          }
        }
      } else {
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach((key) => {
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
        setLeads((prev) => [...prev, ...leadsData]);
      }

      setNextPage(response.data.next);
      setHasMore(!!response.data.next);
    } catch (error: any) {
      console.error("Error fetching leads:", error);
      setError("Failed to load leads.");
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
      NEW: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-800",
      WARM: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200 border-orange-200 dark:border-orange-800",
      COLD: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
      CONVERTED:
        "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const timeString = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (diffDays === 0 && date.getDate() === now.getDate()) {
      return `Today, ${timeString}`;
    }
    if (diffDays === 1 || (diffDays === 0 && date.getDate() !== now.getDate())) {
      return `Yesterday, ${timeString}`;
    }
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Skeleton Loader Component
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800 animate-pulse"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-zinc-800 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-1/4"></div>
            </div>
          </div>
          <div className="h-10 bg-gray-100 dark:bg-zinc-800 rounded-lg w-full"></div>
        </div>
      ))}
    </div>
  );

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-500">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p className="text-gray-900 dark:text-white font-medium mb-1">
          Something went wrong
        </p>
        <button
          onClick={() => fetchLeads(true)}
          className="text-blue-500 hover:text-blue-600 text-sm font-medium px-4 py-2"
        >
          Tap to retry
        </button>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center opacity-60">
        <svg
          className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">No leads found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="space-y-3">
        {leads.map((lead) => (
          <div
            key={lead.id}
            onClick={() => onLeadClick?.(lead.id)}
            className="group relative bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700/60 hover:shadow-md transition-all duration-200"
          >
            {/* Top Row: Avatar + Name + Status */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 overflow-hidden">
                {/* Avatar Placeholder */}
                <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold text-lg shadow-inner">
                  {(lead.customer_name || lead.name || "?")[0].toUpperCase()}
                </div>

                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-[15px] leading-tight">
                    {lead.customer_name || lead.name || "Unnamed Lead"}
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span className="font-medium">{lead.design_type?.name}</span>
                    <span className="w-0.5 h-0.5 bg-gray-300 dark:bg-slate-600 rounded-full"></span>
                    <span>{getRelativeTime(lead.created_at)}</span>
                  </div>
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(
                  lead.status
                )}`}
              >
                {lead.status}
              </span>
            </div>

            {/* Note Preview */}
            {lead.note && (
              <div className="mb-3 px-3 py-2 bg-gray-50 dark:bg-slate-900/50 rounded-lg text-xs text-gray-600 dark:text-slate-400 line-clamp-2 italic border border-gray-100 dark:border-slate-800">
                "{lead.note}"
              </div>
            )}

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100 dark:border-slate-700/50">
              <div className="flex gap-1.5">
                {lead.customer_phonenumber && (
                  <a
                    href={`tel:${lead.customer_phonenumber}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700/50 text-slate-500 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </a>
                )}
                {lead.customer_telegram && (
                  <a
                    href={`https://t.me/${lead.customer_telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/10 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.293-.605.293l.215-3.054 5.56-5.022c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.654-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                    </svg>
                  </a>
                )}
              </div>

              {/* Action Buttons (Professional Outline Style) */}
              <div className="flex gap-2">
                {lead.status === "NEW" && (
                  <>
                    <button
                      onClick={(e) => handleStatusChange(e, lead.id, "WARM")}
                      disabled={updatingLeadId === lead.id}
                      className="px-3 py-1 rounded-md border border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-medium tracking-wide hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors flex items-center gap-1.5"
                    >
                      {updatingLeadId === lead.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Flame className="w-3 h-3" />
                      )}
                      WARM
                    </button>
                    <button
                      onClick={(e) => handleStatusChange(e, lead.id, "COLD")}
                      disabled={updatingLeadId === lead.id}
                      className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px] font-medium tracking-wide hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                    >
                      {updatingLeadId === lead.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Snowflake className="w-3 h-3" />
                      )}
                      COLD
                    </button>
                  </>
                )}

                {lead.status === "WARM" && (
                  <>
                    <button
                      onClick={(e) => handleStatusChange(e, lead.id, "COLD")}
                      disabled={updatingLeadId === lead.id}
                      className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px] font-medium tracking-wide hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                    >
                      {updatingLeadId === lead.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Snowflake className="w-3 h-3" />
                      )}
                      MARK COLD
                    </button>
                  </>
                )}

                {lead.status === "COLD" && (
                  <button
                    onClick={(e) => handleStatusChange(e, lead.id, "WARM")}
                    disabled={updatingLeadId === lead.id}
                    className="px-3 py-1 rounded-md border border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-medium tracking-wide hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors flex items-center gap-1.5"
                  >
                    {updatingLeadId === lead.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Flame className="w-3 h-3" />
                    )}
                    REVIVE
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Trigger */}
      {
        hasMore && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLoadMore();
            }}
            disabled={loadingMore}
            className="w-full py-3 mt-4 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading more...</span>
              </>
            ) : (
              <span>Load older leads</span>
            )}
          </button>
        )
      }
    </div >
  );
};

export default LeadList;
