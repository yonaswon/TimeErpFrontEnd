'use client';
import React from 'react';
import { Factory, Wrench, Truck, Scissors, Package } from 'lucide-react';
import { DashboardData } from './types';

interface Props {
    data: DashboardData;
}

function formatNum(n: number): string {
    return n.toLocaleString();
}

const CNC_STATUS_LABELS: Record<string, string> = {
    'NOT-ASSIGNED': 'Not Assigned',
    'ASSIGNED': 'Assigned',
    'STARTED': 'Started',
    'COMPLATED': 'Completed',
};

const ASSEMBLY_STATUS_LABELS: Record<string, string> = {
    'ASSIGNED': 'Assigned',
    'STARTED': 'Started',
    'COMPLETED': 'Completed',
};

const MAINTENANCE_STATUS_LABELS: Record<string, string> = {
    'NA': 'Not Assigned',
    'A': 'Assigned',
    'S': 'Started',
    'D': 'Done',
};

export default function ProductionStats({ data }: Props) {
    const { production } = data;
    const totalCnc = Object.values(production.cnc).reduce((a, b) => a + b, 0);
    const totalAssembly = Object.values(production.assembly).reduce((a, b) => a + b, 0);
    const totalDelivery = Object.values(production.delivery).reduce((a, b) => a + b, 0);
    const totalMaintenance = Object.values(production.maintenance.status_counts).reduce((a, b) => a + b, 0);

    return (
        <>
            {/* KPI Row */}
            <div className="admin-kpi-grid">
                <div className="admin-kpi-card kpi-primary">
                    <div className="kpi-label"><Scissors /> CNC Tasks</div>
                    <div className="kpi-value">{formatNum(totalCnc)}</div>
                </div>
                <div className="admin-kpi-card kpi-info">
                    <div className="kpi-label"><Factory /> Assembly</div>
                    <div className="kpi-value">{formatNum(totalAssembly)}</div>
                </div>
                <div className="admin-kpi-card kpi-success">
                    <div className="kpi-label"><Truck /> Delivery</div>
                    <div className="kpi-value">{formatNum(totalDelivery)}</div>
                </div>
                <div className="admin-kpi-card kpi-warning">
                    <div className="kpi-label"><Wrench /> Maintenance</div>
                    <div className="kpi-value">{formatNum(totalMaintenance)}</div>
                    <div className="kpi-sub">
                        Warranty: {production.maintenance.warranty} · Non: {production.maintenance.non_warranty}
                    </div>
                </div>
            </div>

            <div className="admin-stats-grid">
                {/* CNC Pipeline */}
                <div className="admin-section-card">
                    <h3><Scissors /> CNC Cutting Pipeline</h3>
                    {Object.entries(production.cnc).map(([status, count]) => {
                        const max = Math.max(...Object.values(production.cnc), 1);
                        const fillClass = status === 'COMPLATED' ? 'fill-success' :
                            status === 'STARTED' ? 'fill-warning' :
                                status === 'ASSIGNED' ? 'fill-info' : '';
                        return (
                            <div key={status} className="admin-progress-row">
                                <span className="admin-progress-label">{CNC_STATUS_LABELS[status] || status}</span>
                                <div className="admin-progress-bar">
                                    <div className={`admin-progress-fill ${fillClass}`}
                                        style={{ width: `${(count / max) * 100}%` }} />
                                </div>
                                <span className="admin-progress-value">{count}</span>
                            </div>
                        );
                    })}
                    {Object.keys(production.cnc).length === 0 && <div className="admin-empty">No CNC data</div>}
                </div>

                {/* Assembly Pipeline */}
                <div className="admin-section-card">
                    <h3><Factory /> Assembly Pipeline</h3>
                    {Object.entries(production.assembly).map(([status, count]) => {
                        const max = Math.max(...Object.values(production.assembly), 1);
                        const fillClass = status === 'COMPLETED' ? 'fill-success' :
                            status === 'STARTED' ? 'fill-warning' : 'fill-info';
                        return (
                            <div key={status} className="admin-progress-row">
                                <span className="admin-progress-label">{ASSEMBLY_STATUS_LABELS[status] || status}</span>
                                <div className="admin-progress-bar">
                                    <div className={`admin-progress-fill ${fillClass}`}
                                        style={{ width: `${(count / max) * 100}%` }} />
                                </div>
                                <span className="admin-progress-value">{count}</span>
                            </div>
                        );
                    })}
                    {Object.keys(production.assembly).length === 0 && <div className="admin-empty">No assembly data</div>}
                </div>

                {/* Delivery Pipeline */}
                <div className="admin-section-card">
                    <h3><Truck /> Delivery & Installation</h3>
                    {Object.entries(production.delivery).map(([status, count]) => {
                        const max = Math.max(...Object.values(production.delivery), 1);
                        return (
                            <div key={status} className="admin-progress-row">
                                <span className="admin-progress-label">{status}</span>
                                <div className="admin-progress-bar">
                                    <div className="admin-progress-fill fill-info"
                                        style={{ width: `${(count / max) * 100}%` }} />
                                </div>
                                <span className="admin-progress-value">{count}</span>
                            </div>
                        );
                    })}
                    {Object.keys(production.delivery).length === 0 && <div className="admin-empty">No delivery data</div>}
                </div>

                {/* Maintenance */}
                <div className="admin-section-card">
                    <h3><Wrench /> Maintenance</h3>
                    {Object.entries(production.maintenance.status_counts).map(([status, count]) => {
                        const max = Math.max(...Object.values(production.maintenance.status_counts), 1);
                        const fillClass = status === 'D' ? 'fill-success' :
                            status === 'S' ? 'fill-warning' :
                                status === 'A' ? 'fill-info' : '';
                        return (
                            <div key={status} className="admin-progress-row">
                                <span className="admin-progress-label">{MAINTENANCE_STATUS_LABELS[status] || status}</span>
                                <div className="admin-progress-bar">
                                    <div className={`admin-progress-fill ${fillClass}`}
                                        style={{ width: `${(count / max) * 100}%` }} />
                                </div>
                                <span className="admin-progress-value">{count}</span>
                            </div>
                        );
                    })}
                    <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
                        <div className="admin-status-badge">
                            Warranty <span className="badge-count">{production.maintenance.warranty}</span>
                        </div>
                        <div className="admin-status-badge">
                            Non-Warranty <span className="badge-count">{production.maintenance.non_warranty}</span>
                        </div>
                    </div>
                </div>

                {/* Releases */}
                <div className="admin-section-card">
                    <h3><Package /> Material Releases</h3>
                    {data.releases.by_reason.map((r: any) => {
                        const max = Math.max(...data.releases.by_reason.map((x: any) => x.count), 1);
                        return (
                            <div key={r.reason} className="admin-progress-row">
                                <span className="admin-progress-label">{r.reason}</span>
                                <div className="admin-progress-bar">
                                    <div className="admin-progress-fill" style={{ width: `${(r.count / max) * 100}%` }} />
                                </div>
                                <span className="admin-progress-value">{r.count}</span>
                            </div>
                        );
                    })}
                    {data.releases.by_reason.length === 0 && <div className="admin-empty">No releases</div>}
                </div>
            </div>
        </>
    );
}
