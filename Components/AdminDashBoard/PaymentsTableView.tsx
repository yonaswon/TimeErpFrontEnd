'use client';
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { Eye, X, ChevronDown, ChevronUp, Package, Wrench, ShoppingBag, CreditCard, Info } from 'lucide-react';
import FinanceTableFilters, { EMPTY_FINANCE_FILTERS } from './FinanceTableFilters';
import type { FinanceTableFiltersState } from './FinanceTableFilters';

interface Props {
    source?: 'order' | 'sales' | 'maintenance' | null;
    onSelectContainer?: (id: number) => void;
    onSelectOrder?: (order: any) => void;
}

const REASON_LABELS: Record<string, string> = {
    PRE: 'Pre-Payment', REM: 'Remaining', FULL: 'Full Payment',
    SALES: 'Product Sales', MAINTENANCE: 'Maintenance'
};
const STATUS_LABELS: Record<string, string> = { P: 'Pending', C: 'Confirmed', R: 'Rejected' };
const STATUS_COLORS: Record<string, string> = { P: '#f59e0b', C: '#16a34a', R: '#dc2626' };

const REASON_OPTIONS = [
    { value: 'PRE', label: 'Pre-Payment' },
    { value: 'REM', label: 'Remaining' },
    { value: 'FULL', label: 'Full Payment' },
    { value: 'SALES', label: 'Product Sales' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
];
const STATUS_OPTIONS = [
    { value: 'P', label: 'Pending' },
    { value: 'C', label: 'Confirmed' },
    { value: 'R', label: 'Rejected' },
];

function formatBirr(n: number) { return `${Math.round(n).toLocaleString()}`; }
function formatDate(d: string | null) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

const ORDER_STATUS_COLORS: Record<string, string> = {
    'PRE-ACCEPTED': '#f59e0b', 'PRE-CONFIRMED': '#f59e0b',
    'CNC-STARTED': '#3b82f6', 'CNC-COMPLETED': '#3b82f6',
    'ASSEMBLY-STARTED': '#8b5cf6', 'ASSEMBLY-COMPLETED': '#8b5cf6',
    'DANDI-STARTED': '#06b6d4',
    'REM-ACCEPTED': '#10b981', 'REM-CONFIRMED': '#10b981',
};

export default function PaymentsTableView({ source, onSelectContainer, onSelectOrder }: Props) {
    const [rows, setRows] = useState<any[]>([]);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<FinanceTableFiltersState>({ ...EMPTY_FINANCE_FILTERS });
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [imageOverlay, setImageOverlay] = useState<{ url: string; label: string } | null>(null);

    const fetchData = useCallback(async (url: string, currentFilters: FinanceTableFiltersState, append = false) => {
        try {
            setLoading(true);
            let finalUrl = url;
            if (!url.includes('?') || url === '/api/admin/finance-tables/') {
                const params = new URLSearchParams();
                params.set('type', 'payments');
                if (source) params.set('source', source);
                Object.entries(currentFilters).forEach(([key, value]) => {
                    if (value) params.set(key, value);
                });
                finalUrl = `/api/admin/finance-tables/?${params.toString()}`;
            }
            const res = await api.get(finalUrl);
            const results = res.data?.results || res.data || [];
            setRows(prev => append ? [...prev, ...results] : results);
            setNextPage(res.data?.next || null);
        } catch (err) {
            console.error('Failed to fetch payments', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData('/api/admin/finance-tables/', filters);
    }, []);

    const handleApply = (f: FinanceTableFiltersState) => { setFilters(f); fetchData('/api/admin/finance-tables/', f); };
    const handleReset = () => { const e = { ...EMPTY_FINANCE_FILTERS }; setFilters(e); fetchData('/api/admin/finance-tables/', e); };

    const sourceIcon = (type: string | null) => {
        if (type === 'order') return <Package size={14} />;
        if (type === 'sales') return <ShoppingBag size={14} />;
        if (type === 'maintenance') return <Wrench size={14} />;
        return <CreditCard size={14} />;
    };

    const sourceLabel = (row: any) => {
        if (row.source_type === 'order' && row.order_container) return row.order_container.client || `Container #${row.order_container.id}`;
        if (row.source_type === 'sales' && row.material_sales) return row.material_sales.customer_name || `Sale #${row.material_sales.id}`;
        if (row.source_type === 'maintenance' && row.maintenance) return row.maintenance.client_name || `Maint #${row.maintenance.id}`;
        return '-';
    };

    const hasImages = (row: any) => row.invoice_image || row.confirmation_image || row.additional_image;

    let globalIdx = 0;

    return (
        <div className="orders-table-section">
            <FinanceTableFilters
                filters={filters}
                onApply={handleApply}
                onReset={handleReset}
                showReason
                showStatus
                reasonOptions={REASON_OPTIONS}
                statusOptions={STATUS_OPTIONS}
                searchPlaceholder="Search payments..."
            />

            <div className="orders-table-wrap">
                <table className="orders-excel-table">
                    <thead>
                        <tr>
                            <th className="ot-col-num">#</th>
                            <th>Amount</th>
                            <th>Reason</th>
                            <th>Source</th>
                            <th>Method</th>
                            <th>Wallet</th>
                            <th>Invoice</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Images</th>
                            <th className="ot-col-detail"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => {
                            globalIdx++;
                            return (
                                <React.Fragment key={row.id}>
                                    <tr
                                        className={`orders-row ${expandedId === row.id ? 'expanded' : ''}`}
                                        onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                                    >
                                        <td className="ot-cell-num">{globalIdx}</td>
                                        <td className="ot-cell-money">
                                            <div className="ot-money-amount">{formatBirr(row.amount)}</div>
                                            <div style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>Birr</div>
                                        </td>
                                        <td>
                                            <span className="fin-reason-badge" style={{ background: `${STATUS_COLORS[row.status]}15`, color: STATUS_COLORS[row.status] }}>
                                                {REASON_LABELS[row.reason] || row.reason}
                                            </span>
                                        </td>
                                        <td className="fin-cell-source">
                                            <span className="fin-source-icon">{sourceIcon(row.source_type)}</span>
                                            <span>{sourceLabel(row)}</span>
                                        </td>
                                        <td>{row.method}</td>
                                        <td style={{ fontSize: 12 }}>{row.wallet_name || '-'}</td>
                                        <td>
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
                                        <td className="ot-cell-date">{formatDate(row.created_at)}</td>
                                        <td>
                                            {hasImages(row) ? (
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    {row.invoice_image && (
                                                        <button className="ot-mockup-btn" onClick={e => { e.stopPropagation(); setImageOverlay({ url: row.invoice_image, label: 'Invoice' }); }}>
                                                            <Eye size={13} />
                                                        </button>
                                                    )}
                                                    {row.confirmation_image && (
                                                        <button className="ot-mockup-btn" onClick={e => { e.stopPropagation(); setImageOverlay({ url: row.confirmation_image, label: 'Confirmation' }); }}>
                                                            <Eye size={13} />
                                                        </button>
                                                    )}
                                                    {row.additional_image && (
                                                        <button className="ot-mockup-btn" onClick={e => { e.stopPropagation(); setImageOverlay({ url: row.additional_image, label: 'Additional' }); }}>
                                                            <Eye size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            ) : <span style={{ color: 'var(--admin-text-muted)' }}>—</span>}
                                        </td>
                                        <td className="ot-cell-detail">
                                            {expandedId === row.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </td>
                                    </tr>

                                    {expandedId === row.id && (
                                        <tr className="fin-detail-expanded-row">
                                            <td colSpan={11}>
                                                <div className="fin-expanded-content">
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

                                                    {/* Order Container Display */}
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
                                                                    <div key={o.order_code} className="fin-order-chip" onClick={e => { e.stopPropagation(); onSelectOrder?.(o); }}>
                                                                        <span className="ot-order-code">ORD-{o.order_code}</span>
                                                                        {o.order_name && <span className="ot-order-name">— {o.order_name}</span>}
                                                                        <span className="ot-order-status" style={{ background: ORDER_STATUS_COLORS[o.order_status] || '#94a3b8' }}>
                                                                            {o.order_status}
                                                                        </span>
                                                                        {o.mockup_image && (
                                                                            <button className="ot-mockup-btn" onClick={ev => { ev.stopPropagation(); setImageOverlay({ url: o.mockup_image, label: `Mockup ORD-${o.order_code}` }); }}>
                                                                                <Eye size={11} />
                                                                            </button>
                                                                        )}
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

                                                    {/* Sales Display */}
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
                                                            {(row.material_sales.releases || []).length > 0 && (
                                                                <div style={{ marginTop: 8 }}>
                                                                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>Products Sold:</div>
                                                                    {row.material_sales.releases.map((rel: any, i: number) => (
                                                                        <div key={i} style={{ fontSize: 12, padding: '2px 0', display: 'flex', gap: 12 }}>
                                                                            <span style={{ fontWeight: 500 }}>{rel.material_name}</span>
                                                                            <span>× {rel.amount}</span>
                                                                            <span style={{ color: 'var(--admin-text-muted)' }}>{rel.inventory}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Maintenance Display */}
                                                    {row.source_type === 'maintenance' && row.maintenance && (
                                                        <div className="fin-expanded-source">
                                                            <div className="fin-expanded-source-header">
                                                                <Wrench size={14} />
                                                                <span>Maintenance #{row.maintenance.id} — {row.maintenance.client_name || 'N/A'}</span>
                                                            </div>
                                                            <div className="fin-expanded-grid">
                                                                <div className="fin-expanded-item">
                                                                    <span className="fin-expanded-label">Contact</span>
                                                                    <span className="fin-expanded-value">{row.maintenance.client_contact || '-'}</span>
                                                                </div>
                                                                {row.maintenance.order_code && (
                                                                    <div className="fin-expanded-item">
                                                                        <span className="fin-expanded-label">Order</span>
                                                                        <span className="fin-expanded-value">ORD-{row.maintenance.order_code}</span>
                                                                    </div>
                                                                )}
                                                                <div className="fin-expanded-item">
                                                                    <span className="fin-expanded-label">Warranty</span>
                                                                    <span className="fin-expanded-value">{row.maintenance.under_warranty ? 'Yes' : 'No'}</span>
                                                                </div>
                                                                {row.maintenance.reported_issue && (
                                                                    <div className="fin-expanded-item" style={{ gridColumn: 'span 2' }}>
                                                                        <span className="fin-expanded-label">Issue</span>
                                                                        <span className="fin-expanded-value">{row.maintenance.reported_issue}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
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
                    <button onClick={() => fetchData(nextPage!, filters, true)}>Load More</button>
                </div>
            )}

            {!loading && rows.length === 0 && (
                <div className="admin-empty">No payments found</div>
            )}

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
    );
}
