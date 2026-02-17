import {
    Wrench,
    User,
    Calendar,
    AlertCircle,
    CheckCircle,
    Clock,
    MapPin,
    Phone,
} from "lucide-react";

interface MaintenanceCardProps {
    maintenance: any;
    onViewDetails: (maintenance: any) => void;
}

const MaintenanceCard = ({
    maintenance,
    onViewDetails,
}: MaintenanceCardProps) => {
    const getStatusStyle = (status: string) => {
        switch (status) {
            case "D": // DONE
                return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
            case "S": // STARTED
                return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
            case "A": // ASSIGNED
                return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800";
            default: // NOT ASSIGNED (NA)
                return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
        }
    };

    const getStatusText = (status: string) => {
        const map: Record<string, string> = {
            NA: "Not Assigned",
            A: "Assigned",
            S: "In Progress",
            D: "Completed",
        };
        return map[status] || status;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
        }).format(new Date(dateString));
    };

    return (
        <div
            onClick={() => onViewDetails(maintenance)}
            className="group flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
        >
            {/* --- HEADER --- */}
            <div className="p-3 sm:p-4 pb-2">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                        <h3
                            className="font-bold text-gray-900 dark:text-white text-base sm:text-lg line-clamp-1 break-all"
                            title={maintenance.client_name}
                        >
                            {maintenance.client_name || "Unknown Client"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span
                                className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide rounded-md border ${getStatusStyle(
                                    maintenance.status
                                )}`}
                            >
                                {getStatusText(maintenance.status)}
                            </span>
                            {maintenance.under_warranty && (
                                <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide rounded-md border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">
                                    Warranty
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BODY: Info --- */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-50 dark:border-zinc-800/50 flex-1">
                <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
                    {/* Issue Preview */}
                    <div className="flex items-start gap-2 mb-1">
                        <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs sm:text-sm line-clamp-2">
                            {maintenance.reported_issue || "No issue reported"}
                        </p>
                    </div>

                    {/* Contact & Date */}
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm mt-1">
                        <div className="flex items-center gap-1.5">
                            <Phone size={13} className="text-gray-400 shrink-0" />
                            <span>{maintenance.client_contact || "N/A"}</span>
                        </div>
                        <span className="text-gray-300 dark:text-zinc-700">|</span>
                        <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-gray-400 shrink-0" />
                            <span>{formatDate(maintenance.created_at)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- FOOTER: Assigned To --- */}
            <div className="px-3 sm:px-4 py-2 bg-gray-50/50 dark:bg-zinc-900/50 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {maintenance.assigned_to
                            ? `${maintenance.assigned_to.first_name} ${maintenance.assigned_to.last_name || ""
                            }`
                            : "Unassigned"}
                    </span>
                </div>
                {maintenance.scheduled_start_date && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                        <Clock size={12} />
                        <span>{formatDate(maintenance.scheduled_start_date)}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MaintenanceCard;
