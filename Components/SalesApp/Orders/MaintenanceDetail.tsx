import { useState } from "react";
import {
    X,
    User,
    Phone,
    Calendar,
    AlertCircle,
    CheckCircle,
    Clock,
    Wrench,
    Image as ImageIcon,
    DollarSign,
    FileText,
    CreditCard,
    MapPin,
    ShieldCheck,
} from "lucide-react";
import api from "@/api";

interface MaintenanceDetailProps {
    maintenance: any;
    onClose: () => void;
    onUpdate?: () => void;
}

const MaintenanceDetail = ({
    maintenance,
    onClose,
    onUpdate,
}: MaintenanceDetailProps) => {
    const [loading, setLoading] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "D":
                return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
            case "S":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
            case "A":
                return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 border-gray-200 dark:border-zinc-700";
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
        return new Date(dateString).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatCurrency = (amount: string | number) => {
        if (!amount) return "N/A";
        const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
        return new Intl.NumberFormat("en-ET", {
            style: "currency",
            currency: "ETB",
            minimumFractionDigits: 0,
        }).format(numAmount);
    };

    const InfoRow = ({ icon: Icon, label, value, subValue }: any) => (
        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
            <div className="mt-1 p-2 bg-gray-100 dark:bg-zinc-800 rounded-md text-gray-500 dark:text-gray-400">
                <Icon size={18} />
            </div>
            <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {label}
                </p>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                    {value || "N/A"}
                </p>
                {subValue && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">{subValue}</p>
                )}
            </div>
        </div>
    );

    const SectionTitle = ({ title, icon: Icon }: any) => (
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-zinc-800 pb-2">
            {Icon && <Icon size={16} className="text-blue-600 dark:text-blue-400" />}
            {title}
        </h3>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
            <div className="bg-white dark:bg-zinc-900 w-full h-[95vh] sm:h-[90vh] sm:rounded-xl shadow-2xl flex flex-col overflow-hidden border-t sm:border border-gray-200 dark:border-zinc-800 rounded-t-xl">
                {/* Header */}
                <div className="shrink-0 p-4 sm:p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-start gap-3">
                    <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hidden sm:block shrink-0 h-fit">
                            <Wrench size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                                    {maintenance.client_name || "Maintenance Request"}
                                </h2>
                                <span
                                    className={`px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-full border whitespace-nowrap ${getStatusColor(
                                        maintenance.status
                                    )}`}
                                >
                                    {getStatusText(maintenance.status)}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                Created on {formatDate(maintenance.created_at)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-all shrink-0"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-zinc-950/30 p-4 sm:p-6 pb-20 sm:pb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Client Info */}
                            <div>
                                <SectionTitle title="Client Information" icon={User} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <InfoRow
                                        icon={User}
                                        label="Client Name"
                                        value={maintenance.client_name}
                                    />
                                    <InfoRow
                                        icon={Phone}
                                        label="Contact"
                                        value={maintenance.client_contact}
                                    />
                                </div>
                            </div>

                            {/* Assignment Info */}
                            <div>
                                <SectionTitle title="Assignment Details" icon={Clock} />
                                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                                <User size={20} className="text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                                    Assigned To
                                                </p>
                                                <p className="text-base font-semibold text-gray-900 dark:text-white">
                                                    {maintenance.assigned_to
                                                        ? `${maintenance.assigned_to.first_name} ${maintenance.assigned_to.last_name || ""
                                                        }`
                                                        : "Unassigned"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2">
                                        <InfoRow
                                            icon={Calendar}
                                            label="Scheduled Start"
                                            value={formatDate(maintenance.scheduled_start_date)}
                                        />
                                        <InfoRow
                                            icon={Calendar}
                                            label="Scheduled End"
                                            value={formatDate(maintenance.scheduled_end_date)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Warranty Info */}
                            {maintenance.under_warranty && (
                                <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-lg p-4 flex items-center gap-3">
                                    <ShieldCheck size={24} className="text-purple-600 dark:text-purple-400" />
                                    <div>
                                        <p className="font-bold text-purple-800 dark:text-purple-300">Under Warranty</p>
                                        <p className="text-xs text-purple-600 dark:text-purple-400">This maintenance is covered under warranty.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Reported Issue */}
                            <div>
                                <SectionTitle title="Reported Issue" icon={AlertCircle} />
                                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg p-4">
                                    <p className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-wrap">
                                        {maintenance.reported_issue || "No issue description provided."}
                                    </p>
                                </div>
                            </div>

                            {/* Attached Image */}
                            {maintenance.image && (
                                <div>
                                    <SectionTitle title="Attached Image" icon={ImageIcon} />
                                    <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-800">
                                        <img
                                            src={maintenance.image}
                                            alt="Maintenance"
                                            className="w-full h-48 sm:h-64 object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                                            onClick={() => window.open(maintenance.image, "_blank")}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Payment Info */}
                            {maintenance.payment_status && (
                                <div>
                                    <SectionTitle title="Payment Information" icon={DollarSign} />
                                    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                                        <div className="p-4 grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                                                <p className="font-semibold">{maintenance.payment_status === 'A' ? 'Accepted' : 'Confirmed'}</p>
                                            </div>
                                            {/* We might need to fetch the actual payment object to show amount, but for now this is okay based on the model */}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceDetail;
