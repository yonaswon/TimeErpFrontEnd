'use client';
import React, { useState, useEffect } from 'react';
import api from '../../api';
import { X, Check, Clock, Package, DollarSign, Wrench, Truck, AlertTriangle, FileText, Image as ImageIcon, User, CreditCard } from 'lucide-react';

interface Props {
    order: any; // Can be just { order_code: '...' }
    onClose: () => void;
}

interface OrderDetail {
    order_code: string;
    status: string;
    client: string | null;
    location: string | null;
    design_type: string;
    container_id: number | null;
    full_payment: number;
    advance_payment: number;
    remaining_payment: number;
    timeline: Record<string, string | null>;
    financials: {
        price: number;
        payments: {
            id: number;
            amount: number;
            reason: string;
            status: string;
            method: string;
            account: string | null;
            wallet: string | null;
            invoice: boolean;
            invoice_image: string | null;
            confirmation_image: string | null;
            accepted_by: string;
            confirmed_by: string | null;
            confirmed_at: string | null;
            note: string | null;
        }[];
        pity_costs: {
            id: number;
            category: string;
            amount: number;
            status: string;
            created_by: string;
            released_to: string | null;
            confirmed_by: string | null;
            invoice: boolean;
            note: string | null;
        }[];
    };
    offset_analysis: {
        material_id: number;
        material_name: string;
        unit: string;
        bom_amount: number;
        released_amount: number;
        offset: number;
        is_excess: boolean;
        releases: {
            id: number;
            date: string;
            amount: number;
            reason: string;
            inventory: string;
            released_by: string;
            proof_image: string | null;
        }[];
    }[];
    production: {
        cnc: {
            id: number;
            status: string;
            assigned_to: string | null;
            image: string | null;
            file: string | null;
        }[];
        assembly: {
            id: number;
            status: string;
            assigned_to: string[];
        }[];
        delivery: {
            id: number;
            status: string;
            assigned_to: string[];
        }[];
    };
}

const TIMELINE_STEPS = [
    { key: 'pre_accepted', label: 'Pre-Accepted' },
    { key: 'pre_confirmed', label: 'Pre-Paid' },
    { key: 'cnc_started', label: 'CNC Started' },
    { key: 'cnc_completed', label: 'CNC Done' },
    { key: 'assembly_started', label: 'Assembly Started' },
    { key: 'assembly_completed', label: 'Assembly Done' },
    { key: 'dandi', label: 'Delivery Started' },
    { key: 'rem_accepted', label: 'Rem Accepted' },
    { key: 'rem_confirmed', label: 'Rem Confirmed' },
];

export default function OrderDetailOverlay({ order, onClose }: Props) {
    const [data, setData] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const isOpen = !!order;

    useEffect(() => {
        if (order?.order_code) {
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

    const formatBirr = (n: number) => {
        return `${Math.round(n).toLocaleString()} Birr`;
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className={`admin-overlay-backdrop ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />
            <div className={`admin-overlay ${isOpen ? 'open' : ''}`} style={{ width: '600px' }}>
                <div className="admin-overlay-header">
                    <div>
                        <h2>Order #{order?.order_code}</h2>
                        {data && <span className="admin-status-badge">{data.status}</span>}
                    </div>
                    <button className="admin-overlay-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="admin-overlay-body" style={{ padding: 0 }}>
                    {/* Tabs */}
                    <div className="admin-tabs" style={{ padding: '0 24px', paddingTop: '16px' }}>
                        <button
                            className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            Overview
                        </button>
                        <button
                            className={`admin-tab ${activeTab === 'financials' ? 'active' : ''}`}
                            onClick={() => setActiveTab('financials')}
                        >
                            Financials
                        </button>
                        <button
                            className={`admin-tab ${activeTab === 'production' ? 'active' : ''}`}
                            onClick={() => setActiveTab('production')}
                        >
                            Production
                        </button>
                        <button
                            className={`admin-tab ${activeTab === 'materials' ? 'active' : ''}`}
                            onClick={() => setActiveTab('materials')}
                        >
                            Materials
                        </button>
                    </div>

                    <div style={{ padding: '0 24px 24px 24px' }}>
                        {loading ? (
                            <div className="admin-loading">
                                <div className="admin-spinner" /> Loading details...
                            </div>
                        ) : data ? (
                            <>
                                {/* OVERVIEW TAB */}
                                {activeTab === 'overview' && (
                                    <>
                                        <div className="admin-section-card">
                                            <h4>Client & Container</h4>
                                            <div className="admin-detail-row">
                                                <span className="admin-detail-label">Client</span>
                                                <span className="admin-detail-value">{data.client || '-'}</span>
                                            </div>
                                            <div className="admin-detail-row">
                                                <span className="admin-detail-label">Location</span>
                                                <span className="admin-detail-value">{data.location || '-'}</span>
                                            </div>
                                            <div className="admin-detail-row">
                                                <span className="admin-detail-label">Design Type</span>
                                                <span className="admin-detail-value">{data.design_type}</span>
                                            </div>
                                            <div className="admin-detail-row">
                                                <span className="admin-detail-label">Price</span>
                                                <span className="admin-detail-value">{formatBirr(data.financials.price)}</span>
                                            </div>
                                        </div>

                                        <div className="admin-section-card">
                                            <h4>Timeline</h4>
                                            {TIMELINE_STEPS.map((step, idx) => {
                                                const dateVal = data.timeline[step.key];
                                                const isCompleted = !!dateVal;
                                                return (
                                                    <div key={step.key} style={{
                                                        display: 'flex', alignItems: 'center', gap: 12,
                                                        padding: '8px 0', borderBottom: idx < TIMELINE_STEPS.length - 1 ? '1px solid var(--admin-border)' : 'none'
                                                    }}>
                                                        <div style={{
                                                            width: 24, height: 24, borderRadius: '50%',
                                                            background: isCompleted ? 'var(--admin-success)' : 'var(--admin-border)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            flexShrink: 0
                                                        }}>
                                                            {isCompleted && <Check size={14} color="#fff" />}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: 13, fontWeight: 600, color: isCompleted ? 'var(--admin-text)' : 'var(--admin-text-muted)' }}>
                                                                {step.label}
                                                            </div>
                                                        </div>
                                                        <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                                                            {formatDate(dateVal)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}

                                {/* FINANCIALS TAB */}
                                {activeTab === 'financials' && (
                                    <>
                                        <div className="admin-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
                                            <div className="admin-kpi-card" style={{ padding: '16px' }}>
                                                <div className="kpi-label">Full Payment</div>
                                                <div className="kpi-value" style={{ fontSize: '18px' }}>{formatBirr(data.full_payment)}</div>
                                            </div>
                                            <div className="admin-kpi-card" style={{ padding: '16px' }}>
                                                <div className="kpi-label">Advance</div>
                                                <div className="kpi-value" style={{ fontSize: '18px' }}>{formatBirr(data.advance_payment)}</div>
                                            </div>
                                            <div className="admin-kpi-card" style={{ padding: '16px' }}>
                                                <div className="kpi-label">Remaining</div>
                                                <div className="kpi-value" style={{ fontSize: '18px' }}>{formatBirr(data.remaining_payment)}</div>
                                            </div>
                                        </div>

                                        <h3>Payments History ({data.financials.payments.length})</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                            {data.financials.payments.map(p => (
                                                <div key={p.id} className="admin-section-card" style={{ marginBottom: 0, padding: '16px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            <span className={`admin-status-badge`} style={{
                                                                background: p.status === 'C' ? 'var(--admin-success)' : 'var(--admin-warning)',
                                                                color: '#fff'
                                                            }}>
                                                                {p.status === 'C' ? 'CONFIRMED' : 'PENDING'}
                                                            </span>
                                                            <span style={{ fontWeight: '600' }}>{p.reason}</span>
                                                        </div>
                                                        <div style={{ fontWeight: 'bold' }}>{formatBirr(p.amount)}</div>
                                                    </div>

                                                    <div className="admin-detail-row">
                                                        <span className="admin-detail-label">Method</span>
                                                        <span className="admin-detail-value">{p.method} {p.account ? `(${p.account})` : ''}</span>
                                                    </div>
                                                    <div className="admin-detail-row">
                                                        <span className="admin-detail-label">Accepted By</span>
                                                        <span className="admin-detail-value">{p.accepted_by}</span>
                                                    </div>
                                                    {p.confirmed_by && (
                                                        <div className="admin-detail-row">
                                                            <span className="admin-detail-label">Confirmed By</span>
                                                            <span className="admin-detail-value">{p.confirmed_by} ({formatDate(p.confirmed_at)})</span>
                                                        </div>
                                                    )}

                                                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                                        {p.invoice_image && (
                                                            <a href={p.invoice_image} target="_blank" className="admin-link" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <ImageIcon size={14} /> Invoice
                                                            </a>
                                                        )}
                                                        {p.confirmation_image && (
                                                            <a href={p.confirmation_image} target="_blank" className="admin-link" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <ImageIcon size={14} /> Receipt
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <h3>Pity Costs ({data.financials.pity_costs.length})</h3>
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>Category</th>
                                                    <th>Amount</th>
                                                    <th>To</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.financials.pity_costs.map(pc => (
                                                    <tr key={pc.id}>
                                                        <td>{pc.category}</td>
                                                        <td>{formatBirr(pc.amount)}</td>
                                                        <td>{pc.released_to || '-'}</td>
                                                        <td>{pc.status}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </>
                                )}

                                {/* PRODUCTION TAB */}
                                {activeTab === 'production' && (
                                    <>
                                        <h3>CNC Files</h3>
                                        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                                            {data.production.cnc.map(cnc => (
                                                <div key={cnc.id} className="admin-section-card" style={{ padding: '12px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: 40, height: 40, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                                                        <FileText size={20} color="var(--admin-text-secondary)" />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '600' }}>CNC Task #{cnc.id}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                                                            {cnc.assigned_to ? `Op: ${cnc.assigned_to}` : 'Unassigned'}
                                                        </div>
                                                    </div>
                                                    <span className="admin-status-badge">{cnc.status}</span>
                                                </div>
                                            ))}
                                            {data.production.cnc.length === 0 && <div className="admin-text-muted">No CNC files found.</div>}
                                        </div>

                                        <h3>Assembly</h3>
                                        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                                            {data.production.assembly.map(a => (
                                                <div key={a.id} className="admin-section-card" style={{ padding: '12px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: 40, height: 40, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                                                        <Wrench size={20} color="var(--admin-text-secondary)" />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '600' }}>Assembly Task #{a.id}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                                                            Team: {a.assigned_to.join(', ') || 'Unassigned'}
                                                        </div>
                                                    </div>
                                                    <span className="admin-status-badge">{a.status}</span>
                                                </div>
                                            ))}
                                            {data.production.assembly.length === 0 && <div className="admin-text-muted">No Assembly tasks found.</div>}
                                        </div>

                                        <h3>Delivery</h3>
                                        <div style={{ display: 'grid', gap: '12px' }}>
                                            {data.production.delivery.map(d => (
                                                <div key={d.id} className="admin-section-card" style={{ padding: '12px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: 40, height: 40, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                                                        <Truck size={20} color="var(--admin-text-secondary)" />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '600' }}>Delivery Task #{d.id}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                                                            Team: {d.assigned_to.join(', ') || 'Unassigned'}
                                                        </div>
                                                    </div>
                                                    <span className="admin-status-badge">{d.status}</span>
                                                </div>
                                            ))}
                                            {data.production.delivery.length === 0 && <div className="admin-text-muted">No Delivery tasks found.</div>}
                                        </div>
                                    </>
                                )}

                                {/* MATERIALS TAB (OFFSET ANALYSIS) */}
                                {activeTab === 'materials' && (
                                    <>
                                        <div className="admin-section-card" style={{ padding: '16px', background: 'var(--admin-bg)', marginBottom: '24px' }}>
                                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <AlertTriangle size={16} color="var(--admin-warning)" />
                                                Offset Analysis
                                            </h4>
                                            <p style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', margin: 0 }}>
                                                Comparison between estimated BOM material usage and actual released amounts.
                                                Positive offset indicates excess usage (wastage or additions).
                                            </p>
                                        </div>

                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>Material</th>
                                                    <th style={{ textAlign: 'right' }}>BOM Est.</th>
                                                    <th style={{ textAlign: 'right' }}>Released</th>
                                                    <th style={{ textAlign: 'right' }}>Offset</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.offset_analysis.map((item) => (
                                                    <React.Fragment key={item.material_id}>
                                                        <tr className={`clickable-row ${item.is_excess ? 'offset-row-excess' : ''}`}>
                                                            <td>
                                                                <div style={{ fontWeight: '600' }}>{item.material_name}</div>
                                                                <div style={{ fontSize: '11px', color: 'var(--admin-text-secondary)' }}>
                                                                    {item.releases.length} release(s)
                                                                </div>
                                                            </td>
                                                            <td style={{ textAlign: 'right' }}>
                                                                {Math.round(item.bom_amount)} {item.unit}
                                                            </td>
                                                            <td style={{ textAlign: 'right' }}>
                                                                {Math.round(item.released_amount)} {item.unit}
                                                            </td>
                                                            <td style={{ textAlign: 'right' }}>
                                                                <span className={item.offset > 0 ? 'offset-positive' : item.offset < 0 ? 'offset-neutral' : ''}>
                                                                    {item.offset > 0 ? '+' : ''}{Math.round(item.offset)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                        {/* Expanded details for releases (Always shown if there are releases?) -> Maybe just list below if excessive? 
                                                            Let's show a small list if offset > 0 to explain why.
                                                        */}
                                                        {item.releases.length > 0 && (
                                                            <tr>
                                                                <td colSpan={4} style={{ padding: '0 0 12px 0', borderBottom: '1px solid var(--admin-border)' }}>
                                                                    <div style={{ background: 'var(--admin-bg)', padding: '8px 12px', borderRadius: '4px', margin: '0 12px' }}>
                                                                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--admin-text-muted)', marginBottom: '4px' }}>RELEASE HISTORY</div>
                                                                        {item.releases.map(r => (
                                                                            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '2px 0' }}>
                                                                                <span>{formatDate(r.date)} - {r.inventory} ({r.released_by})</span>
                                                                                <span>{r.reason}: <b>{Math.round(r.amount)}</b></span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    );
}
