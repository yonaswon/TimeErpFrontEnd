'use client';
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { Eye, X, ChevronDown, ChevronUp, Wrench, Shield, ShieldOff } from 'lucide-react';
import FinanceTableFilters, { EMPTY_FINANCE_FILTERS } from './FinanceTableFilters';
import type { FinanceTableFiltersState } from './FinanceTableFilters';

interface Props {
    onSelectOrder?: (order: any) => void;
}

const STATUS_LABELS: Record<string, string> = { NA: 'Not Assigned', A: 'Assigned', S: 'Started', D: 'Done' };
const STATUS_COLORS: Record<string, string> = { NA: '#94a3b8', A: '#f59e0b', S: '#3b82f6', D: '#16a34a' };
const STATUS_OPTIONS = [
    { value: 'NA', label: 'Not Assigned' },
    { value: 'A', label: 'Assigned' },
    { value: 'S', label: 'Started' },
    { value: 'D', label: 'Done' },
];
const PAY_STATUS_COLORS: Record<string, string> = { P: '#f59e0b', C: '#16a34a', R: '#dc2626' };

function formatBirr(n: number) { return `${Math.round(n).toLocaleString()}`; }
function formatDate(d: string | null) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function MaintenanceTableView({ onSelectOrder }: Props) {
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
                params.set('type', 'maintenance');
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
            console.error('Failed to fetch maintenance', err);
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
                searchPlaceholder="Search maintenance..."
            />

            <div className="orders-table-wrap">
                <table className="orders-excel-table">
                    <thead>
                        <tr>
                            <th className="ot-col-num">#</th>
                            <th>Client</th>
                            <th>Contact</th>
                            <th>Order</th>
                            <th>Issue</th>
                            <th>Warranty</th>
                            <th>Status</th>
                            <th>Assigned To</th>
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
                                    <td style={{ fontWeight: 600 }}>{row.client_name}</td>
                                    <td style={{ fontSize: 12 }}>{row.client_contact}</td>
                                    <td>
                                        {row.order_code ? (
                                            <span className="ot-order-code" style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); if (row.order_code) onSelectOrder?.({ order_code: row.order_code, order_name: row.order_name }); }}>
                                                ORD-{row.order_code}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                                        {row.reported_issue}
                                    </td>
                                    <td>
                                        {row.under_warranty ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16a34a', fontSize: 12, fontWeight: 600 }}>
                                                <Shield size={13} /> Yes
                                            </span>
                                        ) : (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#dc2626', fontSize: 12, fontWeight: 600 }}>
                                                <ShieldOff size={13} /> No
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span className="fin-reason-badge" style={{ background: `${STATUS_COLORS[row.status]}20`, color: STATUS_COLORS[row.status] }}>
                                            {STATUS_LABELS[row.status] || row.status}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 12 }}>{row.assigned_to || '-'}</td>
                                    <td>
                                        {row.image ? (
                                            <button className="ot-mockup-btn" onClick={e => { e.stopPropagation(); setImageOverlay({ url: row.image, label: `Maintenance #${row.id}` }); }}>
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
                                        <td colSpan={11}>
                                            <div className="fin-expanded-content">
                                                <div className="fin-expanded-grid">
                                                    <div className="fin-expanded-item">
                                                        <span className="fin-expanded-label">Posted By</span>
                                                        <span className="fin-expanded-value">{row.posted_by || '-'}</span>
                                                    </div>
                                                    <div className="fin-expanded-item">
                                                        <span className="fin-expanded-label">Payment Status</span>
                                                        <span className="fin-expanded-value">{row.payment_status === 'C' ? 'Confirmed' : row.payment_status === 'A' ? 'Accepted' : '-'}</span>
                                                    </div>
                                                    <div className="fin-expanded-item">
                                                        <span className="fin-expanded-label">Scheduled Start</span>
                                                        <span className="fin-expanded-value">{formatDate(row.scheduled_start_date)}</span>
                                                    </div>
                                                    <div className="fin-expanded-item">
                                                        <span className="fin-expanded-label">Scheduled End</span>
                                                        <span className="fin-expanded-value">{formatDate(row.scheduled_end_date)}</span>
                                                    </div>
                                                    <div className="fin-expanded-item">
                                                        <span className="fin-expanded-label">Started</span>
                                                        <span className="fin-expanded-value">{formatDate(row.started)}</span>
                                                    </div>
                                                    <div className="fin-expanded-item">
                                                        <span className="fin-expanded-label">Ended</span>
                                                        <span className="fin-expanded-value">{formatDate(row.end)}</span>
                                                    </div>
                                                    {row.reported_issue && row.reported_issue !== '-' && (
                                                        <div className="fin-expanded-item" style={{ gridColumn: 'span 3' }}>
                                                            <span className="fin-expanded-label">Full Issue Description</span>
                                                            <span className="fin-expanded-value" style={{ whiteSpace: 'pre-wrap' }}>{row.reported_issue}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Payments */}
                                                {(row.payments || []).length > 0 && (
                                                    <div style={{ marginTop: 12 }}>
                                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Payments</div>
                                                        {row.payments.map((pay: any) => (
                                                            <div key={pay.id} style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--admin-border)' }}>
                                                                <span style={{ fontWeight: 600 }}>{formatBirr(pay.amount)} Birr</span>
                                                                <span style={{ color: PAY_STATUS_COLORS[pay.status], fontWeight: 600 }}>{pay.status_display}</span>
                                                                <span>{pay.method}</span>
                                                                <span style={{ color: 'var(--admin-text-muted)' }}>{pay.wallet_name}</span>
                                                                <span>{pay.invoice ? 'Invoice' : 'Non-Inv'}</span>
                                                                {pay.invoice_image && (
                                                                    <button className="ot-mockup-btn" onClick={e => { e.stopPropagation(); setImageOverlay({ url: pay.invoice_image, label: 'Payment Invoice' }); }}>
                                                                        <Eye size={11} />
                                                                    </button>
                                                                )}
                                                                {pay.confirmation_image && (
                                                                    <button className="ot-mockup-btn" onClick={e => { e.stopPropagation(); setImageOverlay({ url: pay.confirmation_image, label: 'Payment Confirmation' }); }}>
                                                                        <Eye size={11} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
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
            {!loading && rows.length === 0 && <div className="admin-empty">No maintenance records found</div>}

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
