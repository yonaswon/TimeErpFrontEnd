'use client';
import React, { useState, useEffect } from 'react';
import api from '../../api';
import { TrendingUp, TrendingDown, ArrowRight, Eye, Wallet, Building2, RefreshCw } from 'lucide-react';

interface Props {
    onSelectContainer?: (id: number) => void;
}

function formatBirr(n: number) { return `${Math.round(n).toLocaleString()}`; }
function formatDate(d: string | null) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

const AGING_LABELS: Record<string, { label: string; color: string }> = {
    '0_7': { label: '0-7 Days', color: '#16a34a' },
    '8_30': { label: '8-30 Days', color: '#f59e0b' },
    '31_60': { label: '31-60 Days', color: '#ea580c' },
    '60_plus': { label: '60+ Days', color: '#dc2626' },
};

export default function FinanceCashFlow({ onSelectContainer }: Props) {
    const [data, setData] = useState<any>(null);
    const [period, setPeriod] = useState(7);
    const [loading, setLoading] = useState(true);
    const [agingExpanded, setAgingExpanded] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        api.get(`/api/admin/finance-cashflow/?days=${period}`)
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [period]);

    if (loading) return <div className="admin-loading"><div className="admin-spinner" /> Loading cash flow...</div>;
    if (!data) return null;

    const { days, summary, wallets, accounts, recent_transfers, receivables_aging } = data;
    const maxVal = Math.max(...days.map((d: any) => Math.max(d.inflow, d.outflow)), 1);

    return (
        <div className="fin-cashflow-section">
            {/* Summary Strip */}
            <div className="fin-cf-summary-strip">
                <div className="fin-cf-summary-card cf-inflow">
                    <TrendingUp size={18} />
                    <div>
                        <div className="fin-cf-summary-label">Total Inflow ({period}d)</div>
                        <div className="fin-cf-summary-value">{formatBirr(summary.total_inflow)} Birr</div>
                    </div>
                </div>
                <div className="fin-cf-summary-card cf-outflow">
                    <TrendingDown size={18} />
                    <div>
                        <div className="fin-cf-summary-label">Total Outflow ({period}d)</div>
                        <div className="fin-cf-summary-value">{formatBirr(summary.total_outflow)} Birr</div>
                    </div>
                </div>
                <div className={`fin-cf-summary-card ${summary.net_cashflow >= 0 ? 'cf-positive' : 'cf-negative'}`}>
                    {summary.net_cashflow >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    <div>
                        <div className="fin-cf-summary-label">Net Cash Flow</div>
                        <div className="fin-cf-summary-value">{formatBirr(summary.net_cashflow)} Birr</div>
                    </div>
                </div>
                <div className="fin-cf-summary-card cf-receivable">
                    <Eye size={18} />
                    <div>
                        <div className="fin-cf-summary-label">Total Receivable</div>
                        <div className="fin-cf-summary-value">{formatBirr(summary.total_receivable)} Birr</div>
                    </div>
                </div>
            </div>

            <div className="admin-stats-grid">
                {/* Cash Flow Chart */}
                <div className="admin-section-card fin-cf-chart-card">
                    <div className="fin-cf-chart-header">
                        <h3>Cash Flow</h3>
                        <div className="fin-cf-period-toggle">
                            <button className={period === 7 ? 'active' : ''} onClick={() => setPeriod(7)}>7 Days</button>
                            <button className={period === 30 ? 'active' : ''} onClick={() => setPeriod(30)}>30 Days</button>
                        </div>
                    </div>
                    <div className="fin-cf-chart">
                        {days.map((d: any, i: number) => {
                            const inflowH = (d.inflow / maxVal) * 100;
                            const outflowH = (d.outflow / maxVal) * 100;
                            const dayLabel = new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                            return (
                                <div key={i} className="fin-cf-bar-group" title={`${dayLabel}: In ${formatBirr(d.inflow)} | Out ${formatBirr(d.outflow)}`}>
                                    <div className="fin-cf-bars">
                                        <div className="fin-cf-bar fin-cf-bar-in" style={{ height: `${Math.max(inflowH, 2)}%` }} />
                                        <div className="fin-cf-bar fin-cf-bar-out" style={{ height: `${Math.max(outflowH, 2)}%` }} />
                                    </div>
                                    <span className="fin-cf-bar-label">{dayLabel.split(' ')[0]}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="fin-cf-legend">
                        <span><span className="fin-cf-dot dot-in" /> Inflow</span>
                        <span><span className="fin-cf-dot dot-out" /> Outflow</span>
                    </div>
                </div>

                {/* Receivables Aging */}
                <div className="admin-section-card">
                    <h3>Receivables Aging</h3>
                    {Object.entries(AGING_LABELS).map(([key, meta]) => {
                        const bucket = receivables_aging?.[key] || { count: 0, total: 0, items: [] };
                        return (
                            <div key={key} className="fin-aging-bucket">
                                <div
                                    className="fin-aging-header"
                                    onClick={() => setAgingExpanded(agingExpanded === key ? null : key)}
                                    style={{ cursor: bucket.count > 0 ? 'pointer' : 'default' }}
                                >
                                    <span className="fin-aging-dot" style={{ background: meta.color }} />
                                    <span className="fin-aging-label">{meta.label}</span>
                                    <span className="fin-aging-count" style={{ color: meta.color }}>{bucket.count}</span>
                                    <span className="fin-aging-total">{formatBirr(bucket.total)} Birr</span>
                                </div>
                                {agingExpanded === key && bucket.items.length > 0 && (
                                    <div className="fin-aging-items">
                                        {bucket.items.map((item: any) => (
                                            <div
                                                key={item.id}
                                                className="fin-aging-item clickable-row"
                                                onClick={() => onSelectContainer?.(item.id)}
                                            >
                                                <div className="fin-aging-item-top">
                                                    <span className="fin-aging-client">{item.client}</span>
                                                    <span className="fin-aging-days">{item.age_days}d</span>
                                                </div>
                                                <div className="fin-aging-item-orders">
                                                    {(item.orders || []).map((o: any) => (
                                                        <span key={o.order_code} className="ot-order-code" style={{ fontSize: 11 }}>ORD-{o.order_code}</span>
                                                    ))}
                                                </div>
                                                <div className="fin-aging-item-amount">
                                                    Remaining: <strong>{formatBirr(item.remaining_payment)} Birr</strong>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Treasury: Wallets */}
                <div className="admin-section-card">
                    <h3><Wallet size={16} /> Wallets</h3>
                    {wallets.map((w: any) => (
                        <div key={w.id} className="fin-wallet-card">
                            <div className="fin-wallet-name">{w.name}</div>
                            <div className="fin-wallet-balances">
                                <div>
                                    <div className="fin-wallet-label">Invoice</div>
                                    <div className="fin-wallet-amount success">{formatBirr(w.invoice_balance)}</div>
                                </div>
                                <div>
                                    <div className="fin-wallet-label">Non-Invoice</div>
                                    <div className="fin-wallet-amount primary">{formatBirr(w.non_invoice_balance)}</div>
                                </div>
                                <div>
                                    <div className="fin-wallet-label">Total</div>
                                    <div className="fin-wallet-amount">{formatBirr(w.invoice_balance + w.non_invoice_balance)}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bank Accounts */}
                <div className="admin-section-card">
                    <h3><Building2 size={16} /> Bank Accounts</h3>
                    {(accounts || []).map((a: any) => (
                        <div key={a.id} className="fin-bank-card">
                            <div className="fin-bank-name">{a.bank}</div>
                            <div className="fin-bank-info">
                                <span className="fin-bank-number">{a.account_number}</span>
                                <span className="fin-bank-balance">{formatBirr(a.available_amount)} Birr</span>
                            </div>
                        </div>
                    ))}
                    {(!accounts || accounts.length === 0) && <div className="admin-empty">No accounts</div>}
                </div>

                {/* Recent Wallet Transfers */}
                <div className="admin-section-card">
                    <h3><RefreshCw size={16} /> Recent Transfers</h3>
                    <table className="admin-table">
                        <thead>
                            <tr><th>From</th><th></th><th>To</th><th>Amount</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                            {(recent_transfers || []).map((t: any) => (
                                <tr key={t.id}>
                                    <td>{t.from_wallet}</td>
                                    <td style={{ textAlign: 'center' }}><ArrowRight size={12} /></td>
                                    <td>{t.to_wallet}</td>
                                    <td style={{ fontWeight: 600 }}>{formatBirr(t.amount)} Birr</td>
                                    <td style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>{formatDate(t.date)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {(!recent_transfers || recent_transfers.length === 0) && <div className="admin-empty">No transfers</div>}
                </div>
            </div>
        </div>
    );
}
