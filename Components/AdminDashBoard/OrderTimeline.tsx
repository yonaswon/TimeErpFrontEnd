'use client';
import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Check, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { DashboardData } from './types';
import OrdersTableView from './OrdersTableView';

interface Props {
    data: DashboardData;
    onSelectOrder: (order: any) => void;
    onSelectContainer?: (containerId: number) => void;
}

const STATUS_LABELS: Record<string, string> = {
    'PRE-ACCEPTED': 'Pre-Accept',
    'PRE-CONFIRMED': 'Pre-Confirmed',
    'CNC-STARTED': 'CNC',
    'CNC-COMPLETED': 'CNC Done',
    'ASSEMBLY-STARTED': 'Assembly',
    'ASSEMBLY-COMPLETED': 'Asm Done',
    'DANDI-STARTED': 'Delivery',
    'REM-ACCEPTED': 'Rem Accept',
    'REM-CONFIRMED': 'Rem Confirmed',
};

const STATUS_ORDER = [
    'PRE-ACCEPTED', 'PRE-CONFIRMED', 'CNC-STARTED', 'CNC-COMPLETED',
    'ASSEMBLY-STARTED', 'ASSEMBLY-COMPLETED', 'DANDI-STARTED', 'REM-ACCEPTED', 'REM-CONFIRMED'
];

const STATUS_PIPELINE = [
    { key: 'PRE-ACCEPTED', label: 'Pre-Accept', color: '#f59e0b' },
    { key: 'PRE-CONFIRMED', label: 'Pre-Confirmed', color: '#f59e0b' },
    { key: 'CNC-STARTED', label: 'CNC', color: '#3b82f6' },
    { key: 'CNC-COMPLETED', label: 'CNC Done', color: '#3b82f6' },
    { key: 'ASSEMBLY-STARTED', label: 'Assembly', color: '#8b5cf6' },
    { key: 'ASSEMBLY-COMPLETED', label: 'Asm Done', color: '#8b5cf6' },
    { key: 'DANDI-STARTED', label: 'Delivery', color: '#06b6d4' },
    { key: 'REM-ACCEPTED', label: 'Rem Accept', color: '#10b981' },
    { key: 'REM-CONFIRMED', label: 'Rem Confirmed', color: '#10b981' },
];

function getStatusIndex(status: string): number {
    const idx = STATUS_ORDER.indexOf(status);
    return idx >= 0 ? idx : -1;
}

function formatDate(d: string | null): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function OrderTimeline({ data, onSelectOrder, onSelectContainer }: Props) {
    const [containers, setContainers] = useState<any[]>([]);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedContainer, setExpandedContainer] = useState<number | null>(null);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [showDelayed, setShowDelayed] = useState(false);
    const [viewTab, setViewTab] = useState<'progress' | 'table'>('progress');

    useEffect(() => {
        fetchContainers('/api/order-container/?ordering=-created_at');
    }, []);

    const fetchContainers = async (url: string, append = false) => {
        try {
            setLoading(true);
            const res = await api.get(url);
            const results = res.data?.results || res.data || [];
            setContainers(prev => append ? [...prev, ...results] : results);
            setNextPage(res.data?.next || null);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    };

    const handleFilterClick = (statusKey: string) => {
        const newFilter = activeFilter === statusKey ? null : statusKey;
        setActiveFilter(newFilter);

        const delayedParam = showDelayed ? '&is_delayed=true' : '';
        const url = newFilter
            ? `/api/order-container/?ordering=-created_at&order_status=${newFilter}${delayedParam}`
            : `/api/order-container/?ordering=-created_at${delayedParam}`;
        fetchContainers(url, false);
    };

    const handleDelayedClick = () => {
        const newDelayedState = !showDelayed;
        setShowDelayed(newDelayedState);

        const delayedParam = newDelayedState ? '&is_delayed=true' : '';
        const url = activeFilter
            ? `/api/order-container/?ordering=-created_at&order_status=${activeFilter}${delayedParam}`
            : `/api/order-container/?ordering=-created_at${delayedParam}`;
        fetchContainers(url, false);
    };

    const toggleExpand = (id: number) => {
        setExpandedContainer(prev => prev === id ? null : id);
    };

    return (
        <div>
            {/* Tab Bar */}
            <div className="orders-tab-bar">
                <button
                    className={`orders-tab ${viewTab === 'progress' ? 'active' : ''}`}
                    onClick={() => setViewTab('progress')}
                >
                    Progress View
                </button>
                <button
                    className={`orders-tab ${viewTab === 'table' ? 'active' : ''}`}
                    onClick={() => setViewTab('table')}
                >
                    Table View
                </button>
            </div>

            {viewTab === 'table' ? (
                <OrdersTableView onSelectContainer={(id) => onSelectContainer?.(id)} />
            ) : (
                <div className="admin-section-card" style={{ padding: 0 }}>
                    <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h3 style={{ marginBottom: 0 }}>Order Containers Timeline</h3>
                            <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                                {data.orders.total_containers} total containers · {data.orders.total_orders} orders
                            </p>
                        </div>
                        <button
                            onClick={handleDelayedClick}
                            style={{
                                padding: '6px 12px',
                                borderRadius: 6,
                                border: showDelayed ? '1px solid var(--admin-danger)' : '1px solid var(--admin-border)',
                                background: showDelayed ? 'var(--admin-danger-light)' : 'var(--admin-surface)',
                                color: showDelayed ? 'var(--admin-danger)' : 'var(--admin-text-secondary)',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'all 0.2s',
                            }}
                        >
                            ⚠ {showDelayed ? 'Delayed Orders Active' : 'Show Delayed Orders'}
                        </button>
                    </div>
                    {/* Status Timeline Summary */}
                    <div style={{ padding: '12px 24px 0', overflowX: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, minWidth: 650 }}>
                            {STATUS_PIPELINE.map((step, idx) => {
                                const count = data.orders.status_distribution?.[step.key] || 0;
                                const hasOrders = count > 0;
                                const isActive = activeFilter === step.key;
                                return (
                                    <div key={step.key}
                                        onClick={() => handleFilterClick(step.key)}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            flex: 1, position: 'relative', minWidth: 60, cursor: 'pointer',
                                            opacity: activeFilter && !isActive ? 0.5 : 1, transition: 'opacity 0.2s'
                                        }}>
                                        {idx > 0 && (
                                            <div style={{
                                                position: 'absolute', top: 11, right: '50%', left: '-50%',
                                                height: 3, background: 'var(--admin-border)', zIndex: 0, borderRadius: 2,
                                            }} />
                                        )}
                                        <div style={{
                                            width: 24, height: 24, borderRadius: '50%',
                                            background: hasOrders ? step.color : 'var(--admin-border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            zIndex: 1, flexShrink: 0, transition: 'all 0.3s',
                                            boxShadow: isActive ? `0 0 0 4px ${step.color}40` : hasOrders ? `0 0 0 3px ${step.color}25` : 'none',
                                            transform: isActive ? 'scale(1.15)' : 'scale(1)',
                                        }}>
                                            <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{count}</span>
                                        </div>
                                        <span style={{
                                            fontSize: 9, fontWeight: 600, marginTop: 4,
                                            color: hasOrders ? 'var(--admin-text)' : 'var(--admin-text-muted)',
                                            textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.3,
                                            maxWidth: 65, lineHeight: 1.2,
                                        }}>{step.label}</span>
                                    </div>
                                );
                            })}
                        </div>
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
                                            <div className="admin-timeline-meta" style={{ marginBottom: 8 }}>
                                                <span>💰 {Math.round(container.full_payment || 0).toLocaleString()} Birr</span>
                                                <span>📍 {container.location || '-'}</span>
                                                <span>⚙️ {container.order_difficulty}</span>
                                                {container.delivery_date && (
                                                    <span>🚚 {formatDate(container.delivery_date)}</span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                                                {orders.map((o: any) => (
                                                    <div key={o.order_code} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'var(--admin-bg)', padding: '4px 8px', borderRadius: 4, width: 'fit-content' }}>
                                                        <span style={{ fontWeight: 600 }}>ORD-{o.order_code}</span>
                                                        {o.order_name && <span style={{ color: 'var(--admin-text-secondary)' }}>- {o.order_name}</span>}
                                                        <span className="admin-status-badge" style={{ fontSize: 9, padding: '1px 4px', height: 'auto', marginLeft: 4 }}>{o.order_status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onSelectContainer?.(container.id); }}
                                                style={{
                                                    background: 'var(--admin-primary)', color: '#fff', border: 'none',
                                                    borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600,
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                <Info size={12} /> Details
                                            </button>
                                            <span style={{ color: 'var(--admin-text-muted)' }}>
                                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </span>
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
                                                        onClick={(e) => { e.stopPropagation(); onSelectOrder({ ...order, container }); }}
                                                    >
                                                        <div style={{
                                                            display: 'flex', justifyContent: 'space-between',
                                                            alignItems: 'center', marginBottom: 8
                                                        }}>
                                                            <span style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                ORD-{order.order_code}
                                                                {order.order_name && <span style={{ fontSize: 11, color: 'var(--admin-text-secondary)', fontWeight: 500 }}>- {order.order_name}</span>}
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
                            <button onClick={() => fetchContainers(nextPage!, true)}>
                                Load More
                            </button>
                        </div>
                    )}

                    {!loading && containers.length === 0 && (
                        <div className="admin-empty">No order containers found</div>
                    )}
                </div>
            )}
        </div>
    );
}
