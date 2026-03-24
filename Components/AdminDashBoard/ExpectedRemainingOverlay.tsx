'use client';
import React, { useState, useEffect } from 'react';
import api from '../../api';
import { X, Package } from 'lucide-react';

interface Props {
    onClose: () => void;
    onSelectContainer?: (id: number) => void;
    onSelectOrder?: (order: any) => void;
}

function formatBirr(n: number) { return `${Math.round(n).toLocaleString()}`; }
function formatDate(d: string | null) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function ExpectedRemainingOverlay({ onClose, onSelectContainer, onSelectOrder }: Props) {
    const [containers, setContainers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextPage, setNextPage] = useState<string | null>(null);

    const fetchData = async (url: string, append = false) => {
        try {
            setLoading(true);
            const res = await api.get(url);
            const results = res.data?.results || [];
            setContainers(prev => append ? [...prev, ...results] : results);
            setNextPage(res.data?.next || null);
        } catch (err) {
            console.error('Failed to fetch expected remaining orders', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData('/api/admin/orders-table/?is_expected_remaining=true');
    }, []);

    let totalExpected = 0;
    containers.forEach(c => totalExpected += parseFloat(c.remaining_payment || 0));

    return (
        <div className="fin-overlay-backdrop" onClick={onClose}>
            <div className="fin-overlay-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 900 }}>
                <div className="fin-overlay-header">
                    <div>
                        <h3 className="fin-overlay-title">Expected Remaining Orders</h3>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text-secondary)', marginTop: 4 }}>
                            Orders from Pre-Accepted up to D&I Started (Remaining Accepted not included)
                        </p>
                    </div>
                    <button className="fin-overlay-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="fin-overlay-content">
                    <div className="fin-detail-table-wrap">
                        <table className="fin-detail-table">
                            <thead>
                                <tr>
                                    <th>Container</th>
                                    <th>Client</th>
                                    <th>Orders</th>
                                    <th style={{ textAlign: 'right' }}>Full</th>
                                    <th style={{ textAlign: 'right' }}>Advance</th>
                                    <th style={{ textAlign: 'right' }}>Remaining</th>
                                </tr>
                            </thead>
                            <tbody>
                                {containers.map((c, idx) => (
                                    <tr key={c.id} className="fin-detail-row">
                                        <td>
                                            <button className="ot-detail-btn" onClick={() => onSelectContainer?.(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Package size={14} /> #{c.id}
                                            </button>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{c.client || '-'}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {(c.orders || []).map((o: any) => (
                                                    <div
                                                        key={o.order_code}
                                                        className="fin-order-chip"
                                                        onClick={() => onSelectOrder?.(o)}
                                                        style={{ display: 'inline-flex', width: 'fit-content' }}
                                                    >
                                                        <span className="ot-order-code">ORD-{o.order_code}</span>
                                                        <span className="ot-order-status" style={{ fontSize: 10, padding: '2px 6px', background: '#3b82f6' }}>{o.order_status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right', color: 'var(--admin-text-secondary)' }}>{formatBirr(parseFloat(c.full_payment || 0))}</td>
                                        <td style={{ textAlign: 'right', color: 'var(--admin-success)' }}>{formatBirr(parseFloat(c.advance_payment || 0))}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--admin-primary)' }}>{formatBirr(parseFloat(c.remaining_payment || 0))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {loading && <div className="admin-loading"><div className="admin-spinner" /></div>}
                    {!loading && containers.length === 0 && <div className="admin-empty">No expected remaining orders fund</div>}

                    {nextPage && !loading && (
                        <div style={{ textAlign: 'center', padding: '12px' }}>
                            <button className="otf-apply" onClick={() => fetchData(nextPage, true)}>Load More</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
