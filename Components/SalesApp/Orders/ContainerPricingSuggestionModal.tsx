import { useState } from "react";
import { X, Save, Loader, AlertCircle } from "lucide-react";
import api from "@/api";

interface ContainerPricingSuggestionModalProps {
    orderContainer: any;
    onClose: () => void;
    onSuccess: () => void;
}

const ContainerPricingSuggestionModal = ({ orderContainer, onClose, onSuccess }: ContainerPricingSuggestionModalProps) => {
    const [formData, setFormData] = useState({
        suggested_full_payment: orderContainer.full_payment || "",
        suggested_advance_payment: orderContainer.advance_payment || "",
        suggested_remaining_payment: orderContainer.remaining_payment || "",
    });
    const handleFieldChange = (field: string, value: string) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };

            if (field === "suggested_full_payment" || field === "suggested_advance_payment") {
                const full = parseFloat(updated.suggested_full_payment) || 0;
                const advance = parseFloat(updated.suggested_advance_payment) || 0;
                updated.suggested_remaining_payment = Math.max(0, full - advance).toString();
            }

            return updated;
        });
    };

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.post("/finance/payment-edit-suggestion/", {
                edit_type: "CONTAINER",
                order_container: orderContainer.id,
                suggested_full_payment: formData.suggested_full_payment,
                suggested_advance_payment: formData.suggested_advance_payment,
                suggested_remaining_payment: formData.suggested_remaining_payment,
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to submit suggestion");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Suggest Pricing Change</h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg flex gap-2 items-start text-sm">
                            <AlertCircle size={16} className="mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}
                    <form id="pricing-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Payment</label>
                            <input
                                type="number"
                                value={formData.suggested_full_payment}
                                onChange={(e) => handleFieldChange("suggested_full_payment", e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Advance Payment</label>
                            <input
                                type="number"
                                value={formData.suggested_advance_payment}
                                onChange={(e) => handleFieldChange("suggested_advance_payment", e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remaining Payment</label>
                            <input
                                type="number"
                                value={formData.suggested_remaining_payment}
                                readOnly
                                className="w-full px-4 py-2 bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                            />
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3 bg-gray-50 dark:bg-zinc-950">
                    <button onClick={onClose} disabled={loading} className="px-5 py-2.5 flex items-center justify-center rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button form="pricing-form" type="submit" disabled={loading} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors">
                        {loading ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                        Submit Suggestion
                    </button>
                </div>
            </div>
        </div>
    );
};
export default ContainerPricingSuggestionModal;
