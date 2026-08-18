'use client';

import { useEffect, useState } from 'react';
import { Activity, Clock } from 'lucide-react';
import api from '@/api';

interface CncStatsData {
    performance: {
        assigned_today: number;
        completed_today: number;
        in_progress: number;
        delayed: number;
    };
    timeline: Array<{
        id: number;
        status: string;
        start_time: string | null;
        complete_time: string | null;
        material: string;
        order_code: string | number;
    }>;
    machine_status: {
        status: string;
        current_job: string | null;
        started_at: string | null;
    };
}

export default function OverviewTab() {
    const [stats, setStats] = useState<CncStatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/api/cuttingfiles/statistics/');
                setStats(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching stats:', err);
                setError('Failed to load statistics');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="cnc-empty">
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: '3px solid #E5E7EB',
                        borderTopColor: '#84CC16',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 12px',
                    }}
                />
                Loading overview…
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div className="cnc-empty">
                <strong>Could not load overview</strong>
                {error}
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="cnc-empty">
                <strong>No activity yet</strong>
                Stats will appear once cutting tasks are assigned.
            </div>
        );
    }

    return (
        <div className="cnc-desktop-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
                <h2
                    style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: 18,
                        fontWeight: 600,
                        margin: '0 0 12px',
                    }}
                >
                    Today&apos;s performance
                </h2>
                <div className="cnc-kpi-grid">
                    <div className="cnc-kpi-card">
                        <div className="cnc-kpi-value">{stats.performance.assigned_today}</div>
                        <div className="cnc-kpi-label">Assigned today</div>
                    </div>
                    <div className="cnc-kpi-card mint">
                        <div className="cnc-kpi-value">{stats.performance.completed_today}</div>
                        <div className="cnc-kpi-label">Completed</div>
                    </div>
                    <div className="cnc-kpi-card peach">
                        <div className="cnc-kpi-value">{stats.performance.in_progress}</div>
                        <div className="cnc-kpi-label">In progress</div>
                    </div>
                    <div className="cnc-kpi-card lavender">
                        <div className="cnc-kpi-value">{stats.performance.delayed}</div>
                        <div className="cnc-kpi-label">Delayed</div>
                    </div>
                </div>
            </div>

            <div
                style={{
                    background: 'var(--stock-panel-muted)',
                    borderRadius: 'var(--stock-radius-md)',
                    padding: 16,
                }}
            >
                <h2
                    style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: 16,
                        fontWeight: 600,
                        margin: '0 0 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <Activity size={18} />
                    Current status
                </h2>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#fff',
                        borderRadius: 12,
                        padding: '12px 14px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background:
                                    stats.machine_status.status === 'Active' ? '#22C55E' : '#EAB308',
                            }}
                        />
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>
                                {stats.machine_status.status === 'Active' ? 'Machine running' : 'Idle'}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--stock-text-secondary)' }}>
                                {stats.machine_status.current_job || 'No active job'}
                            </div>
                        </div>
                    </div>
                    {stats.machine_status.started_at && (
                        <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--stock-text-secondary)' }}>
                            Since{' '}
                            {new Date(stats.machine_status.started_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div
                style={{
                    background: 'var(--stock-panel-muted)',
                    borderRadius: 'var(--stock-radius-md)',
                    padding: 16,
                }}
            >
                <h2
                    style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: 16,
                        fontWeight: 600,
                        margin: '0 0 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <Clock size={18} />
                    Today&apos;s timeline
                </h2>
                {stats.timeline.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--stock-text-secondary)', textAlign: 'center', margin: 0 }}>
                        No activity recorded today
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {stats.timeline.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    background: '#fff',
                                    borderRadius: 12,
                                    padding: '12px 14px',
                                    borderLeft: `3px solid ${
                                        item.status === 'COMPLATED' ? '#22C55E' : '#84CC16'
                                    }`,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: 4,
                                    }}
                                >
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                                        {item.status === 'COMPLATED' ? 'Completed task' : 'Started task'}
                                    </span>
                                    <span style={{ fontSize: 11, color: 'var(--stock-text-muted)' }}>
                                        {new Date(
                                            item.status === 'COMPLATED' && item.complete_time
                                                ? item.complete_time
                                                : item.start_time || ''
                                        ).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                                <div style={{ fontSize: 13 }}>Order #{item.order_code}</div>
                                <div style={{ fontSize: 12, color: 'var(--stock-text-secondary)' }}>
                                    {item.material}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
