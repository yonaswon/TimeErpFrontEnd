import {
    X,
    User,
    Phone,
    Calendar,
    Package,
    TrendingUp,
    DollarSign,
    Info,
} from "lucide-react";

interface ProductSalesDetailProps {
    sale: any;
    onClose: () => void;
}

const ProductSalesDetail = ({ sale, onClose }: ProductSalesDetailProps) => {
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
                        <div className="p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hidden sm:block shrink-0 h-fit">
                            <TrendingUp size={24} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                                {sale.customer_name || "Product Sale"}
                            </h2>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                    <User size={13} />
                                    <span>
                                        {sale.recorded_by?.first_name ||
                                            sale.recorded_by?.telegram_user_name ||
                                            sale.recorded_by?.username ||
                                            'N/A'}
                                    </span>
                                </div>
                                <span className="hidden sm:inline text-gray-300">•</span>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                    {formatDate(sale.date)}
                                </p>
                            </div>
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

                        {/* Left Column: Customer & Items */}
                        <div className="space-y-6">
                            {/* Customer Info */}
                            <div>
                                <SectionTitle title="Customer Details" icon={User} />
                                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase">Name</p>
                                            <p className="text-base font-semibold text-gray-900 dark:text-white">{sale.customer_name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase">Contact</p>
                                            <p className="text-base font-semibold text-gray-900 dark:text-white">{sale.customer_contact || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sold Items */}
                            <div>
                                <SectionTitle title="Information" icon={Package} />
                                <div className="space-y-3">
                                    {sale.release?.map((item: any, idx: number) => (
                                        <div key={idx} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-3 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                                    <Package size={18} className="text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                                        {item.material?.name || `Material ID: ${item.material?.id || 'Unknown'}`}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {item.material?.code_name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-mono font-medium text-gray-900 dark:text-gray-200 block">
                                                    {Number(item.amount).toLocaleString()} {item.material?.type === 'L' ? 'm' : 'pcs'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Payment & Proof */}
                        <div className="space-y-6">
                            <div>
                                <SectionTitle title="Payment Details" icon={DollarSign} />
                                {sale.payment ? (
                                    <div className="space-y-4">
                                        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Amount</p>
                                                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                                        {formatCurrency(sale.payment.amount)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Method</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                            {sale.payment.method}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                                                    <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold mt-1 ${sale.payment.status === 'C'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        }`}>
                                                        {sale.payment.status === 'C' ? 'Confirmed' : 'Pending'}
                                                    </div>
                                                </div>
                                                {sale.payment.wallet && (
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase">Wallet</p>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                                                            ID: {sale.payment.wallet}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Proof Images */}
                                        {(sale.payment.confirmation_image || sale.payment.invoice_image || sale.payment.additional_image) && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {sale.payment.confirmation_image && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-gray-500 uppercase">Payment Proof</p>
                                                        <div className="relative aspect-video bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 group">
                                                            <img
                                                                src={sale.payment.confirmation_image}
                                                                alt="Payment Proof"
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <a
                                                                href={sale.payment.confirmation_image}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium"
                                                            >
                                                                View Full Size
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                                {sale.payment.invoice_image && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-gray-500 uppercase">Invoice</p>
                                                        <div className="relative aspect-video bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 group">
                                                            <img
                                                                src={sale.payment.invoice_image}
                                                                alt="Invoice"
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <a
                                                                href={sale.payment.invoice_image}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium"
                                                            >
                                                                View Full Size
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                                {sale.payment.additional_image && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-gray-500 uppercase">Additional Image</p>
                                                        <div className="relative aspect-video bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 group">
                                                            <img
                                                                src={sale.payment.additional_image}
                                                                alt="Additional"
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <a
                                                                href={sale.payment.additional_image}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium"
                                                            >
                                                                View Full Size
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-8 bg-gray-50 dark:bg-zinc-900/50 rounded-lg border border-gray-200 dark:border-zinc-800 text-center">
                                        <div className="inline-flex p-3 bg-gray-100 dark:bg-zinc-800 rounded-full mb-3">
                                            <DollarSign size={24} className="text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400 font-medium">No payment information found</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">This record might have been created without a linked payment.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductSalesDetail;
