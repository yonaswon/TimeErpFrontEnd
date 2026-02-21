'use client';
import React, { useState, useEffect } from 'react';
import { Search, Plus, Loader2, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';
import api from '@/api';
import { ArealRecord, Material, Inventory } from '../types';
import CreateArealRecord from './CreateArealRecord';
import EditArealRecord from './EditArealRecord';

export default function ArealRecordsList() {
    const [records, setRecords] = useState<ArealRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [editRecord, setEditRecord] = useState<ArealRecord | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/areal-records/');
            setRecords(response.data);
        } catch (err) {
            console.error('Error fetching areal records:', err);
            setError('Failed to load areal records.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchDropdowns = async () => {
        try {
            const [matRes, invRes] = await Promise.all([
                api.get('/materials/', { params: { type: 'A' } }),
                api.get('/inventories/'),
            ]);
            setMaterials(matRes.data.results || matRes.data);
            setInventories(invRes.data.results || invRes.data);
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    useEffect(() => {
        fetchRecords();
        fetchDropdowns();
    }, []);

    const filteredRecords = records.filter(r =>
        r.material_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.inventory_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && records.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error && records.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-red-500 dark:text-red-400 mb-4">{error}</div>
                <button onClick={() => fetchRecords()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-zinc-700">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Areal Records</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { setRefreshing(true); fetchRecords(); }}
                                disabled={refreshing}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
                            >
                                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={() => setShowCreate(true)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Plus size={16} />
                                Create
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search areal records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Count */}
                <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* List */}
                <div className="divide-y divide-gray-100 dark:divide-zinc-700">
                    {filteredRecords.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                            No areal records found.
                        </div>
                    ) : (
                        filteredRecords.map((record) => (
                            <div key={record.id}>
                                <div className="p-4 hover:bg-gray-50 dark:hover:bg-zinc-700/50 cursor-pointer transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0" onClick={() => setEditRecord(record)}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                                    {record.material_name}
                                                </h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${record.confirmed
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                                    }`}>
                                                    {record.confirmed ? 'Confirmed' : 'Pending'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                <span>📦 {record.inventory_name}</span>
                                                <span>💰 {record.price}</span>
                                                <span>📏 {record.width}×{record.height}</span>
                                                <span>🔢 {record.amount} pcs</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                                                <span>by {record.created_by_username}</span>
                                                <span>{new Date(record.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 ml-2">
                                            {record.each_materials && record.each_materials.length > 0 && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === record.id ? null : record.id); }}
                                                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                >
                                                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === record.id ? 'rotate-180' : ''}`} />
                                                </button>
                                            )}
                                            <ChevronRight
                                                size={16}
                                                className="text-gray-400 dark:text-gray-500 flex-shrink-0"
                                                onClick={() => setEditRecord(record)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Each Materials */}
                                {expandedId === record.id && record.each_materials && record.each_materials.length > 0 && (
                                    <div className="px-4 pb-3">
                                        <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-3">
                                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                Pieces ({record.each_materials.length})
                                            </div>
                                            <div className="space-y-1.5">
                                                {record.each_materials.map((piece) => (
                                                    <div key={piece.id} className="flex items-center justify-between text-xs">
                                                        <span className="text-gray-700 dark:text-gray-300">
                                                            Code #{piece.code} — {piece.current_width}×{piece.current_height}
                                                        </span>
                                                        <div className="flex gap-1.5">
                                                            {piece.started && (
                                                                <span className="px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                                                    Started
                                                                </span>
                                                            )}
                                                            {piece.finished && (
                                                                <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                                                    Finished
                                                                </span>
                                                            )}
                                                            {!piece.started && !piece.finished && (
                                                                <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                                                    Available
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showCreate && (
                <CreateArealRecord
                    materials={materials}
                    inventories={inventories}
                    onClose={() => setShowCreate(false)}
                    onCreated={() => { setShowCreate(false); fetchRecords(); }}
                />
            )}

            {editRecord && (
                <EditArealRecord
                    record={editRecord}
                    materials={materials}
                    inventories={inventories}
                    onClose={() => setEditRecord(null)}
                    onUpdated={() => { setEditRecord(null); fetchRecords(); }}
                />
            )}
        </>
    );
}
