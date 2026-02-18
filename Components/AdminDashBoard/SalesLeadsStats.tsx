'use client';
import React from 'react';
import { TrendingUp, Users, Palette } from 'lucide-react';
import { DashboardData } from './types';

interface Props {
    data: DashboardData;
}

function formatNum(n: number): string {
    return n.toLocaleString();
}

export default function SalesLeadsStats({ data }: Props) {
    const { sales } = data;
    const leadStatuses = ['NEW', 'WARM', 'COLD', 'CONVERTED'];
    const leadColors: Record<string, string> = {
        NEW: 'var(--admin-info)', WARM: 'var(--admin-warning)',
        COLD: 'var(--admin-text-muted)', CONVERTED: 'var(--admin-success)'
    };

    const mockupStatuses = ['SENT', 'STARTED', 'RETURNED', 'CONVERTED'];
    const mockupColors: Record<string, string> = {
        SENT: 'var(--admin-info)', STARTED: 'var(--admin-warning)',
        RETURNED: 'var(--admin-danger)', CONVERTED: 'var(--admin-success)'
    };

    return (
        <>
            {/* KPI Row */}
            <div className="admin-kpi-grid">
                <div className="admin-kpi-card kpi-info">
                    <div className="kpi-label"><TrendingUp /> Total Leads</div>
                    <div className="kpi-value">{formatNum(sales.total_leads)}</div>
                </div>
                <div className="admin-kpi-card kpi-success">
                    <div className="kpi-label"><TrendingUp /> Conversion Rate</div>
                    <div className="kpi-value">{sales.conversion_rate}%</div>
                </div>
                <div className="admin-kpi-card kpi-primary">
                    <div className="kpi-label"><Palette /> Total Mockups</div>
                    <div className="kpi-value">{formatNum(sales.total_mockups)}</div>
                </div>
                <div className="admin-kpi-card kpi-warning">
                    <div className="kpi-label"><Palette /> Modifications</div>
                    <div className="kpi-value">{formatNum(sales.total_modifications)}</div>
                </div>
            </div>

            <div className="admin-stats-grid">
                {/* Lead Funnel */}
                <div className="admin-section-card">
                    <h3><TrendingUp /> Lead Funnel</h3>
                    {leadStatuses.map(status => {
                        const count = sales.lead_status_counts[status] || 0;
                        const max = Math.max(...leadStatuses.map(s => sales.lead_status_counts[s] || 0), 1);
                        return (
                            <div key={status} className="admin-progress-row">
                                <span className="admin-progress-label" style={{ color: leadColors[status] }}>{status}</span>
                                <div className="admin-progress-bar">
                                    <div
                                        className="admin-progress-fill"
                                        style={{ width: `${(count / max) * 100}%`, background: leadColors[status] }}
                                    />
                                </div>
                                <span className="admin-progress-value">{count}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Mockup Status */}
                <div className="admin-section-card">
                    <h3><Palette /> Mockup Status</h3>
                    {mockupStatuses.map(status => {
                        const count = sales.mockup_status_counts[status] || 0;
                        const max = Math.max(...mockupStatuses.map(s => sales.mockup_status_counts[s] || 0), 1);
                        return (
                            <div key={status} className="admin-progress-row">
                                <span className="admin-progress-label" style={{ color: mockupColors[status] }}>{status}</span>
                                <div className="admin-progress-bar">
                                    <div
                                        className="admin-progress-fill"
                                        style={{ width: `${(count / max) * 100}%`, background: mockupColors[status] }}
                                    />
                                </div>
                                <span className="admin-progress-value">{count}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Per Salesperson */}
                <div className="admin-section-card">
                    <h3><Users /> Per Salesperson</h3>
                    {sales.leads_per_salesperson.map((sp: any, i: number) => {
                        const name = sp.sales__telegram_user_name || sp.sales__username || `User ${sp.sales__id}`;
                        const initial = (name || '?')[0].toUpperCase();
                        return (
                            <div key={i} className="admin-person-row">
                                <div className="admin-person-avatar">{initial}</div>
                                <div className="admin-person-info">
                                    <div className="admin-person-name">{name}</div>
                                    <div className="admin-person-stats">
                                        <span>Total: {sp.total}</span>
                                        <span style={{ color: 'var(--admin-success)' }}>Converted: {sp.converted}</span>
                                        <span style={{ color: 'var(--admin-info)' }}>New: {sp.new}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {sales.leads_per_salesperson.length === 0 && <div className="admin-empty">No data</div>}
                </div>

                {/* Per Designer */}
                <div className="admin-section-card">
                    <h3><Palette /> Per Designer</h3>
                    {sales.mockups_per_designer.map((d: any, i: number) => {
                        const name = d.designer__telegram_user_name || d.designer__username || `User ${d.designer__id}`;
                        const initial = (name || '?')[0].toUpperCase();
                        return (
                            <div key={i} className="admin-person-row">
                                <div className="admin-person-avatar">{initial}</div>
                                <div className="admin-person-info">
                                    <div className="admin-person-name">{name}</div>
                                    <div className="admin-person-stats">
                                        <span>Total: {d.total}</span>
                                        <span style={{ color: 'var(--admin-warning)' }}>Started: {d.started}</span>
                                        <span style={{ color: 'var(--admin-success)' }}>Converted: {d.converted}</span>
                                        <span style={{ color: 'var(--admin-danger)' }}>Returned: {d.returned}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {sales.mockups_per_designer.length === 0 && <div className="admin-empty">No data</div>}
                </div>
            </div>
        </>
    );
}
