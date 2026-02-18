'use client';
import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Search, RotateCcw } from 'lucide-react';
import { Filters } from './types';

interface FilterBarProps {
    filters: Filters;
    onApply: (filters: Filters) => void;
    onReset: () => void;
    designTypes: Array<{ id: number; name: string }>;
}

const ORDER_STATUSES = [
    'PRE-ACCEPTED',
    'PRE-PAYMENT CONFIRMED',
    'CNC-STARTED',
    'CNC-COMPLETED',
    'ASSEMBLY-STARTED',
    'ASSEMBLY-COMPLETED',
    'DANDI-STARTED',
    'REM-ACCEPTED',
    'REM-CONFIRMED',
];

export default function FilterBar({ filters, onApply, onReset, designTypes }: FilterBarProps) {
    const [local, setLocal] = useState<Filters>(filters);
    const [users, setUsers] = useState<Array<{ id: number; username: string; telegram_user_name: string }>>([]);

    useEffect(() => {
        api.get('/core/teams/').then(res => {
            setUsers(res.data?.results || res.data || []);
        }).catch(() => { });
    }, []);

    useEffect(() => {
        setLocal(filters);
    }, [filters]);

    const handleChange = (field: keyof Filters, value: string) => {
        setLocal(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="admin-filter-bar">
            <div className="admin-filter-group">
                <label>Date From</label>
                <input
                    type="date"
                    value={local.date_from}
                    onChange={(e) => handleChange('date_from', e.target.value)}
                />
            </div>
            <div className="admin-filter-group">
                <label>Date To</label>
                <input
                    type="date"
                    value={local.date_to}
                    onChange={(e) => handleChange('date_to', e.target.value)}
                />
            </div>
            <div className="admin-filter-group">
                <label>Posted By</label>
                <select
                    value={local.posted_by}
                    onChange={(e) => handleChange('posted_by', e.target.value)}
                >
                    <option value="">All Users</option>
                    {users.map(u => (
                        <option key={u.id} value={u.id}>
                            {u.telegram_user_name || u.username || `User ${u.id}`}
                        </option>
                    ))}
                </select>
            </div>
            <div className="admin-filter-group">
                <label>Difficulty</label>
                <select
                    value={local.order_difficulty}
                    onChange={(e) => handleChange('order_difficulty', e.target.value)}
                >
                    <option value="">All</option>
                    <option value="SIMPLE">Simple</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="DIFFICULT">Difficult</option>
                </select>
            </div>
            <div className="admin-filter-group">
                <label>Order Status</label>
                <select
                    value={local.order_status}
                    onChange={(e) => handleChange('order_status', e.target.value)}
                >
                    <option value="">All Statuses</option>
                    {ORDER_STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>
            <div className="admin-filter-group">
                <label>Design Type</label>
                <select
                    value={local.design_type}
                    onChange={(e) => handleChange('design_type', e.target.value)}
                >
                    <option value="">All Types</option>
                    {designTypes.map(dt => (
                        <option key={dt.id} value={dt.id}>{dt.name}</option>
                    ))}
                </select>
            </div>
            <button className="admin-filter-apply" onClick={() => onApply(local)}>
                <Search style={{ width: 14, height: 14, marginRight: 4, verticalAlign: 'middle' }} />
                Apply
            </button>
            <button className="admin-filter-reset" onClick={onReset}>
                <RotateCcw style={{ width: 14, height: 14, marginRight: 4, verticalAlign: 'middle' }} />
                Reset
            </button>
        </div>
    );
}
