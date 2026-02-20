'use client';
import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
    X, Check, Clock, Package, DollarSign, Wrench, Truck, AlertTriangle,
    FileText, Image as ImageIcon, User, CreditCard, Calendar, MapPin,
    Phone, Star, ChevronRight, Layers, ArrowDownRight, ArrowUpRight,
    CheckCircle, XCircle, Info
} from 'lucide-react';

interface Props {
    order: any;
    onClose: () => void;
    onSelectContainer?: (containerId: number) => void;
}

const TIMELINE_STEPS = [
    { key: 'pre_accepted', label: 'Pre-Accepted', icon: '📋' },
    { key: 'pre_confirmed', label: 'Pre-Paid', icon: '💳' },
    { key: 'cnc_started', label: 'CNC Started', icon: '⚙️' },
    { key: 'cnc_completed', label: 'CNC Done', icon: '✅' },
    { key: 'assembly_started', label: 'Assembly', icon: '🔧' },
    { key: 'assembly_completed', label: 'Asm Done', icon: '✅' },
    { key: 'dandi', label: 'Delivery', icon: '🚚' },
    { key: 'rem_accepted', label: 'Rem Accept', icon: '💰' },
    { key: 'rem_confirmed', label: 'Rem Paid', icon: '✅' },
];

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

export default function OrderDetailOverlay({ order, onClose, onSelectContainer }: Props) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const isOpen = !!order;

    useEffect(() => {
        if (order?.order_code) {
            setActiveTab('overview');
            fetchDetails();
        }
    }, [order?.order_code]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/admin/order-details/${order.order_code}/`);
            setData(res.data);
        } catch (error) {
            console.error(error);
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

    const getStatusIndex = (status: string) => {
        const STATUS_ORDER = [
            'PRE-ACCEPTED', 'PRE-PAYMENT CONFIRMED', 'CNC-STARTED', 'CNC-COMPLETED',
            'ASSEMBLY-STARTED', 'ASSEMBLY-COMPLETED', 'DANDI-STARTED', 'REM-ACCEPTED', 'REM-CONFIRMED'
        ];
        return STATUS_ORDER.indexOf(status);
    };

    if (!isOpen) return null;

    const currentIdx = data ? getStatusIndex(data.status) : -1;

    const renderStatusBar = () => {
        if (!data) return null;
        return (
            <div style={{
                display: 'flex', alignItems: 'center', gap: 0,
                padding: '16px 0', overflow: 'auto'
            }}>
                {TIMELINE_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    return (
                        <div key={step.key} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            flex: 1, position: 'relative', minWidth: 55
                        }}>
                            {idx > 0 && (
                                <div style={{
                                    position: 'absolute', top: 12, right: '50%', left: '-50%',
                                    height: 3,
                                    background: idx <= currentIdx ? 'var(--admin-success)' : 'var(--admin-border)',
                                    zIndex: 0,
                                    borderRadius: 2,
                                }} />
                            )}
                            <div style={{
                                width: 26, height: 26, borderRadius: '50%',
                                background: isCurrent ? 'var(--admin-primary)' : isCompleted ? 'var(--admin-success)' : 'var(--admin-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                zIndex: 1, flexShrink: 0,
                                boxShadow: isCurrent ? '0 0 0 4px rgba(37,99,235,0.2)' : 'none',
                                transition: 'all 0.3s ease',
                            }}>
                                {isCompleted && <Check size={14} color="#fff" />}
                            </div>
                            <span style={{
                                fontSize: 9, fontWeight: 600, marginTop: 4,
                                color: isCurrent ? 'var(--admin-primary)' : isCompleted ? 'var(--admin-text)' : 'var(--admin-text-muted)',
                                textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.3,
                                maxWidth: 60,
                            }}>{step.label}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderOverviewTab = () => {
        if (!data) return null;
        const c = data.container;
        return (
            <>
                {/* Status Bar */}
                <div className="admin-section-card" style={{ padding: '8px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-muted)' }}>Order Progress</span>
                        <span className="admin-status-badge" style={{
                            background: STATUS_COLORS[data.status] || 'var(--admin-border)',
                            color: '#fff', border: 'none', fontSize: 10,
                        }}>{data.status}</span>
                    </div>
                    {renderStatusBar()}
                </div>

                {/* Container Card */}
                {c && (
                    <div className="admin-section-card" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)' }}>
                                Container #{c.id}
                            </h4>
                            {onSelectContainer && (
                                <button
                                    onClick={() => { onClose(); setTimeout(() => onSelectContainer(c.id), 100); }}
                                    style={{
                                        background: 'var(--admin-primary)', color: '#fff', border: 'none',
                                        borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 600,
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                    }}
                                >
                                    View Container →
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <InfoItem icon={<User size={14} />} label="Client" value={c.client} />
                            <InfoItem icon={<Phone size={14} />} label="Contact" value={c.contact} />
                            <InfoItem icon={<MapPin size={14} />} label="Location" value={c.location} />
                            <InfoItem icon={<Calendar size={14} />} label="Delivery Date" value={formatDateShort(c.delivery_date)} />
                            <InfoItem icon={<Star size={14} />} label="Difficulty" value={c.order_difficulty} />
                            <InfoItem icon={<User size={14} />} label="Posted By" value={c.posted_by} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                            {c.invoice && <MiniTag text="Invoice" color="var(--admin-primary)" />}
                            {c.delivery_service && <MiniTag text="Delivery" color="var(--admin-info)" />}
                            {c.instalation_service && <MiniTag text="Installation" color="var(--admin-success)" />}
                        </div>
                        {c.special_requerment && (
                            <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(245,158,11,0.08)', borderRadius: 8, fontSize: 12, color: 'var(--admin-text-secondary)' }}>
                                <strong style={{ color: 'var(--admin-warning)' }}>Special Req:</strong> {c.special_requerment}
                            </div>
                        )}
                        {c.note && (
                            <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--admin-bg)', borderRadius: 8, fontSize: 12, color: 'var(--admin-text-secondary)' }}>
                                <strong>Note:</strong> {c.note}
                            </div>
                        )}
                    </div>
                )}

                {/* Order Price */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
                    <KpiMini label="Order Price" value={formatBirr(data.price)} color="var(--admin-primary)" />
                    {c && <KpiMini label="Container #{c.id}" value={`${data.sibling_orders?.length || 1} orders`} color="var(--admin-text-secondary)" />}
                </div>

                {/* Order Info */}
                <div className="admin-section-card" style={{ padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)' }}>
                        Order Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <InfoItem label="Design Type" value={data.design_type} />
                        <InfoItem label="Price" value={formatBirr(data.price)} />
                        <InfoItem label="Created" value={formatDate(data.created_at)} />
                        <InfoItem label="Order Code" value={`#${data.order_code}`} />
                    </div>
                </div>

                {/* Timeline Details */}
                <div className="admin-section-card" style={{ padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)' }}>
                        Timeline
                    </h4>
                    {TIMELINE_STEPS.map((step, idx) => {
                        const dateVal = data.timeline[step.key];
                        const isCompleted = !!dateVal;
                        return (
                            <div key={step.key} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '6px 0', borderBottom: idx < TIMELINE_STEPS.length - 1 ? '1px solid var(--admin-border)' : 'none'
                            }}>
                                <div style={{
                                    width: 22, height: 22, borderRadius: '50%',
                                    background: isCompleted ? 'var(--admin-success)' : 'var(--admin-border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    {isCompleted && <Check size={12} color="#fff" />}
                                </div>
                                <div style={{ flex: 1, fontSize: 13, fontWeight: isCompleted ? 600 : 400, color: isCompleted ? 'var(--admin-text)' : 'var(--admin-text-muted)' }}>
                                    {step.label}
                                </div>
                                <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{formatDate(dateVal)}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Sibling Orders */}
                {data.sibling_orders && data.sibling_orders.length > 1 && (
                    <div className="admin-section-card" style={{ padding: 16 }}>
                        <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)' }}>
                            All Orders in Container ({data.sibling_orders.length})
                        </h4>
                        {data.sibling_orders.map((so: any) => (
                            <div key={so.order_code} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '8px 12px', borderRadius: 8, marginBottom: 4,
                                background: so.is_current ? 'var(--admin-primary-light)' : 'var(--admin-bg)',
                                border: so.is_current ? '1px solid var(--admin-primary)' : '1px solid transparent',
                            }}>
                                <div>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>#{so.order_code}</span>
                                    <span style={{ fontSize: 11, color: 'var(--admin-text-secondary)', marginLeft: 8 }}>{so.design_type}</span>
                                    {so.is_current && <span style={{ fontSize: 10, color: 'var(--admin-primary)', marginLeft: 6, fontWeight: 700 }}>CURRENT</span>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600 }}>{formatBirr(so.price)}</span>
                                    <span className="admin-status-badge" style={{
                                        fontSize: 9, padding: '2px 6px', height: 'auto',
                                        background: STATUS_COLORS[so.status] || 'var(--admin-text-muted)',
                                        color: '#fff', border: 'none',
                                    }}>{so.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    };

    const renderProductionTab = () => {
        if (!data) return null;
        const { production } = data;
        return (
            <>
                {/* CNC */}
                <div className="admin-section-card" style={{ padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={16} color="var(--admin-primary)" /> CNC Cutting ({production.cnc.length})
                    </h4>
                    {production.cnc.map((cnc: any) => (
                        <div key={cnc.id} style={{
                            padding: 12, background: 'var(--admin-bg)', borderRadius: 8, marginBottom: 8,
                            border: '1px solid var(--admin-border)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontWeight: 600, fontSize: 13 }}>CNC #{cnc.id}</span>
                                <span className="admin-status-badge" style={{ fontSize: 10, padding: '2px 8px', height: 'auto' }}>{cnc.status}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                                <DetailMini label="Operator" value={cnc.assigned_to || 'Unassigned'} />
                                <DetailMini label="Cut On" value={cnc.on_material || '-'} />
                                <DetailMini label="Sched. Start" value={formatDate(cnc.schedule_start_date)} />
                                <DetailMini label="Sched. End" value={formatDate(cnc.schedule_complate_date)} />
                                <DetailMini label="Actual Start" value={formatDate(cnc.start_date)} highlight={!!cnc.start_date} />
                                <DetailMini label="Actual End" value={formatDate(cnc.complate_date)} highlight={!!cnc.complate_date} />
                            </div>
                            {(cnc.image || cnc.file) && (
                                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                    {cnc.image && <a href={cnc.image} target="_blank" className="admin-link" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><ImageIcon size={12} /> Image</a>}
                                    {cnc.file && <a href={cnc.file} target="_blank" className="admin-link" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={12} /> CRV3D File</a>}
                                </div>
                            )}
                        </div>
                    ))}
                    {production.cnc.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No CNC tasks</div>}
                </div>

                {/* Assembly */}
                <div className="admin-section-card" style={{ padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Wrench size={16} color="var(--admin-primary)" /> Assembly ({production.assembly.length})
                    </h4>
                    {production.assembly.map((a: any) => (
                        <div key={a.id} style={{
                            padding: 12, background: 'var(--admin-bg)', borderRadius: 8, marginBottom: 8,
                            border: '1px solid var(--admin-border)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontWeight: 600, fontSize: 13 }}>Assembly #{a.id}</span>
                                <span className="admin-status-badge" style={{ fontSize: 10, padding: '2px 8px', height: 'auto' }}>{a.status}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                                <DetailMini label="Team" value={a.assigned_to.join(', ') || 'Unassigned'} span />
                                <DetailMini label="Sched. Start" value={formatDate(a.schedule_start_date)} />
                                <DetailMini label="Sched. End" value={formatDate(a.schedule_complate_date)} />
                                <DetailMini label="Actual Start" value={formatDate(a.start_date)} highlight={!!a.start_date} />
                                <DetailMini label="Actual End" value={formatDate(a.complate_date)} highlight={!!a.complate_date} />
                            </div>
                        </div>
                    ))}
                    {production.assembly.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No Assembly tasks</div>}
                </div>

                {/* Delivery */}
                <div className="admin-section-card" style={{ padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Truck size={16} color="var(--admin-primary)" /> Delivery & Installation ({production.delivery.length})
                    </h4>
                    {production.delivery.map((d: any) => (
                        <div key={d.id} style={{
                            padding: 12, background: 'var(--admin-bg)', borderRadius: 8, marginBottom: 8,
                            border: '1px solid var(--admin-border)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontWeight: 600, fontSize: 13 }}>Delivery #{d.id}</span>
                                <span className="admin-status-badge" style={{ fontSize: 10, padding: '2px 8px', height: 'auto' }}>{d.status}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                                <DetailMini label="Team" value={d.assigned_to.join(', ') || 'Unassigned'} span />
                                <DetailMini label="Sched. Start" value={formatDate(d.schedule_start_date)} />
                                <DetailMini label="Sched. End" value={formatDate(d.schedule_complate_date)} />
                                <DetailMini label="Actual Start" value={formatDate(d.start_date)} highlight={!!d.start_date} />
                                <DetailMini label="Actual End" value={formatDate(d.complate_date)} highlight={!!d.complate_date} />
                            </div>
                        </div>
                    ))}
                    {production.delivery.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No Delivery tasks</div>}
                </div>
            </>
        );
    };

    const renderFinancialsTab = () => {
        if (!data) return null;
        const { financials } = data;
        return (
            <>
                {/* Payments */}
                <div className="admin-section-card" style={{ padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)' }}>
                        Payments ({financials.payments.length})
                    </h4>
                    {financials.payments.map((p: any) => (
                        <div key={p.id} style={{
                            padding: 12, background: 'var(--admin-bg)', borderRadius: 8, marginBottom: 8,
                            border: '1px solid var(--admin-border)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <span className="admin-status-badge" style={{
                                        background: p.status === 'C' ? 'var(--admin-success)' : p.status === 'R' ? 'var(--admin-danger)' : 'var(--admin-warning)',
                                        color: '#fff', border: 'none', fontSize: 10, padding: '2px 8px', height: 'auto',
                                    }}>
                                        {p.status_display || (p.status === 'C' ? 'CONFIRMED' : p.status === 'R' ? 'REJECTED' : 'PENDING')}
                                    </span>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{p.reason_display || p.reason}</span>
                                </div>
                                <span style={{ fontWeight: 700, fontSize: 14 }}>{formatBirr(p.amount)}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                                <DetailMini label="Method" value={`${p.method}${p.account ? ` (${p.account})` : ''}`} />
                                <DetailMini label="Wallet" value={p.wallet || '-'} />
                                <DetailMini label="Accepted By" value={p.accepted_by} />
                                <DetailMini label="Date" value={formatDate(p.created_at)} />
                                {p.confirmed_by && <DetailMini label="Confirmed By" value={p.confirmed_by} />}
                                {p.confirmed_at && <DetailMini label="Confirmed At" value={formatDate(p.confirmed_at)} />}
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
                    {financials.payments.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No payments</div>}
                </div>

                {/* Pity Costs */}
                <div className="admin-section-card" style={{ padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)' }}>
                        Pity Costs ({financials.pity_costs.length})
                    </h4>
                    {financials.pity_costs.map((pc: any) => (
                        <div key={pc.id} style={{
                            padding: 12, background: 'var(--admin-bg)', borderRadius: 8, marginBottom: 8,
                            border: '1px solid var(--admin-border)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <span className="admin-status-badge" style={{
                                        background: pc.status === 'C' ? 'var(--admin-success)' : pc.status === 'R' ? 'var(--admin-danger)' : 'var(--admin-warning)',
                                        color: '#fff', border: 'none', fontSize: 10, padding: '2px 8px', height: 'auto',
                                    }}>
                                        {pc.status_display || pc.status}
                                    </span>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{pc.category}</span>
                                </div>
                                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--admin-danger)' }}>{formatBirr(pc.amount)}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                                <DetailMini label="Created By" value={pc.created_by} />
                                <DetailMini label="Date" value={formatDate(pc.created_at)} />
                                {pc.released_to && <DetailMini label="Released To" value={pc.released_to} />}
                                {pc.confirmed_by && <DetailMini label="Confirmed By" value={pc.confirmed_by} />}
                            </div>
                            {pc.note && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--admin-text-secondary)', fontStyle: 'italic' }}>Note: {pc.note}</div>}
                        </div>
                    ))}
                    {financials.pity_costs.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No pity costs</div>}
                </div>
            </>
        );
    };

    const renderMaterialsTab = () => {
        if (!data) return null;
        const { offset_analysis, offset_summary } = data;
        return (
            <>
                {/* Offset Summary */}
                {offset_summary && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
                        <KpiMini label="BOM Actual" value={formatBirr(offset_summary.total_bom_actual)} color="var(--admin-primary)" />
                        <KpiMini label="Offset Cost" value={formatBirr(offset_summary.total_offset_cost)} color="var(--admin-danger)" />
                    </div>
                )}

                <div className="admin-section-card" style={{ padding: '12px 16px', background: 'var(--admin-bg)', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--admin-text-secondary)' }}>
                        <Info size={14} color="var(--admin-warning)" />
                        <span>Offset = Released − BOM. Positive offset = excess usage. Additional releases (ADD) are automatically included in offset calculations.</span>
                    </div>
                </div>

                {/* Per-Material Analysis */}
                {offset_analysis.map((item: any) => (
                    <div key={item.material_id} className="admin-section-card" style={{ padding: 16, marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.material_name}</div>
                                <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                                    {item.releases.length} release(s) · {item.unit}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{
                                    fontWeight: 700, fontSize: 16,
                                    color: item.offset > 0 ? 'var(--admin-danger)' : item.offset < 0 ? 'var(--admin-success)' : 'var(--admin-text)',
                                }}>
                                    {item.offset > 0 ? '+' : ''}{Math.round(item.offset * 100) / 100} {item.unit}
                                </div>
                                {item.offset > 0 && item.offset_cost > 0 && (
                                    <div style={{ fontSize: 11, color: 'var(--admin-danger)', marginTop: 2 }}>
                                        ≈ {formatBirr(item.offset_cost)} excess
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* BOM vs Released bar */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12, marginBottom: 12 }}>
                            <DetailMini label="BOM Est." value={`${Math.round(item.bom_amount)} ${item.unit}`} />
                            <DetailMini label="Released" value={`${Math.round(item.released_amount)} ${item.unit}`} />
                            <DetailMini label="Price/Unit" value={item.price_per_unit ? formatBirr(item.price_per_unit) : '-'} />
                        </div>

                        {/* Release History */}
                        {item.releases.length > 0 && (
                            <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 8 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                                    Release History
                                </div>
                                {item.releases.map((r: any) => (
                                    <div key={r.id} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '4px 0', fontSize: 12, borderBottom: '1px solid var(--admin-border)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                                            {r.confirmed ? (
                                                <CheckCircle size={14} color="var(--admin-success)" style={{ flexShrink: 0 }} />
                                            ) : (
                                                <XCircle size={14} color="var(--admin-warning)" style={{ flexShrink: 0 }} />
                                            )}
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {formatDateShort(r.date)} · {r.released_by} · {r.inventory}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                            <span className="admin-status-badge" style={{
                                                fontSize: 9, padding: '1px 6px', height: 'auto',
                                                background: r.reason === 'ADD' ? 'var(--admin-warning)' : r.reason === 'ORDER' ? 'var(--admin-primary)' : 'var(--admin-text-muted)',
                                                color: '#fff', border: 'none',
                                            }}>
                                                {r.reason_display || r.reason}
                                            </span>
                                            <span style={{ fontWeight: 600 }}>{Math.round(r.amount * 100) / 100}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {offset_analysis.length === 0 && (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No materials found for this order</div>
                )}
            </>
        );
    };

    return (
        <>
            <div
                className={`admin-overlay-backdrop ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />
            <div className={`admin-overlay ${isOpen ? 'open' : ''}`} style={{ width: '680px' }}>
                <div className="admin-overlay-header">
                    <div>
                        <h2 style={{ marginBottom: 4 }}>Order #{order?.order_code}</h2>
                        {data && (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <span className="admin-status-badge" style={{
                                    fontSize: 10, padding: '2px 8px', height: 'auto',
                                    background: STATUS_COLORS[data.status] || 'var(--admin-border)',
                                    color: '#fff', border: 'none',
                                }}>{data.status}</span>
                                <span style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>{data.design_type}</span>
                            </div>
                        )}
                    </div>
                    <button className="admin-overlay-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="admin-overlay-body" style={{ padding: 0 }}>
                    {/* Tabs */}
                    <div className="admin-tabs" style={{ padding: '0 24px', paddingTop: '12px' }}>
                        {['overview', 'production', 'financials', 'materials'].map(tab => (
                            <button
                                key={tab}
                                className={`admin-tab ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab === 'overview' ? 'Overview' : tab === 'production' ? 'Production' : tab === 'financials' ? 'Financials' : 'Materials'}
                            </button>
                        ))}
                    </div>

                    <div style={{ padding: '0 24px 24px 24px' }}>
                        {loading ? (
                            <div className="admin-loading">
                                <div className="admin-spinner" /> Loading details...
                            </div>
                        ) : data ? (
                            <>
                                {activeTab === 'overview' && renderOverviewTab()}
                                {activeTab === 'production' && renderProductionTab()}
                                {activeTab === 'financials' && renderFinancialsTab()}
                                {activeTab === 'materials' && renderMaterialsTab()}
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    );
}

/* ---- Micro Components ---- */

function InfoItem({ icon, label, value, span }: { icon?: React.ReactNode; label: string; value: string | null; span?: boolean }) {
    return (
        <div style={{ gridColumn: span ? 'span 2' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 2 }}>
                {icon} {label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)' }}>{value || '-'}</div>
        </div>
    );
}

function KpiMini({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{
            padding: '12px 16px', background: 'var(--admin-surface)',
            borderRadius: 8, border: '1px solid var(--admin-border)',
            textAlign: 'center',
        }}>
            <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
        </div>
    );
}

function DetailMini({ label, value, highlight, span }: { label: string; value: string; highlight?: boolean; span?: boolean }) {
    return (
        <div style={{ gridColumn: span ? 'span 2' : undefined }}>
            <span style={{ color: 'var(--admin-text-muted)', fontSize: 11 }}>{label}: </span>
            <span style={{ fontWeight: highlight ? 700 : 500, color: highlight ? 'var(--admin-success)' : 'var(--admin-text)' }}>{value}</span>
        </div>
    );
}

function MiniTag({ text, color }: { text: string; color: string }) {
    return (
        <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 8px',
            borderRadius: 10, background: `${color}15`, color,
            border: `1px solid ${color}30`,
        }}>{text}</span>
    );
}
