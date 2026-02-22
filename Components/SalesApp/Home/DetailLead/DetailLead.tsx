"use client";
import { useEffect, useState } from "react";
import api from "@/api";
import { X, Loader2, Check, Flame, Snowflake, RefreshCw } from "lucide-react";
import LeadInfo from "./Components/LeadInfo";
import MockUpDisplayer from "./Components/MockUpDisplayer";
import CreateOrderButton from './CreateOrderFromLead/CreateOrderButton'

// Assuming Lead interface definition exists in a common file or inferred from use
interface Lead {
  id: number;
  name: string;
  status: string;
  customer_name: string;
  customer_phonenumber: string;
  customer_telegram: string;
  note: string;
  sales: number;
  created_at: string;
  converted_at: string | null;
  mark_cold_at: string | null;
}

interface DetailLeadProps {
  leadId: number;
  onClose: () => void;
}

export default function DetailLead({ leadId, onClose }: DetailLeadProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // For triggering child refreshes

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      // !!! FUNCTIONALITY UNCHANGED
      const response = await api.get(`/lead/leads/${leadId}/`);
      setLead(response.data);
    } catch (error: any) {
      console.error("Error fetching lead details:", error);
      setError("Failed to load lead details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();

    // Hide Sales Bottom Navigation forcefully via DOM when DetailLead is open
    const hideNav = () => {
      const navs = document.querySelectorAll('.sales-bottom-nav');
      navs.forEach(nav => {
        (nav as HTMLElement).style.setProperty('display', 'none', 'important');
      });
    };

    hideNav();
    // Sometimes React mounts/renders race the DOM, so check again shortly after
    const intervalId = setInterval(hideNav, 100);
    const timeoutId = setTimeout(() => clearInterval(intervalId), 1000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      const navs = document.querySelectorAll('.sales-bottom-nav');
      navs.forEach(nav => {
        (nav as HTMLElement).style.display = '';
      });
    };
  }, [leadId]);

  const handleRefresh = () => {
    fetchLeadDetails(); // Refresh lead details
    setRefreshKey(prev => prev + 1); // Trigger child refresh
  };

  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;
    try {
      setUpdating(true);
      // Optimistic update
      setLead({ ...lead, status: newStatus });
      await api.patch(`/lead/leads/${leadId}/`, { status: newStatus });
    } catch (error) {
      console.error("Failed to update status:", error);
      fetchLeadDetails(); // Revert
    } finally {
      setUpdating(false);
    }
  };

  // --- Loading, Error, No Lead States (Functionality Unchanged) ---
  if (loading && !lead) { // Only show full loader if no data yet
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-lg font-medium text-gray-900 dark:text-white">
              Loading lead details...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-lg font-medium mb-2">Error</div>
            <div className="text-gray-600 dark:text-gray-300 mb-4">{error}</div>
            <button
              onClick={fetchLeadDetails}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-gray-900 dark:text-white text-lg font-medium mb-2">
              No Lead Found
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  // --- END Loading, Error, No Lead States ---

  return (
    <div className="fixed inset-0 bg-white dark:bg-zinc-900 z-50 flex flex-col h-[100dvh] overflow-x-hidden">
      {/* Header (Always Visible) */}
      <div className="sticky top-0 z-20 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 dark:text-white truncate leading-tight">
              {lead.customer_name || "Lead Details"}
            </h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              #{leadId} • {lead.status}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-gray-500 dark:text-gray-400"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {lead.status != "CONVERTED" && <CreateOrderButton leadId={leadId} leadData={lead} />}

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-gray-500 dark:text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - Scrollable for the whole view (mobile-first) */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-3 space-y-4">
          {/* 1. Lead Information Section */}
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800">
            <LeadInfo lead={lead} />
          </div>

          {/* 2. Mockup/Modification Section (The core redesign) */}
          <MockUpDisplayer leadId={leadId} refreshKey={refreshKey} />
        </div>
      </div>


      {/* Bottom Status Action Bar */}
      <div className="p-3 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 safe-area-bottom">
        <div className="flex gap-3">
          {lead.status === 'NEW' && (
            <>
              <button
                onClick={() => handleStatusChange('WARM')}
                disabled={updating}
                className="flex-1 py-3 rounded-xl border border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 font-medium tracking-wide hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                MARK WARM
              </button>
              <button
                onClick={() => handleStatusChange('COLD')}
                disabled={updating}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium tracking-wide hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Snowflake className="w-4 h-4" />}
                MARK COLD
              </button>
            </>
          )}

          {lead.status === 'WARM' && (
            <>
              {/* No Convert Button */}
              <button
                onClick={() => handleStatusChange('COLD')}
                disabled={updating}
                className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium tracking-wide hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Snowflake className="w-4 h-4" />}
                MARK COLD
              </button>
            </>
          )}

          {lead.status === 'COLD' && (
            <button
              onClick={() => handleStatusChange('WARM')}
              disabled={updating}
              className="flex-1 py-3 rounded-xl border border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 font-medium tracking-wide hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
              REVIVE LEAD
            </button>
          )}

          {lead.status === 'CONVERTED' && (
            <div className="w-full py-3 bg-green-50 text-green-700 dark:bg-green-900/10 dark:text-green-400 rounded-xl font-medium text-sm flex items-center justify-center gap-2 border border-green-100 dark:border-green-900/20">
              <Check className="w-4 h-4" />
              Lead Converted
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
