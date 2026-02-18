'use client';
import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { DashboardData } from './types';

interface Props {
    data: DashboardData;
    onSelectOrder: (order: any) => void;
}

const STATUS_LABELS: Record<string, string> = {
    'PRE-ACCEPTED': 'Pre-Accept',
    'PRE-PAYMENT CONFIRMED': 'Pre-Paid',
    'CNC-STARTED': 'CNC',
    'CNC-COMPLETED': 'CNC Done',
    'ASSEMBLY-STARTED': 'Assembly',
    'ASSEMBLY-COMPLETED': 'Asm Done',
    'DANDI-STARTED': 'Delivery',
    'REM-ACCEPTED': 'Rem Accept',
    'REM-CONFIRMED': 'Rem Paid',
};

const STATUS_ORDER = [
    'PRE-ACCEPTED', 'PRE-PAYMENT CONFIRMED', 'CNC-STARTED', 'CNC-COMPLETED',
    'ASSEMBLY-STARTED', 'ASSEMBLY-COMPLETED', 'DANDI-STARTED', 'REM-ACCEPTED', 'REM-CONFIRMED'
];

function getStatusIndex(status: string): number {
    const idx = STATUS_ORDER.indexOf(status);
    return idx >= 0 ? idx : -1;
}

function formatDate(d: string | null): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function OrderTimeline({ data, onSelectOrder }: Props) {
    const [containers, setContainers] = useState<any[]>([]);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedContainer, setExpandedContainer] = useState<number | null>(null);

    useEffect(() => {
        fetchContainers('/api/order-container/?ordering=-created_at');
    }, []);

    const fetchContainers = async (url: string) => {
        try {
            setLoading(true);
            const res = await api.get(url);
            const results = res.data?.results || res.data || [];
            setContainers(prev => url.includes('page=') ? [...prev, ...results] : results);
            setNextPage(res.data?.next || null);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedContainer(prev => prev === id ? null : id);
    };

    return (
        <div className="admin-section-card" style={{ padding: 0 }}>
            <div style={{ padding: '20px 24px 0' }}>
                <h3 style={{ marginBottom: 0 }}>Order Containers Timeline</h3>
                <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                    {data.orders.total_containers} total containers · {data.orders.total_orders} orders
                </p>
            </div>
            <div className="admin-timeline" style={{ padding: '0 12px 12px' }}>
                {containers.map((container: any) => {
                    const orders = container.orders || [];
                    const isExpanded = expandedContainer === container.id;
                    return (
                        <div key={container.id}>
                            <div
                                className="admin-timeline-item"
                                onClick={() => toggleExpand(container.id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="admin-timeline-dot" />
                                <div className="admin-timeline-content">
                                    <div className="admin-timeline-header">
                                        <span className="admin-timeline-title">
                                            #{container.id} — {container.client || 'Unknown Client'}
                                        </span>
                                        <span className="admin-timeline-date">
                                            {formatDate(container.created_at)}
                                        </span>
                                    </div>
                                    <div className="admin-timeline-meta">
                                        <span>💰 {Math.round(container.full_payment || 0).toLocaleString()} Birr</span>
                                        <span>📍 {container.location || '-'}</span>
                                        <span>📦 {orders.length} order{orders.length !== 1 ? 's' : ''}</span>
                                        <span>⚙️ {container.order_difficulty}</span>
                                        {container.delivery_date && (
                                            <span>🚚 {formatDate(container.delivery_date)}</span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ alignSelf: 'center', color: 'var(--admin-text-muted)' }}>
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </div>
                            </div>

                            {isExpanded && orders.length > 0 && (
                                <div style={{ paddingLeft: 40, paddingBottom: 8 }}>
                                    {orders.map((order: any) => {
                                        const currentIdx = getStatusIndex(order.order_status);
                                        return (
                                            <div
                                                key={order.order_code}
                                                style={{
                                                    padding: '12px 16px',
                                                    borderLeft: '2px solid var(--admin-primary)',
                                                    marginBottom: 8,
                                                    borderRadius: '0 8px 8px 0',
                                                    background: 'var(--admin-bg)',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => onSelectOrder({ ...order, container })}
                                            >
                                                <div style={{
                                                    display: 'flex', justifyContent: 'space-between',
                                                    alignItems: 'center', marginBottom: 8
                                                }}>
                                                    <span style={{ fontWeight: 600, fontSize: 13 }}>
                                                        Order #{order.order_code}
                                                    </span>
                                                    <span className="admin-timeline-status" style={{
                                                        background: currentIdx >= 7 ? 'var(--admin-success)' :
                                                            currentIdx >= 4 ? 'var(--admin-primary)' :
                                                                currentIdx >= 2 ? 'var(--admin-warning)' : 'var(--admin-text-muted)',
                                                        color: '#fff',
                                                    }}>
                                                        {order.order_status}
                                                    </span>
                                                </div>
                                                <div className="admin-mini-timeline">
                                                    {STATUS_ORDER.map((status, idx) => (
                                                        <div key={status} className="admin-mini-step">
                                                            <div className={`admin-mini-dot ${idx < currentIdx ? 'completed' : idx === currentIdx ? 'current' : ''}`}>
                                                                {idx <= currentIdx && <Check />}
                                                            </div>
                                                            <span className="admin-mini-label">
                                                                {STATUS_LABELS[status]}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {loading && (
                <div className="admin-loading">
                    <div className="admin-spinner" /> Loading...
                </div>
            )}

            {nextPage && !loading && (
                <div className="admin-load-more">
                    <button onClick={() => fetchContainers(nextPage!)}>
                        Load More
                    </button>
                </div>
            )}

            {!loading && containers.length === 0 && (
                <div className="admin-empty">No order containers found</div>
            )}
        </div>
    );
}
