import {
    TrendingUp,
    User,
    Calendar,
    Package,
} from "lucide-react";

interface ProductSalesCardProps {
    sale: any;
    onViewDetails: (sale: any) => void;
}

const ProductSalesCard = ({ sale, onViewDetails }: ProductSalesCardProps) => {
    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
        }).format(new Date(dateString));
    };

    const itemCount = sale.release?.length || 0;

    return (
        <div
            onClick={() => onViewDetails(sale)}
            className="group flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
        >
            {/* --- HEADER --- */}
            <div className="p-3 sm:p-4 pb-2">
                <div className="flex justify-between items-start mb-1">
                    <div className="flex-1 min-w-0 mr-2">
                        <h3
                            className="font-bold text-gray-900 dark:text-white text-base sm:text-lg line-clamp-1 break-all"
                            title={sale.customer_name}
                        >
                            {sale.customer_name || "Unknown Customer"}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {sale.customer_contact || "No Contact Info"}
                        </p>
                    </div>
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg shrink-0">
                        <TrendingUp size={20} />
                    </div>
                </div>
            </div>

            {/* --- BODY: Info --- */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-50 dark:border-zinc-800/50 flex-1">
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <Package size={14} className="text-blue-500" />
                        <span className="font-medium">{itemCount} Items</span>
                    </div>
                    <span className="text-gray-300 dark:text-zinc-700">|</span>
                    <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{formatDate(sale.date)}</span>
                    </div>
                </div>
            </div>

            {/* Footer - Recorded By */}
            <div className="px-3 sm:px-4 py-2 bg-gray-50/50 dark:bg-zinc-900/50 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    <User size={13} className="text-gray-400" />
                    <span className="text-xs text-gray-500">
                        Recorded by: {sale.recorded_by?.first_name || sale.recorded_by?.telegram_user_name || 'N/A'}
                    </span>
                </div>
            </div>

        </div>
    );
};

export default ProductSalesCard;
