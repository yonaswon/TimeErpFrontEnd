'use client';
import React from 'react';
import {
    ShoppingCart, DollarSign, TrendingUp, AlertTriangle,
    Package, Factory, Truck, Users
} from 'lucide-react';
import { DashboardData } from './types';

interface Props {
    data: DashboardData;
}

function formatNum(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
}

function formatBirr(n: number): string {
    return `${Math.round(n).toLocaleString()} Birr`;
}

export default function DashboardOverview({ data }: Props) {
    const totalProduction = Object.values(data.production.cnc || {}).reduce((a, b) => a + b, 0);
    const totalDeliveries = Object.values(data.production.delivery || {}).reduce((a, b) => a + b, 0);

    return (
        <>
            {/* KPI Cards */}
            <div className="admin-kpi-grid">
                <div className="admin-kpi-card kpi-primary">
                    <div className="kpi-label"><ShoppingCart /> Total Orders</div>
                    <div className="kpi-value">{formatNum(data.orders.total_orders)}</div>
                    <div className="kpi-sub">{data.orders.total_containers} containers</div>
                </div>
                <div className="admin-kpi-card kpi-success">
                    <div className="kpi-label"><DollarSign /> Revenue</div>
                    <div className="kpi-value">{formatBirr(data.orders.financials.total_revenue)}</div>
                    <div className="kpi-sub">Avg: {formatBirr(data.orders.financials.avg_order_value)}</div>
                </div>
                <div className="admin-kpi-card kpi-info">
                    <div className="kpi-label"><TrendingUp /> Active Leads</div>
                    <div className="kpi-value">{formatNum(data.sales.total_leads)}</div>
                    <div className="kpi-sub">{data.sales.conversion_rate}% conversion</div>
                </div>
                <div className="admin-kpi-card kpi-warning">
                    <div className="kpi-label"><DollarSign /> Pending Payments</div>
                    <div className="kpi-value">{formatBirr(data.finance.total_pending)}</div>
                    <div className="kpi-sub">Confirmed: {formatBirr(data.finance.total_confirmed)}</div>
                </div>
                <div className="admin-kpi-card kpi-primary">
                    <div className="kpi-label"><Factory /> Production</div>
                    <div className="kpi-value">{formatNum(totalProduction)}</div>
                    <div className="kpi-sub">CNC tasks total</div>
                </div>
                <div className="admin-kpi-card kpi-info">
                    <div className="kpi-label"><Truck /> Deliveries</div>
                    <div className="kpi-value">{formatNum(totalDeliveries)}</div>
                    <div className="kpi-sub">D&I assignments</div>
                </div>
                <div className="admin-kpi-card kpi-danger">
                    <div className="kpi-label"><AlertTriangle /> Low Stock</div>
                    <div className="kpi-value">{data.stock.low_stock_count}</div>
                    <div className="kpi-sub">materials below threshold</div>
                </div>
                <div className="admin-kpi-card kpi-success">
                    <div className="kpi-label"><Users /> Team</div>
                    <div className="kpi-value">{data.team.total_users}</div>
                    <div className="kpi-sub">{data.team.roles.length} roles</div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="admin-stats-grid">
                {/* Order Status Distribution */}
                <div className="admin-section-card">
                    <h3><ShoppingCart /> Order Status Distribution</h3>
                    {Object.entries(data.orders.status_distribution).map(([status, count]) => {
                        const maxCount = Math.max(...Object.values(data.orders.status_distribution), 1);
                        return (
                            <div key={status} className="admin-progress-row">
                                <span className="admin-progress-label">{status}</span>
                                <div className="admin-progress-bar">
                                    <div
                                        className="admin-progress-fill"
                                        style={{ width: `${(count / maxCount) * 100}%` }}
                                    />
                                </div>
                                <span className="admin-progress-value">{count}</span>
                            </div>
                        );
                    })}
                    {Object.keys(data.orders.status_distribution).length === 0 && (
                        <div className="admin-empty">No orders found</div>
                    )}
                </div>

                {/* Difficulty Distribution */}
                <div className="admin-section-card">
                    <h3><Factory /> Order Difficulty</h3>
                    {Object.entries(data.orders.difficulty_distribution).map(([diff, count]) => {
                        const colors: Record<string, string> = { SIMPLE: 'fill-success', MEDIUM: 'fill-warning', DIFFICULT: 'fill-danger' };
                        const maxCount = Math.max(...Object.values(data.orders.difficulty_distribution), 1);
                        return (
                            <div key={diff} className="admin-progress-row">
                                <span className="admin-progress-label">{diff}</span>
                                <div className="admin-progress-bar">
                                    <div
                                        className={`admin-progress-fill ${colors[diff] || ''}`}
                                        style={{ width: `${(count / maxCount) * 100}%` }}
                                    />
                                </div>
                                <span className="admin-progress-value">{count}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Production Pipeline */}
                <div className="admin-section-card">
                    <h3><Factory /> Production Pipeline</h3>
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 8 }}>CNC CUTTING</div>
                        <div className="admin-status-bar">
                            {Object.entries(data.production.cnc).map(([status, count]) => (
                                <span key={status} className="admin-status-badge">
                                    {status} <span className="badge-count">{count}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 8 }}>ASSEMBLY</div>
                        <div className="admin-status-bar">
                            {Object.entries(data.production.assembly).map(([status, count]) => (
                                <span key={status} className="admin-status-badge">
                                    {status} <span className="badge-count">{count}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 8 }}>DELIVERY</div>
                        <div className="admin-status-bar">
                            {Object.entries(data.production.delivery).map(([status, count]) => (
                                <span key={status} className="admin-status-badge">
                                    {status} <span className="badge-count">{count}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="admin-section-card">
                    <h3><DollarSign /> Financial Summary</h3>
                    <div className="admin-detail-row">
                        <span className="admin-detail-label">Total Revenue</span>
                        <span className="admin-detail-value">{formatBirr(data.orders.financials.total_revenue)}</span>
                    </div>
                    <div className="admin-detail-row">
                        <span className="admin-detail-label">Advance Payments</span>
                        <span className="admin-detail-value">{formatBirr(data.orders.financials.total_advance)}</span>
                    </div>
                    <div className="admin-detail-row">
                        <span className="admin-detail-label">Remaining Payments</span>
                        <span className="admin-detail-value">{formatBirr(data.orders.financials.total_remaining)}</span>
                    </div>
                    <div className="admin-detail-row">
                        <span className="admin-detail-label">Confirmed Payments</span>
                        <span className="admin-detail-value" style={{ color: 'var(--admin-success)' }}>{formatBirr(data.finance.total_confirmed)}</span>
                    </div>
                    <div className="admin-detail-row">
                        <span className="admin-detail-label">Pending Payments</span>
                        <span className="admin-detail-value" style={{ color: 'var(--admin-warning)' }}>{formatBirr(data.finance.total_pending)}</span>
                    </div>
                    <div className="admin-detail-row">
                        <span className="admin-detail-label">Pity Costs</span>
                        <span className="admin-detail-value" style={{ color: 'var(--admin-danger)' }}>{formatBirr(data.finance.pity_costs.total)}</span>
                    </div>
                </div>
            </div>
        </>
    );
}
