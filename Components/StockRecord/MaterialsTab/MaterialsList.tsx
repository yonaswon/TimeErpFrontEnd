'use client';
import React, { useState, useEffect } from 'react';
import { Search, Plus, Loader2, RefreshCw, ChevronRight, Filter } from 'lucide-react';
import api from '@/api';
import { Material, MaterialsResponse, MATERIAL_TYPE_CHOICES, MATERIAL_LABEL_CHOICES } from '../types';
import CreateMaterial from './CreateMaterial';
import EditMaterial from './EditMaterial';

export default function MaterialsList() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [labelFilter, setLabelFilter] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [editMaterial, setEditMaterial] = useState<Material | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const fetchMaterials = async (url?: string, append = false) => {
        try {
            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setError(null);
            const params: Record<string, string> = {};
            if (typeFilter) params.type = typeFilter;
            if (labelFilter) params.lable = labelFilter;

            const response = await api.get<MaterialsResponse>(url || '/materials/', { params: append ? {} : params });
            if (append) {
                setMaterials(prev => [...prev, ...response.data.results]);
            } else {
                setMaterials(response.data.results);
            }
            setNextPage(response.data.next);
        } catch (err) {
            console.error('Error fetching materials:', err);
            setError('Failed to load materials.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, [typeFilter, labelFilter]);

    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.code_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    );

    const getTypeDisplay = (type: string) => {
        const found = MATERIAL_TYPE_CHOICES.find(t => t.value === type);
        return found ? found.label : type;
    };

    const getLabelColor = (lable: string) => {
        const colors: Record<string, string> = {
            'COLOR': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
            'BG': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
            'LED': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            'OL': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
            'PS': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
            'OTHER': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
        };
        return colors[lable] || colors['OTHER'];
    };

    const getTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            'L': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
            'A': 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
            'P': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
        };
        return colors[type] || '';
    };

    if (loading && materials.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error && materials.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-red-500 dark:text-red-400 mb-4">{error}</div>
                <button
                    onClick={() => fetchMaterials()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
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
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Materials</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { setRefreshing(true); fetchMaterials(); }}
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
                                placeholder="Search materials..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-3 py-2 border rounded-lg transition-colors ${showFilters || typeFilter || labelFilter
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                    : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="flex gap-2 mt-3">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Types</option>
                                {MATERIAL_TYPE_CHOICES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                            <select
                                value={labelFilter}
                                onChange={(e) => setLabelFilter(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Labels</option>
                                {MATERIAL_LABEL_CHOICES.map(l => (
                                    <option key={l.value} value={l.value}>{l.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Count */}
                <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {filteredMaterials.length} material{filteredMaterials.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* List */}
                <div className="divide-y divide-gray-100 dark:divide-zinc-700">
                    {filteredMaterials.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                            {searchTerm ? 'No materials match your search.' : 'No materials found.'}
                        </div>
                    ) : (
                        filteredMaterials.map((material) => (
                            <div
                                key={material.id}
                                onClick={() => setEditMaterial(material)}
                                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-700/50 cursor-pointer transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                            {material.name}
                                        </h3>
                                        {material.code_name && (
                                            <span className="text-xs bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                                                {material.code_name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTypeBadge(material.type)}`}>
                                            {getTypeDisplay(material.type)}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getLabelColor(material.lable)}`}>
                                            {material.lable}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Available: {material.available}
                                        </span>
                                        {material.type === 'A' && material.width && material.height && (
                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                {material.width}×{material.height}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2" />
                            </div>
                        ))
                    )}
                </div>

                {/* Load More */}
                {nextPage && (
                    <div className="p-4 border-t border-gray-100 dark:border-zinc-700">
                        <button
                            onClick={() => fetchMaterials(nextPage, true)}
                            disabled={loadingMore}
                            className="w-full py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                        >
                            {loadingMore ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 size={14} className="animate-spin" /> Loading...
                                </span>
                            ) : (
                                'Load More'
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Create Overlay */}
            {showCreate && (
                <CreateMaterial
                    onClose={() => setShowCreate(false)}
                    onCreated={() => { setShowCreate(false); fetchMaterials(); }}
                />
            )}

            {/* Edit Overlay */}
            {editMaterial && (
                <EditMaterial
                    material={editMaterial}
                    onClose={() => setEditMaterial(null)}
                    onUpdated={() => { setEditMaterial(null); fetchMaterials(); }}
                />
            )}
        </>
    );
}
