'use client';
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { Eye, X, ChevronDown, ChevronUp, AlertTriangle, Package, ShoppingBag, Wrench } from 'lucide-react';
import FinanceTableFilters, { EMPTY_FINANCE_FILTERS } from './FinanceTableFilters';
import type { FinanceTableFiltersState } from './FinanceTableFilters';

interface Props {
    onSelectContainer?: (id: number) => void;
    onPurchaseClick?: (id: number) => void;
}

const STATUS_LABELS: Record<string, string> = { P: 'Pending', C: 'Confirmed', R: 'Rejected' };
const STATUS_COLORS: Record<string, string> = { P: '#f59e0b', C: '#16a34a', R: '#dc2626' };
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

export default function PityCostTableView({ onSelectContainer, onPurchaseClick }: Props) {
    const [rows, setRows] = useState<any[]>([]);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<FinanceTableFiltersState>({ ...EMPTY_FINANCE_FILTERS });
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [imageOverlay, setImageOverlay] = useState<{ url: string; label: string } | null>(null);
    const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);

    useEffect(() => {
        // Fetch categories for filter
        api.get('/api/admin/finance-tables/?type=pity_costs&p=1').catch(() => { });
        api.get('/api/pity-cost-categories/').then(res => {
            setCategories(res.data?.results || res.data || []);
        }).catch(() => { });
    }, []);

    const fetchData = useCallback(async (url: string, currentFilters: FinanceTableFiltersState, append = false) => {
        try {
            setLoading(true);
            let finalUrl = url;
            if (!url.includes('?') || url === '/api/admin/finance-tables/') {
                const params = new URLSearchParams();
                params.set('type', 'pity_costs');
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
            console.error('Failed to fetch pity costs', err);
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
                showCategory
                statusOptions={STATUS_OPTIONS}
                categoryOptions={categories}
                searchPlaceholder="Search pity costs..."
            />

            <div className="orders-table-wrap">
                <table className="orders-excel-table">
                    <thead>
                        <tr>
                            <th className="ot-col-num">#</th>
                            <th>Amount</th>
                            <th>Category</th>
                            <th>Invoice</th>
                            <th>Status</th>
                            <th>Created By</th>
                            <th>Released To</th>
                            <th>Image</th>
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
                                    <td className="ot-cell-money">
                                        <div className="ot-money-amount">{formatBirr(row.total_amount)}</div>
                                        <div style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>Birr</div>
                                    </td>
                                    <td>
                                        <span className="fin-reason-badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                            <AlertTriangle size={11} /> {row.category}
                                        </span>
                                    </td>
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
                                    <td style={{ fontSize: 12 }}>{row.created_by || '-'}</td>
                                    <td style={{ fontSize: 12 }}>{row.released_to || '-'}</td>
                                    <td>
                                        {row.invoice_image ? (
                                            <button className="ot-mockup-btn" onClick={e => { e.stopPropagation(); setImageOverlay({ url: row.invoice_image, label: `Pity Cost #${row.id} Invoice` }); }}>
                                                <Eye size={13} />
                                            </button>
                                        ) : <span style={{ color: 'var(--admin-text-muted)' }}>—</span>}
                                    </td>
                                    <td className="ot-cell-date">{formatDate(row.created_at)}</td>
                                    <td className="ot-cell-detail">
                                        {expandedId === row.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </td>
                                </tr>

                                {expandedId === row.id && (
                                    <tr className="fin-detail-expanded-row">
                                        <td colSpan={10}>
                                            <div className="fin-expanded-content">
                                                <div className="fin-expanded-grid">
                                                    <div className="fin-expanded-item">
                                                        <span className="fin-expanded-label">Confirmed By</span>
                                                        <span className="fin-expanded-value">{row.confirmed_by || '-'}</span>
                                                    </div>
                                                    <div className="fin-expanded-item">
                                                        <span className="fin-expanded-label">Confirmed At</span>
                                                        <span className="fin-expanded-value">{formatDate(row.confirmed_at)}</span>
                                                    </div>
                                                    {row.note && (
                                                        <div className="fin-expanded-item" style={{ gridColumn: 'span 2' }}>
                                                            <span className="fin-expanded-label">Note</span>
                                                            <span className="fin-expanded-value">{row.note}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Materials */}
                                                {(row.materials || []).length > 0 && (
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
                                                                {row.materials.map((mat: any, i: number) => (
                                                                    <tr key={i}>
                                                                        <td>{mat.name}</td>
                                                                        <td>{mat.amount}</td>
                                                                        <td>{formatBirr(mat.price)}</td>
                                                                        <td style={{ fontWeight: 600 }}>{formatBirr(mat.total_price)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}

                                                {/* Linked entities */}
                                                <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                                                    {row.linked_order && (
                                                        <div className="fin-expanded-source" style={{ flex: 1, minWidth: 200 }}>
                                                            <div className="fin-expanded-source-header">
                                                                <Package size={14} />
                                                                <span>Order — {row.linked_order.client}</span>
                                                                <button className="ot-detail-btn" onClick={e => { e.stopPropagation(); onSelectContainer?.(row.linked_order.id); }}>
                                                                    <Eye size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {row.linked_purchase && (
                                                        <div className="fin-expanded-source" style={{ flex: 1, minWidth: 200 }}>
                                                            <div className="fin-expanded-source-header">
                                                                <ShoppingBag size={14} />
                                                                <span>Purchase #{row.linked_purchase.id} — {formatBirr(row.linked_purchase.total_amount)} Birr</span>
                                                                <button className="ot-detail-btn" onClick={e => { e.stopPropagation(); onPurchaseClick?.(row.linked_purchase.id); }}>
                                                                    <Eye size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {row.linked_maintenance && (
                                                        <div className="fin-expanded-source" style={{ flex: 1, minWidth: 200 }}>
                                                            <div className="fin-expanded-source-header">
                                                                <Wrench size={14} />
                                                                <span>Maintenance #{row.linked_maintenance.id} — {row.linked_maintenance.client_name || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
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
            {!loading && rows.length === 0 && <div className="admin-empty">No pity costs found</div>}

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
