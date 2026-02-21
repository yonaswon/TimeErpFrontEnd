'use client';
import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '@/api';
import { Material, Inventory } from '../types';

interface Props {
    materials: Material[];
    inventories: Inventory[];
    onClose: () => void;
    onCreated: () => void;
}

export default function CreateLandPRecord({ materials, inventories, onClose, onCreated }: Props) {
    const [form, setForm] = useState({
        material: '',
        inventory: '',
        price: '',
        first_amount: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!form.material || !form.inventory || !form.price || !form.first_amount) {
            setError('All fields are required');
            return;
        }
        try {
            setSaving(true);
            setError(null);
            await api.post('/landp-records/', {
                material: parseInt(form.material),
                inventory: parseInt(form.inventory),
                price: form.price,
                first_amount: form.first_amount,
            });
            onCreated();
        } catch (err: any) {
            const detail = err.response?.data;
            if (detail && typeof detail === 'object') {
                const messages = Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
                setError(messages.join('\n'));
            } else {
                setError('Failed to create record');
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
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create L&P Record</h2>
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

                    {/* Material Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Material *</label>
                        <select
                            value={form.material}
                            onChange={(e) => setForm({ ...form, material: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Material (L/P only)</option>
                            {materials.map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.type === 'L' ? 'Length' : 'Piece'})</option>
                            ))}
                        </select>
                    </div>

                    {/* Inventory Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inventory *</label>
                        <select
                            value={form.inventory}
                            onChange={(e) => setForm({ ...form, inventory: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Inventory</option>
                            {inventories.map(i => (
                                <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                            placeholder="0.00"
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* First Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={form.first_amount}
                            onChange={(e) => setForm({ ...form, first_amount: e.target.value })}
                            placeholder="0.00"
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving && <Loader2 size={16} className="animate-spin" />}
                        {saving ? 'Creating...' : 'Create Record'}
                    </button>
                </div>
            </div>
        </div>
    );
}
