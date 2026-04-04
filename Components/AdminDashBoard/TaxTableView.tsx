'use client';
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { FileText, Calculator, ArrowUpRight, ArrowDownRight, Edit2, Check } from 'lucide-react';
import FinanceTableFilters, { EMPTY_FINANCE_FILTERS } from './FinanceTableFilters';
import type { FinanceTableFiltersState } from './FinanceTableFilters';

interface Props {
    onSelectContainer?: (id: number) => void;
    onSelectOrder?: (order: any) => void;
    onPurchaseClick?: (id: number) => void;
}

function formatBirr(n: number) { return `${Math.round(n).toLocaleString()}`; }
function formatDate(d: string | null) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function TaxTableView({ onSelectContainer, onSelectOrder, onPurchaseClick }: Props) {
    const [rows, setRows] = useState<any[]>([]);
    const [totals, setTotals] = useState({ income: 0, deductions: 0, withholding_tax: 0, breakdown: { purchases: 0, expenses: 0, pity_costs: 0 } });
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<FinanceTableFiltersState>({ ...EMPTY_FINANCE_FILTERS, reason: 'all' }); // Using reason field to track 'type'
    const [vatPercent, setVatPercent] = useState<number>(15);
    const [isEditingVat, setIsEditingVat] = useState(false);
    const [vatInput, setVatInput] = useState('15');

    const [profitTaxPercent, setProfitTaxPercent] = useState<number>(35);
    const [isEditingProfitTax, setIsEditingProfitTax] = useState(false);
    const [profitTaxInput, setProfitTaxInput] = useState('35');

    const TYPE_OPTIONS = [
        { value: 'all', label: 'All Records' },
        { value: 'payment', label: 'Payments (Income)' },
        { value: 'purchase', label: 'Purchases' },
        { value: 'expense', label: 'Expenses' },
        { value: 'pity_cost', label: 'Pity Costs' },
    ];

    const fetchData = useCallback(async (url: string, currentFilters: FinanceTableFiltersState, append = false) => {
        try {
            setLoading(true);
            let finalUrl = url;
            if (!url.includes('?') || url === '/api/admin/finance-tax/') {
                const params = new URLSearchParams();
                if (currentFilters.reason && currentFilters.reason !== 'all') params.set('type', currentFilters.reason);
                if (currentFilters.date_preset) params.set('date_preset', currentFilters.date_preset);
                if (currentFilters.date_from) params.set('date_from', currentFilters.date_from);
                if (currentFilters.date_to) params.set('date_to', currentFilters.date_to);
                finalUrl = `/api/admin/finance-tax/?${params.toString()}`;
            }
            const res = await api.get(finalUrl);
            const results = res.data?.results || [];

            setRows(prev => append ? [...prev, ...results] : results);
            if (res.data?.totals && !append) {
                setTotals(res.data.totals);
            }
            setNextPage(res.data?.next || null);
        } catch (err) {
            console.error('Failed to fetch tax records', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData('/api/admin/finance-tax/', filters);
    }, []);

    const handleApply = (f: FinanceTableFiltersState) => { setFilters(f); fetchData('/api/admin/finance-tax/', f); };
    const handleReset = () => { const e = { ...EMPTY_FINANCE_FILTERS, reason: 'all' }; setFilters(e); fetchData('/api/admin/finance-tax/', e); };

    const grossRevenue = totals.income;
    const baseRevenue = grossRevenue / (1 + (vatPercent / 100));
    const vatAmount = grossRevenue - baseRevenue;
    const netAmount = baseRevenue - totals.deductions;
    const profitTaxAmount = (netAmount > 0 ? netAmount : 0) * (profitTaxPercent / 100);
    const finalProfitTaxPayable = profitTaxAmount - totals.withholding_tax;

    const saveVat = () => {
        const val = parseFloat(vatInput);
        if (!isNaN(val) && val >= 0) setVatPercent(val);
        else setVatInput(vatPercent.toString());
        setIsEditingVat(false);
    };

    const saveProfitTax = () => {
        const val = parseFloat(profitTaxInput);
        if (!isNaN(val) && val >= 0) setProfitTaxPercent(val);
        else setProfitTaxInput(profitTaxPercent.toString());
        setIsEditingProfitTax(false);
    };

    let globalIdx = 0;

    return (
        <div className="orders-table-section">
            <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="admin-kpi-card" style={{ margin: 0 }}>
                    <div className="kpi-label"><ArrowUpRight size={16} /> Gross Revenue</div>
                    <div className="kpi-value">{formatBirr(grossRevenue)}</div>
                    <div className="kpi-sub">Total Payments (Includes VAT)</div>
                </div>
                <div className="admin-kpi-card kpi-success" style={{ margin: 0 }}>
                    <div className="kpi-label"><FileText size={16} /> Base Excl. VAT</div>
                    <div className="kpi-value">{formatBirr(baseRevenue)}</div>
                    <div className="kpi-sub">Gross Revenue ÷ (1 + VAT%)</div>
                </div>
                <div className="admin-kpi-card kpi-danger" style={{ margin: 0 }}>
                    <div className="kpi-label"><ArrowDownRight size={16} /> Total Deductions</div>
                    <div className="kpi-value">{formatBirr(totals.deductions)}</div>
                    <div className="kpi-sub">Purchases, Expenses, Pity Costs</div>
                </div>
                <div className="admin-kpi-card kpi-primary" style={{ margin: 0 }}>
                    <div className="kpi-label"><FileText size={16} /> Net Profit</div>
                    <div className="kpi-value">{formatBirr(netAmount)}</div>
                    <div className="kpi-sub">Base Revenue - Deductions</div>
                </div>

                <div className="admin-kpi-card kpi-warning" style={{ margin: 0 }}>
                    <div className="kpi-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span><Calculator size={16} /> Extracted VAT</span>
                        {!isEditingVat ? (
                            <button onClick={() => setIsEditingVat(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7 }}>
                                <Edit2 size={12} /> {vatPercent}%
                            </button>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                    type="number"
                                    value={vatInput}
                                    onChange={e => setVatInput(e.target.value)}
                                    style={{ width: '40px', padding: '2px 4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #ccc' }}
                                    autoFocus
                                />
                                <button onClick={saveVat} style={{ background: 'var(--admin-warning)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', padding: '2px' }}><Check size={12} /></button>
                            </div>
                        )}
                    </div>
                    <div className="kpi-value">{formatBirr(vatAmount)}</div>
                    <div className="kpi-sub">Gross Revenue - Base Revenue</div>
                </div>

                <div className="admin-kpi-card kpi-success" style={{ margin: 0 }}>
                    <div className="kpi-label"><FileText size={16} /> Withholding Tax</div>
                    <div className="kpi-value">{formatBirr(totals.withholding_tax)}</div>
                    <div className="kpi-sub">Collected by Clients</div>
                </div>

                <div className="admin-kpi-card kpi-danger" style={{ margin: 0 }}>
                    <div className="kpi-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span><Calculator size={16} /> Final Profit Tax</span>
                        {!isEditingProfitTax ? (
                            <button onClick={() => setIsEditingProfitTax(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7 }}>
                                <Edit2 size={12} /> {profitTaxPercent}%
                            </button>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                    type="number"
                                    value={profitTaxInput}
                                    onChange={e => setProfitTaxInput(e.target.value)}
                                    style={{ width: '40px', padding: '2px 4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #ccc' }}
                                    autoFocus
                                />
                                <button onClick={saveProfitTax} style={{ background: 'var(--admin-danger)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', padding: '2px' }}><Check size={12} /></button>
                            </div>
                        )}
                    </div>
                    <div className="kpi-value">{formatBirr(finalProfitTaxPayable > 0 ? finalProfitTaxPayable : 0)}</div>
                    <div className="kpi-sub">Calculated Profit Tax - Withholding Tax</div>
                </div>
            </div>

            <FinanceTableFilters
                filters={filters}
                onApply={handleApply}
                onReset={handleReset}
                showReason
                reasonOptions={TYPE_OPTIONS}
                searchPlaceholder="Search tax records..."
                hideSearch
                hideInvoice
            />

            <div className="orders-table-wrap">
                <table className="orders-excel-table">
                    <thead>
                        <tr>
                            <th className="ot-col-num">#</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Reason / Category</th>
                            <th>Source / Entity</th>
                            <th>Note / Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => {
                            globalIdx++;
                            const isIncome = row.record_type === 'payment';
                            return (
                                <tr key={`${row.record_type}-${row.id}`} className="orders-row">
                                    <td className="ot-cell-num">{globalIdx}</td>
                                    <td className="ot-cell-date">{formatDate(row.date)}</td>
                                    <td>
                                        <span className="fin-reason-badge" style={{
                                            background: isIncome ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                                            color: isIncome ? '#16a34a' : '#dc2626'
                                        }}>
                                            {row.record_type.toUpperCase().replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="ot-cell-money" style={{ color: isIncome ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                        {isIncome ? '+' : '-'}{formatBirr(row.amount)}
                                    </td>
                                    <td>{row.reason}</td>
                                    <td>{row.source}</td>
                                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {row.note || '-'}
                                    </td>
                                </tr>
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
                <div className="admin-empty">No invoice-backed records found for this period</div>
            )}
        </div>
    );
}
