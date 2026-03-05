import { useState, useEffect } from "react";
import {
    X,
    Receipt,
    Banknote,
    Plus,
    CheckCircle,
    User,
    Package,
    MapPin,
    Phone,
    Calendar,
    Truck,
    Clock,
    XCircle,
    AlertCircle,
    Tag,
} from "lucide-react";
import api from "@/api";

// Assuming these interfaces are imported or defined elsewhere in your app. Added them here for self-containment.
export interface OrderContainer {
    id: number;
    client: string;
    contact: string;
    location: string;
    delivery_date: string;
    full_payment: number;
    advance_payment: string;
    remaining_payment: string;
    delivery_service: boolean;
    instalation_service: boolean;
    orders: Array<{
        order_code: number;
        order_name?: string;
        order_status: string;
        price: number;
    }>;
}

export interface DandITask {
    id: number;
    status: "ASSIGNED" | "STARTED" | "COMPLATED";
    assigned_to: Array<{
        id: number;
        first_name: string;
        telegram_user_name: string;
    }>;
    order_container: OrderContainer;
}

interface OrderDetailOverlayProps {
    onClose: () => void;
    // Either provide just the container (unassigned tab) OR the full task (assigned/started/completed tabs)
    container?: OrderContainer;
    task?: DandITask;
}

interface TeamMember {
    id: number;
    first_name: string;
    telegram_user_name: string;
}

interface Category {
    id: number;
    name: string;
}

interface PettyCostCategory {
    id: number;
    name: string;
    date: string;
}

interface PettyCostRecord {
    id: number;
    category: PettyCostCategory;
    total_amount: string;
    status: "P" | "C" | "R";
    note: string | null;
    created_at: string;
}

const OrderDetailOverlay = ({ onClose, container, task }: OrderDetailOverlayProps) => {
    // Determine the active container based on props
    const activeContainer = task ? task.order_container : container;

    // Form states
    const [showPettyCostForm, setShowPettyCostForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [releasedTo, setReleasedTo] = useState("");

    const [categories, setCategories] = useState<Category[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

    // New state for displaying related petty costs
    const [pettyCosts, setPettyCosts] = useState<PettyCostRecord[]>([]);
    const [fetchingCosts, setFetchingCosts] = useState(false);

    useEffect(() => {
        if (activeContainer) {
            fetchPettyCosts();
        }
    }, [activeContainer]);

    const fetchPettyCosts = async () => {
        try {
            setFetchingCosts(true);
            const res = await api.get(`/finance/pity-cost-record/?order_container=${activeContainer?.id}&ordering=-created_at`);
            setPettyCosts(res.data.results || []);
        } catch (err) {
            console.error("Failed to fetch petty costs", err);
        } finally {
            setFetchingCosts(false);
        }
    };

    useEffect(() => {
        if (showPettyCostForm) {
            fetchCategories();
            if (!task) {
                // Only fetch all D&I team members if we aren't already narrowed down to an assigned task
                fetchTeamMembers();
            }
        }
    }, [showPettyCostForm, task]);

    const fetchCategories = async () => {
        try {
            const res = await api.get("/finance/pity-cost-record-category/");
            setCategories(res.data.results || res.data);
        } catch (err) {
            console.error("Failed to fetch categories", err);
        }
    };

    const fetchTeamMembers = async () => {
        try {
            const res = await api.get("/core/teams/?role=AssemblyDeliveryandInstalationApp");
            setTeamMembers(res.data);
        } catch (err) {
            console.error("Failed to fetch team members", err);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            setLoading(true);
            const res = await api.post("/finance/pity-cost-record-category/", {
                name: newCategoryName,
            });
            setCategories([...categories, res.data]);
            setCategoryId(res.data.id.toString());
            setNewCategoryName("");
        } catch (err) {
            console.error("Failed to create category", err);
            setError("Failed to create category. It might already exist.");
        } finally {
            setLoading(false);
        }
    };

    const submitPettyCost = async () => {
        setError(null);
        setSuccessMessage(null);

        if (!amount || !categoryId) {
            setError("Amount and Category are required.");
            return;
        }

        if (!task && !releasedTo) {
            setError("Please select who the money is released to.");
            return;
        }

        try {
            setLoading(true);

            // If it's a task, default to releasing to the first assigned member if not explicitly chosen
            // Or require selecting among assigned users. Here we require explicitly picking if multiple.
            let finalReleasedTo = releasedTo;
            if (task && !releasedTo) {
                if (task.assigned_to.length === 1) {
                    finalReleasedTo = task.assigned_to[0].id.toString();
                } else {
                    setError("Please select the assigned team member the cash is released to.");
                    setLoading(false);
                    return;
                }
            }

            const payload = {
                order_container: activeContainer?.id,
                total_amount: parseFloat(amount),
                category: parseInt(categoryId),
                released_to: parseInt(finalReleasedTo),
                note,
                status: "C", // CONFIRMED status per backend choices
            };

            await api.post("/finance/pity-cost-record/", payload);
            setSuccessMessage("Petty cost recorded successfully!");

            // Refresh list
            fetchPettyCosts();

            // Reset form
            setAmount("");
            setNote("");
            setCategoryId("");
            setReleasedTo("");
            setShowPettyCostForm(false);

            // Hide success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);

        } catch (err: any) {
            console.error("Failed to record petty cost", err);
            setError(err.response?.data?.error || "Failed to record petty cost");
        } finally {
            setLoading(false);
        }
    };

    if (!activeContainer) return null;

    // The available members to release money to. 
    // If assigned (task exists), restrict to assigned users. If unassigned, show all fetched team members.
    const availableMembers = task ? task.assigned_to : teamMembers;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-[16px] max-w-2xl w-full my-8 flex flex-col max-h-[90vh] shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-[10px]">
                            <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Container #{activeContainer.id} Details
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                {activeContainer.client}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="p-5 overflow-y-auto flex-1 hidden-scrollbar space-y-6">
                    {/* Top Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-[12px] border border-gray-100 dark:border-slate-600">
                            <Truck className="w-4 h-4 text-blue-500 mb-2" />
                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Delivery Service</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {activeContainer.delivery_service ? "Yes" : "No"}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-[12px] border border-gray-100 dark:border-slate-600">
                            <Package className="w-4 h-4 text-green-500 mb-2" />
                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Installation</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {activeContainer.instalation_service ? "Yes" : "No"}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-[12px] border border-gray-100 dark:border-slate-600">
                            <Phone className="w-4 h-4 text-purple-500 mb-2" />
                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Contact</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {activeContainer.contact}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-[12px] border border-gray-100 dark:border-slate-600">
                            <MapPin className="w-4 h-4 text-orange-500 mb-2" />
                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Location</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {activeContainer.location}
                            </p>
                        </div>
                    </div>

                    {/* Associated Orders */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span>Associated Orders ({activeContainer.orders.length})</span>
                        </h3>
                        <div className="bg-gray-50 dark:bg-slate-700/30 rounded-[12px] border border-gray-100 dark:border-slate-700 overflow-hidden">
                            <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                {activeContainer.orders.map((order) => (
                                    <div key={order.order_code} className="p-3 flex items-center justify-between hover:bg-white dark:hover:bg-slate-700/50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-[14px] font-semibold text-gray-900 dark:text-white">
                                                ORD-{order.order_code} {order.order_name ? `- ${order.order_name}` : ""}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                                Status: {order.order_status}
                                            </span>
                                        </div>
                                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-[6px]">
                                            Br {Number(order.price).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {successMessage && (
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-[12px] flex items-center border border-green-200 dark:border-green-800">
                            <CheckCircle className="w-5 h-5 mr-2 shrink-0" />
                            <p className="text-sm font-medium">{successMessage}</p>
                        </div>
                    )}

                    {/* Petty Costs List Section */}
                    <div>
                        <div className="flex justify-between items-center mb-3 mt-4">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                                <Banknote className="w-4 h-4 text-green-600" />
                                <span>Petty Costs ({pettyCosts.length})</span>
                            </h3>
                            <button
                                onClick={() => setShowPettyCostForm(true)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Record Cost</span>
                            </button>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-700/30 rounded-[12px] border border-gray-100 dark:border-slate-700 overflow-hidden">
                            {fetchingCosts ? (
                                <div className="p-4 text-center text-sm text-gray-500">Loading costs...</div>
                            ) : pettyCosts.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500">No petty costs recorded for this container.</div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {pettyCosts.map((cost) => (
                                        <div key={cost.id} className="p-3 hover:bg-white dark:hover:bg-slate-700/50 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                        Br {Number(cost.total_amount).toLocaleString()}
                                                    </span>
                                                    {cost.category && (
                                                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gray-200 dark:bg-slate-600 rounded text-xs text-gray-700 dark:text-slate-300">
                                                            <Tag className="w-3 h-3" />
                                                            <span>{cost.category.name}</span>
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-500 shrink-0">
                                                    {new Date(cost.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {cost.note && <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{cost.note}</p>}
                                            {cost.status && (
                                                <div className="mt-2">
                                                    <span className={`inline-flex items-center space-x-1 text-xs font-medium px-2 py-0.5 rounded-full ${cost.status === "C" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                                            cost.status === "P" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                                                "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                                        }`}>
                                                        {cost.status === "C" && <CheckCircle className="w-3 h-3" />}
                                                        {cost.status === "P" && <Clock className="w-3 h-3" />}
                                                        {cost.status === "R" && <XCircle className="w-3 h-3" />}
                                                        <span>
                                                            {cost.status === "C" ? "Confirmed" : cost.status === "P" ? "Pending" : "Rejected"}
                                                        </span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Nested Petty Cost Overlay Modal */}
                    {showPettyCostForm && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] overflow-y-auto">
                            <div className="bg-white dark:bg-slate-800 rounded-[16px] max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700 transform scale-100 transition-all">
                                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-slate-700">
                                    <div className="flex items-center space-x-2">
                                        <Banknote className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Record Petty Cost</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowPettyCostForm(false)}
                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-4 space-y-4">
                                    {error && (
                                        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-[8px] border border-red-100 dark:border-red-900/50">
                                            {error}
                                        </p>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                Amount *
                                            </label>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-white text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                Released To *
                                            </label>
                                            <select
                                                value={releasedTo}
                                                onChange={(e) => setReleasedTo(e.target.value)}
                                                className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-white text-sm appearance-none"
                                            >
                                                <option value="">Select Team Member</option>
                                                {availableMembers.map((m) => (
                                                    <option key={m.id} value={m.id}>
                                                        @{m.telegram_user_name} ({m.first_name})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                Category *
                                            </label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={categoryId}
                                                    onChange={(e) => setCategoryId(e.target.value)}
                                                    className="flex-1 p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-white text-sm appearance-none"
                                                >
                                                    <option value="">Select Category</option>
                                                    {categories.map((c) => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Create New Category inline */}
                                            <div className="flex gap-2 mt-2">
                                                <input
                                                    type="text"
                                                    value={newCategoryName}
                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                    placeholder="Or create new category"
                                                    className="flex-1 p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-white text-sm"
                                                />
                                                <button
                                                    onClick={handleCreateCategory}
                                                    disabled={loading || !newCategoryName.trim()}
                                                    className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 font-medium rounded-[10px] hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 text-sm whitespace-nowrap"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                Note (Optional)
                                            </label>
                                            <textarea
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                rows={2}
                                                className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-white text-sm resize-none"
                                                placeholder="Enter any additional details..."
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-700 mt-4">
                                        <button
                                            onClick={() => setShowPettyCostForm(false)}
                                            className="px-5 py-2.5 mr-2 text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 font-medium rounded-[10px] transition-colors text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={submitPettyCost}
                                            disabled={loading}
                                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-[10px] disabled:opacity-50 transition-colors flex items-center space-x-2 text-sm"
                                        >
                                            {loading ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            ) : (
                                                <Banknote className="w-4 h-4" />
                                            )}
                                            <span>Record Cost</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetailOverlay;
