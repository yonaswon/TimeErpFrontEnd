'use client';
import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
    X, Check, User, Phone, MapPin, Calendar, Star, Truck, DollarSign,
    Package, CreditCard, AlertTriangle, CheckCircle, XCircle, Image as ImageIcon,
    TrendingUp, TrendingDown, ChevronRight
} from 'lucide-react';

interface Props {
    containerId: number | null;
    onClose: () => void;
    onSelectOrder?: (order: any) => void;
}

const STATUS_COLORS: Record<string, string> = {
    'PRE-ACCEPTED': '#f59e0b',
    'PRE-PAYMENT CONFIRMED': '#f59e0b',
    'CNC-STARTED': '#3b82f6',
    'CNC-COMPLETED': '#3b82f6',
    'ASSEMBLY-STARTED': '#8b5cf6',
    'ASSEMBLY-COMPLETED': '#8b5cf6',
    'DANDI-STARTED': '#06b6d4',
    'REM-ACCEPTED': '#10b981',
    'REM-CONFIRMED': '#10b981',
};

const STATUS_STEPS = [
    'PRE-ACCEPTED', 'PRE-PAYMENT CONFIRMED', 'CNC-STARTED', 'CNC-COMPLETED',
    'ASSEMBLY-STARTED', 'ASSEMBLY-COMPLETED', 'DANDI-STARTED', 'REM-ACCEPTED', 'REM-CONFIRMED'
];

export default function ContainerDetailOverlay({ containerId, onClose, onSelectOrder }: Props) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const isOpen = !!containerId;

    useEffect(() => {
        if (containerId) {
            setActiveTab('overview');
            fetchDetails();
        }
    }, [containerId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/admin/container-details/${containerId}/`);
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d: string | null) => {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const formatDateShort = (d: string | null) => {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
    };

    const formatBirr = (n: number) => `${Math.round(n).toLocaleString()} Birr`;

    if (!isOpen) return null;

    const renderOverviewTab = () => {
        if (!data) return null;
        const fs = data.financial_stats || {};
        return (
            <>
                {/* Container Info */}
                <div className="admin-section-card" style={{ padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)' }}>
                        Client Information
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <InfoRow icon={<User size={14} />} label="Client" value={data.client} />
                        <InfoRow icon={<Phone size={14} />} label="Contact" value={data.contact} />
                        <InfoRow icon={<MapPin size={14} />} label="Location" value={data.location} />
                        <InfoRow icon={<Calendar size={14} />} label="Delivery" value={formatDateShort(data.delivery_date)} />
                        <InfoRow icon={<Star size={14} />} label="Difficulty" value={data.order_difficulty} />
                        <InfoRow icon={<User size={14} />} label="Posted By" value={data.posted_by} />
                        <InfoRow icon={<Calendar size={14} />} label="Created" value={formatDate(data.created_at)} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                        {data.invoice && <MiniTag text="Invoice" color="var(--admin-primary)" />}
                        {data.delivery_service && <MiniTag text="Delivery Service" color="#06b6d4" />}
                        {data.instalation_service && <MiniTag text="Installation Service" color="var(--admin-success)" />}
                    </div>
                    {data.special_requerment && (
                        <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(245,158,11,0.08)', borderRadius: 8, fontSize: 12, color: 'var(--admin-text-secondary)' }}>
                            <strong style={{ color: 'var(--admin-warning)' }}>Special Requirement:</strong> {data.special_requerment}
                        </div>
                    )}
                    {data.note && (
                        <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--admin-bg)', borderRadius: 8, fontSize: 12, color: 'var(--admin-text-secondary)' }}>
                            <strong>Note:</strong> {data.note}
                        </div>
                    )}
                </div>

                {/* Financial Stats */}
                <div className="admin-section-card" style={{ padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)' }}>
                        Financial Overview
                    </h4>
                    {/* Revenue */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                        <KpiCard label="Full Payment" value={formatBirr(data.full_payment)} color="var(--admin-text)" />
                        <KpiCard label="Advance Paid" value={formatBirr(data.advance_payment)} color="var(--admin-success)" />
                        <KpiCard label="Remaining" value={formatBirr(data.remaining_payment)} color="var(--admin-warning)" />
                    </div>
                    {/* Costs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
                        <KpiCard label="Offset Cost" value={formatBirr(fs.total_offset_cost || 0)} color="#dc2626" />
                        <KpiCard label="Additional Cost" value={formatBirr(fs.total_additional_cost || 0)} color="#f59e0b" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
                        <KpiCard label="Pity Costs" value={formatBirr(data.total_pity)} color="#dc2626" />
                        <KpiCard label="Orders Price" value={formatBirr(data.total_orders_price)} color="var(--admin-text)" />
                    </div>
                    {/* Profit */}
                    <div style={{
                        padding: '16px', borderRadius: 8, textAlign: 'center',
                        background: (fs.estimated_profit || 0) >= 0
                            ? 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(22,163,74,0.15))'
                            : 'linear-gradient(135deg, rgba(220,38,38,0.08), rgba(220,38,38,0.15))',
                        border: `1px solid ${(fs.estimated_profit || 0) >= 0 ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`,
                    }}>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
                            Estimated Profit
                        </div>
                        <div style={{
                            fontSize: 22, fontWeight: 800,
                            color: (fs.estimated_profit || 0) >= 0 ? 'var(--admin-success)' : '#dc2626',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                            {(fs.estimated_profit || 0) >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            {formatBirr(fs.estimated_profit || 0)}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                            Full Payment − BOM Est. − Pity − Additional
                        </div>
                    </div>
                </div>

                {/* Pity Cost Breakdown by Category */}
                {fs.pity_by_category && Object.keys(fs.pity_by_category).length > 0 && (
                    <div className="admin-section-card" style={{ padding: 16 }}>
                        <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)' }}>
                            Pity Costs by Category
                        </h4>
                        {Object.entries(fs.pity_by_category).map(([cat, amt]: [string, any]) => (
                            <div key={cat} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '8px 0', borderBottom: '1px solid var(--admin-border)', fontSize: 13,
                            }}>
                                <span style={{ color: 'var(--admin-text)' }}>{cat}</span>
                                <span style={{ fontWeight: 700, color: '#dc2626' }}>{formatBirr(amt)}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Orders List */}
                <div className="admin-section-card" style={{ padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)' }}>
                        Orders ({data.orders.length})
                    </h4>
                    {data.orders.map((o: any) => {
                        const progress = ((o.status_index + 1) / STATUS_STEPS.length) * 100;
                        return (
                            <div
                                key={o.order_code}
                                onClick={() => onSelectOrder && onSelectOrder(o)}
                                style={{
                                    padding: 12, background: 'var(--admin-bg)', borderRadius: 8, marginBottom: 8,
                                    border: '1px solid var(--admin-border)', cursor: onSelectOrder ? 'pointer' : 'default',
                                    transition: 'border-color 0.2s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--admin-primary)')}
                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--admin-primary)' }}>ORD-{o.order_code}</span>
                                        <span style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>{o.design_type}</span>
                                        <ChevronRight size={14} color="var(--admin-text-muted)" />
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: 14 }}>{formatBirr(o.price)}</span>
                                </div>
                                {/* Mini progress bar */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ flex: 1, height: 4, background: 'var(--admin-border)', borderRadius: 2, overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.max(progress, 5)}%`, height: '100%',
                                            background: STATUS_COLORS[o.status] || 'var(--admin-primary)',
                                            borderRadius: 2, transition: 'width 0.3s ease',
                                        }} />
                                    </div>
                                    <span className="admin-status-badge" style={{
                                        fontSize: 9, padding: '2px 6px', height: 'auto',
                                        background: STATUS_COLORS[o.status] || 'var(--admin-text-muted)',
                                        color: '#fff', border: 'none', flexShrink: 0,
                                    }}>{o.status}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Delivery & Installation */}
                {data.deliveries.length > 0 && (
                    <div className="admin-section-card" style={{ padding: 16 }}>
                        <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Truck size={16} color="var(--admin-primary)" /> Delivery & Installation
                        </h4>
                        {data.deliveries.map((d: any) => (
                            <div key={d.id} style={{ padding: 12, background: 'var(--admin-bg)', borderRadius: 8, marginBottom: 8, border: '1px solid var(--admin-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>Delivery #{d.id}</span>
                                    <span className="admin-status-badge" style={{ fontSize: 10, padding: '2px 8px', height: 'auto' }}>{d.status}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                                    <DetailLine label="Team" value={d.assigned_to.join(', ') || 'Unassigned'} />
                                    <DetailLine label="Sched. Start" value={formatDate(d.schedule_start_date)} />
                                    <DetailLine label="Sched. End" value={formatDate(d.schedule_complate_date)} />
                                    <DetailLine label="Actual Start" value={formatDate(d.start_date)} highlight={!!d.start_date} />
                                    <DetailLine label="Actual End" value={formatDate(d.complate_date)} highlight={!!d.complate_date} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    };

    const renderPaymentsTab = () => {
        if (!data) return null;
        return (
            <>
                <div className="admin-section-card" style={{ padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)' }}>
                        Payments ({data.payments.length})
                    </h4>
                    {data.payments.map((p: any) => (
                        <div key={p.id} style={{ padding: 12, background: 'var(--admin-bg)', borderRadius: 8, marginBottom: 8, border: '1px solid var(--admin-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <span className="admin-status-badge" style={{
                                        background: p.status === 'C' ? 'var(--admin-success)' : p.status === 'R' ? '#dc2626' : 'var(--admin-warning)',
                                        color: '#fff', border: 'none', fontSize: 10, padding: '2px 8px', height: 'auto',
                                    }}>{p.status_display}</span>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{p.reason_display}</span>
                                </div>
                                <span style={{ fontWeight: 700, fontSize: 14 }}>{formatBirr(p.amount)}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                                <DetailLine label="Method" value={`${p.method}${p.account ? ` (${p.account})` : ''}`} />
                                <DetailLine label="Wallet" value={p.wallet || '-'} />
                                <DetailLine label="Accepted By" value={p.accepted_by} />
                                <DetailLine label="Date" value={formatDate(p.created_at)} />
                                {p.confirmed_by && <DetailLine label="Confirmed By" value={p.confirmed_by} />}
                                {p.confirmed_at && <DetailLine label="Confirmed At" value={formatDate(p.confirmed_at)} />}
                            </div>
                            {p.note && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--admin-text-secondary)', fontStyle: 'italic' }}>Note: {p.note}</div>}
                            {(p.invoice_image || p.confirmation_image || p.additional_image) && (
                                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {p.invoice_image && <a href={p.invoice_image} target="_blank" className="admin-link" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><ImageIcon size={12} /> Invoice</a>}
                                    {p.confirmation_image && <a href={p.confirmation_image} target="_blank" className="admin-link" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><ImageIcon size={12} /> Receipt</a>}
                                    {p.additional_image && <a href={p.additional_image} target="_blank" className="admin-link" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><ImageIcon size={12} /> Additional</a>}
                                </div>
                            )}
                        </div>
                    ))}
                    {data.payments.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No payments</div>}
                </div>

                {/* Pity Costs */}
                <div className="admin-section-card" style={{ padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)' }}>
                        Pity Costs ({data.pity_costs.length})
                    </h4>
                    {data.pity_costs.map((pc: any) => (
                        <div key={pc.id} style={{ padding: 12, background: 'var(--admin-bg)', borderRadius: 8, marginBottom: 8, border: '1px solid var(--admin-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <span className="admin-status-badge" style={{
                                        background: pc.status === 'C' ? 'var(--admin-success)' : 'var(--admin-warning)',
                                        color: '#fff', border: 'none', fontSize: 10, padding: '2px 8px', height: 'auto',
                                    }}>{pc.status_display}</span>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{pc.category}</span>
                                </div>
                                <span style={{ fontWeight: 700, fontSize: 14, color: '#dc2626' }}>{formatBirr(pc.amount)}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                                <DetailLine label="Created By" value={pc.created_by} />
                                <DetailLine label="Date" value={formatDate(pc.created_at)} />
                                {pc.released_to && <DetailLine label="Released To" value={pc.released_to} />}
                                {pc.confirmed_by && <DetailLine label="Confirmed By" value={pc.confirmed_by} />}
                            </div>
                            {pc.note && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--admin-text-secondary)', fontStyle: 'italic' }}>Note: {pc.note}</div>}
                        </div>
                    ))}
                    {data.pity_costs.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No pity costs</div>}
                </div>
            </>
        );
    };

    return (
        <>
            <div className={`admin-overlay-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <div className={`admin-overlay ${isOpen ? 'open' : ''}`}>
                <div className="admin-overlay-header">
                    <div>
                        <h2 style={{ marginBottom: 4 }}>Container #{containerId}</h2>
                        {data && (
                            <span style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>
                                {data.client} · {data.orders.length} order{data.orders.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <button className="admin-overlay-close" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="admin-overlay-body" style={{ padding: 0 }}>
                    <div className="admin-tabs" style={{ padding: '0 24px', paddingTop: 12 }}>
                        {['overview', 'payments'].map(tab => (
                            <button
                                key={tab}
                                className={`admin-tab ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab === 'overview' ? 'Overview' : 'Payments'}
                            </button>
                        ))}
                    </div>
                    <div style={{ padding: '0 24px 24px' }}>
                        {loading ? (
                            <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>
                        ) : data ? (
                            <>
                                {activeTab === 'overview' && renderOverviewTab()}
                                {activeTab === 'payments' && renderPaymentsTab()}
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    );
}

/* Mini Components */
function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string | null }) {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 2 }}>{icon} {label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)' }}>{value || '-'}</div>
        </div>
    );
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{ padding: '10px 12px', background: 'var(--admin-surface)', borderRadius: 8, border: '1px solid var(--admin-border)', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--admin-text-muted)', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color }}>{value}</div>
        </div>
    );
}

function DetailLine({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div>
            <span style={{ color: 'var(--admin-text-muted)', fontSize: 11 }}>{label}: </span>
            <span style={{ fontWeight: highlight ? 700 : 500, color: highlight ? 'var(--admin-success)' : 'var(--admin-text)' }}>{value}</span>
        </div>
    );
}

function MiniTag({ text, color }: { text: string; color: string }) {
    return (
        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: `${color}15`, color, border: `1px solid ${color}30` }}>{text}</span>
    );
}
