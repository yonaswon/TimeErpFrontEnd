'use client';
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { Eye, X } from 'lucide-react';
import FinanceTableFilters, { EMPTY_FINANCE_FILTERS } from './FinanceTableFilters';
import type { FinanceTableFiltersState } from './FinanceTableFilters';
import AdjustmentInvoiceDetailOverlay from './AdjustmentInvoiceDetailOverlay';

interface Props {
    onSelectContainer?: (id: number) => void;
}

function formatBirr(n: number | string) { return `${Math.round(parseFloat(n.toString())).toLocaleString()}`; }
function formatDate(d: string | null) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}
function getUserName(user: any) {
    if (!user) return 'Unknown';
    return user.telegram_user_name || user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown';
}

export default function AdjustmentInvoiceTableView({ onSelectContainer }: Props) {
    const [rows, setRows] = useState<any[]>([]);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<FinanceTableFiltersState>({ ...EMPTY_FINANCE_FILTERS });
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const fetchData = useCallback(async (url: string, currentFilters: FinanceTableFiltersState, append = false) => {
        try {
            setLoading(true);
            let finalUrl = url;
            if (!url.includes('?') || url === '/finance/adjustment-invoice/') {
                const params = new URLSearchParams();
                if (currentFilters.date_preset && currentFilters.date_preset !== 'all_time') params.set('date_preset', currentFilters.date_preset);
                if (currentFilters.date_from) params.set('date_from', currentFilters.date_from);
                if (currentFilters.date_to) params.set('date_to', currentFilters.date_to);
                finalUrl = `/finance/adjustment-invoice/?${params.toString()}`;
            }
            const res = await api.get(finalUrl);
            const results = res.data?.results || res.data || [];
            if (!append) {
                // If the first load doesn't have pagination structure, fall back properly.
                if (Array.isArray(res.data)) {
                    setRows(res.data);
                    setNextPage(null);
                } else {
                    setRows(results);
                    setNextPage(res.data?.next ? res.data.next.replace(api.defaults.baseURL || '', '') : null);
                }
            } else {
                setRows(prev => [...prev, ...results]);
                setNextPage(res.data?.next ? res.data.next.replace(api.defaults.baseURL || '', '') : null);
            }
        } catch (err) {
            console.error('Failed to fetch adjustment invoices', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData('/finance/adjustment-invoice/', filters); }, []);

    const handleApply = (f: FinanceTableFiltersState) => { setFilters(f); fetchData('/finance/adjustment-invoice/', f); };
    const handleReset = () => { const e = { ...EMPTY_FINANCE_FILTERS }; setFilters(e); fetchData('/finance/adjustment-invoice/', e); };

    return (
        <div className="orders-table-section">
            <FinanceTableFilters
                filters={filters}
                onApply={handleApply}
                onReset={handleReset}
                hideSearch
            />

            <div className="orders-table-wrap">
                <table className="orders-excel-table">
                    <thead>
                        <tr>
                            <th className="ot-col-num">#</th>
                            <th>Amount</th>
                            <th>Note</th>
                            <th>Images</th>
                            <th>Recorded By</th>
                            <th>Date</th>
                            <th className="ot-col-detail">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => (
                            <React.Fragment key={row.id}>
                                <tr className="orders-row" onClick={() => setSelectedId(row.id)}>
                                    <td className="ot-cell-num">{idx + 1}</td>
                                    <td className="ot-cell-money" style={{ color: '#ef4444', fontWeight: 600 }}>
                                        <div className="ot-money-amount">{formatBirr(row.amount)}</div>
                                        <div style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>Birr</div>
                                    </td>
                                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {row.note || '-'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {row.invoice && <span className="fin-badge-yes">Invoice</span>}
                                            {row.additional_image && <span className="fin-badge-yes">Extra</span>}
                                        </div>
                                    </td>
                                    <td style={{ fontSize: 12 }}>{getUserName(row.recorded_by)}</td>
                                    <td className="ot-cell-date">{formatDate(row.created_at)}</td>
                                    <td className="ot-cell-detail">
                                        <button className="ot-detail-btn" onClick={e => { e.stopPropagation(); setSelectedId(row.id); }}>
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {loading && <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>}
            {nextPage && !loading && <div className="admin-load-more"><button onClick={() => fetchData(nextPage!, filters, true)}>Load More</button></div>}
            {!loading && rows.length === 0 && <div className="admin-empty">No adjustment invoices found</div>}

            <AdjustmentInvoiceDetailOverlay
                adjustmentId={selectedId}
                onClose={() => setSelectedId(null)}
                onSelectContainer={onSelectContainer}
            />
        </div>
    );
}
