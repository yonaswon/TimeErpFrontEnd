'use client';
import React, { useState, useEffect } from 'react';
import api from '../../api';
import { X, DollarSign, Calendar, User, ShoppingCart, Image as ImageIcon } from 'lucide-react';

interface PurchaseDetail {
    id: number;
    status: string;
    status_display: string;
    request_status: string;
    created_by: string;
    date: string;
    inventory: string | null;
    total_amount: number;
    items: {
        material_name: string;
        amount: number;
        price: number;
        total: number;
    }[];
    payment: {
        method: string;
        account: string | null;
        payment_code: string | null;
        confirmed_by: string | null;
        finalized_by: string | null;
        invoice_image: string | null;
        payment_screenshot: string | null;
    };
}

interface Props {
    purchaseId: number | null;
    onClose: () => void;
}

export default function PurchaseDetailOverlay({ purchaseId, onClose }: Props) {
    const [data, setData] = useState<PurchaseDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const isOpen = !!purchaseId;

    useEffect(() => {
        if (purchaseId) {
            fetchDetails();
        }
    }, [purchaseId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/admin/purchase-details/${purchaseId}/`);
            setData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d: string) => {
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const formatBirr = (n: number) => {
        return `${Math.round(n).toLocaleString()} Birr`;
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'D': return 'var(--admin-success)';
            case 'P': return 'var(--admin-warning)';
            case 'C': return 'var(--admin-danger)';
            default: return 'var(--admin-text-secondary)';
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className={`admin-overlay-backdrop ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />
            <div className={`admin-overlay ${isOpen ? 'open' : ''}`}>
                <div className="admin-overlay-header">
                    <h2>Purchase #{purchaseId}</h2>
                    <button className="admin-overlay-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="admin-overlay-body">
                    {loading ? (
                        <div className="admin-loading">
                            <div className="admin-spinner" /> Loading purchase details...
                        </div>
                    ) : data ? (
                        <>
                            {/* Header Status */}
                            <div className="admin-section-card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>STATUS</div>
                                    <div className="admin-status-badge" style={{
                                        color: getStatusColor(data.status),
                                        borderColor: getStatusColor(data.status),
                                        background: `rgba(0,0,0,0.02)`
                                    }}>
                                        {data.status_display}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>TOTAL</div>
                                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--admin-text)' }}>
                                        {formatBirr(data.total_amount)}
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="admin-stats-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div className="admin-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', border: 'none', background: 'var(--admin-bg)', padding: '12px', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--admin-text-muted)' }}>
                                        <Calendar size={14} /> DATE
                                    </div>
                                    <div style={{ fontWeight: '600' }}>{formatDate(data.date)}</div>
                                </div>
                                <div className="admin-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', border: 'none', background: 'var(--admin-bg)', padding: '12px', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--admin-text-muted)' }}>
                                        <User size={14} /> REQUESTER
                                    </div>
                                    <div style={{ fontWeight: '600' }}>{data.created_by}</div>
                                </div>
                                <div className="admin-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', border: 'none', background: 'var(--admin-bg)', padding: '12px', borderRadius: '8px', gridColumn: 'span 2' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--admin-text-muted)' }}>
                                        <ShoppingCart size={14} /> INVENTORY
                                    </div>
                                    <div style={{ fontWeight: '600' }}>{data.inventory || '-'}</div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="admin-overlay-section">
                                <h4>Items Purchased</h4>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Material</th>
                                            <th style={{ textAlign: 'right' }}>Qty</th>
                                            <th style={{ textAlign: 'right' }}>Price</th>
                                            <th style={{ textAlign: 'right' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.material_name}</td>
                                                <td style={{ textAlign: 'right' }}>{Math.round(item.amount)}</td>
                                                <td style={{ textAlign: 'right' }}>{Math.round(item.price)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{Math.round(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Payment Info */}
                            <div className="admin-overlay-section">
                                <h4>Payment Details</h4>
                                <div className="admin-detail-row">
                                    <span className="admin-detail-label">Method</span>
                                    <span className="admin-detail-value">{data.payment.method}</span>
                                </div>
                                {data.payment.account && (
                                    <div className="admin-detail-row">
                                        <span className="admin-detail-label">Account</span>
                                        <span className="admin-detail-value">{data.payment.account}</span>
                                    </div>
                                )}
                                <div className="admin-detail-row">
                                    <span className="admin-detail-label">Confirmed By</span>
                                    <span className="admin-detail-value">{data.payment.confirmed_by || 'Pending'}</span>
                                </div>

                                <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                                    {data.payment.invoice_image && (
                                        <a href={data.payment.invoice_image} target="_blank" rel="noopener noreferrer"
                                            style={{ flex: 1, padding: '8px', border: '1px solid var(--admin-border)', borderRadius: '8px', textAlign: 'center', textDecoration: 'none', color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <ImageIcon size={16} /> View Invoice
                                        </a>
                                    )}
                                    {data.payment.payment_screenshot && (
                                        <a href={data.payment.payment_screenshot} target="_blank" rel="noopener noreferrer"
                                            style={{ flex: 1, padding: '8px', border: '1px solid var(--admin-border)', borderRadius: '8px', textAlign: 'center', textDecoration: 'none', color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <ImageIcon size={16} /> View Receipt
                                        </a>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </>
    );
}
