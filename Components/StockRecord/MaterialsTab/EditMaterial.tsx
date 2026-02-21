'use client';
import React, { useState } from 'react';
import { X, Loader2, Trash2 } from 'lucide-react';
import api from '@/api';
import { Material, MATERIAL_TYPE_CHOICES, MATERIAL_LABEL_CHOICES } from '../types';

interface Props {
    material: Material;
    onClose: () => void;
    onUpdated: () => void;
}

export default function EditMaterial({ material, onClose, onUpdated }: Props) {
    const [form, setForm] = useState({
        name: material.name,
        type: material.type,
        lable: material.lable || 'OTHER',
        code_name: material.code_name || '',
        min_threshold: material.min_threshold,
        width: material.width || '',
        height: material.height || '',
    });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDelete, setShowDelete] = useState(false);

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            setError('Name is required');
            return;
        }
        try {
            setSaving(true);
            setError(null);
            const payload: any = {
                name: form.name,
                type: form.type,
                lable: form.lable,
                code_name: form.code_name || null,
                min_threshold: form.min_threshold,
            };
            if (form.type === 'A') {
                payload.width = form.width || null;
                payload.height = form.height || null;
            } else {
                payload.width = null;
                payload.height = null;
            }
            await api.patch(`/materials/${material.id}/`, payload);
            onUpdated();
        } catch (err: any) {
            const detail = err.response?.data;
            if (detail && typeof detail === 'object') {
                const messages = Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
                setError(messages.join('\n'));
            } else {
                setError('Failed to update material');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await api.delete(`/materials/${material.id}/`);
            onUpdated();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete material. It may have related records.');
            setShowDelete(false);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white dark:bg-zinc-800 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-4 py-3 flex items-center justify-between z-10">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Material</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowDelete(true)} className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                            <Trash2 size={18} />
                        </button>
                        <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">
                            {error}
                        </div>
                    )}

                    {/* Delete Confirmation */}
                    {showDelete && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-700 dark:text-red-300 mb-3">Are you sure you want to delete this material? This cannot be undone.</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {deleting && <Loader2 size={14} className="animate-spin" />}
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                                <button
                                    onClick={() => setShowDelete(false)}
                                    className="flex-1 py-2 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-zinc-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Info Row */}
                    <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>ID: {material.id}</span>
                        <span>Available: {material.available}</span>
                        <span>Partial: {material.parsialy_available}</span>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                        <select
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value as "L" | "A" | "P" })}
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {MATERIAL_TYPE_CHOICES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Label */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label</label>
                        <select
                            value={form.lable}
                            onChange={(e) => setForm({ ...form, lable: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {MATERIAL_LABEL_CHOICES.map(l => (
                                <option key={l.value} value={l.value}>{l.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Code Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code Name</label>
                        <input
                            type="text"
                            value={form.code_name}
                            onChange={(e) => setForm({ ...form, code_name: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Min Threshold */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Threshold</label>
                        <input
                            type="number"
                            value={form.min_threshold}
                            onChange={(e) => setForm({ ...form, min_threshold: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Width & Height - only for Areal */}
                    {form.type === 'A' && (
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
                    )}

                    {/* Submit */}
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
