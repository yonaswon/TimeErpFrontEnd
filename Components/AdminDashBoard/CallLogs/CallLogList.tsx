'use client';
import React, { useState, useEffect } from 'react';
import { Phone, Clock, Filter, X } from 'lucide-react';
import api from '../../../api';

interface CallLog {
    id: number;
    sales_details: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
    };
    full_name: string;
    phone_number: string;
    status: string;
    duration: number;
    started_at: string;
    is_synced: boolean;
}

const STATUS_COLORS: Record<string, string> = {
    ANSWERED: 'var(--admin-success)',
    MISSED: 'var(--admin-danger)',
    REJECTED: 'var(--admin-warning)',
    OUTGOING: 'var(--admin-info)',
};

export default function CallLogList() {
    const [callLogs, setCallLogs] = useState<CallLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<CallLog[]>([]);
    const [loading, setLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState('');
    const [salesFilter, setSalesFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        fetchCallLogs();
    }, []);

    const fetchCallLogs = async () => {
        setLoading(true);
        try {
            const response = await api.get('/lead/call-logs/');
            const data = Array.isArray(response.data) ? response.data : response.data.results || [];
            setCallLogs(data);
            setFilteredLogs(data);
        } catch (error) {
            console.error('Failed to fetch call logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let result = callLogs;
        if (statusFilter) {
            result = result.filter(log => log.status === statusFilter);
        }
        if (salesFilter) {
            result = result.filter(log => log.sales_details?.id.toString() === salesFilter);
        }
        if (dateFilter) {
            result = result.filter(log => {
                const logDate = new Date(log.started_at).toISOString().split('T')[0];
                return logDate === dateFilter;
            });
        }
        setFilteredLogs(result);
    }, [statusFilter, salesFilter, dateFilter, callLogs]);

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m + 'm ' + s + 's';
    };

    // Calculate Last Sync Date per agent
    const agentSyncMap = new Map<number, { name: string; lastSync: Date }>();
    callLogs.forEach(log => {
        if (!log.sales_details) return;
        const currentLastSync = agentSyncMap.get(log.sales_details.id)?.lastSync;
        const logDate = new Date(log.started_at);
        if (!currentLastSync || logDate > currentLastSync) {
            const firstName = log.sales_details.first_name || '';
            const lastName = log.sales_details.last_name || log.sales_details.username;
            agentSyncMap.set(log.sales_details.id, {
                name: (firstName + ' ' + lastName).trim(),
                lastSync: logDate
            });
        }
    });

    const uniqueSales = Array.from(agentSyncMap.entries());

    const clearFilters = () => {
        setStatusFilter('');
        setSalesFilter('');
        setDateFilter('');
    };

    const stats = {
        ANSWERED: filteredLogs.filter(log => log.status === 'ANSWERED').length,
        OUTGOING: filteredLogs.filter(log => log.status === 'OUTGOING').length,
        MISSED: filteredLogs.filter(log => log.status === 'MISSED').length,
        REJECTED: filteredLogs.filter(log => log.status === 'REJECTED').length,
    };

    return (
        <>
            {/* Agent Last Sync Cards */}
            <div className="admin-kpi-grid">
                {uniqueSales.map(([id, info]) => (
                    <div key={id} className="admin-kpi-card kpi-info">
                        <div className="kpi-label"><Phone size={16} /> {info.name}</div>
                        <div className="kpi-value" style={{ fontSize: 14 }}>
                            <Clock size={14} style={{ marginRight: 4 }} />
                            {info.lastSync.toLocaleString()}
                        </div>
                        <div className="kpi-sub">Last Sync</div>
                    </div>
                ))}
                {uniqueSales.length === 0 && !loading && (
                    <div className="admin-kpi-card kpi-warning">
                        <div className="kpi-label"><Phone size={16} /> No Agents</div>
                        <div className="kpi-value" style={{ fontSize: 14 }}>No sync data</div>
                    </div>
                )}
            </div>

            {/* Statistics */}
            <div className="admin-kpi-grid" style={{ marginBottom: 16 }}>
                <div className="admin-kpi-card kpi-success">
                    <div className="kpi-label"><Phone size={16} /> Answered</div>
                    <div className="kpi-value">{stats.ANSWERED}</div>
                </div>
                <div className="admin-kpi-card kpi-info">
                    <div className="kpi-label"><Phone size={16} /> Outgoing</div>
                    <div className="kpi-value">{stats.OUTGOING}</div>
                </div>
                <div className="admin-kpi-card kpi-danger">
                    <div className="kpi-label"><Phone size={16} /> Missed</div>
                    <div className="kpi-value">{stats.MISSED}</div>
                </div>
                <div className="admin-kpi-card kpi-warning">
                    <div className="kpi-label"><Phone size={16} /> Rejected</div>
                    <div className="kpi-value">{stats.REJECTED}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="admin-section-card" style={{ marginBottom: 16 }}>
                <h3><Filter size={18} /> Filters</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: 150 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 4 }}>Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 13 }}
                        >
                            <option value="">All Statuses</option>
                            <option value="ANSWERED">Answered</option>
                            <option value="MISSED">Missed</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="OUTGOING">Outgoing</option>
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: 150 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 4 }}>Sales Agent</label>
                        <select
                            value={salesFilter}
                            onChange={(e) => setSalesFilter(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 13 }}
                        >
                            <option value="">All Agents</option>
                            {uniqueSales.map(([id, info]) => (
                                <option key={id} value={id}>{info.name}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: 150 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 4 }}>Date</label>
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 13 }}
                        />
                    </div>
                    <button
                        onClick={clearFilters}
                        style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-secondary)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        <X size={14} /> Clear
                    </button>
                </div>
            </div>

            {/* Call Logs Table */}
            <div className="admin-section-card">
                <h3><Phone size={18} /> Call Logs ({filteredLogs.length})</h3>
                {loading ? (
                    <div className="admin-loading">
                        <div className="admin-spinner" />
                        Loading call logs...
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="admin-empty">No call logs found.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--admin-border)' }}>
                                    <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--admin-text-secondary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date & Time</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--admin-text-secondary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Agent</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--admin-text-secondary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--admin-text-secondary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--admin-text-secondary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--admin-text-secondary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                                        <td style={{ padding: '10px 12px' }}>{new Date(log.started_at).toLocaleString()}</td>
                                        <td style={{ padding: '10px 12px' }}>{log.sales_details?.first_name || log.sales_details?.username}</td>
                                        <td style={{ padding: '10px 12px' }}>{log.full_name || 'Unknown'}</td>
                                        <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{log.phone_number}</td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '3px 10px',
                                                borderRadius: 12,
                                                fontSize: 11,
                                                fontWeight: 600,
                                                color: '#fff',
                                                background: STATUS_COLORS[log.status] || 'var(--admin-text-muted)',
                                            }}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 12px' }}>{formatDuration(log.duration)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
