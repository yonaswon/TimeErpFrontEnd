import React, { useState, useEffect } from "react";
import api from "@/api";
import {
    Clock,
    AlertCircle,
    Loader,
} from "lucide-react";

const STATUS_ORDER = [
    "PRE-ACCEPTED",
    "PRE-CONFIRMED",
    "CNC-STARTED",
    "CNC-COMPLETED",
    "ASSEMBLY-STARTED",
    "ASSEMBLY-COMPLETED",
    "DANDI-STARTED",
    "REM-ACCEPTED",
    "REM-CONFIRMED",
];

const STATUS_CONFIG: Record<
    string,
    { label: string; color: string; bg: string; iconColor: string }
> = {
    "PRE-ACCEPTED": { label: "Pre-Accept", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-500" },
    "PRE-CONFIRMED": { label: "Pre-Confirmed", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-500" },
    "CNC-STARTED": { label: "CNC Started", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-500" },
    "CNC-COMPLETED": { label: "CNC Done", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-500" },
    "ASSEMBLY-STARTED": { label: "Assembly", color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30", iconColor: "text-purple-500" },
    "ASSEMBLY-COMPLETED": { label: "Asm Done", color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30", iconColor: "text-purple-500" },
    "DANDI-STARTED": { label: "Delivery", color: "text-cyan-700 dark:text-cyan-400", bg: "bg-cyan-100 dark:bg-cyan-900/30", iconColor: "text-cyan-500" },
    "REM-ACCEPTED": { label: "Rem Accept", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30", iconColor: "text-emerald-500" },
    "REM-CONFIRMED": { label: "Rem Confirmed", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30", iconColor: "text-emerald-500" },
};

function getStatusDate(order: any) {
    switch (order.order_status) {
        case "PRE-ACCEPTED": return order.pre_accepted_date;
        case "PRE-CONFIRMED": return order.pre_confirmed_date;
        case "CNC-STARTED": return order.cnc_started_date;
        case "CNC-COMPLETED": return order.cnc_completed_date;
        case "ASSEMBLY-STARTED": return order.assembly_started_date;
        case "ASSEMBLY-COMPLETED": return order.assembly_completed_date;
        case "DANDI-STARTED": return order.dandi_date;
        case "REM-ACCEPTED": return order.rem_accepted_date;
        case "REM-CONFIRMED": return order.rem_confirmed_date;
        default: return order.created_at;
    }
}

function formatDuration(dateString: string | null) {
    if (!dateString) return "N/A";
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();

    if (diffMs < 0) return "Just now";

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? "s" : ""} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
}

type StatusState = {
    orders: any[];
    loading: boolean;
    nextPage: string | null;
};

const ProgressContent = () => {
    const [statusData, setStatusData] = useState<Record<string, StatusState>>({});

    useEffect(() => {
        // Initialize state and fetch for all statuses
        const initialStates: Record<string, StatusState> = {};
        STATUS_ORDER.forEach((status) => {
            initialStates[status] = { orders: [], loading: true, nextPage: null };
            fetchOrdersForStatus(status, `/api/orders/?order_status=${status}&ordering=-created_at`);
        });
        setStatusData(initialStates);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchOrdersForStatus = async (status: string, url: string, isLoadMore = false) => {
        setStatusData((prev) => ({
            ...prev,
            [status]: { ...(prev[status] || { orders: [], nextPage: null }), loading: true },
        }));

        try {
            const res = await api.get(url);
            const results = res.data?.results || res.data || [];

            setStatusData((prev) => {
                const currentOrders = prev[status]?.orders || [];
                return {
                    ...prev,
                    [status]: {
                        orders: isLoadMore ? [...currentOrders, ...results] : results,
                        nextPage: res.data?.next || null,
                        loading: false,
                    },
                };
            });
        } catch (err) {
            console.error(`Failed to fetch orders for ${status}`, err);
            setStatusData((prev) => ({
                ...prev,
                [status]: { ...(prev[status] || { orders: [], nextPage: null }), loading: false },
            }));
        }
    };

    // Check if any status is loading for the global loader
    const isInitialLoading = Object.values(statusData).every(s => s.loading && s.orders.length === 0);

    // Calculate total orders
    const totalOrders = Object.values(statusData).reduce((sum, s) => sum + (s?.orders.length || 0), 0);

    return (
        <div className="bg-white dark:bg-slate-900 min-h-screen pb-24">
            {/* Header section */}
            <div className="bg-white dark:bg-slate-900 p-4 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-10 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Live Progress</h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        Timeline of {totalOrders} active orders
                    </p>
                </div>
                {isInitialLoading && <Loader className="w-5 h-5 animate-spin text-blue-500" />}
            </div>

            <div className="p-4 pt-6">
                <div className="relative border-l-2 border-gray-100 dark:border-slate-800 ml-3 space-y-8">
                    {STATUS_ORDER.map((status) => {
                        const data = statusData[status] || { orders: [], loading: false, nextPage: null };
                        const statusOrders = data.orders;
                        const config = STATUS_CONFIG[status] || STATUS_CONFIG["PRE-ACCEPTED"];

                        // Hide completely empty statuses if they are REM-CONFIRMED, REM-ACCEPTED to save some space at the end
                        // Only hide if they are also done loading to avoid jumping
                        if (statusOrders.length === 0 && !data.loading && (status === "REM-CONFIRMED" || status === "REM-ACCEPTED")) return null;

                        return (
                            <div key={status} className="relative pl-6">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 ${statusOrders.length > 0 ? config.bg.replace('100', '500').replace('/30', '') : 'bg-gray-200 dark:bg-slate-700'}`}>
                                    {statusOrders.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                                </div>

                                {/* Status Header */}
                                <div className="flex items-center justify-between mb-3 -mt-1">
                                    <h3 className={`text-sm font-bold ${statusOrders.length > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>
                                        {config.label}
                                    </h3>
                                    <div className="flex items-center space-x-2">
                                        {data.loading && <Loader className="w-3 h-3 animate-spin text-gray-400" />}
                                        {statusOrders.length > 0 && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                                                {statusOrders.length}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Orders List */}
                                <div className="space-y-2">
                                    {statusOrders.length === 0 ? (
                                        !data.loading && <p className="text-xs text-gray-400 dark:text-slate-600 italic">No orders</p>
                                    ) : (
                                        <>
                                            {statusOrders.map((order) => {
                                                const dateVal = getStatusDate(order);
                                                const durationStr = formatDuration(dateVal);

                                                return (
                                                    <div key={order.order_code} className="flex flex-col bg-gray-50/80 dark:bg-slate-800/80 p-2.5 rounded-[10px] border border-gray-100 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex items-center space-x-2 min-w-0 pr-2">
                                                                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 shrink-0">
                                                                    ORD-{order.order_code}
                                                                </span>
                                                                <span className="text-xs font-medium text-gray-500 dark:text-slate-400 truncate">
                                                                    {order.order_name || "Un-named"}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center space-x-1 shrink-0 bg-white dark:bg-slate-700/50 px-1.5 py-0.5 rounded shadow-sm border border-gray-100 dark:border-slate-600/50">
                                                                <Clock className="w-3 h-3 text-gray-400 dark:text-slate-400" />
                                                                <span className="text-[10px] text-gray-500 dark:text-slate-300 font-medium whitespace-nowrap">{durationStr}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {data.nextPage && (
                                                <button
                                                    onClick={() => fetchOrdersForStatus(status, data.nextPage as string, true)}
                                                    disabled={data.loading}
                                                    className="w-full mt-2 py-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-semibold rounded-[8px] transition-colors text-xs flex justify-center items-center"
                                                >
                                                    {data.loading ? "Loading..." : "Load More"}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {!isInitialLoading && totalOrders === 0 && (
                    <div className="text-center py-10">
                        <AlertCircle className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">No active orders found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressContent;
