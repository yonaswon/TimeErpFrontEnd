'use client';
import React, { useState, useEffect } from 'react';
import { Search, Loader2, RefreshCw, ChevronDown } from 'lucide-react';
import api from '@/api';
import { EachArealMaterial, Material, Inventory } from '../types';
import EditEachArealMaterial from './EditEachArealMaterial';

export default function EachArealMaterialsList() {
    const [pieces, setPieces] = useState<EachArealMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [materialFilter, setMaterialFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [editPiece, setEditPiece] = useState<EachArealMaterial | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    const fetchPieces = async () => {
        try {
            setLoading(true);
            setError(null);
            const params: Record<string, string> = {};
            if (materialFilter) params.material = materialFilter;
            if (statusFilter === 'available') params.finished = 'false';
            if (statusFilter === 'finished') params.finished = 'true';
            const response = await api.get('/each-areal-materials/', { params });
            setPieces(response.data);
        } catch (err) {
            console.error('Error fetching each areal materials:', err);
            setError('Failed to load pieces.');
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
        fetchPieces();
        fetchDropdowns();
    }, [materialFilter, statusFilter]);

    const filteredPieces = pieces.filter(p =>
        p.material_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toString().includes(searchTerm) ||
        p.inventory_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (piece: EachArealMaterial) => {
        if (piece.finished) {
            return { text: 'Finished', className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' };
        }
        if (piece.started) {
            return { text: 'Started', className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' };
        }
        return { text: 'Available', className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' };
    };

    if (loading && pieces.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error && pieces.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-red-500 dark:text-red-400 mb-4">{error}</div>
                <button onClick={() => fetchPieces()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Each Areal Material</h2>
                        <button
                            onClick={() => { setRefreshing(true); fetchPieces(); }}
                            disabled={refreshing}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
                        >
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by name, code, inventory..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-3 py-2 border rounded-lg transition-colors ${showFilters || materialFilter || statusFilter
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
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Status</option>
                                <option value="available">Available</option>
                                <option value="finished">Finished</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Count */}
                <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {filteredPieces.length} piece{filteredPieces.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* List */}
                <div className="divide-y divide-gray-100 dark:divide-zinc-700">
                    {filteredPieces.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                            No pieces found.
                        </div>
                    ) : (
                        filteredPieces.map((piece) => {
                            const status = getStatusBadge(piece);
                            return (
                                <div
                                    key={piece.id}
                                    onClick={() => setEditPiece(piece)}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-700/50 cursor-pointer transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                                                {piece.material_name}
                                            </h3>
                                            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                                                #{piece.code}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}>
                                                {status.text}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                            <span>📏 {piece.current_width}×{piece.current_height}</span>
                                            {piece.inventory_name && <span>📦 {piece.inventory_name}</span>}
                                            <span>{new Date(piece.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {editPiece && (
                <EditEachArealMaterial
                    piece={editPiece}
                    inventories={inventories}
                    onClose={() => setEditPiece(null)}
                    onUpdated={() => { setEditPiece(null); fetchPieces(); }}
                />
            )}
        </>
    );
}
