'use client';
import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '@/api';
import { LandPRecord, Material, Inventory } from '../types';

interface Props {
    record: LandPRecord;
    materials: Material[];
    inventories: Inventory[];
    onClose: () => void;
    onUpdated: () => void;
}

export default function EditLandPRecord({ record, materials, inventories, onClose, onUpdated }: Props) {
    const [form, setForm] = useState({
        material: record.material,
        inventory: record.inventory,
        price: record.price,
        first_amount: record.first_amount,
        current_amount: record.current_amount,
        is_active: record.is_active,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        try {
            setSaving(true);
            setError(null);
            await api.patch(`/landp-records/${record.id}/`, {
                material: form.material,
                inventory: form.inventory,
                price: form.price,
                first_amount: form.first_amount,
                current_amount: form.current_amount,
                is_active: form.is_active,
            });
            onUpdated();
        } catch (err: any) {
            const detail = err.response?.data;
            if (detail && typeof detail === 'object') {
                const messages = Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
                setError(messages.join('\n'));
            } else {
                setError('Failed to update record');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white dark:bg-zinc-800 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-4 py-3 flex items-center justify-between z-10">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit L&P Record</h2>
                    <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">
                            {error}
                        </div>
                    )}

                    {/* Info */}
                    <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>ID: {record.id}</span>
                        <span>By: {record.created_by_username}</span>
                        <span>{new Date(record.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Material Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Material</label>
                        <select
                            value={form.material}
                            onChange={(e) => setForm({ ...form, material: parseInt(e.target.value) })}
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {materials.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Inventory Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inventory</label>
                        <select
                            value={form.inventory}
                            onChange={(e) => setForm({ ...form, inventory: parseInt(e.target.value) })}
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {inventories.map(i => (
                                <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
                        <input
                            type="number"
                            step="0.01"
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* First Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            value={form.first_amount}
                            onChange={(e) => setForm({ ...form, first_amount: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Current Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            value={form.current_amount}
                            onChange={(e) => setForm({ ...form, current_amount: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
                        <button
                            onClick={() => setForm({ ...form, is_active: !form.is_active })}
                            className={`w-12 h-6 rounded-full transition-colors relative ${form.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-600'
                                }`}
                        >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'left-6' : 'left-0.5'
                                }`} />
                        </button>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving && <Loader2 size={16} className="animate-spin" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
