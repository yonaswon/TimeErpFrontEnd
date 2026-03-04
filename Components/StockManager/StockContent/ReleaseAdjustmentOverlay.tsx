'use client';
import React, { useState } from 'react';
import { X, Loader2, ArrowDownRight } from 'lucide-react';
import api from '@/api';

interface Props {
    materialId: number;
    materialName: string;
    available: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ReleaseAdjustmentOverlay({ materialId, materialName, available, onClose, onSuccess }: Props) {
    const [amount, setAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount greater than 0');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            await api.post('/api/release/adjustment_release/', {
                material: materialId,
                amount: parseFloat(amount),
            });
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 1000);
        } catch (err: any) {
            const detail = err.response?.data?.error;
            setError(detail || 'Failed to create adjustment release');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white dark:bg-zinc-800 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-4 py-3 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                        <ArrowDownRight size={20} className="text-amber-500" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Release Adjustment</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Success State */}
                    {success && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-600 dark:text-green-400">
                            Adjustment release created successfully!
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Material Info */}
                    <div className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{materialName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Available in stock: <span className="font-medium text-gray-700 dark:text-gray-300">{available}</span>
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Amount to Release
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount..."
                            disabled={success}
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        />
                    </div>

                    {/* Submit Button */}
                    {!success && (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !amount}
                            className="w-full py-3 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting && <Loader2 size={16} className="animate-spin" />}
                            {submitting ? 'Processing...' : 'Release Adjustment'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
