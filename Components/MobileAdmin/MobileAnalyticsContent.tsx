"use client";
import React, { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import api from "@/api";
import { DashboardData } from "@/Components/AdminDashBoard/types";
import DashboardOverview from "@/Components/AdminDashBoard/DashboardOverview";
import FinanceStats from "@/Components/AdminDashBoard/FinanceStats";

// Import the existing admin dashboard CSS so cards style correctly
import "@/Components/AdminDashBoard/AdminDashBoard.css";

const MobileAnalyticsContent = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [view, setView] = useState<"overview" | "finance">("overview");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await api.get("/api/admin-dashboard/");
                setData(response.data);
            } catch (err: any) {
                setError(err?.response?.data?.error || "Failed to load analytics data");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-blue-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Loading analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-6 h-6" />
                    <p className="font-medium">{error}</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-4 max-w-md mx-auto">
            {/* Segmented Control */}
            <div className="bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl flex">
                <button
                    onClick={() => setView("overview")}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${view === "overview"
                            ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setView("finance")}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${view === "finance"
                            ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                >
                    Finance
                </button>
            </div>

            {/* Content wrapper with a specific class that avoids the desktop left padding */}
            <div className="mobile-admin-dashboard-wrap overflow-x-hidden space-y-4 pb-4">
                {view === "overview" ? (
                    <DashboardOverview data={data} />
                ) : (
                    <FinanceStats data={data} onPurchaseClick={() => { }} />
                )}
            </div>
        </div>
    );
};

export default MobileAnalyticsContent;
