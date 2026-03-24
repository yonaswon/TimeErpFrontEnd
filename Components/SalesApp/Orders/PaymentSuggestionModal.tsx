import { useState, useRef, useEffect } from "react";
import { X, Save, Loader, AlertCircle, Scan, Image as ImageIcon, Loader2 } from "lucide-react";
import jsQR from "jsqr";
import api from "@/api";

interface PaymentSuggestionModalProps {
    orderContainer: any;
    payment?: any; // If passed, we edit it, else create new
    onClose: () => void;
    onSuccess: () => void;
}

const PaymentSuggestionModal = ({ orderContainer, payment, onClose, onSuccess }: PaymentSuggestionModalProps) => {
    const isEditing = !!payment;

    const [formData, setFormData] = useState({
        suggested_amount: payment?.amount || "",
        suggested_wallet: payment?.wallet?.id || 1,
        suggested_method: payment?.method || "BANK",
        suggested_account: payment?.account?.id || "",
        suggested_transaction_id: payment?.transaction_id || "",
        suggested_reason: payment?.reason || "PRE",
        suggested_note: payment?.note || "",
        suggested_invoice: payment?.invoice || false,
        suggested_confirmation_image: null as File | null,
        suggested_invoice_image: null as File | null,
    });

    const [wallets, setWallets] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);

    const [loadingAssets, setLoadingAssets] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [checkStatus, setCheckStatus] = useState({ is_checking: false, is_unique: null as boolean | null });
    const [scanningQR, setScanningQR] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);

    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const confirmImgRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchAssets = async () => {
            setLoadingAssets(true);
            try {
                const [wRes, aRes] = await Promise.all([
                    api.get("/finance/wallet/"),
                    api.get("/finance/account/")
                ]);
                setWallets(wRes.data.results || wRes.data);
                setAccounts(aRes.data.results || aRes.data);
            } catch (err) {
                console.error("Failed to load wallets/accounts", err);
            } finally {
                setLoadingAssets(false);
            }
        };
        fetchAssets();
    }, []);

    const selectedAccountObj = accounts.find(a => a.id === Number(formData.suggested_account));
    const expectedTransactionLength = selectedAccountObj?.transaction_id_number_of_character || null;

    const checkTransactionUniqueness = (transactionId: string, requiredLength: number | null) => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        if (!transactionId || transactionId.trim() === '') {
            setCheckStatus({ is_checking: false, is_unique: null });
            return;
        }

        if (requiredLength && transactionId.length !== requiredLength) {
            setCheckStatus({ is_checking: false, is_unique: null });
            return;
        }

        setCheckStatus({ is_checking: true, is_unique: null });
        debounceTimer.current = setTimeout(async () => {
            try {
                const res = await api.post('/finance/payment/check_transaction_id/', { transaction_id: transactionId });
                setCheckStatus({ is_checking: false, is_unique: res.data.is_unique });
            } catch (err) {
                setCheckStatus({ is_checking: false, is_unique: null });
            }
        }, 500);
    };

    const handleMethodChange = (method: string) => {
        let wallet = formData.suggested_wallet;
        if (method === "BANK" || method === "CHECK") wallet = 1;
        else if (method === "CASH") wallet = 2;

        setFormData(prev => ({
            ...prev,
            suggested_method: method,
            suggested_wallet: wallet,
            suggested_account: "",
            suggested_transaction_id: "",
        }));
        setCheckStatus({ is_checking: false, is_unique: null });
    };

    const handleAccountChange = (accountId: string) => {
        setFormData(prev => ({ ...prev, suggested_account: accountId, suggested_transaction_id: "" }));
        setCheckStatus({ is_checking: false, is_unique: null });
    };

    const handleTransactionIdChange = (txId: string) => {
        setFormData(prev => ({ ...prev, suggested_transaction_id: txId }));
        if (formData.suggested_method === "BANK") {
            checkTransactionUniqueness(txId, expectedTransactionLength);
        }
    };

    const handleScanQR = async () => {
        if (!formData.suggested_confirmation_image) return;
        setScanningQR(true);
        setScanError(null);

        try {
            const codeData = await new Promise<string | null>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (!ctx) { resolve(null); return; }

                        const tryDecode = (w: number, h: number) => {
                            canvas.width = w; canvas.height = h;
                            ctx.drawImage(img, 0, 0, w, h);
                            const imageData = ctx.getImageData(0, 0, w, h);
                            try { return jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" }); }
                            catch (err) { return null; }
                        };

                        let ratio = Math.min(1, 2500 / img.width, 2500 / img.height);
                        let w1 = Math.round(img.width * ratio), h1 = Math.round(img.height * ratio);
                        let code = tryDecode(w1, h1) || tryDecode(Math.round(w1 * 0.5), Math.round(h1 * 0.5)) || tryDecode(Math.round(w1 * 0.25), Math.round(h1 * 0.25));
                        resolve(code ? code.data : null);
                    };
                    img.onerror = () => resolve(null);
                    img.src = e.target?.result as string;
                };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(formData.suggested_confirmation_image!);
            });

            if (codeData) {
                handleTransactionIdChange(codeData.trim());
            } else {
                setScanError('No QR code found in image');
                setTimeout(() => setScanError(null), 5000);
            }
        } catch (err) {
            setScanError('Failed to scan image');
        } finally {
            setScanningQR(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const data = new FormData();
            data.append("edit_type", isEditing ? "PAYMENT_EDIT" : "PAYMENT_ADD");
            data.append("order_container", orderContainer.id);
            if (isEditing) data.append("payment", payment.id);

            data.append("suggested_amount", formData.suggested_amount);
            if (formData.suggested_wallet) data.append("suggested_wallet", String(formData.suggested_wallet));
            if (formData.suggested_method) data.append("suggested_method", formData.suggested_method);
            if (formData.suggested_account) data.append("suggested_account", String(formData.suggested_account));
            if (formData.suggested_transaction_id) data.append("suggested_transaction_id", formData.suggested_transaction_id);
            if (formData.suggested_reason) data.append("suggested_reason", formData.suggested_reason);
            if (formData.suggested_note) data.append("suggested_note", formData.suggested_note);
            data.append("suggested_invoice", formData.suggested_invoice ? "true" : "false");

            if (formData.suggested_confirmation_image) {
                data.append("suggested_confirmation_image", formData.suggested_confirmation_image);
            }

            await api.post("/finance/payment-edit-suggestion/", data, {
                headers: { "Content-Type": "multipart/form-data" },
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
            <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {isEditing ? "Suggest Payment Edit" : "Suggest New Payment"}
                    </h2>
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

                    {loadingAssets ? (
                        <div className="flex items-center gap-2 text-gray-500 py-10 justify-center">
                            <Loader className="animate-spin" size={20} /> Loading resources...
                        </div>
                    ) : (
                        <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                                    <input
                                        type="number"
                                        value={formData.suggested_amount}
                                        onChange={(e) => setFormData({ ...formData, suggested_amount: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Method</label>
                                    <select
                                        value={formData.suggested_method}
                                        onChange={(e) => handleMethodChange(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    >
                                        <option value="BANK">BANK</option>
                                        <option value="CASH">CASH</option>
                                        <option value="CHECK">CHECK</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wallet</label>
                                    <div className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-100 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400 text-sm">
                                        {wallets.find(w => w.id === Number(formData.suggested_wallet))?.name || "Auto-assigned"}
                                    </div>
                                </div>
                                {(formData.suggested_method === "BANK" || formData.suggested_method === "CHECK") && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account</label>
                                        <select
                                            value={formData.suggested_account}
                                            onChange={(e) => handleAccountChange(e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">Select Account</option>
                                            {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {formData.suggested_method === "BANK" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Transaction ID * {expectedTransactionLength ? `(${expectedTransactionLength} chars)` : ''}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.suggested_transaction_id}
                                        onChange={(e) => handleTransactionIdChange(e.target.value)}
                                        className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-colors bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white ${(expectedTransactionLength && formData.suggested_transaction_id.length > 0 && formData.suggested_transaction_id.length !== expectedTransactionLength) || checkStatus.is_unique === false
                                            ? 'border-red-500' : (checkStatus.is_unique === true ? 'border-green-500' : 'border-gray-200 dark:border-zinc-700')
                                            }`}
                                        placeholder="Enter transaction ID"
                                        required
                                    />
                                    {expectedTransactionLength && formData.suggested_transaction_id.length > 0 && formData.suggested_transaction_id.length !== expectedTransactionLength && (
                                        <p className="text-xs text-red-500 mt-1">Must be exactly {expectedTransactionLength} characters.</p>
                                    )}
                                    {((expectedTransactionLength === null) || (expectedTransactionLength !== null && formData.suggested_transaction_id.length === expectedTransactionLength)) && formData.suggested_transaction_id.length > 0 && (
                                        <div className="mt-1 text-xs">
                                            {checkStatus.is_checking && <span className="text-gray-500 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Checking uniqueness...</span>}
                                            {!checkStatus.is_checking && checkStatus.is_unique === true && <span className="text-green-500 font-medium">✅ Unique</span>}
                                            {!checkStatus.is_checking && checkStatus.is_unique === false && <span className="text-red-500 font-medium">❌ This Transaction ID is already used</span>}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
                                <select
                                    value={formData.suggested_reason}
                                    onChange={(e) => setFormData({ ...formData, suggested_reason: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                >
                                    <option value="PRE">PRE-PAYMENT</option>
                                    <option value="REM">REMAINING PAYMENT</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Review Receipt Image</label>
                                <div className="flex items-center gap-3 w-full">
                                    <div
                                        onClick={() => confirmImgRef.current?.click()}
                                        className="flex-1 p-3 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                                    >
                                        <ImageIcon className="text-blue-500" size={18} />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                                            {formData.suggested_confirmation_image ? formData.suggested_confirmation_image.name : "Select Receipt"}
                                        </span>
                                    </div>
                                    {formData.suggested_confirmation_image && formData.suggested_method === "BANK" && (
                                        <button
                                            type="button"
                                            onClick={handleScanQR}
                                            disabled={scanningQR}
                                            className="flex flex-col items-center justify-center p-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                                        >
                                            {scanningQR ? <Loader2 className="animate-spin mb-1" size={18} /> : <Scan className="mb-1" size={18} />}
                                            <span className="text-[10px] font-bold uppercase">Scan QR</span>
                                        </button>
                                    )}
                                </div>
                                {scanError && (
                                    <div className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                        <AlertCircle size={14} /> {scanError}
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={confirmImgRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setFormData({ ...formData, suggested_confirmation_image: e.target.files[0] });
                                        }
                                    }}
                                />
                            </div>

                        </form>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3 bg-gray-50 dark:bg-zinc-950">
                    <button onClick={onClose} disabled={loading} className="px-5 py-2.5 flex items-center justify-center rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button form="payment-form" type="submit" disabled={loading || loadingAssets} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors">
                        {loading ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                        Submit Suggestion
                    </button>
                </div>
            </div>
        </div>
    );
};
export default PaymentSuggestionModal;
