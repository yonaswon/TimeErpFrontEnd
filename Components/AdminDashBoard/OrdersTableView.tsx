'use client';
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { Eye, X, Info, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import OrdersTableFilters, { EMPTY_TABLE_FILTERS } from './OrdersTableFilters';
import type { TableFilters } from './OrdersTableFilters';

interface Props {
    onSelectContainer: (containerId: number) => void;
}

function formatRelativeTime(dateStr: string | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
}

function formatDate(d: string | null): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function formatBirr(n: number): string {
    return `${Math.round(n).toLocaleString()}`;
}

const STATUS_COLORS: Record<string, string> = {
    'PRE-ACCEPTED': '#f59e0b',
    'PRE-CONFIRMED': '#f59e0b',
    'CNC-STARTED': '#3b82f6',
    'CNC-COMPLETED': '#3b82f6',
    'ASSEMBLY-STARTED': '#8b5cf6',
    'ASSEMBLY-COMPLETED': '#8b5cf6',
    'DANDI-STARTED': '#06b6d4',
    'REM-ACCEPTED': '#10b981',
    'REM-CONFIRMED': '#10b981',
};

export default function OrdersTableView({ onSelectContainer }: Props) {
    const [rows, setRows] = useState<any[]>([]);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<TableFilters>({ ...EMPTY_TABLE_FILTERS });
    const [mockupOverlay, setMockupOverlay] = useState<{ url: string; code: number } | null>(null);

    const fetchData = useCallback(async (url: string, currentFilters: TableFilters, append = false) => {
        try {
            setLoading(true);
            let finalUrl = url;
            // If it's the base URL, build params
            if (!url.includes('?') || url === '/api/admin/orders-table/') {
                const params = new URLSearchParams();
                Object.entries(currentFilters).forEach(([key, value]) => {
                    if (value) params.set(key, value);
                });
                const qs = params.toString();
                finalUrl = `/api/admin/orders-table/${qs ? '?' + qs : ''}`;
            }
            const res = await api.get(finalUrl);
            const results = res.data?.results || res.data || [];
            setRows(prev => append ? [...prev, ...results] : results);
            setNextPage(res.data?.next || null);
        } catch (err) {
            console.error('Failed to fetch table data', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData('/api/admin/orders-table/', filters);
    }, []);

    const handleApplyFilters = (newFilters: TableFilters) => {
        setFilters(newFilters);
        fetchData('/api/admin/orders-table/', newFilters);
    };

    const handleResetFilters = () => {
        const empty = { ...EMPTY_TABLE_FILTERS };
        setFilters(empty);
        fetchData('/api/admin/orders-table/', empty);
    };

    return (
        <div className="orders-table-section">
            <OrdersTableFilters
                filters={filters}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
            />

            <div className="orders-table-wrap">
                <table className="orders-excel-table">
                    <thead>
                        <tr>
                            <th className="ot-col-num">#</th>
                            <th className="ot-col-orders">Orders</th>
                            <th className="ot-col-mockup">Mockup</th>
                            <th className="ot-col-client">Client</th>
                            <th className="ot-col-created">Created</th>
                            <th className="ot-col-delivery">Delivery</th>
                            <th className="ot-col-status">Status</th>
                            <th className="ot-col-by">Created By</th>
                            <th className="ot-col-money">Full Pay</th>
                            <th className="ot-col-money">Advance</th>
                            <th className="ot-col-money">Remaining</th>
                            <th className="ot-col-detail"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row: any, idx: number) => (
                            <tr
                                key={row.id}
                                className={`orders-row orders-row-${row.row_shade}${row.is_delayed ? ' orders-row-delayed' : ''}`}
                            >
                                <td className="ot-cell-num">{idx + 1}</td>

                                {/* Orders cell */}
                                <td className="ot-cell-orders">
                                    <div className="ot-v-flex">
                                        {(row.orders || []).map((o: any) => (
                                            <div key={o.order_code} className="ot-order-line">
                                                <span className="ot-order-code">ORD-{o.order_code}</span>
                                                {o.order_name && <span className="ot-order-name">- {o.order_name}</span>}
                                                <span
                                                    className="ot-order-status"
                                                    style={{ background: STATUS_COLORS[o.order_status] || '#94a3b8' }}
                                                >
                                                    {o.order_status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </td>

                                {/* Mockup cell */}
                                <td className="ot-cell-mockup">
                                    <div className="ot-v-flex">
                                        {(row.orders || []).map((o: any) => (
                                            o.mockup_image ? (
                                                <button
                                                    key={o.order_code}
                                                    className="ot-mockup-btn"
                                                    onClick={() => setMockupOverlay({ url: o.mockup_image, code: o.order_code })}
                                                    title={`View mockup for ORD-${o.order_code}`}
                                                >
                                                    <Eye size={13} />
                                                    <span>ORD-{o.order_code}</span>
                                                </button>
                                            ) : (
                                                <div key={o.order_code} className="ot-mockup-empty">—</div>
                                            )
                                        ))}
                                    </div>
                                </td>

                                {/* Client */}
                                <td className="ot-cell-client">
                                    <div className="ot-client-name">{row.client || '-'}</div>
                                    <div className="ot-client-location">{row.location || ''}</div>
                                </td>

                                {/* Created */}
                                <td className="ot-cell-date">
                                    <div className="ot-date-main">{formatDate(row.created_at)}</div>
                                    <div className="ot-date-relative">{formatRelativeTime(row.created_at)}</div>
                                </td>

                                {/* Delivery */}
                                <td className="ot-cell-delivery">
                                    <div className="ot-date-main">{formatDate(row.delivery_date)}</div>
                                    {row.is_delayed ? (
                                        <div className="ot-delayed-badge">
                                            <AlertTriangle size={10} /> DELAYED
                                        </div>
                                    ) : row.days_until_delivery !== null && row.days_until_delivery >= 0 ? (
                                        <div className="ot-delivery-ok">
                                            <Clock size={10} /> {row.days_until_delivery === 0 ? 'Today' : `in ${row.days_until_delivery}d`}
                                        </div>
                                    ) : row.all_completed ? (
                                        <div className="ot-delivery-done">Delivered</div>
                                    ) : null}
                                </td>

                                {/* Status */}
                                <td className="ot-cell-status">
                                    {row.all_completed ? (
                                        <CheckCircle size={18} color="#16a34a" />
                                    ) : (
                                        <XCircle size={18} color="#dc2626" />
                                    )}
                                </td>

                                {/* Created by */}
                                <td className="ot-cell-by">{row.posted_by_display || '-'}</td>

                                {/* Full payment */}
                                <td className="ot-cell-money">
                                    <div className="ot-money-amount">{formatBirr(row.full_payment)}</div>
                                </td>

                                {/* Advance */}
                                <td className="ot-cell-money">
                                    <div className="ot-money-amount">{formatBirr(row.advance_payment)}</div>
                                    <div className={`ot-money-status ${row.pre_confirmed ? 'confirmed' : 'pending'}`}>
                                        {row.pre_confirmed ? '✓ Confirmed' : '✗ Pending'}
                                        {(row.payments || []).filter((p: any) => p.reason === 'PRE' && (p.invoice_image || p.confirmation_image)).map((p: any, i: number) => (
                                            <button
                                                key={i}
                                                className="ot-payment-img-btn"
                                                title="View payment image"
                                                onClick={() => setMockupOverlay({ url: p.invoice_image || p.confirmation_image, code: p.id })}
                                            >
                                                <Eye size={12} />
                                            </button>
                                        ))}
                                    </div>
                                </td>

                                {/* Remaining */}
                                <td className="ot-cell-money">
                                    <div className="ot-money-amount">{formatBirr(row.remaining_payment)}</div>
                                    <div className={`ot-money-status ${row.rem_confirmed ? 'confirmed' : 'pending'}`}>
                                        {row.rem_confirmed ? '✓ Paid' : '✗ Not Paid'}
                                        {(row.payments || []).filter((p: any) => p.reason === 'REM' && (p.invoice_image || p.confirmation_image)).map((p: any, i: number) => (
                                            <button
                                                key={i}
                                                className="ot-payment-img-btn"
                                                title="View payment image"
                                                onClick={() => setMockupOverlay({ url: p.invoice_image || p.confirmation_image, code: p.id })}
                                            >
                                                <Eye size={12} />
                                            </button>
                                        ))}
                                    </div>
                                </td>

                                {/* Detail */}
                                <td className="ot-cell-detail">
                                    <button
                                        className="ot-detail-btn"
                                        onClick={() => onSelectContainer(row.id)}
                                        title="View details"
                                    >
                                        <Info size={15} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {loading && (
                <div className="admin-loading">
                    <div className="admin-spinner" /> Loading...
                </div>
            )}

            {nextPage && !loading && (
                <div className="admin-load-more">
                    <button onClick={() => fetchData(nextPage!, filters, true)}>
                        Load More
                    </button>
                </div>
            )}

            {!loading && rows.length === 0 && (
                <div className="admin-empty">No orders found matching filters</div>
            )}

            {/* Mockup Image Overlay */}
            {mockupOverlay && (
                <div className="ot-mockup-overlay" onClick={() => setMockupOverlay(null)}>
                    <div className="ot-mockup-overlay-content" onClick={e => e.stopPropagation()}>
                        <div className="ot-mockup-overlay-header">
                            <span>ORD-{mockupOverlay.code} — Mockup</span>
                            <button onClick={() => setMockupOverlay(null)}><X size={20} /></button>
                        </div>
                        <img src={mockupOverlay.url} alt={`Mockup ORD-${mockupOverlay.code}`} />
                    </div>
                </div>
            )}
        </div>
    );
}
