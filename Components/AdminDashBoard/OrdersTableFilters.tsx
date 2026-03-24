'use client';
import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Search, RotateCcw, Calendar, Filter } from 'lucide-react';

interface TableFilters {
    date_preset: string;
    date_from: string;
    date_to: string;
    posted_by: string;
    client: string;
    material: string;
    order_status: string;
    has_invoice: string;
    search: string;
}

interface Props {
    filters: TableFilters;
    onApply: (filters: TableFilters) => void;
    onReset: () => void;
}

const DATE_PRESETS = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'this_week', label: 'This Week' },
    { key: 'this_month', label: 'This Month' },
];

const ORDER_STATUSES = [
    'PRE-ACCEPTED', 'PRE-CONFIRMED', 'CNC-STARTED', 'CNC-COMPLETED',
    'ASSEMBLY-STARTED', 'ASSEMBLY-COMPLETED', 'DANDI-STARTED',
    'REM-ACCEPTED', 'REM-CONFIRMED',
];

export const EMPTY_TABLE_FILTERS: TableFilters = {
    date_preset: '', date_from: '', date_to: '',
    posted_by: '', client: '', material: '', order_status: '', has_invoice: '', search: ''
};

export default function OrdersTableFilters({ filters, onApply, onReset }: Props) {
    const [local, setLocal] = useState<TableFilters>(filters);
    const [users, setUsers] = useState<Array<{ id: number; username: string; telegram_user_name: string }>>([]);
    const [materials, setMaterials] = useState<Array<{ id: number; name: string }>>([]);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        api.get('/core/teams/').then(res => {
            setUsers(res.data?.results || res.data || []);
        }).catch(() => { });
        api.get('/api/materials/').then(res => {
            setMaterials(res.data?.results || res.data || []);
        }).catch(() => { });
    }, []);

    useEffect(() => { setLocal(filters); }, [filters]);

    const set = (field: keyof TableFilters, value: string) => {
        const updated = { ...local, [field]: value };
        // If picking a preset, clear custom dates
        if (field === 'date_preset' && value) {
            updated.date_from = '';
            updated.date_to = '';
        }
        // If picking custom date, clear preset
        if ((field === 'date_from' || field === 'date_to') && value) {
            updated.date_preset = '';
        }
        setLocal(updated);
    };

    const handlePresetClick = (key: string) => {
        const val = local.date_preset === key ? '' : key;
        const updated = { ...local, date_preset: val, date_from: '', date_to: '' };
        setLocal(updated);
        onApply(updated);
    };

    const activeCount = Object.values(local).filter(v => v).length;

    return (
        <div className="orders-table-filters">
            {/* Date preset chips */}
            <div className="otf-row">
                <div className="otf-presets">
                    {DATE_PRESETS.map(p => (
                        <button
                            key={p.key}
                            className={`otf-chip ${local.date_preset === p.key ? 'active' : ''}`}
                            onClick={() => handlePresetClick(p.key)}
                        >
                            <Calendar size={12} />
                            {p.label}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div className="otf-search-box">
                        <Search size={14} className="otf-search-icon" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={local.search}
                            onChange={e => set('search', e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && onApply(local)}
                        />
                    </div>
                    <button
                        className={`otf-toggle ${expanded ? 'active' : ''}`}
                        onClick={() => setExpanded(!expanded)}
                    >
                        <Filter size={14} />
                        Filters {activeCount > 0 && <span className="otf-badge">{activeCount}</span>}
                    </button>
                </div>
            </div>

            {/* Expanded filters */}
            {expanded && (
                <div className="otf-expanded">
                    <div className="otf-grid">
                        <div className="otf-field">
                            <label>From</label>
                            <input type="date" value={local.date_from} onChange={e => set('date_from', e.target.value)} />
                        </div>
                        <div className="otf-field">
                            <label>To</label>
                            <input type="date" value={local.date_to} onChange={e => set('date_to', e.target.value)} />
                        </div>
                        <div className="otf-field">
                            <label>Salesperson</label>
                            <select value={local.posted_by} onChange={e => set('posted_by', e.target.value)}>
                                <option value="">All</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.telegram_user_name || u.username || `User ${u.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="otf-field">
                            <label>Customer</label>
                            <input
                                type="text"
                                placeholder="Search client..."
                                value={local.client}
                                onChange={e => set('client', e.target.value)}
                            />
                        </div>
                        <div className="otf-field">
                            <label>Material</label>
                            <select value={local.material} onChange={e => set('material', e.target.value)}>
                                <option value="">All Materials</option>
                                {materials.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="otf-field">
                            <label>Order Status</label>
                            <select value={local.order_status} onChange={e => set('order_status', e.target.value)}>
                                <option value="">All Statuses</option>
                                {ORDER_STATUSES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="otf-field">
                            <label>Invoice Status</label>
                            <select value={local.has_invoice} onChange={e => set('has_invoice', e.target.value)}>
                                <option value="">All</option>
                                <option value="true">With Invoice</option>
                                <option value="false">Without Invoice</option>
                            </select>
                        </div>
                    </div>

                    <div className="otf-actions">
                        <button className="otf-apply" onClick={() => onApply(local)}>
                            <Search size={13} /> Apply
                        </button>
                        <button className="otf-reset" onClick={() => { onReset(); setExpanded(false); }}>
                            <RotateCcw size={13} /> Reset
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export type { TableFilters };
