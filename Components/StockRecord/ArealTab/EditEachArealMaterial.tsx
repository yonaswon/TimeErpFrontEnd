'use client';
import React, { useState } from 'react';
import { X, Loader2, Trash2 } from 'lucide-react';
import api from '@/api';
import { EachArealMaterial, Inventory } from '../types';

interface Props {
    piece: EachArealMaterial;
    inventories: Inventory[];
    onClose: () => void;
    onUpdated: () => void;
}

export default function EditEachArealMaterial({ piece, inventories, onClose, onUpdated }: Props) {
    const [form, setForm] = useState({
        current_width: piece.current_width,
        current_height: piece.current_height,
        started: piece.started,
        finished: piece.finished,
        inventory: piece.inventory || '',
    });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        try {
            setSaving(true);
            setError(null);
            await api.patch(`/each-areal-materials/${piece.id}/`, {
                current_width: form.current_width,
                current_height: form.current_height,
                started: form.started,
                finished: form.finished,
                inventory: form.inventory || null,
            });
            onUpdated();
        } catch (err: any) {
            const detail = err.response?.data;
            if (detail && typeof detail === 'object') {
                const messages = Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
                setError(messages.join('\n'));
            } else {
                setError('Failed to update piece');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await api.delete(`/each-areal-materials/${piece.id}/`);
            onUpdated();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete piece. It may have related records.');
            setShowDelete(false);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white dark:bg-zinc-800 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-4 py-3 flex items-center justify-between z-10">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Edit Piece #{piece.code}
                    </h2>
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
                            <p className="text-sm text-red-700 dark:text-red-300 mb-3">Are you sure you want to delete piece #{piece.code}? This cannot be undone.</p>
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

                    {/* Info */}
                    <div className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Material</span>
                                <p className="font-medium text-gray-900 dark:text-white">{piece.material_name}</p>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Code</span>
                                <p className="font-medium text-gray-900 dark:text-white font-mono">#{piece.code}</p>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Record ID</span>
                                <p className="font-medium text-gray-900 dark:text-white">{piece.areal_material_record || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Date</span>
                                <p className="font-medium text-gray-900 dark:text-white">{new Date(piece.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Inventory */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inventory</label>
                        <select
                            value={form.inventory}
                            onChange={(e) => setForm({ ...form, inventory: e.target.value ? parseInt(e.target.value) : '' })}
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">No Inventory</option>
                            {inventories.map(i => (
                                <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Dimensions */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Width</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.current_width}
                                onChange={(e) => setForm({ ...form, current_width: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Height</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.current_height}
                                onChange={(e) => setForm({ ...form, current_height: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Area Display */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                            Area: {(parseFloat(form.current_width as string) * parseFloat(form.current_height as string) || 0).toFixed(2)} sq units
                        </div>
                    </div>

                    {/* Started Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Started</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Has cutting/usage begun?</p>
                        </div>
                        <button
                            onClick={() => setForm({ ...form, started: !form.started })}
                            className={`w-12 h-6 rounded-full transition-colors relative ${form.started ? 'bg-orange-500' : 'bg-gray-300 dark:bg-zinc-600'
                                }`}
                        >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.started ? 'left-6' : 'left-0.5'
                                }`} />
                        </button>
                    </div>

                    {/* Finished Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Finished</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Is this piece fully consumed?</p>
                        </div>
                        <button
                            onClick={() => setForm({ ...form, finished: !form.finished })}
                            className={`w-12 h-6 rounded-full transition-colors relative ${form.finished ? 'bg-red-500' : 'bg-gray-300 dark:bg-zinc-600'
                                }`}
                        >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.finished ? 'left-6' : 'left-0.5'
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
