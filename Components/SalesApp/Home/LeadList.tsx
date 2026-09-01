"use client";
import { useEffect, useState } from "react";
import api from "@/api";
import { Loader2, RefreshCw, Snowflake, XCircle } from "lucide-react";
import { buildLeadListParams, LeadListFilters } from "./leadListQuery";

const PAGE_SIZE = 20;

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
  pipeline_stage_detail?: { id: number; code: string; name: string; color: string };
}

interface LeadListProps {
  activeTab: string;
  filters: LeadListFilters;
  userId: number | null;
  onLeadClick?: (leadId: number) => void;
  showCreateOverlay: boolean;
  searchQuery: string;
}

const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, index) => (
      <div
        key={index}
        className="animate-pulse rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="mb-3 flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-zinc-800" />
          <div className="flex-1">
            <div className="mb-2 h-4 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
            <div className="h-3 w-1/4 rounded bg-gray-200 dark:bg-zinc-800" />
          </div>
        </div>
        <div className="h-10 w-full rounded-lg bg-gray-100 dark:bg-zinc-800" />
      </div>
    ))}
  </div>
);

const LeadList = ({
  activeTab,
  filters,
  userId,
  onLeadClick,
  showCreateOverlay,
  searchQuery,
}: LeadListProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leadCount, setLeadCount] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingLeadId, setUpdatingLeadId] = useState<number | null>(null);
  const criteriaKey = [
    activeTab,
    debouncedSearch,
    filters.dateRange,
    filters.pipelineStage,
    userId ?? "",
    showCreateOverlay ? "create-open" : "create-closed",
  ].join("|");
  const [pagination, setPagination] = useState({ criteriaKey, page: 1 });
  const page = pagination.criteriaKey === criteriaKey ? pagination.page : 1;
  const totalPages = Math.max(1, Math.ceil(leadCount / PAGE_SIZE));

  const changePage = (nextPage: number) => {
    setPagination({ criteriaKey, page: nextPage });
  };

  const handlePipelineAction = async (e: React.MouseEvent, lead: Lead, action: 'cold' | 'lost' | 'revive') => {
    e.stopPropagation();
    if (updatingLeadId) return;
    const reason = window.prompt(action === 'cold' ? 'Why is this lead cold?' : action === 'lost' ? 'Why was this lead lost?' : 'Why are you reopening this lead?')?.trim();
    if (!reason) return;
    try {
      setUpdatingLeadId(lead.id);
      const endpoint = action === 'cold' ? 'mark-cold' : action === 'lost' ? 'mark-lost' : 'revive';
      await api.post(`/lead/leads/${lead.id}/${endpoint}/`, { reason });
      setRefreshKey((current) => current + 1);
    } catch (error) {
      console.error("Failed to update pipeline:", error);
    } finally {
      setUpdatingLeadId(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!userId && activeTab === "your") {
      return;
    }

    const controller = new AbortController();

    const fetchLeads = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = buildLeadListParams({
          activeTab,
          filters: {
            dateRange: filters.dateRange,
            pipelineStage: filters.pipelineStage,
          },
          page,
          pageSize: PAGE_SIZE,
          search: debouncedSearch,
          userId,
        });
        const response = await api.get("/lead/leads/", {
          params,
          signal: controller.signal,
        });
        const leadsData = Array.isArray(response.data.results)
          ? response.data.results
          : Array.isArray(response.data)
            ? response.data
            : [];

        setLeads(leadsData);
        setLeadCount(
          typeof response.data.count === "number"
            ? response.data.count
            : leadsData.length,
        );
      } catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "ERR_CANCELED"
        ) return;
        console.error("Error fetching leads:", error);
        setError("Failed to load leads.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchLeads();
    return () => controller.abort();
  }, [
    activeTab,
    debouncedSearch,
    filters.dateRange,
    filters.pipelineStage,
    page,
    refreshKey,
    showCreateOverlay,
    userId,
  ]);

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
          onClick={() => setRefreshKey((current) => current + 1)}
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
        <p className="text-gray-500 dark:text-gray-400">
          {searchQuery.trim()
            ? "No leads found matching your search."
            : "No leads found"}
        </p>
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
                  {((lead.customer_name || lead.name || "?").replace('[Unregistered]', '').trim())[0]?.toUpperCase() || '?'}
                </div>

                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-[15px] leading-tight">
                    {(lead.customer_name || lead.name || "Unnamed Lead").replace('[Unregistered]', '').trim() || "Unnamed Lead"}
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span className="font-medium">{lead.design_type?.name}</span>
                    <span className="w-0.5 h-0.5 bg-gray-300 dark:bg-slate-600 rounded-full"></span>
                    <span>{getRelativeTime(lead.created_at)}</span>
                  </div>
                </div>
              </div>

              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                style={{ color: lead.pipeline_stage_detail?.color || '#64748B', borderColor: `${lead.pipeline_stage_detail?.color || '#64748B'}55`, backgroundColor: `${lead.pipeline_stage_detail?.color || '#64748B'}12` }}
              >
                {lead.pipeline_stage_detail?.name || 'Needs Details'}
              </span>
            </div>

            {/* Note Preview */}
            {lead.note && (
              <div className="mb-3 px-3 py-2 bg-gray-50 dark:bg-slate-900/50 rounded-lg text-xs text-gray-600 dark:text-slate-400 line-clamp-2 italic border border-gray-100 dark:border-slate-800">
                &ldquo;{lead.note}&rdquo;
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
                {['NEEDS_DETAILS', 'NEW_LEAD'].includes(lead.pipeline_stage_detail?.code || '') && <button onClick={(e) => handlePipelineAction(e, lead, 'cold')} disabled={updatingLeadId === lead.id} className="px-3 py-1 rounded-md border border-slate-200 text-slate-600 text-[11px] font-medium flex items-center gap-1.5">{updatingLeadId === lead.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Snowflake className="w-3 h-3" />} MARK COLD</button>}
                {['MOCKUP_REQUESTED', 'MOCKUP_IN_PROGRESS', 'MOCKUP_RETURNED', 'MODIFICATION_REQUESTED', 'MODIFICATION_IN_PROGRESS', 'MODIFICATION_RETURNED'].includes(lead.pipeline_stage_detail?.code || '') && <button onClick={(e) => handlePipelineAction(e, lead, 'lost')} disabled={updatingLeadId === lead.id} className="px-3 py-1 rounded-md border border-red-200 text-red-600 text-[11px] font-medium flex items-center gap-1.5">{updatingLeadId === lead.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} MARK LOST</button>}
                {['COLD', 'LOST'].includes(lead.pipeline_stage_detail?.code || '') && <button onClick={(e) => handlePipelineAction(e, lead, 'revive')} disabled={updatingLeadId === lead.id} className="px-3 py-1 rounded-md border border-blue-200 text-blue-600 text-[11px] font-medium flex items-center gap-1.5">{updatingLeadId === lead.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} REOPEN</button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <nav
        aria-label="Lead list pagination"
        className="flex items-center justify-between gap-3 px-1"
      >
        <button
          type="button"
          onClick={() => changePage(Math.max(1, page - 1))}
          disabled={page === 1 || loading}
          className="min-w-20 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200"
        >
          Previous
        </button>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
          Page {page} of {totalPages}
          <span className="block">{leadCount} {leadCount === 1 ? "lead" : "leads"}</span>
        </p>

        <button
          type="button"
          onClick={() => changePage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || loading}
          className="min-w-20 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200"
        >
          Next
        </button>
      </nav>
    </div >
  );
};

export default LeadList;
