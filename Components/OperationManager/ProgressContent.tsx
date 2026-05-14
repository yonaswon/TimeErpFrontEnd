import React, { useState, useEffect, useRef } from "react";
import api from "@/api";
import {
    Clock,
    AlertCircle,
    Loader,
    Camera,
    X,
    ImageIcon,
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

const ACTIVE_PRODUCTION_STATUSES = [
    "CNC-STARTED",
    "CNC-COMPLETED",
    "ASSEMBLY-STARTED",
    "ASSEMBLY-COMPLETED",
    "DANDI-STARTED",
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

function formatDuration(input: string | number | null): string {
    if (input === null || input === undefined) return "N/A";

    let diffMs: number;
    if (typeof input === "number") {
        diffMs = input * 1000;
    } else {
        const past = new Date(input);
        diffMs = new Date().getTime() - past.getTime();
    }

    if (diffMs < 0) return "Just now";

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? "s" : ""} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
}

type DetailImage = {
    url: string;
    uploadedAt: string;
    uploadedBy: string;
    orderId: number;
    orderStatus: string;
};

type StatusState = {
    orders: any[];
    loading: boolean;
    nextPage: string | null;
};

const ProgressContent = () => {
    const [statusData, setStatusData] = useState<Record<string, StatusState>>({});
    const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({});
    const [uploadingOrders, setUploadingOrders] = useState<Record<number, boolean>>({});
    const [detailImage, setDetailImage] = useState<DetailImage | null>(null);
    const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    useEffect(() => {
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

    const handleImageUpload = async (orderId: number, orderStatus: string, file: File) => {
        setUploadingOrders((prev) => ({ ...prev, [orderId]: true }));
        setUploadErrors((prev) => { const n = { ...prev }; delete n[orderId]; return n; });

        const formData = new FormData();
        formData.append("order", String(orderId));
        formData.append("image", file);

        try {
            const res = await api.post("/api/order-status-images/upload/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const newImageUrl = res.data?.image || null;

            // Update the order in local state with the new image URL
            setStatusData((prev) => {
                const statusState = prev[orderStatus];
                if (!statusState) return prev;
                return {
                    ...prev,
                    [orderStatus]: {
                        ...statusState,
                        orders: statusState.orders.map((o) =>
                            o.order_code === orderId
                                ? { ...o, today_status_image: newImageUrl }
                                : o
                        ),
                    },
                };
            });

            // Close detail modal if open for this order
            if (detailImage?.orderId === orderId) {
                setDetailImage(null);
            }
        } catch (err: any) {
            const msg =
                err?.response?.data?.error ||
                err?.response?.data?.image?.[0] ||
                "Upload failed. Please try again.";
            setUploadErrors((prev) => ({ ...prev, [orderId]: msg }));
        } finally {
            setUploadingOrders((prev) => { const n = { ...prev }; delete n[orderId]; return n; });
        }
    };

    const isInitialLoading = Object.values(statusData).every(s => s.loading && s.orders.length === 0);
    const totalOrders = Object.values(statusData).reduce((sum, s) => sum + (s?.orders.length || 0), 0);

    return (
        <div className="bg-white dark:bg-slate-900 min-h-screen pb-24">
            {/* Header */}
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
                        const isActiveStatus = ACTIVE_PRODUCTION_STATUSES.includes(status);

                        if (statusOrders.length === 0 && !data.loading && (status === "REM-CONFIRMED" || status === "REM-ACCEPTED")) return null;

                        return (
                            <div key={status} className="relative pl-6">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 ${statusOrders.length > 0 ? config.bg.replace('100', '500').replace('/30', '') : 'bg-gray-200 dark:bg-slate-700'}`}>
                                    {statusOrders.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                                </div>

                                {/* Status Header */}
                                <div className="flex items-center justify-between mb-3 -mt-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className={`text-sm font-bold ${statusOrders.length > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>
                                            {config.label}
                                        </h3>
                                        {isActiveStatus && (
                                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                                Daily photo required
                                            </span>
                                        )}
                                    </div>
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
                                                const durationStr = order.status_duration_seconds != null
                                                    ? formatDuration(order.status_duration_seconds)
                                                    : formatDuration(getStatusDate(order));
                                                const hasImage = !!order.today_status_image;
                                                const isUploading = !!uploadingOrders[order.order_code];
                                                const uploadError = uploadErrors[order.order_code];

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

                                                        {/* Image upload section for active statuses */}
                                                        {isActiveStatus && (
                                                            <div className="mt-2 flex items-center gap-2">
                                                                {hasImage ? (
                                                                    <button
                                                                        onClick={() => setDetailImage({
                                                                            url: order.today_status_image,
                                                                            uploadedAt: "",
                                                                            uploadedBy: "",
                                                                            orderId: order.order_code,
                                                                            orderStatus: order.order_status,
                                                                        })}
                                                                        className="shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 border-green-400 dark:border-green-600 hover:opacity-80 transition-opacity"
                                                                        title="View today's image"
                                                                    >
                                                                        <img
                                                                            src={order.today_status_image}
                                                                            alt="Today's status"
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => fileInputRefs.current[order.order_code]?.click()}
                                                                        disabled={isUploading}
                                                                        className="shrink-0 w-12 h-12 rounded-lg border-2 border-dashed border-orange-300 dark:border-orange-700 flex items-center justify-center hover:border-orange-500 dark:hover:border-orange-500 transition-colors bg-orange-50 dark:bg-orange-900/20"
                                                                        title="Upload today's status image"
                                                                    >
                                                                        {isUploading ? (
                                                                            <Loader className="w-4 h-4 animate-spin text-orange-500" />
                                                                        ) : (
                                                                            <Camera className="w-4 h-4 text-orange-400 dark:text-orange-500" />
                                                                        )}
                                                                    </button>
                                                                )}

                                                                <div className="flex flex-col min-w-0">
                                                                    {hasImage ? (
                                                                        <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold">✓ Today's image uploaded</span>
                                                                    ) : (
                                                                        <span className="text-[10px] text-orange-500 dark:text-orange-400 font-semibold">Upload today's image</span>
                                                                    )}
                                                                    {hasImage && (
                                                                        <button
                                                                            onClick={() => fileInputRefs.current[order.order_code]?.click()}
                                                                            disabled={isUploading}
                                                                            className="text-[10px] text-blue-500 dark:text-blue-400 hover:underline text-left"
                                                                        >
                                                                            Change image
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {/* Hidden file input */}
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    ref={(el) => { fileInputRefs.current[order.order_code] = el; }}
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) handleImageUpload(order.order_code, order.order_status, file);
                                                                        e.target.value = "";
                                                                    }}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Upload error */}
                                                        {uploadError && (
                                                            <p className="mt-1 text-[10px] text-red-500 dark:text-red-400">{uploadError}</p>
                                                        )}
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

            {/* Detail Image Modal */}
            {detailImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
                    onClick={() => setDetailImage(null)}
                >
                    <div
                        className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-slate-700">
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    ORD-{detailImage.orderId} — Today's Image
                                </p>
                                <p className="text-[10px] text-gray-500 dark:text-slate-400">
                                    {detailImage.orderStatus}
                                </p>
                            </div>
                            <button
                                onClick={() => setDetailImage(null)}
                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                            >
                                <X className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                            </button>
                        </div>

                        {/* Full-size image */}
                        <div className="relative">
                            <img
                                src={detailImage.url}
                                alt="Status confirmation"
                                className="w-full object-contain max-h-72"
                            />
                        </div>

                        {/* Actions */}
                        <div className="p-3 flex gap-2">
                            <button
                                onClick={() => fileInputRefs.current[detailImage.orderId]?.click()}
                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <ImageIcon className="w-3.5 h-3.5" />
                                Change Image
                            </button>
                            <button
                                onClick={() => setDetailImage(null)}
                                className="flex-1 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgressContent;
