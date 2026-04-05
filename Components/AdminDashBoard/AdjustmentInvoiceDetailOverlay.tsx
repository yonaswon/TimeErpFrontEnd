'use client';
import React, { useState, useEffect } from 'react';
import api from '../../api';
import { X, Calendar, User, Package, ShoppingBag, FileText, Image as ImageIcon } from 'lucide-react';

interface AdjustmentDetail {
    id: number;
    amount: string;
    note: string | null;
    invoice: string | null;
    additional_image: string | null;
    created_at: string;
    recorded_by: {
        id: number;
        first_name: string;
        last_name: string;
        username?: string;
        telegram_user_name?: string;
    } | null;
    order_container: any[];
    sales_recored: any[];
}

interface Props {
    adjustmentId: number | null;
    onClose: () => void;
    onSelectContainer?: (id: number) => void;
}

export default function AdjustmentInvoiceDetailOverlay({ adjustmentId, onClose, onSelectContainer }: Props) {
    const [data, setData] = useState<AdjustmentDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const isOpen = !!adjustmentId;

    useEffect(() => {
        if (adjustmentId) {
            fetchDetails();
        }
    }, [adjustmentId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/finance/adjustment-invoice/${adjustmentId}/`);
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

    const formatBirr = (n: number | string) => {
        return `${Math.round(parseFloat(n.toString())).toLocaleString()} Birr`;
    };

    const getUserName = (user: AdjustmentDetail['recorded_by']) => {
        if (!user) return 'Unknown';
        return user.telegram_user_name || user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown';
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
                    <h2>Adjustment #{adjustmentId}</h2>
                    <button className="admin-overlay-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="admin-overlay-body">
                    {loading ? (
                        <div className="admin-loading">
                            <div className="admin-spinner" /> Loading details...
                        </div>
                    ) : data ? (
                        <>
                            {/* Header Status */}
                            <div className="admin-section-card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>STATUS</div>
                                    <div className="admin-status-badge" style={{
                                        color: 'var(--admin-success)',
                                        borderColor: 'var(--admin-success)',
                                        background: `rgba(0,0,0,0.02)`
                                    }}>
                                        Completed
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>AMOUNT</div>
                                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--admin-text)' }}>
                                        {formatBirr(data.amount)}
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="admin-stats-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div className="admin-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', border: 'none', background: 'var(--admin-bg)', padding: '12px', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--admin-text-muted)' }}>
                                        <Calendar size={14} /> DATE
                                    </div>
                                    <div style={{ fontWeight: '600' }}>{formatDate(data.created_at)}</div>
                                </div>
                                <div className="admin-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', border: 'none', background: 'var(--admin-bg)', padding: '12px', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--admin-text-muted)' }}>
                                        <User size={14} /> RECORDED BY
                                    </div>
                                    <div style={{ fontWeight: '600' }}>{getUserName(data.recorded_by)}</div>
                                </div>
                                {data.note && (
                                    <div className="admin-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', border: 'none', background: 'var(--admin-bg)', padding: '12px', borderRadius: '8px', gridColumn: 'span 2' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--admin-text-muted)' }}>
                                            <FileText size={14} /> NOTE
                                        </div>
                                        <div style={{ fontWeight: '600' }}>{data.note}</div>
                                    </div>
                                )}
                            </div>

                            {/* Linked Entities */}
                            {(data.order_container?.length > 0 || data.sales_recored?.length > 0) && (
                                <div className="admin-overlay-section">
                                    <h4>Linked Records</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {data.order_container?.map((c: any) => (
                                            <div key={`order-${c.id}`} className="admin-detail-row" style={{ padding: '8px', border: '1px solid var(--admin-border)', borderRadius: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, color: 'var(--admin-primary)', cursor: onSelectContainer ? 'pointer' : 'default' }} onClick={() => onSelectContainer && onSelectContainer(c.id)}>
                                                    <Package size={16} /> Order #{c.id} - {c.client}
                                                </div>
                                            </div>
                                        ))}
                                        {data.sales_recored?.map((s: any) => (
                                            <div key={`sale-${s.id}`} className="admin-detail-row" style={{ padding: '8px', border: '1px solid var(--admin-border)', borderRadius: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, color: 'var(--admin-success)' }}>
                                                    <ShoppingBag size={16} /> Sale #{s.id} - {s.customer_name || 'N/A'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Images */}
                            {(data.invoice || data.additional_image) && (
                                <div className="admin-overlay-section">
                                    <h4>Attached Images</h4>
                                    <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                                        {data.invoice && (
                                            <div style={{ border: '1px solid var(--admin-border)', borderRadius: '8px', overflow: 'hidden' }}>
                                                <div style={{ padding: '8px 12px', background: 'var(--admin-bg)', borderBottom: '1px solid var(--admin-border)', fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <ImageIcon size={14} /> Invoice Image
                                                </div>
                                                <img src={data.invoice} alt="Invoice" style={{ width: '100%', display: 'block' }} />
                                            </div>
                                        )}
                                        {data.additional_image && (
                                            <div style={{ border: '1px solid var(--admin-border)', borderRadius: '8px', overflow: 'hidden' }}>
                                                <div style={{ padding: '8px 12px', background: 'var(--admin-bg)', borderBottom: '1px solid var(--admin-border)', fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <ImageIcon size={14} /> Additional Image
                                                </div>
                                                <img src={data.additional_image} alt="Additional" style={{ width: '100%', display: 'block' }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </>
    );
}
