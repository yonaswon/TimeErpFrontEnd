'use client';
import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Search, RotateCcw, Calendar, Filter } from 'lucide-react';

export interface FinanceTableFiltersState {
    date_preset: string;
    date_from: string;
    date_to: string;
    has_invoice: string;
    status: string;
    reason: string;
    category: string;
    search: string;
}

interface Props {
    filters: FinanceTableFiltersState;
    onApply: (filters: FinanceTableFiltersState) => void;
    onReset: () => void;
    showReason?: boolean;
    showStatus?: boolean;
    showCategory?: boolean;
    statusOptions?: Array<{ value: string; label: string }>;
    reasonOptions?: Array<{ value: string; label: string }>;
    categoryOptions?: Array<{ id: number; name: string }>;
    searchPlaceholder?: string;
    hideSearch?: boolean;
    hideInvoice?: boolean;
}

const DATE_PRESETS = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'this_week', label: 'This Week' },
    { key: 'this_month', label: 'This Month' },
];

export const EMPTY_FINANCE_FILTERS: FinanceTableFiltersState = {
    date_preset: '', date_from: '', date_to: '',
    has_invoice: '', status: '', reason: '', category: '', search: ''
};

export default function FinanceTableFilters({
    filters, onApply, onReset,
    showReason = false, showStatus = true, showCategory = false,
    statusOptions, reasonOptions, categoryOptions,
    searchPlaceholder = 'Search...',
    hideSearch = false, hideInvoice = false
}: Props) {
    const [local, setLocal] = useState<FinanceTableFiltersState>(filters);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => { setLocal(filters); }, [filters]);

    const set = (field: keyof FinanceTableFiltersState, value: string) => {
        const updated = { ...local, [field]: value };
        if (field === 'date_preset' && value) {
            updated.date_from = '';
            updated.date_to = '';
        }
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
                    {!hideSearch && (
                        <div className="otf-search-box">
                            <Search size={14} className="otf-search-icon" />
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={local.search}
                                onChange={e => set('search', e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && onApply(local)}
                            />
                        </div>
                    )}
                    <button
                        className={`otf-toggle ${expanded ? 'active' : ''}`}
                        onClick={() => setExpanded(!expanded)}
                    >
                        <Filter size={14} />
                        Filters {activeCount > 0 && <span className="otf-badge">{activeCount}</span>}
                    </button>
                </div>
            </div>

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
                        {!hideInvoice && (
                            <div className="otf-field">
                                <label>Invoice Status</label>
                                <select value={local.has_invoice} onChange={e => set('has_invoice', e.target.value)}>
                                    <option value="">All</option>
                                    <option value="true">With Invoice</option>
                                    <option value="false">Without Invoice</option>
                                </select>
                            </div>
                        )}
                        {showStatus && statusOptions && (
                            <div className="otf-field">
                                <label>Status</label>
                                <select value={local.status} onChange={e => set('status', e.target.value)}>
                                    <option value="">All</option>
                                    {statusOptions.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {showReason && reasonOptions && (
                            <div className="otf-field">
                                <label>Reason</label>
                                <select value={local.reason} onChange={e => set('reason', e.target.value)}>
                                    <option value="">All</option>
                                    {reasonOptions.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {showCategory && categoryOptions && (
                            <div className="otf-field">
                                <label>Category</label>
                                <select value={local.category} onChange={e => set('category', e.target.value)}>
                                    <option value="">All</option>
                                    {categoryOptions.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
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
