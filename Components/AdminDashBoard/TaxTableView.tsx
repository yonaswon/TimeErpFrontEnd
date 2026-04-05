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
    const [totals, setTotals] = useState({ income: 0, expected_revenue: 0, deductions: 0, withholding_tax: 0, breakdown: { purchases: 0, expenses: 0, pity_costs: 0, adjustment_invoices: 0 } });
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'classic' | 'modern'>('modern');
    const [includeExpected, setIncludeExpected] = useState(false);
    const [filters, setFilters] = useState<FinanceTableFiltersState>({ ...EMPTY_FINANCE_FILTERS, reason: 'all' });
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
        { value: 'adjustment', label: 'Adjustment Invoices' },
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

    const expectedRev = totals.expected_revenue || 0;
    const grossRevenue = totals.income + (includeExpected ? expectedRev : 0);
    const baseRevenue = grossRevenue / (1 + (vatPercent / 100));
    const vatAmount = grossRevenue - baseRevenue;
    const netAmount = baseRevenue - totals.deductions;
    const profitTaxAmount = (netAmount > 0 ? netAmount : 0) * (profitTaxPercent / 100);
    const withholdingTax = totals.withholding_tax || 0;
    const totalTaxDue = vatAmount + profitTaxAmount - withholdingTax;

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
        <div className="orders-table-section" style={{ minHeight: '100%', paddingBottom: '40px' }}>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <div className="admin-kpi-card" style={{ margin: 0, padding: '4px', display: 'flex', gap: '4px', borderRadius: '8px', alignItems: 'center' }}>
                    <button
                        onClick={() => setViewMode('classic')}
                        style={{ padding: '6px 12px', border: 'none', background: viewMode === 'classic' ? '#3b82f6' : 'transparent', color: viewMode === 'classic' ? '#fff' : 'inherit', borderRadius: '6px', fontWeight: viewMode === 'classic' ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px', opacity: viewMode === 'classic' ? 1 : 0.7 }}
                    >Classic Cards</button>
                    <button
                        onClick={() => setViewMode('modern')}
                        style={{ padding: '6px 12px', border: 'none', background: viewMode === 'modern' ? '#3b82f6' : 'transparent', color: viewMode === 'modern' ? '#fff' : 'inherit', borderRadius: '6px', fontWeight: viewMode === 'modern' ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px', opacity: viewMode === 'modern' ? 1 : 0.7 }}
                    >Compact Ribbon</button>
                </div>
            </div>

            {/* TOP STATISTICS SECTION */}
            {viewMode === 'classic' ? (
                <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div className="admin-kpi-card" style={{ margin: 0 }}>
                        <div className="kpi-label"><ArrowUpRight size={16} /> Gross Revenue</div>
                        <div className="kpi-value">{formatBirr(grossRevenue)}</div>
                        <div className="kpi-sub" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                            <input type="checkbox" checked={includeExpected} onChange={e => setIncludeExpected(e.target.checked)} id="expRev" />
                            <label htmlFor="expRev" style={{ cursor: 'pointer' }}>+ Expected Rev</label>
                        </div>
                    </div>
                    <div className="admin-kpi-card kpi-success" style={{ margin: 0 }}>
                        <div className="kpi-label"><FileText size={16} /> Expected Revenue</div>
                        <div className="kpi-value">{formatBirr(expectedRev)}</div>
                        <div className="kpi-sub" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                            Unpaid Invoicable Orders
                        </div>
                    </div>
                    <div className="admin-kpi-card kpi-success" style={{ margin: 0 }}>
                        <div className="kpi-label"><FileText size={16} /> Base Excl. VAT</div>
                        <div className="kpi-value">{formatBirr(baseRevenue)}</div>
                        <div className="kpi-sub">Gross Revenue ÷ (1 + VAT%)</div>
                    </div>
                    <div className="admin-kpi-card kpi-danger" style={{ margin: 0 }}>
                        <div className="kpi-label"><ArrowDownRight size={16} /> Total Deductions</div>
                        <div className="kpi-value">{formatBirr(totals.deductions)}</div>
                        <div className="kpi-sub">Purchases, Expenses, Pity Costs, Adjustments</div>
                    </div>
                    <div className="admin-kpi-card kpi-danger" style={{ margin: 0 }}>
                        <div className="kpi-label"><FileText size={16} /> Adjustment Invoices</div>
                        <div className="kpi-value">{formatBirr(totals?.breakdown?.adjustment_invoices || 0)}</div>
                        <div className="kpi-sub">Total recorded adjustments</div>
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
                            <span><Calculator size={16} /> Profit Tax</span>
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
                        <div className="kpi-value">{formatBirr(profitTaxAmount)}</div>
                        <div className="kpi-sub">Calculated {profitTaxPercent}% on Net Profit</div>
                    </div>

                    {/* NEW TOTAL CARD */}
                    <div className="admin-kpi-card" style={{ margin: 0, background: '#1e293b', color: '#fff' }}>
                        <div className="kpi-label" style={{ color: '#cbd5e1' }}><Calculator size={16} /> Total Tax Due</div>
                        <div className="kpi-value" style={{ color: '#fff' }}>{formatBirr(totalTaxDue)}</div>
                        <div className="kpi-sub" style={{ color: '#94a3b8' }}>VAT + Profit Tax - Withholding</div>
                    </div>
                </div>
            ) : (
                <div style={{ padding: '0 16px 24px' }}>
                    <div className="admin-kpi-card" style={{ margin: 0, padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: 'none', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(150, 150, 150, 0.2)', paddingBottom: '16px' }}>
                            <div>
                                <div className="kpi-label" style={{ textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Gross Revenue</div>
                                <div className="kpi-value" style={{ fontSize: '1.25rem' }}>{formatBirr(grossRevenue)}</div>
                                <div className="kpi-sub" style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <input type="checkbox" checked={includeExpected} onChange={e => setIncludeExpected(e.target.checked)} style={{ width: '12px', height: '12px' }} id="expRevM" />
                                    <label htmlFor="expRevM" style={{ cursor: 'pointer' }}>+ Exp. ({formatBirr(expectedRev)})</label>
                                </div>
                            </div>
                            <div style={{ width: '1px', height: '40px', background: 'rgba(150, 150, 150, 0.2)' }}></div>
                            <div>
                                <div className="kpi-label" style={{ textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Base (ex VAT)</div>
                                <div className="kpi-value" style={{ fontSize: '1.25rem' }}>{formatBirr(baseRevenue)}</div>
                            </div>
                            <div style={{ width: '1px', height: '40px', background: 'rgba(150, 150, 150, 0.2)' }}></div>
                            <div>
                                <div className="kpi-label" style={{ textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Total Deductions</div>
                                <div className="kpi-value" style={{ fontSize: '1.25rem', color: '#ef4444' }}>-{formatBirr(totals.deductions)}</div>
                            </div>
                            <div style={{ width: '1px', height: '40px', background: 'rgba(150, 150, 150, 0.2)' }}></div>
                            <div>
                                <div className="kpi-label" style={{ textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Adjustment Invoices</div>
                                <div className="kpi-value" style={{ fontSize: '1.25rem', color: '#ef4444' }}>{formatBirr(totals?.breakdown?.adjustment_invoices || 0)}</div>
                            </div>
                            <div style={{ width: '1px', height: '40px', background: 'rgba(150, 150, 150, 0.2)' }}></div>
                            <div>
                                <div className="kpi-label" style={{ textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Net Profit</div>
                                <div className="kpi-value" style={{ fontSize: '1.5rem', color: '#10b981' }}>{formatBirr(netAmount)}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                            <div>
                                <div className="kpi-label" style={{ textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                                    Extract VAT
                                    {!isEditingVat ? (
                                        <button onClick={() => setIsEditingVat(true)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', marginLeft: '6px', cursor: 'pointer' }}>{vatPercent}% <Edit2 size={10} style={{ display: 'inline' }} /></button>
                                    ) : (
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                                            <input type="number" value={vatInput} onChange={e => setVatInput(e.target.value)} style={{ width: '40px', padding: '2px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                            <button onClick={saveVat} style={{ background: '#3b82f6', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '4px' }}><Check size={10} /></button>
                                        </div>
                                    )}
                                </div>
                                <div className="kpi-value" style={{ fontSize: '1.25rem' }}>{formatBirr(vatAmount)}</div>
                            </div>
                            <div>
                                <div className="kpi-label" style={{ textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Withholding Tax</div>
                                <div className="kpi-value" style={{ fontSize: '1.25rem' }}>{formatBirr(totals.withholding_tax)}</div>
                            </div>
                            <div>
                                <div className="kpi-label" style={{ textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                                    Profit Tax
                                    {!isEditingProfitTax ? (
                                        <button onClick={() => setIsEditingProfitTax(true)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 'bold', marginLeft: '6px', cursor: 'pointer' }}>{profitTaxPercent}% <Edit2 size={10} style={{ display: 'inline' }} /></button>
                                    ) : (
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                                            <input type="number" value={profitTaxInput} onChange={e => setProfitTaxInput(e.target.value)} style={{ width: '40px', padding: '2px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                            <button onClick={saveProfitTax} style={{ background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '4px', padding: '2px' }}><Check size={10} /></button>
                                        </div>
                                    )}
                                </div>
                                <div className="kpi-value" style={{ fontSize: '1.25rem' }}>{formatBirr(profitTaxAmount)}</div>
                            </div>
                            <div style={{ marginLeft: 'auto', background: 'rgba(239, 68, 68, 0.1)', padding: '10px 24px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <div className="kpi-label" style={{ textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', color: '#ef4444' }}>
                                    Total Tax Due
                                </div>
                                <div className="kpi-value" style={{ fontSize: '1.5rem', color: '#ef4444' }}>{formatBirr(totalTaxDue)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* UNIFIED TABLE SECTION */}
            <div style={{ padding: '0 16px', marginBottom: '24px' }}>
                <FinanceTableFilters
                    filters={filters}
                    onApply={handleApply}
                    onReset={handleReset}
                    showReason
                    reasonOptions={TYPE_OPTIONS}
                    searchPlaceholder="Search tax records..."
                    hideSearch={viewMode === 'modern'} // Clean up modern view slightly
                    hideInvoice
                />
            </div>

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
                            const isIncome = row.record_type === 'payment' || row.record_type === 'adjustment';
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
                <div className="admin-loading" style={{ marginTop: '24px' }}>
                    <div className="admin-spinner" /> Loading records...
                </div>
            )}

            {nextPage && !loading && (
                <div className="admin-load-more" style={{ marginTop: '32px' }}>
                    <button onClick={() => fetchData(nextPage!, filters, true)} style={{ padding: '8px 24px' }}>Load More Records</button>
                </div>
            )}

            {!loading && rows.length === 0 && (
                <div className="admin-empty" style={{ marginTop: '24px' }}>
                    No invoice-backed records found for this period
                </div>
            )}
        </div>
    );
}
