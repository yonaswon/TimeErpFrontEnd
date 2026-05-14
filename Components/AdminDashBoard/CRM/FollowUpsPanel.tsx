'use client';

import React, { useEffect, useMemo, useState } from 'react';
import api from '@/api';
import { CalendarClock, CheckCircle2, X, AlertTriangle, RefreshCw, Phone } from 'lucide-react';

interface FollowUp {
    id: number;
    lead_id: number;
    lead_name: string;
    lead_phone: string;
    lead_temperature: string;
    reason: string;
    headline: string;
    note: string;
    scheduled_at: string;
    priority: 'LOW' | 'MED' | 'HIGH';
    status: string;
    is_due: boolean;
    created_at: string;
}

const priorityColor: Record<string, string> = {
    HIGH: '#dc2626',
    MED: '#d97706',
    LOW: '#6b7280',
};

const reasonLabel: Record<string, string> = {
    missed_call_unreturned: 'Missed call not returned',
    hot_lead_silent: 'Hot lead has gone silent',
    mockup_promised: 'Mockup promised but not sent',
    quote_promised: 'Quote promised but not sent',
    callback_promised: 'Promised to call back',
    decision_window: 'Inside customer decision window',
    proactive_check_in: 'Proactive check-in',
    other: 'Other',
};

function relativeTime(iso: string) {
    if (!iso) return '';
    const ts = new Date(iso).getTime();
    const diff = ts - Date.now();
    const abs = Math.abs(diff);
    const mins = Math.round(abs / 60_000);
    const hours = Math.round(mins / 60);
    const days = Math.round(hours / 24);
    if (mins < 60) return diff < 0 ? `${mins}m ago` : `in ${mins}m`;
    if (hours < 24) return diff < 0 ? `${hours}h ago` : `in ${hours}h`;
    return diff < 0 ? `${days}d ago` : `in ${days}d`;
}

export default function FollowUpsPanel() {
    const [tasks, setTasks] = useState<FollowUp[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'DUE'>('ALL');
    const [statusFilter, setStatusFilter] = useState<'PENDING' | 'DONE' | 'DISMISSED' | 'SUPERSEDED' | 'ALL'>('PENDING');

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'ALL') params.set('status', statusFilter);
            if (filter === 'HIGH') params.set('priority', 'HIGH');
            if (filter === 'DUE') params.set('due', '1');
            const res = await api.get(`/crm/followups/?${params.toString()}`);
            setTasks(res.data?.results || []);
        } catch (e) {
            console.error('Failed to load follow-ups', e);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); /* eslint-disable-next-line */ }, [filter, statusFilter]);

    const replanNow = async () => {
        try {
            await api.post('/crm/followups/replan-now/');
            setTimeout(fetchTasks, 1500);
        } catch (e) {
            console.error(e);
        }
    };

    const markDone = async (id: number) => {
        try {
            await api.post(`/crm/followups/${id}/done/`);
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (e) { console.error(e); }
    };

    const dismiss = async (id: number) => {
        try {
            await api.post(`/crm/followups/${id}/dismiss/`);
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (e) { console.error(e); }
    };

    const grouped = useMemo(() => {
        const overdue: FollowUp[] = [];
        const today: FollowUp[] = [];
        const week: FollowUp[] = [];
        const later: FollowUp[] = [];
        const now = Date.now();
        const day = 24 * 3600_000;
        for (const t of tasks) {
            const ts = new Date(t.scheduled_at).getTime();
            const delta = ts - now;
            if (delta < 0) overdue.push(t);
            else if (delta < day) today.push(t);
            else if (delta < 7 * day) week.push(t);
            else later.push(t);
        }
        return { overdue, today, week, later };
    }, [tasks]);

    return (
        <div style={{ padding: 20, maxWidth: 1100 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalendarClock size={22} /> AI Follow-up Tasks
                </h2>
                <span style={{ color: '#6b7280', fontSize: 13 }}>{tasks.length} task(s)</span>
                <div style={{ flex: 1 }} />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                    style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db' }}>
                    <option value="PENDING">Pending</option>
                    <option value="DONE">Done</option>
                    <option value="DISMISSED">Dismissed</option>
                    <option value="SUPERSEDED">Superseded</option>
                    <option value="ALL">All</option>
                </select>
                <select value={filter} onChange={e => setFilter(e.target.value as any)}
                    style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db' }}>
                    <option value="ALL">All priorities</option>
                    <option value="HIGH">High priority</option>
                    <option value="DUE">Due now</option>
                </select>
                <button onClick={replanNow} disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: '#2563eb', color: 'white', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                    <RefreshCw size={16} /> Replan now
                </button>
            </div>

            {loading && <div style={{ color: '#6b7280' }}>Loading…</div>}
            {!loading && tasks.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: 8 }}>
                    No follow-ups in this filter.
                </div>
            )}

            {[
                { title: '⚠️ Overdue', list: grouped.overdue },
                { title: '📅 Today', list: grouped.today },
                { title: '📆 This Week', list: grouped.week },
                { title: '🗓 Later', list: grouped.later },
            ].map(section => section.list.length > 0 && (
                <div key={section.title} style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: '#6b7280', letterSpacing: 0.5, marginBottom: 8 }}>
                        {section.title} ({section.list.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {section.list.map(t => (
                            <div key={t.id} style={{ background: 'white', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: priorityColor[t.priority] || '#6b7280' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                                        <strong style={{ fontSize: 15 }}>{t.lead_name || `Lead #${t.lead_id}`}</strong>
                                        <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#f3f4f6', color: '#374151' }}>{t.priority}</span>
                                        {t.lead_temperature === 'HOT' && <span style={{ fontSize: 11 }}>🔥 HOT</span>}
                                        {t.is_due && <span style={{ fontSize: 11, color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={11}/>DUE</span>}
                                        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6b7280' }}>{relativeTime(t.scheduled_at)}</span>
                                    </div>
                                    <div style={{ fontSize: 14, marginBottom: 4 }}>{t.headline}</div>
                                    {t.note && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{t.note}</div>}
                                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                                        {reasonLabel[t.reason] || t.reason}
                                        {t.lead_phone && <> · {t.lead_phone}</>}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {t.lead_phone && (
                                        <a href={`tel:${t.lead_phone}`} title="Call"
                                            style={{ padding: '5px 8px', borderRadius: 5, background: '#10b981', color: 'white', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontSize: 12 }}>
                                            <Phone size={12} /> Call
                                        </a>
                                    )}
                                    <button onClick={() => markDone(t.id)} title="Mark done"
                                        style={{ padding: '5px 8px', borderRadius: 5, background: '#f3f4f6', border: '1px solid #d1d5db', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                                        <CheckCircle2 size={12} /> Done
                                    </button>
                                    <button onClick={() => dismiss(t.id)} title="Dismiss"
                                        style={{ padding: '5px 8px', borderRadius: 5, background: 'white', border: '1px solid #d1d5db', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
                                        <X size={12} /> Dismiss
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
