"use client";

import React, { useState, useEffect } from "react";
import api from "@/api";
import { X, Package, AlertCircle, PlusCircle } from "lucide-react";

interface Material {
    id: number;
    name: string;
    type: string; // 'L', 'P', 'A'
    code_name: string;
}

interface AddBomOverlayProps {
    orderId: number;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddBomOverlay: React.FC<AddBomOverlayProps> = ({ orderId, isOpen, onClose, onSuccess }) => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [width, setWidth] = useState<string>("");
    const [height, setHeight] = useState<string>("");

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchMaterials();
            // Reset state
            setSelectedMaterialId("");
            setAmount("");
            setWidth("");
            setHeight("");
            setError(null);
        }
    }, [isOpen]);

    const fetchMaterials = async () => {
        try {
            setFetching(true);
            const res = await api.get("/materials");
            // Some endpoints return { results: [...] } or just [...]
            const data = res.data.results || res.data;
            setMaterials(data);
        } catch (err: any) {
            setError("Failed to fetch materials.");
        } finally {
            setFetching(false);
        }
    };

    const selectedMaterial = materials.find((m) => m.id.toString() === selectedMaterialId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMaterialId) {
            setError("Please select a material.");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const bomItem: any = {
                material: parseInt(selectedMaterialId),
            };

            if (selectedMaterial?.type === "A") {
                if (!width || !height) {
                    setError("Width and height are required for areal materials.");
                    setLoading(false);
                    return;
                }
                bomItem.amount = 1;
                bomItem.width = parseFloat(width);
                bomItem.height = parseFloat(height);
            } else {
                if (!amount) {
                    setError("Amount is required.");
                    setLoading(false);
                    return;
                }
                bomItem.amount = parseFloat(amount);
            }

            await api.post(`/api/orders/${orderId}/add_bom/`, {
                boms_data: [bomItem],
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to add BOM.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <PlusCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add BOM</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="p-4 mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Material</label>
                            <select
                                value={selectedMaterialId}
                                onChange={(e) => setSelectedMaterialId(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={fetching || loading}
                            >
                                <option value="">Select a material</option>
                                {materials.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} ({m.code_name}) - {m.type === "A" ? "Area" : m.type === "L" ? "Length" : "Piece"}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedMaterial && (
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                                {selectedMaterial.type === "A" ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Width (m)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={width}
                                                onChange={(e) => setWidth(e.target.value)}
                                                className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Width"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Height (m)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={height}
                                                onChange={(e) => setHeight(e.target.value)}
                                                className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Height"
                                                required
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Amount ({selectedMaterial.type === "L" ? "m" : "pcs"})
                                        </label>
                                        <input
                                            type="number"
                                            step={selectedMaterial.type === "P" ? "1" : "0.01"}
                                            min="0"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Amount"
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-zinc-700 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !selectedMaterialId}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                            >
                                {loading ? "Adding..." : "Add BOM"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddBomOverlay;
