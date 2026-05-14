'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Phone, Clock, Filter, X, ChevronLeft, ChevronRight, Search, Mic } from 'lucide-react';
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

interface SalesUser {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
}

const STATUS_COLORS: Record<string, string> = {
    ANSWERED: 'var(--admin-success)',
    MISSED: 'var(--admin-danger)',
    REJECTED: 'var(--admin-warning)',
    OUTGOING: 'var(--admin-info)',
};

const PAGE_SIZE = 100;

function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

export default function CallLogList() {
    const [logs, setLogs] = useState<CallLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);

    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [salesFilter, setSalesFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [hasRecording, setHasRecording] = useState('');
    const [durMin, setDurMin] = useState('');
    const [durMax, setDurMax] = useState('');

    const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const fetchLogs = useCallback(async (pageNum: number) => {
        setLoading(true);
        try {
            const params: Record<string, string> = {
                page: String(pageNum),
                page_size: String(PAGE_SIZE),
                ordering: '-started_at',
            };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            if (salesFilter) params.sales = salesFilter;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            if (hasRecording) params.has_recording = hasRecording;
            if (durMin) params.duration_min = durMin;
            if (durMax) params.duration_max = durMax;

            const res = await api.get('/lead/call-logs/', { params });
            const data = res.data;
            if (Array.isArray(data)) {
                setLogs(data);
                setTotalCount(data.length);
            } else {
                setLogs(data.results || []);
                setTotalCount(data.count || 0);
            }
        } catch (err) {
            console.error('Failed to fetch call logs:', err);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, salesFilter, dateFrom, dateTo, hasRecording, durMin, durMax]);

    useEffect(() => {
        api.get('/lead/crm/sales-users/').then(res => setSalesUsers(res.data || [])).catch(() => {});
    }, []);

    useEffect(() => {
        setPage(1);
        fetchLogs(1);
    }, [fetchLogs]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput.trim());
    };

    const clearFilters = () => {
        setSearchInput('');
        setSearch('');
        setStatusFilter('');
        setSalesFilter('');
        setDateFrom('');
        setDateTo('');
        setHasRecording('');
        setDurMin('');
        setDurMax('');
    };

    const goPage = (p: number) => {
        setPage(p);
        fetchLogs(p);
    };

    // Compute per-agent last sync from current page data (best effort)
    const agentSyncMap = new Map<number, { name: string; lastSync: Date }>();
    logs.forEach(log => {
        if (!log.sales_details) return;
        const cur = agentSyncMap.get(log.sales_details.id)?.lastSync;
        const d = new Date(log.started_at);
        if (!cur || d > cur) {
            const fn = log.sales_details.first_name || '';
            const ln = log.sales_details.last_name || log.sales_details.username;
            agentSyncMap.set(log.sales_details.id, { name: `${fn} ${ln}`.trim(), lastSync: d });
        }
    });

    const stats = {
        ANSWERED: logs.filter(l => l.status === 'ANSWERED').length,
        OUTGOING: logs.filter(l => l.status === 'OUTGOING').length,
        MISSED: logs.filter(l => l.status === 'MISSED').length,
        REJECTED: logs.filter(l => l.status === 'REJECTED').length,
    };

    return (
        <>
            {/* Agent Last Sync Cards */}
            <div className="admin-kpi-grid">
                {Array.from(agentSyncMap.entries()).map(([id, info]) => (
                    <div key={id} className="admin-kpi-card kpi-info">
                        <div className="kpi-label"><Phone size={16} /> {info.name}</div>
                        <div className="kpi-value" style={{ fontSize: 14 }}>
                            <Clock size={14} style={{ marginRight: 4 }} />
                            {info.lastSync.toLocaleString()}
                        </div>
                        <div className="kpi-sub">Last Sync (this page)</div>
                    </div>
                ))}
            </div>

            {/* Stats */}
            <div className="admin-kpi-grid" style={{ marginBottom: 16 }}>
                <div className="admin-kpi-card kpi-success">
                    <div className="kpi-label"><Phone size={16} /> Answered</div>
                    <div className="kpi-value">{stats.ANSWERED}</div>
                    <div className="kpi-sub">this page</div>
                </div>
                <div className="admin-kpi-card kpi-info">
                    <div className="kpi-label"><Phone size={16} /> Outgoing</div>
                    <div className="kpi-value">{stats.OUTGOING}</div>
                    <div className="kpi-sub">this page</div>
                </div>
                <div className="admin-kpi-card kpi-danger">
                    <div className="kpi-label"><Phone size={16} /> Missed</div>
                    <div className="kpi-value">{stats.MISSED}</div>
                    <div className="kpi-sub">this page</div>
                </div>
                <div className="admin-kpi-card kpi-warning">
                    <div className="kpi-label"><Phone size={16} /> Rejected</div>
                    <div className="kpi-value">{stats.REJECTED}</div>
                    <div className="kpi-sub">this page</div>
                </div>
            </div>

            {/* Filters */}
            <div className="admin-section-card" style={{ marginBottom: 16 }}>
                <h3><Filter size={18} /> Filters</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    {/* Search */}
                    <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 200px', minWidth: 160, position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Phone or name…"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 13 }}
                        />
                    </form>

                    {/* Status */}
                    <div style={{ flex: '1 1 130px', minWidth: 120 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 3 }}>Status</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 13 }}>
                            <option value="">All</option>
                            <option value="ANSWERED">Answered</option>
                            <option value="MISSED">Missed</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="OUTGOING">Outgoing</option>
                        </select>
                    </div>

                    {/* Sales */}
                    <div style={{ flex: '1 1 150px', minWidth: 130 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 3 }}>Sales Agent</label>
                        <select value={salesFilter} onChange={e => setSalesFilter(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 13 }}>
                            <option value="">All agents</option>
                            {salesUsers.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date range */}
                    <div style={{ flex: '1 1 120px', minWidth: 110 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 3 }}>From</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 13 }} />
                    </div>
                    <div style={{ flex: '1 1 120px', minWidth: 110 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 3 }}>To</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 13 }} />
                    </div>

                    {/* Has recording */}
                    <div style={{ flex: '1 1 130px', minWidth: 120 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 3 }}>Recording</label>
                        <select value={hasRecording} onChange={e => setHasRecording(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 13 }}>
                            <option value="">Any</option>
                            <option value="1">Has recording</option>
                            <option value="0">No recording</option>
                        </select>
                    </div>

                    {/* Duration range */}
                    <div style={{ flex: '1 1 90px', minWidth: 80 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 3 }}>Min sec</label>
                        <input type="number" placeholder="0" value={durMin} onChange={e => setDurMin(e.target.value)} min={0}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 13 }} />
                    </div>
                    <div style={{ flex: '1 1 90px', minWidth: 80 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: 3 }}>Max sec</label>
                        <input type="number" placeholder="∞" value={durMax} onChange={e => setDurMax(e.target.value)} min={0}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 13 }} />
                    </div>

                    <button onClick={clearFilters}
                        style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-secondary)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, alignSelf: 'flex-end' }}>
                        <X size={14} /> Clear
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="admin-section-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h3 style={{ margin: 0 }}><Phone size={18} /> Call Logs</h3>
                    <span style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>
                        {totalCount.toLocaleString()} total · page {page}/{totalPages}
                    </span>
                </div>

                {loading ? (
                    <div className="admin-loading"><div className="admin-spinner" /> Loading call logs…</div>
                ) : logs.length === 0 ? (
                    <div className="admin-empty">No call logs found.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--admin-border)' }}>
                                    {['Date & Time', 'Agent', 'Contact', 'Phone', 'Status', 'Duration', 'Rec'].map(h => (
                                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--admin-text-secondary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                                        <td style={{ padding: '10px 12px' }}>{new Date(log.started_at).toLocaleString()}</td>
                                        <td style={{ padding: '10px 12px' }}>{log.sales_details?.first_name || log.sales_details?.username || '-'}</td>
                                        <td style={{ padding: '10px 12px' }}>{log.full_name || 'Unknown'}</td>
                                        <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{log.phone_number}</td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: '#fff', background: STATUS_COLORS[log.status] || 'var(--admin-text-muted)' }}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 12px' }}>{formatDuration(log.duration)}</td>
                                        <td style={{ padding: '10px 12px' }}>
                                            {(log as any).has_recording ? <Mic size={14} color="var(--admin-success)" /> : <span style={{ color: 'var(--admin-text-secondary)', fontSize: 11 }}>—</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
                        <button onClick={() => goPage(Math.max(1, page - 1))} disabled={page <= 1}
                            style={{ padding: '7px 14px', border: '1px solid var(--admin-border)', borderRadius: 6, background: 'var(--admin-card-bg)', color: 'var(--admin-text)', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ChevronLeft size={14} /> Prev
                        </button>
                        <span style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>Page {page} of {totalPages}</span>
                        <button onClick={() => goPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                            style={{ padding: '7px 14px', border: '1px solid var(--admin-border)', borderRadius: 6, background: 'var(--admin-card-bg)', color: 'var(--admin-text)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
