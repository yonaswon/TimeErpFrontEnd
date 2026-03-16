import { useState, useEffect } from "react";
import {
    Truck,
    Calendar,
    Users,
    MapPin,
    Phone,
    DollarSign,
    Package,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Clock,
    CheckCircle,
    Eye,
    Building,
    X,
    CreditCard,
    Upload,
    ImageIcon,
} from "lucide-react";
import api from "@/api";
import OrderDetailOverlay from "./OrderDetailOverlay";

// Reuse interfaces
interface OrderContainer {
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
        mockup: any;
    }>;
}

interface DandITask {
    id: number;
    status: "ASSIGNED" | "STARTED" | "COMPLATED";
    schedule_start_date: string;
    schedule_complate_date: string;
    date: string;
    started_at: string | null;
    completed_at: string | null;
    assigned_to: Array<{
        id: number;
        first_name: string;
        telegram_user_name: string;
    }>;
    order_container: OrderContainer;
}

interface BankAccount {
    id: number;
    bank_name: string;
    account_number: string;
    account_holder_name: string;
}

const AllTasksContent = ({ filterStatus }: { filterStatus?: 'ASSIGNED' | 'STARTED' | 'COMPLATED' }) => {
    const [tasks, setTasks] = useState<DandITask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    // Modals state
    const [startOverlay, setStartOverlay] = useState<{ isOpen: boolean; task: DandITask | null }>({ isOpen: false, task: null });
    const [completeOverlay, setCompleteOverlay] = useState<{ isOpen: boolean; task: DandITask | null }>({ isOpen: false, task: null });
    const [detailOverlay, setDetailOverlay] = useState<{ isOpen: boolean; task: DandITask | null }>({ isOpen: false, task: null });

    useEffect(() => {
        fetchTasks();
    }, [filterStatus]);

    const fetchTasks = async (url?: string) => {
        try {
            if (url) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Fetch assignments, filtered by status if provided, ordered by creation date
            const endpoint = url || `/api/dandi/?ordering=-date${filterStatus ? `&status=${filterStatus}` : ''}`;
            const response = await api.get(endpoint);

            if (url) {
                setTasks(prev => [...prev, ...(response.data.results || [])]);
            } else {
                setTasks(response.data.results || []);
            }

            setNextPage(response.data.next || null);
        } catch (err: any) {
            setError("Failed to fetch tasks");
            console.error("Error fetching tasks:", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
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

    if (loading && !loadingMore) {
        return (
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-3">Loading tasks...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20">
            {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {tasks.length === 0 ? (
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Tasks Found</h3>
                    <p className="text-gray-600 dark:text-gray-400">There are currently no tasks assigned.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            getRelativeDate={getRelativeDate}
                            onStart={() => setStartOverlay({ isOpen: true, task })}
                            onComplete={() => setCompleteOverlay({ isOpen: true, task })}
                            onShowDetails={() => setDetailOverlay({ isOpen: true, task })}
                        />
                    ))}

                    {nextPage && (
                        <div className="pt-2">
                            <button
                                onClick={() => fetchTasks(nextPage)}
                                disabled={loadingMore}
                                className="w-full py-3 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 text-blue-600 dark:text-blue-400 font-semibold rounded-[12px] shadow-sm transition-colors text-sm flex justify-center items-center"
                            >
                                {loadingMore ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400 mr-2"></div>
                                        Loading...
                                    </>
                                ) : (
                                    "Load More"
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Start Task Overlay */}
            {startOverlay.isOpen && startOverlay.task && (
                <StartTaskOverlay
                    task={startOverlay.task}
                    onClose={() => setStartOverlay({ isOpen: false, task: null })}
                    onSuccess={() => {
                        fetchTasks();
                        setStartOverlay({ isOpen: false, task: null });
                    }}
                />
            )}

            {/* Complete Task Overlay */}
            {completeOverlay.isOpen && completeOverlay.task && (
                <CompleteTaskOverlay
                    task={completeOverlay.task}
                    onClose={() => setCompleteOverlay({ isOpen: false, task: null })}
                    onSuccess={() => {
                        fetchTasks();
                        setCompleteOverlay({ isOpen: false, task: null });
                    }}
                />
            )}

            {/* Detail Overlay */}
            {detailOverlay.isOpen && detailOverlay.task && (
                <OrderDetailOverlay
                    task={detailOverlay.task}
                    onClose={() => setDetailOverlay({ isOpen: false, task: null })}
                />
            )}
        </div>
    );
};

// Task Card Component
const TaskCard = ({
    task,
    getRelativeDate,
    onStart,
    onComplete,
    onShowDetails,
}: {
    task: DandITask;
    getRelativeDate: (dateString: string) => string;
    onStart: () => void;
    onComplete: () => void;
    onShowDetails: () => void;
}) => {
    const container = task.order_container;
    const isStarted = task.status === "STARTED";
    const isCompleted = task.status === "COMPLATED";

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[12px] border border-gray-200 dark:border-slate-700 p-4">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center space-x-2">
                        <h3 className="text-[18px] font-semibold text-gray-900 dark:text-slate-100">
                            Container #{container.id}
                        </h3>
                        <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${isCompleted
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : isStarted
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                }`}
                        >
                            {task.status}
                        </span>
                    </div>
                    <p className="text-[14px] text-gray-500 dark:text-slate-400 mt-1">
                        {container.client}
                    </p>
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                    {container.delivery_service && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-xs flex items-center gap-1 border border-blue-100 dark:border-blue-900/30">
                            <Truck className="w-3 h-3" /> Delivery
                        </span>
                    )}
                    {container.instalation_service && (
                        <span className="px-2 py-1 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-full text-xs flex items-center gap-1 border border-green-100 dark:border-green-900/30">
                            <Package className="w-3 h-3" /> Installation
                        </span>
                    )}
                </div>
            </div>

            {/* Orders List */}
            <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                    Associated Orders ({container.orders.length})
                </h4>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-[8px] border border-gray-100 dark:border-slate-600 p-3 flex flex-col gap-2">
                    {container.orders.map((o) => (
                        <div key={o.order_code} className="flex items-center text-[14px] text-gray-700 dark:text-slate-300">
                            <Package className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-500 flex-shrink-0" />
                            <span className="font-medium">ORD-{o.order_code}</span>
                            {o.order_name && <span className="ml-1 truncate">- {o.order_name}</span>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Team & Schedule Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <h4 className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                        Assigned Team
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {task.assigned_to.map((member) => (
                            <span
                                key={member.id}
                                className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-[8px] text-[14px] text-gray-700 dark:text-slate-300"
                            >
                                <Users className="w-3 h-3" />
                                <span>@{member.telegram_user_name}</span>
                            </span>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                        Schedule
                    </h4>
                    <div className="space-y-1 text-[14px] bg-gray-50 dark:bg-slate-700/50 rounded-[8px] border border-gray-100 dark:border-slate-600 p-3">
                        <div className="flex items-center space-x-2 text-gray-700 dark:text-slate-300">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span>Start: {new Date(task.schedule_start_date).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-700 dark:text-slate-300">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span>End: {new Date(task.schedule_complate_date).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Location & Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2 text-[14px]">
                    <div className="flex items-center space-x-2 text-gray-700 dark:text-slate-300">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span className="truncate">{container.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-700 dark:text-slate-300">
                        <Phone className="w-4 h-4 text-green-500" />
                        <span>{container.contact}</span>
                    </div>
                </div>

                <div className="space-y-2 text-[14px] bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-[8px]">
                    <div className="flex justify-between items-center text-gray-700 dark:text-slate-300">
                        <span>Total: ${container.full_payment}</span>
                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">Remaining: ${container.remaining_payment}</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                <button
                    onClick={onShowDetails}
                    className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-gray-100 text-gray-700 rounded-[8px] hover:bg-gray-200 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                </button>
                {!isCompleted && (
                    !isStarted ? (
                        <button
                            onClick={onStart}
                            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 text-white rounded-[8px] hover:bg-blue-700 transition-colors"
                        >
                            <Truck className="w-4 h-4" />
                            <span>Start Task</span>
                        </button>
                    ) : (
                        <button
                            onClick={onComplete}
                            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-green-600 text-white rounded-[8px] hover:bg-green-700 transition-colors"
                        >
                            <CheckCircle className="w-4 h-4" />
                            <span>Complete Task</span>
                        </button>
                    )
                )}
            </div>
        </div>
    );
};

// Start Task Overlay
const StartTaskOverlay = ({
    task,
    onClose,
    onSuccess,
}: {
    task: DandITask;
    onClose: () => void;
    onSuccess: () => void;
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStart = async () => {
        try {
            setLoading(true);
            setError(null);
            await api.post(`/api/dandi/${task.id}/start/`);
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to start task.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white dark:bg-zinc-800 rounded-xl max-w-sm w-full p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Start Task</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Are you sure you want to start D&I for Container #{task.order_container.id}?
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleStart}
                        disabled={loading}
                        className="flex-1 flex justify-center items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <span>Start</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Complete Task + Payment Overlay (Multi-Payment Support)
interface PaymentEntry {
    method: string;
    amount: number;
    wallet: number | null;
    account: string;
    screenshot: File | null;
    note: string;
}

const CompleteTaskOverlay = ({
    task,
    onClose,
    onSuccess,
}: {
    task: DandITask;
    onClose: () => void;
    onSuccess: () => void;
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const remainingPayment = parseFloat(task.order_container.remaining_payment);

    // Multiple payments state
    const [payments, setPayments] = useState<PaymentEntry[]>([
        { method: 'CASH', amount: Math.round(remainingPayment), wallet: 2, account: '', screenshot: null, note: '' }
    ]);
    const [proofImages, setProofImages] = useState<File[]>([]);

    // Bank accounts cache per payment index
    const [accountsMap, setAccountsMap] = useState<Record<number, any[]>>({});

    useEffect(() => {
        const fetchAccounts = async () => {
            const newMap: Record<number, any[]> = {};
            for (let i = 0; i < payments.length; i++) {
                if (payments[i].method === 'BANK' || payments[i].method === 'CHECK') {
                    try {
                        const resC = await api.get('/finance/account/?account_type=C&deleted=false');
                        const resP = await api.get('/finance/account/?account_type=P&deleted=false');
                        const acC = resC.data.results || resC.data || [];
                        const acP = resP.data.results || resP.data || [];
                        newMap[i] = [...acC, ...acP];
                    } catch {
                        newMap[i] = [];
                    }
                }
            }
            setAccountsMap(newMap);
        };
        fetchAccounts();
    }, [payments.map(p => p.method).join(',')]);

    const updatePayment = (index: number, field: keyof PaymentEntry, value: any) => {
        const updated = [...payments];
        const entry = { ...updated[index], [field]: value };
        if (field === 'method') {
            entry.wallet = (value === 'BANK' || value === 'CHECK') ? 1 : value === 'CASH' ? 2 : null;
            entry.account = '';
            entry.screenshot = null;
        }
        updated[index] = entry;
        setPayments(updated);
    };

    const addPayment = () => {
        const remaining = remainingPayment - payments.reduce((s, p) => s + p.amount, 0);
        setPayments([...payments, { method: 'CASH', amount: Math.max(0, Math.round(remaining)), wallet: 2, account: '', screenshot: null, note: '' }]);
    };

    const removePayment = (index: number) => {
        if (payments.length <= 1) return;
        setPayments(payments.filter((_, i) => i !== index));
    };

    const totalAllocated = payments.reduce((s, p) => s + p.amount, 0);

    const handleComplete = async () => {
        // Validate all payments
        const errors: string[] = [];
        payments.forEach((p, i) => {
            if (!p.method) errors.push(`Payment #${i + 1}: method is required`);
            if (!p.amount || p.amount <= 0) errors.push(`Payment #${i + 1}: amount must be > 0`);
            if ((p.method === 'BANK' || p.method === 'CHECK') && !p.account) {
                errors.push(`Payment #${i + 1}: account is required`);
            }
            if ((p.method === 'BANK' || p.method === 'CHECK') && !p.screenshot) {
                errors.push(`Payment #${i + 1}: screenshot is required`);
            }
        });
        if (remainingPayment > 0 && Math.round(totalAllocated) !== Math.round(remainingPayment)) {
            errors.push(`Total amounts (${totalAllocated}) must equal remaining payment (${remainingPayment})`);
        }
        if (errors.length > 0) {
            setError(errors.join('\n'));
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const formData = new FormData();

            if (remainingPayment > 0) {
                // Build payments_data JSON (without file fields)
                const paymentsData = payments.map((p) => ({
                    method: p.method,
                    amount: p.amount,
                    wallet: p.wallet,
                    account: p.account ? parseInt(p.account) : null,
                    note: p.note,
                }));
                formData.append('payments_data', JSON.stringify(paymentsData));

                // Append screenshots
                payments.forEach((p, index) => {
                    if ((p.method === 'BANK' || p.method === 'CHECK') && p.screenshot) {
                        formData.append(`payment_${index}_screenshot`, p.screenshot);
                    }
                });
            }

            // Append proof images regardless of payment remaining
            proofImages.forEach((img, index) => {
                formData.append(`proof_image_${index}`, img);
            });

            await api.post(`/api/dandi/${task.id}/complete/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to complete task.");
        } finally {
            setLoading(false);
        }
    };

    const handleProofImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setProofImages(prev => [...prev, ...newFiles].slice(0, 10)); // Max 10 images
        }
    };

    const removeProofImage = (indexToRemove: number) => {
        setProofImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-zinc-700 sticky top-0 bg-white dark:bg-zinc-800 z-10 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Complete & Payment</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2 whitespace-pre-line">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
                        </div>
                    )}

                    {/* Payment Summary */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800/50">
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-600 mb-2">Payment Details</h4>
                        <div className="flex justify-between text-sm mb-1 text-yellow-700 dark:text-yellow-500">
                            <span>Total Amount:</span>
                            <span>{task.order_container.full_payment.toLocaleString()} Birr</span>
                        </div>
                        <div className="flex justify-between font-semibold text-yellow-900 dark:text-yellow-400">
                            <span>Remaining Amount:</span>
                            <span>{remainingPayment.toLocaleString()} Birr</span>
                        </div>
                    </div>

                    {/* Allocated vs Required */}
                    {remainingPayment > 0 && (
                        <div className={`p-3 rounded-lg text-sm font-medium ${Math.round(totalAllocated) === Math.round(remainingPayment)
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                            }`}>
                            Allocated: {totalAllocated.toLocaleString()} / {remainingPayment.toLocaleString()} Birr
                            {Math.round(totalAllocated) !== Math.round(remainingPayment) && (
                                <span className="ml-2 text-xs">(Diff: {(remainingPayment - totalAllocated).toLocaleString()})</span>
                            )}
                        </div>
                    )}

                    {remainingPayment > 0 && (
                        <div className="space-y-4">
                            {payments.map((payment, index) => {
                                const accounts = accountsMap[index] || [];
                                return (
                                    <div key={index} className="border border-gray-200 dark:border-zinc-700 rounded-lg p-3 relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Payment #{index + 1}
                                            </span>
                                            {payments.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removePayment(index)}
                                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            {/* Amount */}
                                            <div>
                                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Amount *</label>
                                                <input
                                                    type="number"
                                                    value={payment.amount || ''}
                                                    onChange={(e) => updatePayment(index, 'amount', Math.round(parseFloat(e.target.value) || 0))}
                                                    className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm"
                                                    min={0}
                                                />
                                            </div>

                                            {/* Method */}
                                            <div>
                                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Method *</label>
                                                <select
                                                    value={payment.method}
                                                    onChange={(e) => updatePayment(index, 'method', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm"
                                                >
                                                    <option value="CASH">Cash</option>
                                                    <option value="BANK">Bank Transfer</option>
                                                    <option value="CHECK">Check</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Account (for BANK/CHECK) */}
                                        {(payment.method === 'BANK' || payment.method === 'CHECK') && (
                                            <div className="mb-3">
                                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Bank Account *</label>
                                                <select
                                                    value={payment.account}
                                                    onChange={(e) => updatePayment(index, 'account', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm"
                                                >
                                                    <option value="">Select account</option>
                                                    {accounts.map((acc: any) => (
                                                        <option key={acc.id} value={acc.id}>
                                                            {acc.bank} - {acc.account_number} ({acc.account_name})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* Screenshot (for BANK/CHECK) */}
                                        {(payment.method === 'BANK' || payment.method === 'CHECK') && (
                                            <div className="mb-3">
                                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Screenshot *</label>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <label className="flex items-center gap-1.5 cursor-pointer text-blue-600 border border-blue-600 rounded-lg px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs">
                                                        <Upload className="w-3.5 h-3.5" />
                                                        {payment.screenshot ? 'Change' : 'Upload'}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => updatePayment(index, 'screenshot', e.target.files?.[0] || null)}
                                                        />
                                                    </label>
                                                    {payment.screenshot && (
                                                        <span className="text-xs text-green-600 truncate max-w-[150px]">{payment.screenshot.name}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Note */}
                                        <div>
                                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Note</label>
                                            <input
                                                type="text"
                                                value={payment.note}
                                                onChange={(e) => updatePayment(index, 'note', e.target.value)}
                                                className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm"
                                                placeholder="Optional note..."
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Add Payment Button */}
                            <button
                                type="button"
                                onClick={addPayment}
                                className="flex items-center gap-1.5 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center"
                            >
                                <CreditCard className="w-4 h-4" />
                                Add Another Payment Method
                            </button>
                        </div>
                    )}

                    {/* Proof Images Section */}
                    <div className="pt-4 border-t border-gray-200 dark:border-zinc-700">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Proof of Delivery / Installation
                        </label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-4 text-center">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleProofImagesChange}
                                className="hidden"
                                id="proof-images-all"
                                disabled={proofImages.length >= 10}
                            />
                            <label
                                htmlFor="proof-images-all"
                                className={`cursor-pointer text-sm font-medium flex items-center justify-center gap-2 ${proofImages.length >= 10 ? 'text-gray-400' : 'text-blue-600 hover:text-blue-700'}`}
                            >
                                <ImageIcon className="w-4 h-4" />
                                {proofImages.length >= 10 ? 'Max 10 images reached' : 'Add Proof Images'}
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Upload up to 10 images (PNG, JPG)
                            </p>
                        </div>

                        {/* Proof Images Preview */}
                        {proofImages.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                {proofImages.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-700 rounded border border-gray-200 dark:border-zinc-600">
                                        <span className="text-xs text-gray-600 dark:text-gray-300 truncate w-3/4">
                                            {file.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeProofImage(index)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title="Remove image"
                                        >
                                            <span className="text-lg leading-none">×</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-zinc-700 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-zinc-700 dark:text-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleComplete}
                        disabled={loading}
                        className="flex-1 flex justify-center items-center gap-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" /> Complete
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AllTasksContent;
