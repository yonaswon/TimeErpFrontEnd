'use client';
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { Eye, X, ChevronDown, ChevronUp, Search, RotateCcw, CreditCard, Package, Wrench, ShoppingBag } from 'lucide-react';

interface Props {
    initialFilters?: Record<string, string>;
    title?: string;
    onSelectContainer?: (id: number) => void;
    onSelectOrder?: (order: any) => void;
    onClose: () => void;
}

const REASON_LABELS: Record<string, string> = {
    PRE: 'Pre-Payment', REM: 'Remaining', FULL: 'Full Payment',
    SALES: 'Product Sales', MAINTENANCE: 'Maintenance'
};
const STATUS_LABELS: Record<string, string> = { P: 'Pending', C: 'Confirmed', R: 'Rejected' };
const STATUS_COLORS: Record<string, string> = { P: '#f59e0b', C: 'var(--admin-success)', R: '#dc2626' };

function formatBirr(n: number) { return `${Math.round(n).toLocaleString()}`; }
function formatDate(d: string | null) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function FinanceDetailPanel({ initialFilters = {}, title, onSelectContainer, onSelectOrder, onClose }: Props) {
    const [rows, setRows] = useState<any[]>([]);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [imageOverlay, setImageOverlay] = useState<{ url: string; label: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = useCallback(async (url: string, append = false) => {
        try {
            setLoading(true);
            const res = await api.get(url);
            const results = res.data?.results || res.data || [];
            setRows(prev => append ? [...prev, ...results] : results);
            setNextPage(res.data?.next || null);
        } catch (err) {
            console.error('Failed to fetch finance detail', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const params = new URLSearchParams();
        Object.entries(initialFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
        fetchData(`/api/admin/finance-detail/?${params.toString()}`);
    }, [initialFilters]);

    const handleSearch = () => {
        const params = new URLSearchParams();
        Object.entries(initialFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
        if (searchTerm) params.set('search', searchTerm);
        fetchData(`/api/admin/finance-detail/?${params.toString()}`);
    };

    const sourceIcon = (type: string | null) => {
        if (type === 'order') return <Package size={14} />;
        if (type === 'sales') return <ShoppingBag size={14} />;
        if (type === 'maintenance') return <Wrench size={14} />;
        return <CreditCard size={14} />;
    };

    const sourceLabel = (row: any) => {
        if (row.source_type === 'order' && row.order_container) {
            return row.order_container.client || `Container #${row.order_container.id}`;
        }
        if (row.source_type === 'sales' && row.material_sales) {
            return row.material_sales.customer_name || `Sale #${row.material_sales.id}`;
        }
        if (row.source_type === 'maintenance' && row.maintenance) {
            return `Maint #${row.maintenance.id}`;
        }
        return '-';
    };

    return (
        <div className="fin-overlay-backdrop" onClick={onClose}>
            <div className="fin-overlay-modal" onClick={e => e.stopPropagation()}>
                <div className="fin-overlay-header">
                    <h3 className="fin-overlay-title">{title || 'Finance Details'}</h3>
                    <button className="fin-overlay-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="fin-overlay-content">
                    {/* Search */}
                    <div className="fin-detail-search">
                        <div className="otf-search-box">
                            <Search size={14} className="otf-search-icon" />
                            <input
                                type="text"
                                placeholder="Search by client, order, transaction..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        {searchTerm && (
                            <button className="otf-reset" onClick={() => { setSearchTerm(''); handleSearch(); }}>
                                <RotateCcw size={12} /> Clear
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div className="fin-detail-table-wrap">
                        <table className="fin-detail-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Amount</th>
                                    <th>Reason</th>
                                    <th>Source</th>
                                    <th>Method</th>
                                    <th>Wallet</th>
                                    <th>Invoice</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => (
                                    <React.Fragment key={row.id}>
                                        <tr
                                            className={`fin-detail-row ${expandedId === row.id ? 'expanded' : ''}`}
                                            onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                                        >
                                            <td className="fin-cell-num">{idx + 1}</td>
                                            <td className="fin-cell-amount">{formatBirr(row.amount)} <span className="fin-currency">Birr</span></td>
                                            <td>
                                                <span className="fin-reason-badge" style={{ background: `${STATUS_COLORS[row.status]}15`, color: STATUS_COLORS[row.status] }}>
                                                    {REASON_LABELS[row.reason] || row.reason}
                                                </span>
                                            </td>
                                            <td className="fin-cell-source">
                                                <span className="fin-source-icon">{sourceIcon(row.source_type)}</span>
                                                <span>{sourceLabel(row)}</span>
                                            </td>
                                            <td className="fin-cell-method">{row.method}</td>
                                            <td className="fin-cell-wallet">{row.wallet_name || '-'}</td>
                                            <td className="fin-cell-invoice">
                                                {row.invoice ? (
                                                    <span className="fin-badge-yes">Yes</span>
                                                ) : (
                                                    <span className="fin-badge-no">No</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="fin-status-dot" style={{ background: STATUS_COLORS[row.status] }} />
                                                <span style={{ color: STATUS_COLORS[row.status], fontWeight: 600, fontSize: 12 }}>
                                                    {STATUS_LABELS[row.status]}
                                                </span>
                                            </td>
                                            <td className="fin-cell-date">{formatDate(row.created_at)}</td>
                                            <td className="fin-cell-expand">
                                                {expandedId === row.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </td>
                                        </tr>

                                        {/* Expanded Detail */}
                                        {expandedId === row.id && (
                                            <tr className="fin-detail-expanded-row">
                                                <td colSpan={10}>
                                                    <div className="fin-expanded-content">
                                                        {/* Payment Meta */}
                                                        <div className="fin-expanded-grid">
                                                            <div className="fin-expanded-item">
                                                                <span className="fin-expanded-label">Transaction ID</span>
                                                                <span className="fin-expanded-value">{row.transaction_id || '-'}</span>
                                                            </div>
                                                            <div className="fin-expanded-item">
                                                                <span className="fin-expanded-label">Accepted By</span>
                                                                <span className="fin-expanded-value">{row.accepted_by || '-'}</span>
                                                            </div>
                                                            <div className="fin-expanded-item">
                                                                <span className="fin-expanded-label">Confirmed By</span>
                                                                <span className="fin-expanded-value">{row.confirmed_by || '-'}</span>
                                                            </div>
                                                            <div className="fin-expanded-item">
                                                                <span className="fin-expanded-label">Confirmed At</span>
                                                                <span className="fin-expanded-value">{formatDate(row.confirmed_at)}</span>
                                                            </div>
                                                            <div className="fin-expanded-item">
                                                                <span className="fin-expanded-label">Account</span>
                                                                <span className="fin-expanded-value">{row.account_bank ? `${row.account_bank} (${row.account_number})` : '-'}</span>
                                                            </div>
                                                            {row.note && (
                                                                <div className="fin-expanded-item" style={{ gridColumn: 'span 2' }}>
                                                                    <span className="fin-expanded-label">Note</span>
                                                                    <span className="fin-expanded-value">{row.note}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Images */}
                                                        {(row.invoice_image || row.confirmation_image || row.additional_image) && (
                                                            <div className="fin-expanded-images">
                                                                {row.invoice_image && (
                                                                    <button className="ot-mockup-btn" onClick={e => { e.stopPropagation(); setImageOverlay({ url: row.invoice_image, label: 'Invoice' }); }}>
                                                                        <Eye size={13} /> Invoice
                                                                    </button>
                                                                )}
                                                                {row.confirmation_image && (
                                                                    <button className="ot-mockup-btn" onClick={e => { e.stopPropagation(); setImageOverlay({ url: row.confirmation_image, label: 'Confirmation' }); }}>
                                                                        <Eye size={13} /> Confirmation
                                                                    </button>
                                                                )}
                                                                {row.additional_image && (
                                                                    <button className="ot-mockup-btn" onClick={e => { e.stopPropagation(); setImageOverlay({ url: row.additional_image, label: 'Additional' }); }}>
                                                                        <Eye size={13} /> Additional
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Source Detail: Orders */}
                                                        {row.source_type === 'order' && row.order_container && (
                                                            <div className="fin-expanded-source">
                                                                <div className="fin-expanded-source-header">
                                                                    <Package size={14} />
                                                                    <span>Order Container — {row.order_container.client}</span>
                                                                    <button className="ot-detail-btn" onClick={e => { e.stopPropagation(); onSelectContainer?.(row.order_container.id); }} title="View container">
                                                                        <Eye size={12} />
                                                                    </button>
                                                                </div>
                                                                <div className="fin-expanded-orders">
                                                                    {(row.order_container.orders || []).map((o: any) => (
                                                                        <div
                                                                            key={o.order_code}
                                                                            className="fin-order-chip"
                                                                            onClick={e => { e.stopPropagation(); onSelectOrder?.(o); }}
                                                                        >
                                                                            <span className="ot-order-code">ORD-{o.order_code}</span>
                                                                            {o.order_name && <span className="ot-order-name">— {o.order_name}</span>}
                                                                            <span className="ot-order-status" style={{ background: o.order_status.includes('REM') ? '#10b981' : o.order_status.includes('CNC') ? '#3b82f6' : '#f59e0b' }}>
                                                                                {o.order_status}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="fin-container-amounts">
                                                                    <span>Full: {formatBirr(row.order_container.full_payment)} Birr</span>
                                                                    <span>Advance: {formatBirr(row.order_container.advance_payment)} Birr</span>
                                                                    <span>Remaining: {formatBirr(row.order_container.remaining_payment)} Birr</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Source Detail: Sales */}
                                                        {row.source_type === 'sales' && row.material_sales && (
                                                            <div className="fin-expanded-source">
                                                                <div className="fin-expanded-source-header">
                                                                    <ShoppingBag size={14} />
                                                                    <span>Product Sale — {row.material_sales.customer_name}</span>
                                                                </div>
                                                                <div className="fin-expanded-item">
                                                                    <span className="fin-expanded-label">Contact</span>
                                                                    <span className="fin-expanded-value">{row.material_sales.customer_contact || '-'}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Source Detail: Maintenance */}
                                                        {row.source_type === 'maintenance' && row.maintenance && (
                                                            <div className="fin-expanded-source">
                                                                <div className="fin-expanded-source-header">
                                                                    <Wrench size={14} />
                                                                    <span>Maintenance #{row.maintenance.id}</span>
                                                                </div>
                                                                {row.maintenance.order_code && (
                                                                    <div className="fin-expanded-item">
                                                                        <span className="fin-expanded-label">Order</span>
                                                                        <span className="fin-expanded-value">ORD-{row.maintenance.order_code}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {loading && <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>}

                    {nextPage && !loading && (
                        <div style={{ textAlign: 'center', padding: '12px' }}>
                            <button className="otf-apply" onClick={() => fetchData(nextPage, true)}>
                                Load More
                            </button>
                        </div>
                    )}

                    {!loading && rows.length === 0 && <div className="admin-empty">No payments found</div>}

                    {/* Image Overlay */}
                    {imageOverlay && (
                        <div className="ot-mockup-overlay" onClick={() => setImageOverlay(null)}>
                            <div className="ot-mockup-overlay-content" onClick={e => e.stopPropagation()}>
                                <div className="ot-mockup-overlay-header">
                                    <span>{imageOverlay.label}</span>
                                    <button onClick={() => setImageOverlay(null)}><X size={20} /></button>
                                </div>
                                <img src={imageOverlay.url} alt={imageOverlay.label} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
