'use client';
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { Eye, X, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import FinanceTableFilters, { EMPTY_FINANCE_FILTERS } from './FinanceTableFilters';
import type { FinanceTableFiltersState } from './FinanceTableFilters';

interface Props {
    onPurchaseClick?: (id: number) => void;
}

const STATUS_LABELS: Record<string, string> = { P: 'In Progress', D: 'Done', C: 'Cancelled' };
const STATUS_COLORS: Record<string, string> = { P: '#f59e0b', D: '#16a34a', C: '#dc2626' };
const REQ_STATUS_LABELS: Record<string, string> = { NS: 'Not Sent', S: 'Sent', C: 'Confirmed', R: 'Rejected' };
const STATUS_OPTIONS = [
    { value: 'P', label: 'In Progress' },
    { value: 'D', label: 'Done' },
    { value: 'C', label: 'Cancelled' },
];

function formatBirr(n: number) { return `${Math.round(n).toLocaleString()}`; }
function formatDate(d: string | null) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function PurchaseTableView({ onPurchaseClick }: Props) {
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
                params.set('type', 'purchases');
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
            console.error('Failed to fetch purchases', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData('/api/admin/finance-tables/', filters); }, []);

    const handleApply = (f: FinanceTableFiltersState) => { setFilters(f); fetchData('/api/admin/finance-tables/', f); };
    const handleReset = () => { const e = { ...EMPTY_FINANCE_FILTERS }; setFilters(e); fetchData('/api/admin/finance-tables/', e); };

    return (
        <div className="orders-table-section">
            <FinanceTableFilters
                filters={filters}
                onApply={handleApply}
                onReset={handleReset}
                showStatus
                statusOptions={STATUS_OPTIONS}
                searchPlaceholder="Search purchases..."
            />

            <div className="orders-table-wrap">
                <table className="orders-excel-table">
                    <thead>
                        <tr>
                            <th className="ot-col-num">#</th>
                            <th>ID</th>
                            <th>Total Amount</th>
                            <th>Status</th>
                            <th>Request</th>
                            <th>Invoice</th>
                            <th>Wallet</th>
                            <th>Created By</th>
                            <th>Inventory</th>
                            <th>Images</th>
                            <th>Date</th>
                            <th className="ot-col-detail"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => (
                            <React.Fragment key={row.id}>
                                <tr
                                    className={`orders-row ${expandedId === row.id ? 'expanded' : ''}`}
                                    onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                                >
                                    <td className="ot-cell-num">{idx + 1}</td>
                                    <td style={{ fontWeight: 600 }}>#{row.id}</td>
                                    <td className="ot-cell-money">
                                        <div className="ot-money-amount">{formatBirr(row.total_amount)}</div>
                                        <div style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>Birr</div>
                                    </td>
                                    <td>
                                        <span className="fin-reason-badge" style={{ background: `${STATUS_COLORS[row.status]}20`, color: STATUS_COLORS[row.status] }}>
                                            {STATUS_LABELS[row.status] || row.status_display}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 12 }}>
                                        {REQ_STATUS_LABELS[row.request_status] || row.request_status_display}
                                    </td>
                                    <td>
                                        {row.invoice ? (
                                            <span className="fin-badge-yes">Yes</span>
                                        ) : (
                                            <span className="fin-badge-no">No</span>
                                        )}
                                    </td>
                                    <td style={{ fontSize: 12 }}>{row.from_wallet}</td>
                                    <td style={{ fontSize: 12 }}>{row.created_by || '-'}</td>
                                    <td style={{ fontSize: 12 }}>{row.inventory || '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {row.invoice_image && (
                                                <button className="ot-mockup-btn" onClick={e => { e.stopPropagation(); setImageOverlay({ url: row.invoice_image, label: 'Invoice' }); }}>
                                                    <Eye size={13} />
                                                </button>
                                            )}
                                            {row.payment_screenshot && (
                                                <button className="ot-mockup-btn" onClick={e => { e.stopPropagation(); setImageOverlay({ url: row.payment_screenshot, label: 'Payment Screenshot' }); }}>
                                                    <Eye size={13} />
                                                </button>
                                            )}
                                            {!row.invoice_image && !row.payment_screenshot && <span style={{ color: 'var(--admin-text-muted)' }}>—</span>}
                                        </div>
                                    </td>
                                    <td className="ot-cell-date">{formatDate(row.date)}</td>
                                    <td className="ot-cell-detail">
                                        {expandedId === row.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </td>
                                </tr>

                                {expandedId === row.id && (
                                    <tr className="fin-detail-expanded-row">
                                        <td colSpan={12}>
                                            <div className="fin-expanded-content">
                                                <div className="fin-expanded-grid">
                                                    <div className="fin-expanded-item">
                                                        <span className="fin-expanded-label">Confirmed By</span>
                                                        <span className="fin-expanded-value">{row.confirmed_by || '-'}</span>
                                                    </div>
                                                    <div className="fin-expanded-item">
                                                        <span className="fin-expanded-label">Finalized By</span>
                                                        <span className="fin-expanded-value">{row.finalized_by || '-'}</span>
                                                    </div>
                                                    <div className="fin-expanded-item">
                                                        <span className="fin-expanded-label">Payment Code</span>
                                                        <span className="fin-expanded-value">{row.payment_code || '-'}</span>
                                                    </div>
                                                    <div className="fin-expanded-item">
                                                        <span className="fin-expanded-label">To Account</span>
                                                        <span className="fin-expanded-value">{row.to_account_name ? `${row.to_account_name} (${row.to_account_number})` : '-'}</span>
                                                    </div>
                                                </div>

                                                {/* Materials */}
                                                {(row.items || []).length > 0 && (
                                                    <div style={{ marginTop: 12 }}>
                                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Materials</div>
                                                        <table className="fin-inner-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Material</th>
                                                                    <th>Amount</th>
                                                                    <th>Price</th>
                                                                    <th>Total</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {row.items.map((item: any, i: number) => (
                                                                    <tr key={i}>
                                                                        <td>{item.material_name}</td>
                                                                        <td>{item.amount}</td>
                                                                        <td>{formatBirr(item.price)}</td>
                                                                        <td style={{ fontWeight: 600 }}>{formatBirr(item.total_price)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
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
            {nextPage && !loading && <div className="admin-load-more"><button onClick={() => fetchData(nextPage!, filters, true)}>Load More</button></div>}
            {!loading && rows.length === 0 && <div className="admin-empty">No purchases found</div>}

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
