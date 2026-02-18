'use client';
import React from 'react';
import { DollarSign, CreditCard, ShoppingBag, AlertTriangle, Wallet } from 'lucide-react';
import { DashboardData } from './types';

interface Props {
    data: DashboardData;
    onPurchaseClick: (id: number) => void;
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

export default function FinanceStats({ data, onPurchaseClick }: Props) {
    const { finance } = data;
    const totalPayments = finance.payment_by_status.reduce((a, b) => a + b.count, 0);

    return (
        <>
            {/* KPI Cards */}
            <div className="admin-kpi-grid">
                <div className="admin-kpi-card kpi-success">
                    <div className="kpi-label"><DollarSign /> Confirmed</div>
                    <div className="kpi-value">{formatBirr(finance.total_confirmed)}</div>
                    <div className="kpi-sub">Total confirmed payments</div>
                </div>
                <div className="admin-kpi-card kpi-warning">
                    <div className="kpi-label"><DollarSign /> Pending</div>
                    <div className="kpi-value">{formatBirr(finance.total_pending)}</div>
                    <div className="kpi-sub">Awaiting confirmation</div>
                </div>
                <div className="admin-kpi-card kpi-primary">
                    <div className="kpi-label"><ShoppingBag /> Purchases</div>
                    <div className="kpi-value">{finance.purchases.total}</div>
                    <div className="kpi-sub">{formatBirr(finance.purchases.total_amount)}</div>
                </div>
                <div className="admin-kpi-card kpi-danger">
                    <div className="kpi-label"><AlertTriangle /> Pity Costs</div>
                    <div className="kpi-value">{formatBirr(finance.pity_costs.total)}</div>
                </div>
            </div>

            <div className="admin-stats-grid">
                {/* Payments by Reason */}
                <div className="admin-section-card">
                    <h3><CreditCard /> Payments by Reason</h3>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Reason</th>
                                <th>Count</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {finance.payment_by_reason.map((p) => (
                                <tr key={p.reason}>
                                    <td>{REASON_LABELS[p.reason] || p.reason}</td>
                                    <td>{p.count}</td>
                                    <td>{formatBirr(p.total || 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {finance.payment_by_reason.length === 0 && <div className="admin-empty">No payments</div>}
                </div>

                {/* Payments by Status */}
                <div className="admin-section-card">
                    <h3><DollarSign /> Payments by Status</h3>
                    {finance.payment_by_status.map((p) => {
                        const max = Math.max(...finance.payment_by_status.map(x => x.count), 1);
                        return (
                            <div key={p.status} className="admin-progress-row">
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
                        <span className="admin-detail-value" style={{ color: 'var(--admin-warning)' }}>
                            {finance.purchases.in_progress}
                        </span>
                    </div>
                    <div className="admin-detail-row">
                        <span className="admin-detail-label">Done</span>
                        <span className="admin-detail-value" style={{ color: 'var(--admin-success)' }}>
                            {finance.purchases.done}
                        </span>
                    </div>
                    <div className="admin-detail-row">
                        <span className="admin-detail-label">Total Amount</span>
                        <span className="admin-detail-value">{formatBirr(finance.purchases.total_amount)}</span>
                    </div>

                    {/* Recent Purchases List */}
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

                {/* Wallets */}
                <div className="admin-section-card">
                    <h3><Wallet /> Wallet Balances</h3>
                    {finance.wallets.map((w) => (
                        <div key={w.id} style={{
                            padding: '12px',
                            background: 'var(--admin-bg)',
                            borderRadius: 'var(--admin-radius-sm)',
                            marginBottom: 8,
                            border: '1px solid var(--admin-border)'
                        }}>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'var(--admin-text)' }}>
                                {w.name}
                            </div>
                            <div style={{ display: 'flex', gap: 24 }}>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Invoice</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-success)' }}>
                                        {formatBirr(w.invoice_balance || 0)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Non-Invoice</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-primary)' }}>
                                        {formatBirr(w.non_invoice_balance || 0)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {finance.wallets.length === 0 && <div className="admin-empty">No wallets</div>}
                </div>
            </div>
        </>
    );
}
