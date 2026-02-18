'use client';
import React, { useState, useEffect } from 'react';
import api from '../../api';
import { X, Package, TrendingUp, TrendingDown, ArrowRightLeft, AlertTriangle } from 'lucide-react';

interface MaterialDetail {
    id: number;
    name: string;
    type: string;
    label: string | null;
    stats: {
        available: number;
        reserved: number;
        min_threshold: number;
        width: number;
        height: number;
    };
    transactions: {
        id: string;
        type: 'RELEASE' | 'PURCHASE' | 'TRANSFER';
        date: string;
        amount: number;
        inventory: string;
        user: string;
        detail: string;
    }[];
}

interface Props {
    materialId: number | null;
    onClose: () => void;
}

export default function MaterialDetailOverlay({ materialId, onClose }: Props) {
    const [data, setData] = useState<MaterialDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const isOpen = !!materialId;

    useEffect(() => {
        if (materialId) {
            fetchDetails();
        }
    }, [materialId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/admin/material-details/${materialId}/`);
            setData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d: string) => {
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <div
                className={`admin-overlay-backdrop ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />
            <div className={`admin-overlay ${isOpen ? 'open' : ''}`}>
                <div className="admin-overlay-header">
                    <h2>Material Details</h2>
                    <button className="admin-overlay-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="admin-overlay-body">
                    {loading ? (
                        <div className="admin-loading">
                            <div className="admin-spinner" /> Loading material data...
                        </div>
                    ) : data ? (
                        <>
                            {/* Header Info */}
                            <div className="admin-section-card" style={{ padding: '16px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '18px' }}>{data.name}</h3>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                            <span className="admin-status-badge">
                                                {data.type}
                                            </span>
                                            {data.label && (
                                                <span className="admin-status-badge" style={{ background: 'var(--admin-primary-light)', color: 'var(--admin-primary)' }}>
                                                    {data.label}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--admin-text)' }}>
                                            {Math.round(data.stats.available).toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                                            Available
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="admin-stats-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                                <div className="admin-kpi-card" style={{ padding: '16px' }}>
                                    <div className="kpi-label">Reserved</div>
                                    <div className="kpi-value" style={{ fontSize: '20px' }}>{Math.round(data.stats.reserved).toLocaleString()}</div>
                                </div>
                                <div className="admin-kpi-card" style={{ padding: '16px' }}>
                                    <div className="kpi-label">Min Threshold</div>
                                    <div className="kpi-value" style={{ fontSize: '20px' }}>{data.stats.min_threshold}</div>
                                </div>
                                {(data.stats.width > 0 || data.stats.height > 0) && (
                                    <div className="admin-kpi-card" style={{ padding: '16px', gridColumn: 'span 2' }}>
                                        <div className="kpi-label">Dimensions</div>
                                        <div className="kpi-value" style={{ fontSize: '16px', fontWeight: '500' }}>
                                            {data.stats.width} x {data.stats.height}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Low Stock Warning */}
                            {data.stats.available < data.stats.min_threshold && (
                                <div className="admin-section-card" style={{ borderColor: 'var(--admin-danger)', background: 'rgba(239, 68, 68, 0.05)', padding: '16px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--admin-danger)', fontWeight: '600' }}>
                                        <AlertTriangle size={20} />
                                        <span>Low Stock Alert! Current level is below minimum threshold.</span>
                                    </div>
                                </div>
                            )}

                            {/* Transaction History */}
                            <div className="admin-overlay-section">
                                <h4>Transaction History</h4>
                                <div className="transaction-list">
                                    {data.transactions.length === 0 ? (
                                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                            No recent transactions found.
                                        </div>
                                    ) : (
                                        data.transactions.map((tx) => (
                                            <div key={tx.id} className="transaction-item">
                                                <div className={`transaction-icon ${tx.type === 'RELEASE' ? 'bg-release' :
                                                        tx.type === 'PURCHASE' ? 'bg-purchase' : 'bg-transfer'
                                                    }`}>
                                                    {tx.type === 'RELEASE' && <TrendingDown size={18} />}
                                                    {tx.type === 'PURCHASE' && <TrendingUp size={18} />}
                                                    {tx.type === 'TRANSFER' && <ArrowRightLeft size={18} />}
                                                </div>
                                                <div className="transaction-info">
                                                    <div className="transaction-title">{tx.detail}</div>
                                                    <div className="transaction-meta">
                                                        {formatDate(tx.date)} • {tx.user} • {tx.inventory}
                                                    </div>
                                                </div>
                                                <div className="transaction-amount" style={{
                                                    color: tx.type === 'RELEASE' ? 'var(--admin-danger)' :
                                                        tx.type === 'PURCHASE' ? 'var(--admin-success)' : 'var(--admin-primary)'
                                                }}>
                                                    {tx.type === 'RELEASE' ? '-' : '+'}{Math.round(tx.amount).toLocaleString()}
                                                </div>
                                            </div>
                                        ))
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
