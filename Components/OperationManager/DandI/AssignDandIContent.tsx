import { useState, useEffect } from "react";
import {
    Truck,
    Package,
    Clock,
    CheckCircle2,
    XCircle,
    CheckCircle,
    Calendar,
    Users,
    Phone,
    MapPin,
    Grid,
    List,
    AlertCircle,
    X,
    Eye,
    DollarSign,
} from "lucide-react";
import api from "@/api";
import OrderDetailOverlay from "./OrderDetailOverlay";

// Reusing interfaces from supervisor apps
interface OrderContainer {
    id: number;
    orders: Array<{
        order_code: number;
        order_name?: string;
        boms: Array<any>;
        mockup: any;
        cutting_files: Array<any>;
        order_status: string;
        price: number;
        design_type: number;
    }>;
    posted_by: any;
    client: string;
    contact: string;
    location: string;
    delivery_date: string;
    invoice: boolean;
    full_payment: number;
    special_requerment: string;
    advance_payment: string;
    remaining_payment: string;
    instalation_service: boolean;
    order_difficulty: string;
    note: string;
    delivery_service: boolean;
    created_at: string;
    updated_at: string | null;
    lead: number;
}

interface TeamMember {
    id: number;
    telegram_id: number;
    telegram_user_name: string;
    role: Array<{
        id: number;
        Name: string;
        date: string;
    }>;
    first_name: string;
}

type ViewMode = "card" | "list";

const AssignDandIContent = () => {
    const [viewMode, setViewMode] = useState<ViewMode>("card");
    const [containers, setContainers] = useState<OrderContainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [assignOverlay, setAssignOverlay] = useState<{
        isOpen: boolean;
        container: OrderContainer | null;
    }>({
        isOpen: false,
        container: null,
    });
    const [detailOverlay, setDetailOverlay] = useState<{
        isOpen: boolean;
        container: OrderContainer | null;
    }>({
        isOpen: false,
        container: null,
    });

    useEffect(() => {
        fetchOrderContainers();
    }, []);

    const fetchOrderContainers = async (url?: string) => {
        try {
            if (url) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const endpoint = url || `/api/order-container/?is_assigned=false`;
            const response = await api.get(endpoint);

            if (url) {
                setContainers(prev => [...prev, ...(response.data.results || [])]);
            } else {
                setContainers(response.data.results || []);
            }

            setNextPage(response.data.next || null);
        } catch (err: any) {
            setError("Failed to fetch order containers");
            console.error("Error fetching containers:", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const openAssignOverlay = (container: OrderContainer) => {
        setAssignOverlay({
            isOpen: true,
            container,
        });
    };

    const closeAssignOverlay = () => {
        setAssignOverlay({
            isOpen: false,
            container: null,
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getRelativeDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Tomorrow";
        if (diffDays === -1) return "Yesterday";
        if (diffDays > 0) return `${diffDays} days from now`;
        return `${Math.abs(diffDays)} days ago`;
    };

    const openDetailOverlay = (container: OrderContainer) => {
        setDetailOverlay({
            isOpen: true,
            container,
        });
    };

    const closeDetailOverlay = () => {
        setDetailOverlay({
            isOpen: false,
            container: null,
        });
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-3">
                    Loading order containers...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* View Toggle */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Available Orders ({containers.length})
                </h3>
                <div className="bg-gray-100 dark:bg-zinc-700 rounded-lg p-1 flex">
                    <button
                        onClick={() => setViewMode("card")}
                        className={`p-2 rounded-md transition-colors ${viewMode === "card"
                            ? "bg-white dark:bg-zinc-600 text-blue-600 shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            }`}
                        title="Card View"
                    >
                        <Grid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 rounded-md transition-colors ${viewMode === "list"
                            ? "bg-white dark:bg-zinc-600 text-blue-600 shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            }`}
                        title="List View"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {containers.length === 0 ? (
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
                    <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No Orders Available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        All orders have been assigned for delivery and installation.
                    </p>
                </div>
            ) : (
                <div className={viewMode === "card" ? "space-y-4" : "space-y-2"}>
                    {containers.map((container) =>
                        viewMode === "card" ? (
                            <OrderContainerCard
                                key={container.id}
                                container={container}
                                onAssign={openAssignOverlay}
                                onShowDetails={openDetailOverlay}
                                getRelativeDate={getRelativeDate}
                            />
                        ) : (
                            <OrderContainerListItem
                                key={container.id}
                                container={container}
                                onAssign={openAssignOverlay}
                                onShowDetails={openDetailOverlay}
                                getRelativeDate={getRelativeDate}
                            />
                        )
                    )}
                </div>
            )}

            {/* Pagination */}
            {nextPage && (
                <div className="pt-2 pb-6">
                    <button
                        onClick={() => fetchOrderContainers(nextPage)}
                        disabled={loadingMore}
                        className="w-full py-3 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 text-blue-600 dark:text-blue-400 font-semibold rounded-[12px] shadow-sm transition-colors text-sm flex justify-center items-center"
                    >
                        {loadingMore ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400 mr-2"></div>
                                Loading...
                            </>
                        ) : (
                            "Load More Orders"
                        )}
                    </button>
                </div>
            )}

            {/* Assign Overlay */}
            {assignOverlay.isOpen && assignOverlay.container && (
                <AssignOverlay
                    container={assignOverlay.container}
                    onClose={closeAssignOverlay}
                    onSuccess={() => {
                        fetchOrderContainers();
                        closeAssignOverlay();
                    }}
                    getRelativeDate={getRelativeDate}
                />
            )}

            {/* Detail Overlay */}
            {detailOverlay.isOpen && detailOverlay.container && (
                <OrderDetailOverlay
                    container={detailOverlay.container}
                    onClose={closeDetailOverlay}
                />
            )}
        </div>
    );
};

// Card View Component
const OrderContainerCard = ({
    container,
    onAssign,
    onShowDetails,
    getRelativeDate,
}: {
    container: OrderContainer;
    onAssign: (container: OrderContainer) => void;
    onShowDetails: (container: OrderContainer) => void;
    getRelativeDate: (dateString: string) => string;
}) => {
    const allOrdersAssemblyCompleted = container.orders.every(
        (order) => order.order_status === "ASSEMBLY-COMPLETED"
    );

    const completedOrdersCount = container.orders.filter(
        (order) => order.order_status === "ASSEMBLY-COMPLETED"
    ).length;

    const totalOrdersCount = container.orders.length;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[12px] border border-gray-200 dark:border-slate-700 p-4">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-[18px] font-semibold text-gray-900 dark:text-slate-100">
                        Container #{container.id}
                    </h3>
                    <p className="text-[14px] text-gray-500 dark:text-slate-400 mt-1">
                        {container.client}
                    </p>
                </div>
                <div className="text-right">
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${allOrdersAssemblyCompleted
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                            }`}
                    >
                        {allOrdersAssemblyCompleted
                            ? "Ready"
                            : `${completedOrdersCount}/${totalOrdersCount} Completed`}
                    </span>
                </div>
            </div>

            {/* Client & Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-[8px] border border-gray-100 dark:border-slate-600 p-3">
                    <h4 className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                        Client Information
                    </h4>
                    <div className="space-y-2 text-[14px]">
                        <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="text-gray-900 dark:text-slate-100">
                                {container.client}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-green-600" />
                            <span className="text-gray-600 dark:text-slate-300">
                                {container.contact}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-red-600" />
                            <span className="text-gray-600 dark:text-slate-300">
                                {container.location}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-[8px] border border-gray-100 dark:border-slate-600 p-3">
                    <h4 className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                        Order Details
                    </h4>
                    <div className="space-y-2 text-[14px]">
                        <div className="flex justify-between items-center text-gray-700 dark:text-slate-300">
                            <span>Total Payment:</span>
                            <span className="text-gray-900 dark:text-slate-100 font-medium">${container.full_payment}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-700 dark:text-slate-300">
                            <span>Advance Paid:</span>
                            <span className="text-green-600 dark:text-green-400 font-medium">${container.advance_payment}</span>
                        </div>
                        <div className="flex justify-between items-center font-semibold bg-yellow-50 dark:bg-yellow-900/10 p-2 text-yellow-900 dark:text-yellow-400 rounded mt-1">
                            <span>Remaining:</span>
                            <span>${container.remaining_payment}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-700 dark:text-slate-300 mt-2">
                            <span>Delivery Date:</span>
                            <span className="text-gray-900 dark:text-slate-100">
                                {getRelativeDate(container.delivery_date)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Services */}
            <div className="mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Services Required
                </h4>
                <div className="flex space-x-2">
                    {container.delivery_service && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs">
                            Delivery
                        </span>
                    )}
                    {container.instalation_service && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs">
                            Installation
                        </span>
                    )}
                    <span
                        className={`px-2 py-1 rounded-full text-xs ${container.order_difficulty === "HIGH"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : container.order_difficulty === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            }`}
                    >
                        {container.order_difficulty}
                    </span>
                </div>
            </div>

            {/* Orders Summary */}
            <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                    Associated Orders ({completedOrdersCount}/{totalOrdersCount} Assembly Completed)
                </h4>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-[8px] border border-gray-100 dark:border-slate-600 p-3 space-y-2">
                    {container.orders.map((order) => (
                        <div
                            key={order.order_code}
                            className={`flex justify-between items-center text-[14px] p-2 rounded-[8px] ${order.order_status === "ASSEMBLY-COMPLETED"
                                ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800/50"
                                : "bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/50"
                                }`}
                        >
                            <div className="flex items-center space-x-2">
                                {order.order_status === "ASSEMBLY-COMPLETED" ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-yellow-600 shrink-0" />
                                )}
                                <span className="text-gray-900 dark:text-slate-100 font-medium">
                                    ORD-{order.order_code}
                                    {order.order_name && <span className="ml-1 text-gray-500 dark:text-slate-400 font-normal truncate">— {order.order_name}</span>}
                                </span>
                                <span
                                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${order.order_status === "ASSEMBLY-COMPLETED"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800"
                                        : order.order_status === "ASSEMBLY-STARTED"
                                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800"
                                            : "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-gray-300 border border-gray-200 dark:border-slate-700"
                                        }`}
                                >
                                    {order.order_status.replace("-", " ")}
                                </span>
                            </div>
                            <span className="text-gray-600 dark:text-slate-400 hidden sm:block">
                                ${order.price}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Assembly Completion Warning */}
            {!allOrdersAssemblyCompleted && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <p className="text-yellow-700 text-sm">
                            {totalOrdersCount - completedOrdersCount} order(s) still need
                            assembly completion
                        </p>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="mt-4 flex space-x-2">
                <button
                    onClick={() => onShowDetails(container)}
                    className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-[8px] transition-colors font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                    <Eye className="w-5 h-5" />
                    <span>View Details</span>
                </button>
                <button
                    onClick={() => onAssign(container)}
                    disabled={!allOrdersAssemblyCompleted}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-[8px] transition-colors font-medium ${allOrdersAssemblyCompleted
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400"
                        }`}
                >
                    <Truck className="w-5 h-5" />
                    <span>Assign</span>
                </button>
            </div>
        </div>
    );
};

// List View Component
const OrderContainerListItem = ({
    container,
    onAssign,
    onShowDetails,
    getRelativeDate,
}: {
    container: OrderContainer;
    onAssign: (container: OrderContainer) => void;
    onShowDetails: (container: OrderContainer) => void;
    getRelativeDate: (dateString: string) => string;
}) => {
    const allOrdersAssemblyCompleted = container.orders.every(
        (order) => order.order_status === "ASSEMBLY-COMPLETED"
    );

    const completedOrdersCount = container.orders.filter(
        (order) => order.order_status === "ASSEMBLY-COMPLETED"
    ).length;

    const totalOrdersCount = container.orders.length;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[12px] border border-gray-200 dark:border-slate-700 p-3">
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                        <span className="font-medium text-gray-900 dark:text-slate-100 text-[14px]">
                            Container #{container.id}
                        </span>
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-full text-xs">
                            {container.client}
                        </span>
                        <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${allOrdersAssemblyCompleted
                                ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800"
                                }`}
                        >
                            {allOrdersAssemblyCompleted
                                ? "Ready"
                                : `${completedOrdersCount}/${totalOrdersCount}`}
                        </span>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-slate-400 overflow-x-auto hidden-scrollbar pb-1">
                        <div className="flex items-center space-x-1 shrink-0">
                            <Phone className="w-3 h-3" />
                            <span>{container.contact}</span>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                            <MapPin className="w-3 h-3" />
                            <span>{container.location}</span>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                            <DollarSign className="w-3 h-3" />
                            <span>${container.full_payment}</span>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                            <Calendar className="w-3 h-3" />
                            <span>{getRelativeDate(container.delivery_date)}</span>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                            <Package className="w-3 h-3" />
                            <span>
                                {completedOrdersCount}/{totalOrdersCount} done
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2 ml-4 shrink-0">
                    <button
                        onClick={() => onShowDetails(container)}
                        className="flex items-center space-x-1 px-3 py-2 rounded-[8px] transition-colors text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                    >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Details</span>
                    </button>
                    <button
                        onClick={() => onAssign(container)}
                        disabled={!allOrdersAssemblyCompleted}
                        className={`flex items-center space-x-1 px-4 py-2 rounded-[8px] transition-colors text-sm font-medium ${allOrdersAssemblyCompleted
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                            }`}
                    >
                        <Truck className="w-4 h-4" />
                        <span>Assign</span>
                    </button>
                </div>
            </div>

            {/* Assembly status in list view */}
            {!allOrdersAssemblyCompleted && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <div className="flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 text-yellow-600" />
                        <span className="text-yellow-700">
                            {totalOrdersCount - completedOrdersCount} order(s) pending
                            assembly
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

// Assign Overlay Component
const AssignOverlay = ({
    container,
    onClose,
    onSuccess,
    getRelativeDate,
}: {
    container: OrderContainer;
    onClose: () => void;
    onSuccess: () => void;
    getRelativeDate: (dateString: string) => string;
}) => {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
    const [scheduleStartDate, setScheduleStartDate] = useState<string>("");
    const [scheduleCompleteDate, setScheduleCompleteDate] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fetchingTeam, setFetchingTeam] = useState(true);

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    const fetchTeamMembers = async () => {
        try {
            setFetchingTeam(true);
            const response = await api.get(
                "/core/teams/?role=AssemblyDeliveryandInstalationApp"
            );
            setTeamMembers(response.data);
        } catch (err: any) {
            setError("Failed to fetch team members");
            console.error("Error fetching team members:", err);
        } finally {
            setFetchingTeam(false);
        }
    };

    const handleMemberToggle = (memberId: number) => {
        setSelectedMembers((prev) =>
            prev.includes(memberId)
                ? prev.filter((id) => id !== memberId)
                : [...prev, memberId]
        );
    };

    const handleAssign = async () => {
        if (
            selectedMembers.length === 0 ||
            !scheduleStartDate ||
            !scheduleCompleteDate
        ) {
            setError("Please select at least one team member and set schedule dates");
            return;
        }

        // Validate dates
        const startDate = new Date(scheduleStartDate);
        const completeDate = new Date(scheduleCompleteDate);
        const now = new Date();

        if (startDate <= now) {
            setError("Start date must be in the future");
            return;
        }

        if (completeDate <= startDate) {
            setError("Completion date must be after start date");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const payload = {
                order_container: container.id,
                assigned_to: selectedMembers,
                schedule_start_date: startDate.toISOString(),
                schedule_complate_date: completeDate.toISOString(),
                status: "ASSIGNED",
            };

            await api.post("/api/dandi/", payload);
            onSuccess();
        } catch (err: any) {
            console.error("Error assigning task:", err);
            setError("Failed to assign task. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getMinStartDate = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const getMinCompleteDate = () => {
        if (!scheduleStartDate) return getMinStartDate();
        return scheduleStartDate;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700 sticky top-0 bg-white dark:bg-zinc-800 z-10">
                    <div className="flex items-center space-x-3">
                        <Truck className="w-6 h-6 text-blue-600" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Assign for D&I
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Team Members Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Assign To Team Members *
                            </label>
                            {fetchingTeam ? (
                                <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                                        Loading team members...
                                    </p>
                                </div>
                            ) : (
                                <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800">
                                    {teamMembers.map((member) => (
                                        <label
                                            key={member.id}
                                            className="flex items-center space-x-2 p-3 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer border-b border-gray-100 dark:border-zinc-600 last:border-b-0"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedMembers.includes(member.id)}
                                                onChange={() => handleMemberToggle(member.id)}
                                                className="text-blue-600 rounded"
                                            />
                                            <Users className="w-4 h-4 text-blue-600" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    @{member.telegram_user_name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {member.role.map((r) => r.Name).join(", ")}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                            {selectedMembers.length > 0 && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                    {selectedMembers.length} member(s) selected
                                </p>
                            )}
                        </div>

                        {/* Schedule Dates */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Schedule Start Date *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={scheduleStartDate}
                                    onChange={(e) => setScheduleStartDate(e.target.value)}
                                    min={getMinStartDate()}
                                    className="w-full p-3 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                                />
                                {scheduleStartDate && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        {getRelativeDate(scheduleStartDate)}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Schedule Complete Date *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={scheduleCompleteDate}
                                    onChange={(e) => setScheduleCompleteDate(e.target.value)}
                                    min={getMinCompleteDate()}
                                    className="w-full p-3 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                                />
                                {scheduleCompleteDate && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        {getRelativeDate(scheduleCompleteDate)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAssign}
                            disabled={
                                loading ||
                                selectedMembers.length === 0 ||
                                !scheduleStartDate ||
                                !scheduleCompleteDate
                            }
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Assigning...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Assign Task</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignDandIContent;
