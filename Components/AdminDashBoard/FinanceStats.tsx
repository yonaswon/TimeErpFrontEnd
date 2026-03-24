'use client';
import React, { useState } from 'react';
import { DollarSign, CreditCard, ShoppingBag, AlertTriangle, Wallet, FileText, FileX, ArrowDownCircle, CheckCircle, Tag, Wrench, ChevronRight } from 'lucide-react';
import { DashboardData } from './types';
import FinanceDetailPanel from './FinanceDetailPanel';
import FinanceCashFlow from './FinanceCashFlow';
import ExpectedRemainingOverlay from './ExpectedRemainingOverlay';

interface Props {
    data: DashboardData;
    onPurchaseClick: (id: number) => void;
    onSelectContainer?: (id: number) => void;
    onSelectOrder?: (order: any) => void;
}

function formatBirr(n: number): string {
    return `${Math.round(n).toLocaleString()} Birr`;
}

const REASON_LABELS: Record<string, string> = {
    PRE: 'Pre-Payment', REM: 'Remaining', FULL: 'Full Payment',
    SALES: 'Product Sales', MAINTENANCE: 'Maintenance'
};

const STATUS_LABELS: Record<string, string> = {
    P: 'Pending', C: 'Confirmed', R: 'Rejected'
};

const STATUS_COLORS: Record<string, string> = {
    P: 'var(--admin-warning)', C: 'var(--admin-success)', R: 'var(--admin-danger)'
};

interface DetailFilter {
    key: string;
    title: string;
    filters: Record<string, string>;
}

export default function FinanceStats({ data, onPurchaseClick, onSelectContainer, onSelectOrder }: Props) {
    const { finance } = data;
    const totalPayments = finance.payment_by_status.reduce((a, b) => a + b.count, 0);
    const [activeDetail, setActiveDetail] = useState<DetailFilter | null>(null);

    const openDetail = (key: string, title: string, filters: Record<string, string>) => {
        if (activeDetail?.key === key) {
            setActiveDetail(null);
        } else {
            setActiveDetail({ key, title, filters });
        }
    };

    const getStatusData = (status: string) => finance.payment_by_status.find(p => p.status === status);

    return (
        <>
            {/* KPI Cards — Clickable */}
            <div className="admin-kpi-grid">
                {/* Confirmed */}
                <div
                    className={`admin-kpi-card kpi-success fin-kpi-clickable ${activeDetail?.key?.startsWith('confirmed') ? 'fin-kpi-active' : ''}`}
                    onClick={() => openDetail('confirmed', 'Confirmed Payments', { status: 'C' })}
                >
                    <div className="kpi-label"><DollarSign /> Confirmed <ChevronRight size={14} className="fin-kpi-arrow" /></div>
                    <div className="kpi-value">{formatBirr(finance.total_confirmed)}</div>
                    <div className="kpi-sub" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 500 }}>
                            <div
                                className="fin-kpi-subitem"
                                onClick={e => { e.stopPropagation(); openDetail('confirmed-inv', 'Confirmed — Invoice', { status: 'C', invoice: 'true' }); }}
                            >
                                <FileText size={16} style={{ color: 'var(--admin-success)' }} />
                                <span>Inv: {formatBirr(getStatusData('C')?.invoice_total || 0)}</span>
                            </div>
                            <div
                                className="fin-kpi-subitem"
                                onClick={e => { e.stopPropagation(); openDetail('confirmed-noninv', 'Confirmed — Non-Invoice', { status: 'C', invoice: 'false' }); }}
                            >
                                <FileX size={16} style={{ color: 'var(--admin-warning)' }} />
                                <span>Non-Inv: {formatBirr(getStatusData('C')?.non_invoice_total || 0)}</span>
                            </div>
                        </div>
                        <div style={{ height: '1px', background: 'var(--admin-border)', opacity: 0.5, margin: '2px 0' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--admin-text)' }}>
                            <div className="fin-kpi-subitem" onClick={e => { e.stopPropagation(); openDetail('confirmed-pre', 'Confirmed — Pre-Payments', { status: 'C', reason: 'PRE' }); }}>
                                <ArrowDownCircle size={14} style={{ color: 'var(--admin-primary)' }} /> <span>Pre: {formatBirr(getStatusData('C')?.pre_total || 0)}</span>
                            </div>
                            <div className="fin-kpi-subitem" onClick={e => { e.stopPropagation(); openDetail('confirmed-rem', 'Confirmed — Remaining', { status: 'C', reason: 'REM' }); }}>
                                <CheckCircle size={14} style={{ color: 'var(--admin-success)' }} /> <span>Rem: {formatBirr(getStatusData('C')?.rem_total || 0)}</span>
                            </div>
                            <div className="fin-kpi-subitem" onClick={e => { e.stopPropagation(); openDetail('confirmed-sales', 'Confirmed — Sales', { status: 'C', reason: 'SALES' }); }}>
                                <Tag size={14} style={{ color: '#8b5cf6' }} /> <span>Sales: {formatBirr(getStatusData('C')?.sales_total || 0)}</span>
                            </div>
                            <div className="fin-kpi-subitem" onClick={e => { e.stopPropagation(); openDetail('confirmed-maint', 'Confirmed — Maintenance', { status: 'C', reason: 'MAINTENANCE' }); }}>
                                <Wrench size={14} style={{ color: '#64748b' }} /> <span>Maint: {formatBirr(getStatusData('C')?.maint_total || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending */}
                <div
                    className={`admin-kpi-card kpi-warning fin-kpi-clickable ${activeDetail?.key?.startsWith('pending') ? 'fin-kpi-active' : ''}`}
                    onClick={() => openDetail('pending', 'Pending Payments', { status: 'P' })}
                >
                    <div className="kpi-label"><DollarSign /> Pending <ChevronRight size={14} className="fin-kpi-arrow" /></div>
                    <div className="kpi-value">{formatBirr(finance.total_pending)}</div>
                    <div className="kpi-sub" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 500 }}>
                            <div className="fin-kpi-subitem" onClick={e => { e.stopPropagation(); openDetail('pending-inv', 'Pending — Invoice', { status: 'P', invoice: 'true' }); }}>
                                <FileText size={16} style={{ color: 'var(--admin-success)' }} /> <span>Inv: {formatBirr(getStatusData('P')?.invoice_total || 0)}</span>
                            </div>
                            <div className="fin-kpi-subitem" onClick={e => { e.stopPropagation(); openDetail('pending-noninv', 'Pending — Non-Invoice', { status: 'P', invoice: 'false' }); }}>
                                <FileX size={16} style={{ color: 'var(--admin-warning)' }} /> <span>Non-Inv: {formatBirr(getStatusData('P')?.non_invoice_total || 0)}</span>
                            </div>
                        </div>
                        <div style={{ height: '1px', background: 'var(--admin-border)', opacity: 0.5, margin: '2px 0' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--admin-text)' }}>
                            <div className="fin-kpi-subitem" onClick={e => { e.stopPropagation(); openDetail('pending-pre', 'Pending — Pre', { status: 'P', reason: 'PRE' }); }}>
                                <ArrowDownCircle size={14} style={{ color: 'var(--admin-primary)' }} /> <span>Pre: {formatBirr(getStatusData('P')?.pre_total || 0)}</span>
                            </div>
                            <div className="fin-kpi-subitem" onClick={e => { e.stopPropagation(); openDetail('pending-rem', 'Pending — Remaining', { status: 'P', reason: 'REM' }); }}>
                                <CheckCircle size={14} style={{ color: 'var(--admin-success)' }} /> <span>Rem: {formatBirr(getStatusData('P')?.rem_total || 0)}</span>
                            </div>
                            <div className="fin-kpi-subitem" onClick={e => { e.stopPropagation(); openDetail('pending-sales', 'Pending — Sales', { status: 'P', reason: 'SALES' }); }}>
                                <Tag size={14} style={{ color: '#8b5cf6' }} /> <span>Sales: {formatBirr(getStatusData('P')?.sales_total || 0)}</span>
                            </div>
                            <div className="fin-kpi-subitem" onClick={e => { e.stopPropagation(); openDetail('pending-maint', 'Pending — Maintenance', { status: 'P', reason: 'MAINTENANCE' }); }}>
                                <Wrench size={14} style={{ color: '#64748b' }} /> <span>Maint: {formatBirr(getStatusData('P')?.maint_total || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expected Remaining */}
                <div
                    className={`admin-kpi-card kpi-primary fin-kpi-clickable ${activeDetail?.key === 'expected-remaining' ? 'fin-kpi-active' : ''}`}
                    onClick={() => openDetail('expected-remaining', 'Expected Remaining Orders', {})}
                >
                    <div className="kpi-label"><Wallet /> Expected Remaining <ChevronRight size={14} className="fin-kpi-arrow" /></div>
                    <div className="kpi-value">{formatBirr(finance.expected_remaining || 0)}</div>
                    <div className="kpi-sub">From active orders</div>
                </div>

                {/* Expenses */}
                <div className="admin-kpi-card kpi-danger">
                    <div className="kpi-label"><ShoppingBag /> Expenses</div>
                    <div className="kpi-value">{formatBirr(finance.expenses?.total || 0)}</div>
                    <div className="kpi-sub" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px', fontSize: '13px', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--admin-danger)' }}>
                            <FileText size={16} /> <span>Inv: {formatBirr(finance.expenses?.invoice_total || 0)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--admin-warning)' }}>
                            <FileX size={16} /> <span>Non-Inv: {formatBirr(finance.expenses?.non_invoice_total || 0)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Panel Overlay — appears when a KPI card is clicked */}
            {activeDetail && activeDetail.key !== 'expected-remaining' && (
                <FinanceDetailPanel
                    initialFilters={activeDetail.filters}
                    title={activeDetail.title}
                    onSelectContainer={onSelectContainer}
                    onSelectOrder={onSelectOrder}
                    onClose={() => setActiveDetail(null)}
                />
            )}

            {activeDetail?.key === 'expected-remaining' && (
                <ExpectedRemainingOverlay
                    onClose={() => setActiveDetail(null)}
                    onSelectContainer={onSelectContainer}
                    onSelectOrder={onSelectOrder}
                />
            )}

            {/* Cash Flow Section */}
            <FinanceCashFlow onSelectContainer={onSelectContainer} />

            {/* Existing tables */}
            <div className="admin-stats-grid">
                {/* Payments by Reason */}
                <div className="admin-section-card">
                    <h3><CreditCard /> Payments by Reason</h3>
                    <table className="admin-table">
                        <thead>
                            <tr><th>Reason</th><th>Count</th><th>Amount</th><th></th></tr>
                        </thead>
                        <tbody>
                            {finance.payment_by_reason.map((p) => (
                                <tr key={p.reason} className="clickable-row" onClick={() => openDetail(`reason-${p.reason}`, REASON_LABELS[p.reason] || p.reason, { reason: p.reason })}>
                                    <td>{REASON_LABELS[p.reason] || p.reason}</td>
                                    <td>{p.count}</td>
                                    <td>{formatBirr(p.total || 0)}</td>
                                    <td><ChevronRight size={14} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {finance.payment_by_reason.length === 0 && <div className="admin-empty">No payments</div>}
                </div>

                {/* Expenses by Category */}
                <div className="admin-section-card">
                    <h3><ShoppingBag /> Expenses by Category</h3>
                    <table className="admin-table">
                        <thead>
                            <tr><th>Category</th><th>Count</th><th>Amount</th></tr>
                        </thead>
                        <tbody>
                            {(finance.expenses?.by_category || []).map((cat) => (
                                <tr key={cat.expense_category__name || 'Uncategorized'}>
                                    <td>{cat.expense_category__name || 'Uncategorized'}</td>
                                    <td>{cat.count}</td>
                                    <td>{formatBirr(cat.total || 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {(!finance.expenses?.by_category || finance.expenses.by_category.length === 0) && <div className="admin-empty">No expenses</div>}
                </div>

                {/* Payments by Status */}
                <div className="admin-section-card">
                    <h3><DollarSign /> Payments by Status</h3>
                    {finance.payment_by_status.map((p) => {
                        const max = Math.max(...finance.payment_by_status.map(x => x.count), 1);
                        return (
                            <div
                                key={p.status}
                                className="admin-progress-row clickable-row"
                                onClick={() => openDetail(`status-${p.status}`, STATUS_LABELS[p.status] || p.status, { status: p.status })}
                            >
                                <span className="admin-progress-label" style={{ color: STATUS_COLORS[p.status] }}>
                                    {STATUS_LABELS[p.status] || p.status}
                                </span>
                                <div className="admin-progress-bar">
                                    <div
                                        className="admin-progress-fill"
                                        style={{ width: `${(p.count / max) * 100}%`, background: STATUS_COLORS[p.status] }}
                                    />
                                </div>
                                <span className="admin-progress-value">{p.count}</span>
                            </div>
                        );
                    })}
                    <div style={{ marginTop: 12, fontSize: 13, color: 'var(--admin-text-secondary)' }}>
                        Total: {totalPayments} payments
                    </div>
                </div>

                {/* Purchases */}
                <div className="admin-section-card">
                    <h3><ShoppingBag /> Purchase Summary</h3>
                    <div className="admin-detail-row">
                        <span className="admin-detail-label">Total Purchases</span>
                        <span className="admin-detail-value">{finance.purchases.total}</span>
                    </div>
                    <div className="admin-detail-row">
                        <span className="admin-detail-label">In Progress</span>
                        <span className="admin-detail-value" style={{ color: 'var(--admin-warning)' }}>{finance.purchases.in_progress}</span>
                    </div>
                    <div className="admin-detail-row">
                        <span className="admin-detail-label">Done</span>
                        <span className="admin-detail-value" style={{ color: 'var(--admin-success)' }}>{finance.purchases.done}</span>
                    </div>
                    <div className="admin-detail-row">
                        <span className="admin-detail-label">Total Amount</span>
                        <span className="admin-detail-value">{formatBirr(finance.purchases.total_amount)}</span>
                    </div>

                    {finance.purchases.recent_list && finance.purchases.recent_list.length > 0 && (
                        <div style={{ marginTop: '16px', borderTop: '1px solid var(--admin-border)', paddingTop: '12px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--admin-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                Recent Purchases
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {finance.purchases.recent_list.map(p => (
                                    <div
                                        key={p.id}
                                        className="clickable-row"
                                        style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 8px', borderRadius: '4px', background: 'var(--admin-bg)' }}
                                        onClick={() => onPurchaseClick?.(p.id)}
                                    >
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{ fontWeight: '600' }}>#{p.id}</span>
                                            <span style={{ fontSize: '11px', color: 'var(--admin-text-secondary)' }}>{new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <span style={{ fontWeight: '600' }}>{formatBirr(p.total_amount)}</span>
                                            <span className="admin-status-badge" style={{ fontSize: '10px', padding: '2px 6px', height: 'auto' }}>
                                                {STATUS_LABELS[p.status] || p.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Pity Costs */}
                <div className="admin-section-card">
                    <h3><AlertTriangle /> Pity Costs by Category</h3>
                    {finance.pity_costs.by_category.map((cat) => {
                        const max = Math.max(...finance.pity_costs.by_category.map(x => x.total || 0), 1);
                        return (
                            <div key={cat.category__name} className="admin-progress-row">
                                <span className="admin-progress-label">{cat.category__name || 'Uncategorized'}</span>
                                <div className="admin-progress-bar">
                                    <div className="admin-progress-fill fill-danger"
                                        style={{ width: `${((cat.total || 0) / max) * 100}%` }} />
                                </div>
                                <span className="admin-progress-value">{formatBirr(cat.total || 0)}</span>
                            </div>
                        );
                    })}
                    {finance.pity_costs.by_category.length === 0 && <div className="admin-empty">No pity costs</div>}
                </div>
            </div>
        </>
    );
}
