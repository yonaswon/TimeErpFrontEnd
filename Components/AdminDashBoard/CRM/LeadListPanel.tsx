'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Search, Phone, Send, SlidersHorizontal, X, Bookmark, ChevronDown } from 'lucide-react';
import api from '../../../api';

interface LeadSummary {
    id: number;
    name: string;
    customer_name: string;
    status: string;
    temperature: string;
    source: string | null;
    sales: { id: number; username: string; full_name: string } | null;
    phones: string[];
    phone_count: number;
    telegram_count: number;
    created_at: string;
    last_activity: string;
    last_activity_type: string;
    note: string;
}

interface SalesUser {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
}

interface SavedView {
    label: string;
    filters: Record<string, string>;
}

interface Props {
    mode: 'lead' | 'phone';
    onModeChange: (m: 'lead' | 'phone') => void;
    selectedLeadId: number | null;
    onSelectLead: (id: number, lead: LeadSummary) => void;
    onSelectPhone?: (phone: string) => void;
}

function timeAgo(iso: string): string {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'now';
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d`;
    return new Date(iso).toLocaleDateString();
}

const PAGE_SIZE = 50;
const SAVED_VIEWS_KEY = 'crm_saved_views';

const DEFAULT_SAVED_VIEWS: SavedView[] = [
    { label: 'Hot leads', filters: { temperature: 'HOT' } },
    { label: 'Overdue follow-ups', filters: { has_overdue_followup: '1' } },
    { label: 'No activity 3d', filters: { last_activity_within: '3' } },
];

export default function LeadListPanel({ mode, onModeChange, selectedLeadId, onSelectLead, onSelectPhone }: Props) {
    const [leads, setLeads] = useState<LeadSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [tempFilter, setTempFilter] = useState('');
    const [salesFilter, setSalesFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sourceChannel, setSourceChannel] = useState('');
    const [hasMockup, setHasMockup] = useState('');
    const [hasOrder, setHasOrder] = useState('');
    const [lastActivityWithin, setLastActivityWithin] = useState('');
    const [hasOverdueFollowup, setHasOverdueFollowup] = useState('');

    const [showAdvanced, setShowAdvanced] = useState(false);
    const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
    const [phoneInput, setPhoneInput] = useState('');

    const [savedViews, setSavedViews] = useState<SavedView[]>(() => {
        try {
            const stored = localStorage.getItem(SAVED_VIEWS_KEY);
            return stored ? JSON.parse(stored) : DEFAULT_SAVED_VIEWS;
        } catch {
            return DEFAULT_SAVED_VIEWS;
        }
    });
    const [showViews, setShowViews] = useState(false);

    const buildParams = useCallback((pageNum: number) => {
        const params: Record<string, string> = { page_size: String(PAGE_SIZE), page: String(pageNum) };
        if (search.trim()) params.search = search.trim();
        if (statusFilter) params.status = statusFilter;
        if (tempFilter) params.temperature = tempFilter;
        if (salesFilter) params.sales_id = salesFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (sourceChannel) params.source_channel = sourceChannel;
        if (hasMockup) params.has_mockup = hasMockup;
        if (hasOrder) params.has_order = hasOrder;
        if (lastActivityWithin) params.last_activity_within = lastActivityWithin;
        if (hasOverdueFollowup) params.has_overdue_followup = hasOverdueFollowup;
        return params;
    }, [search, statusFilter, tempFilter, salesFilter, dateFrom, dateTo, sourceChannel, hasMockup, hasOrder, lastActivityWithin, hasOverdueFollowup]);

    const fetchLeads = useCallback(async (pageNum = 1, append = false) => {
        if (mode !== 'lead') return;
        if (append) setLoadingMore(true); else setLoading(true);
        try {
            const res = await api.get('/lead/crm/leads/', { params: buildParams(pageNum) });
            const results: LeadSummary[] = res.data.results || [];
            setLeads(prev => append ? [...prev, ...results] : results);
            setHasNext(!!res.data.next);
            setTotalCount(res.data.count || 0);
            setPage(pageNum);
        } catch (err) {
            console.error('Failed to load leads', err);
            if (!append) setLeads([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [mode, buildParams]);

    useEffect(() => {
        api.get('/lead/crm/sales-users/').then(res => setSalesUsers(res.data || [])).catch(() => {});
    }, []);

    useEffect(() => {
        fetchLeads(1, false);
    }, [fetchLeads]);

    const applyView = (view: SavedView) => {
        // Reset all filters then apply view's filters
        setStatusFilter('');
        setTempFilter('');
        setSalesFilter('');
        setDateFrom('');
        setDateTo('');
        setSourceChannel('');
        setHasMockup('');
        setHasOrder('');
        setLastActivityWithin('');
        setHasOverdueFollowup('');
        setSearch('');
        const f = view.filters;
        if (f.status) setStatusFilter(f.status);
        if (f.temperature) setTempFilter(f.temperature);
        if (f.sales_id) setSalesFilter(f.sales_id);
        if (f.date_from) setDateFrom(f.date_from);
        if (f.date_to) setDateTo(f.date_to);
        if (f.source_channel) setSourceChannel(f.source_channel);
        if (f.has_mockup) setHasMockup(f.has_mockup);
        if (f.has_order) setHasOrder(f.has_order);
        if (f.last_activity_within) setLastActivityWithin(f.last_activity_within);
        if (f.has_overdue_followup) setHasOverdueFollowup(f.has_overdue_followup);
        setShowViews(false);
    };

    const saveCurrentView = () => {
        const label = prompt('Name this view:');
        if (!label) return;
        const filters: Record<string, string> = {};
        if (statusFilter) filters.status = statusFilter;
        if (tempFilter) filters.temperature = tempFilter;
        if (salesFilter) filters.sales_id = salesFilter;
        if (dateFrom) filters.date_from = dateFrom;
        if (dateTo) filters.date_to = dateTo;
        if (sourceChannel) filters.source_channel = sourceChannel;
        if (hasMockup) filters.has_mockup = hasMockup;
        if (hasOrder) filters.has_order = hasOrder;
        if (lastActivityWithin) filters.last_activity_within = lastActivityWithin;
        if (hasOverdueFollowup) filters.has_overdue_followup = hasOverdueFollowup;
        const updated = [...savedViews, { label, filters }];
        setSavedViews(updated);
        localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(updated));
    };

    const deleteView = (idx: number) => {
        const updated = savedViews.filter((_, i) => i !== idx);
        setSavedViews(updated);
        localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(updated));
    };

    const hasActiveFilters = !!(statusFilter || tempFilter || salesFilter || dateFrom || dateTo || sourceChannel || hasMockup || hasOrder || lastActivityWithin || hasOverdueFollowup);

    return (
        <div className="crm-left">
            <div className="crm-left-header">
                <div className="crm-view-toggle">
                    <button className={mode === 'lead' ? 'active' : ''} onClick={() => onModeChange('lead')}>Per Lead</button>
                    <button className={mode === 'phone' ? 'active' : ''} onClick={() => onModeChange('phone')}>Per Phone</button>
                </div>

                {mode === 'lead' ? (
                    <>
                        {/* Search */}
                        <form className="crm-search" onSubmit={e => { e.preventDefault(); fetchLeads(1, false); }}>
                            <Search size={14} />
                            <input
                                type="text"
                                placeholder="Search leads, phone, name…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </form>

                        {/* Basic filters row */}
                        <div className="crm-filter-row">
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="">All status</option>
                                <option value="NEW">NEW</option>
                                <option value="WARM">WARM</option>
                                <option value="COLD">COLD</option>
                                <option value="CONVERTED">CONVERTED</option>
                            </select>
                            <select value={tempFilter} onChange={e => setTempFilter(e.target.value)}>
                                <option value="">All temp</option>
                                <option value="NEW">NEW</option>
                                <option value="HOT">HOT</option>
                                <option value="WARM">WARM</option>
                                <option value="COLD">COLD</option>
                            </select>
                            <select value={salesFilter} onChange={e => setSalesFilter(e.target.value)}>
                                <option value="">All sales</option>
                                {salesUsers.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Advanced filters toggle */}
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button
                                onClick={() => setShowAdvanced(v => !v)}
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 10px', border: `1px solid ${hasActiveFilters ? '#2563eb' : 'var(--admin-border)'}`, borderRadius: 6, background: hasActiveFilters ? 'rgba(37,99,235,0.08)' : 'transparent', color: hasActiveFilters ? '#2563eb' : 'var(--admin-text-secondary)', cursor: 'pointer', fontSize: 12 }}
                            >
                                <SlidersHorizontal size={12} /> Advanced {hasActiveFilters ? '●' : ''}
                            </button>
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setShowViews(v => !v)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', border: '1px solid var(--admin-border)', borderRadius: 6, background: 'transparent', color: 'var(--admin-text-secondary)', cursor: 'pointer', fontSize: 12 }}
                                >
                                    <Bookmark size={12} /> Views <ChevronDown size={10} />
                                </button>
                                {showViews && (
                                    <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 100, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 200, padding: 8 }}>
                                        {savedViews.map((v, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 5, cursor: 'pointer' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--admin-bg)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                <span style={{ flex: 1, fontSize: 13 }} onClick={() => applyView(v)}>{v.label}</span>
                                                <button onClick={() => deleteView(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-secondary)', padding: 2 }}><X size={11} /></button>
                                            </div>
                                        ))}
                                        <div style={{ borderTop: '1px solid var(--admin-border)', marginTop: 6, paddingTop: 6 }}>
                                            <button onClick={saveCurrentView} style={{ width: '100%', padding: '6px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#2563eb', textAlign: 'left' }}>
                                                + Save current filters
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Advanced filters panel */}
                        {showAdvanced && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0', borderTop: '1px solid var(--admin-border)' }}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From"
                                        style={{ flex: 1, padding: '7px 8px', border: '1px solid var(--admin-border)', borderRadius: 6, background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 12 }} />
                                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To"
                                        style={{ flex: 1, padding: '7px 8px', border: '1px solid var(--admin-border)', borderRadius: 6, background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 12 }} />
                                </div>
                                <select value={sourceChannel} onChange={e => setSourceChannel(e.target.value)}
                                    style={{ padding: '7px 8px', border: '1px solid var(--admin-border)', borderRadius: 6, background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 12 }}>
                                    <option value="">Any channel</option>
                                    <option value="Call">Has calls</option>
                                    <option value="SMS">Has SMS</option>
                                    <option value="TG">Has Telegram</option>
                                </select>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <select value={hasMockup} onChange={e => setHasMockup(e.target.value)}
                                        style={{ flex: 1, padding: '7px 8px', border: '1px solid var(--admin-border)', borderRadius: 6, background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 12 }}>
                                        <option value="">Mockup: any</option>
                                        <option value="1">Has mockup</option>
                                        <option value="0">No mockup</option>
                                    </select>
                                    <select value={hasOrder} onChange={e => setHasOrder(e.target.value)}
                                        style={{ flex: 1, padding: '7px 8px', border: '1px solid var(--admin-border)', borderRadius: 6, background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 12 }}>
                                        <option value="">Order: any</option>
                                        <option value="1">Has order</option>
                                        <option value="0">No order</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <select value={lastActivityWithin} onChange={e => setLastActivityWithin(e.target.value)}
                                        style={{ flex: 1, padding: '7px 8px', border: '1px solid var(--admin-border)', borderRadius: 6, background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 12 }}>
                                        <option value="">Activity: any time</option>
                                        <option value="1">Last 24h</option>
                                        <option value="3">Last 3 days</option>
                                        <option value="7">Last week</option>
                                        <option value="30">Last 30 days</option>
                                    </select>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--admin-text)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        <input type="checkbox" checked={hasOverdueFollowup === '1'} onChange={e => setHasOverdueFollowup(e.target.checked ? '1' : '')} />
                                        Overdue
                                    </label>
                                </div>
                                {hasActiveFilters && (
                                    <button onClick={() => {
                                        setStatusFilter(''); setTempFilter(''); setSalesFilter('');
                                        setDateFrom(''); setDateTo(''); setSourceChannel('');
                                        setHasMockup(''); setHasOrder(''); setLastActivityWithin(''); setHasOverdueFollowup('');
                                    }} style={{ padding: '6px', border: '1px solid var(--admin-border)', borderRadius: 6, background: 'transparent', color: 'var(--admin-text-secondary)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                        <X size={11} /> Clear filters
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <form className="crm-search" onSubmit={e => { e.preventDefault(); if (phoneInput.trim()) onSelectPhone?.(phoneInput.trim()); }}>
                        <Phone size={14} />
                        <input type="tel" placeholder="Enter phone number…" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} />
                    </form>
                )}
            </div>

            <div className="crm-lead-list">
                {mode === 'phone' ? (
                    <div style={{ padding: 20, fontSize: 13, color: 'var(--admin-text-secondary)', textAlign: 'center' }}>
                        Enter a phone number above to load its conversation.
                    </div>
                ) : loading ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--admin-text-secondary)' }}>Loading leads…</div>
                ) : leads.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--admin-text-secondary)' }}>No leads found.</div>
                ) : (
                    leads.map(l => {
                        const display = l.name || l.customer_name || (l.phones[0] || `Lead #${l.id}`);
                        const initials = display.split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '#';
                        return (
                            <div key={l.id} className={`crm-lead-card ${selectedLeadId === l.id ? 'active' : ''}`} onClick={() => onSelectLead(l.id, l)}>
                                <div className="crm-lead-avatar">{initials}</div>
                                <div className="crm-lead-info">
                                    <div className="crm-lead-name">
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{display}</span>
                                        <span className={`crm-status-badge crm-status-${l.status}`}>{l.status}</span>
                                    </div>
                                    <div className="crm-lead-meta">
                                        {l.phone_count > 0 && <span className="crm-lead-meta-icon"><Phone size={10} />{l.phone_count}</span>}
                                        {l.telegram_count > 0 && <span className="crm-lead-meta-icon"><Send size={10} />{l.telegram_count}</span>}
                                        {l.temperature && l.temperature !== 'NEW' && (
                                            <span className={`crm-status-badge crm-status-${l.temperature}`} style={{ fontSize: 8 }}>{l.temperature}</span>
                                        )}
                                        {l.sales && <span style={{ marginLeft: 'auto', fontSize: 10 }}>{l.sales.full_name}</span>}
                                    </div>
                                </div>
                                <div className="crm-lead-time">{timeAgo(l.last_activity)}</div>
                            </div>
                        );
                    })
                )}

                {mode === 'lead' && !loading && leads.length > 0 && (
                    <div style={{ padding: '12px 16px', textAlign: 'center', borderTop: '1px solid var(--admin-border)' }}>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-secondary)', marginBottom: hasNext ? 8 : 0 }}>
                            {leads.length} of {totalCount}
                        </div>
                        {hasNext && (
                            <button onClick={() => fetchLeads(page + 1, true)} disabled={loadingMore}
                                style={{ padding: '6px 14px', fontSize: 12, border: '1px solid var(--admin-border)', borderRadius: 6, background: 'var(--admin-card-bg)', color: 'var(--admin-text)', cursor: loadingMore ? 'wait' : 'pointer' }}>
                                {loadingMore ? 'Loading…' : 'Load more'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
