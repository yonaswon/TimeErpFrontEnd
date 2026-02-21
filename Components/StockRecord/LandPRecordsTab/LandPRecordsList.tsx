'use client';
import React, { useState, useEffect } from 'react';
import { Search, Plus, Loader2, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';
import api from '@/api';
import { LandPRecord, Material, Inventory } from '../types';
import CreateLandPRecord from './CreateLandPRecord';
import EditLandPRecord from './EditLandPRecord';

export default function LandPRecordsList() {
    const [records, setRecords] = useState<LandPRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [materialFilter, setMaterialFilter] = useState('');
    const [inventoryFilter, setInventoryFilter] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [editRecord, setEditRecord] = useState<LandPRecord | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            setError(null);
            const params: Record<string, string> = {};
            if (materialFilter) params.material_id = materialFilter;
            if (inventoryFilter) params.inventory_id = inventoryFilter;
            const response = await api.get('/landp-records/', { params });
            setRecords(response.data);
        } catch (err) {
            console.error('Error fetching L&P records:', err);
            setError('Failed to load L&P records.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchDropdowns = async () => {
        try {
            const [matRes, invRes] = await Promise.all([
                api.get('/materials/', { params: { type: 'L' } }),
                api.get('/inventories/'),
            ]);
            // Also fetch Piece materials
            const pRes = await api.get('/materials/', { params: { type: 'P' } });
            const allMaterials = [...(matRes.data.results || matRes.data), ...(pRes.data.results || pRes.data)];
            setMaterials(allMaterials);
            setInventories(invRes.data.results || invRes.data);
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    useEffect(() => {
        fetchRecords();
        fetchDropdowns();
    }, [materialFilter, inventoryFilter]);

    const filteredRecords = records.filter(r =>
        r.material_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.inventory_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.created_by_username?.toLowerCase().includes(searchTerm.toLowerCase())
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
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">L&P Records</h2>
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
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search records..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-3 py-2 border rounded-lg transition-colors ${showFilters || materialFilter || inventoryFilter
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                    : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="flex gap-2 mt-3">
                            <select
                                value={materialFilter}
                                onChange={(e) => setMaterialFilter(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Materials</option>
                                {materials.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                            <select
                                value={inventoryFilter}
                                onChange={(e) => setInventoryFilter(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Inventories</option>
                                {inventories.map(i => (
                                    <option key={i.id} value={i.id}>{i.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
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
                            No L&P records found.
                        </div>
                    ) : (
                        filteredRecords.map((record) => (
                            <div
                                key={record.id}
                                onClick={() => setEditRecord(record)}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-zinc-700/50 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                                {record.material_name}
                                            </h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${record.is_active
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                                }`}>
                                                {record.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                            <span>📦 {record.inventory_name}</span>
                                            <span>💰 {record.price}</span>
                                            <span>📊 {record.current_amount}/{record.first_amount}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                                            <span>by {record.created_by_username}</span>
                                            <span>{new Date(record.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showCreate && (
                <CreateLandPRecord
                    materials={materials}
                    inventories={inventories}
                    onClose={() => setShowCreate(false)}
                    onCreated={() => { setShowCreate(false); fetchRecords(); }}
                />
            )}

            {editRecord && (
                <EditLandPRecord
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
