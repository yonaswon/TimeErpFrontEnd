'use client';
import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '@/api';
import { ArealRecord, Material, Inventory } from '../types';

interface Props {
    record: ArealRecord;
    materials: Material[];
    inventories: Inventory[];
    onClose: () => void;
    onUpdated: () => void;
}

export default function EditArealRecord({ record, materials, inventories, onClose, onUpdated }: Props) {
    const [form, setForm] = useState({
        material: record.material,
        inventory: record.inventory,
        price: record.price,
        width: record.width,
        height: record.height,
        amount: record.amount,
        confirmed: record.confirmed,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        try {
            setSaving(true);
            setError(null);
            await api.patch(`/areal-records/${record.id}/`, {
                material: form.material,
                inventory: form.inventory,
                price: form.price,
                width: form.width,
                height: form.height,
                amount: form.amount,
                confirmed: form.confirmed,
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
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Areal Record</h2>
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

                    {/* Pieces Summary */}
                    {record.each_materials && record.each_materials.length > 0 && (
                        <div className="p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg">
                            <div className="text-xs font-medium text-teal-700 dark:text-teal-300">
                                {record.each_materials.length} piece(s) created from this record
                            </div>
                        </div>
                    )}

                    {/* Material */}
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

                    {/* Inventory */}
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

                    {/* Width & Height */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Width</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.width}
                                onChange={(e) => setForm({ ...form, width: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Height</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.height}
                                onChange={(e) => setForm({ ...form, height: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                        <input
                            type="number"
                            value={form.amount}
                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Confirmed */}
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirmed</label>
                        <button
                            onClick={() => setForm({ ...form, confirmed: !form.confirmed })}
                            className={`w-12 h-6 rounded-full transition-colors relative ${form.confirmed ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-600'
                                }`}
                        >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.confirmed ? 'left-6' : 'left-0.5'
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
