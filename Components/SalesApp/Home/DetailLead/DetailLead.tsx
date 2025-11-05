"use client";
import { useEffect, useState } from "react";
import api from "@/api";
import { X } from "lucide-react";
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

  useEffect(() => {
    fetchLeadDetails();
  }, [leadId]);

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

  // --- Loading, Error, No Lead States (Functionality Unchanged) ---
  if (loading) {
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
    <div className="fixed inset-0 bg-white dark:bg-zinc-900 z-50 flex flex-col h-screen">
      {/* Header (Always Visible) */}
      <div className="sticky top-0 z-20 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Lead: {lead.customer_name || "Details"}
            </h1>
          </div>
          {lead.status != "CONVERTED" && <CreateOrderButton leadId={leadId} leadData={lead} />}

          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-gray-500 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Area - Scrollable for the whole view (mobile-first) */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* 1. Lead Information Section */}
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800">
            <LeadInfo lead={lead} />
          </div>

          {/* 2. Mockup/Modification Section (The core redesign) */}
          <MockUpDisplayer leadId={leadId} />
        </div>
      </div>
    </div>
  );
}
