'use client';
import React from 'react';
import { Package, AlertTriangle, Layers, Archive } from 'lucide-react';
import { DashboardData } from './types';

interface Props {
    data: DashboardData;
    onMaterialClick: (id: number) => void;
}

function formatNum(n: number): string {
    return n.toLocaleString();
}

function formatBirr(n: number): string {
    return `${Math.round(n).toLocaleString()} Birr`;
}

const TYPE_LABELS: Record<string, string> = {
    L: 'Length', A: 'Areal', P: 'Piece'
};

const LABEL_DISPLAY: Record<string, string> = {
    COLOR: 'Color', BG: 'Background', LED: 'LED',
    OL: 'Light', PS: 'Power Supply', OTHER: 'Other'
};

export default function StockOverview({ data, onMaterialClick }: Props) {
    const { stock } = data;

    return (
        <>
            {/* KPI Cards */}
            <div className="admin-kpi-grid">
                <div className="admin-kpi-card kpi-primary">
                    <div className="kpi-label"><Package /> Total Materials</div>
                    <div className="kpi-value">{formatNum(stock.total_materials)}</div>
                </div>
                <div className="admin-kpi-card kpi-danger">
                    <div className="kpi-label"><AlertTriangle /> Low Stock</div>
                    <div className="kpi-value">{stock.low_stock_count}</div>
                    <div className="kpi-sub">materials below threshold</div>
                </div>
                <div className="admin-kpi-card kpi-success">
                    <div className="kpi-label"><Layers /> BOMs Total</div>
                    <div className="kpi-value">{formatNum(stock.bom.total)}</div>
                    <div className="kpi-sub">Released: {stock.bom.released} · Unreleased: {stock.bom.unreleased}</div>
                </div>
                <div className="admin-kpi-card kpi-info">
                    <div className="kpi-label"><Archive /> Inventories</div>
                    <div className="kpi-value">{stock.inventories.length}</div>
                </div>
            </div>

            <div className="admin-stats-grid">
                {/* Materials by Type */}
                <div className="admin-section-card">
                    <h3><Package /> Materials by Type</h3>
                    {Object.entries(stock.materials_by_type).map(([type, count]) => {
                        const max = Math.max(...Object.values(stock.materials_by_type), 1);
                        return (
                            <div key={type} className="admin-progress-row">
                                <span className="admin-progress-label">{TYPE_LABELS[type] || type}</span>
                                <div className="admin-progress-bar">
                                    <div className="admin-progress-fill"
                                        style={{ width: `${(count / max) * 100}%` }} />
                                </div>
                                <span className="admin-progress-value">{count}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Materials by Label */}
                <div className="admin-section-card">
                    <h3><Layers /> Materials by Label</h3>
                    {Object.entries(stock.materials_by_label).map(([label, count]) => {
                        const max = Math.max(...Object.values(stock.materials_by_label), 1);
                        return (
                            <div key={label} className="admin-progress-row">
                                <span className="admin-progress-label">{LABEL_DISPLAY[label] || label}</span>
                                <div className="admin-progress-bar">
                                    <div className="admin-progress-fill fill-info"
                                        style={{ width: `${(count / max) * 100}%` }} />
                                </div>
                                <span className="admin-progress-value">{count}</span>
                            </div>
                        );
                    })}
                </div>

                {/* BOM Summary */}
                <div className="admin-section-card">
                    <h3><Layers /> BOM Summary</h3>
                    <div className="admin-detail-row">
                        <span className="admin-detail-label">Total BOMs</span>
                        <span className="admin-detail-value">{stock.bom.total}</span>
                    </div>
                    <div className="admin-detail-row">
                        <span className="admin-detail-label">Released</span>
                        <span className="admin-detail-value" style={{ color: 'var(--admin-success)' }}>{stock.bom.released}</span>
                    </div>
                    <div className="admin-detail-row">
                        <span className="admin-detail-label">Unreleased</span>
                        <span className="admin-detail-value" style={{ color: 'var(--admin-warning)' }}>{stock.bom.unreleased}</span>
                    </div>
                    <div className="admin-detail-row">
                        <span className="admin-detail-label">Total Estimated Cost</span>
                        <span className="admin-detail-value">{formatBirr(stock.bom.total_estimated_cost)}</span>
                    </div>
                    <div className="admin-detail-row">
                        <span className="admin-detail-label">Total Actual Cost</span>
                        <span className="admin-detail-value">{formatBirr(stock.bom.total_actual_cost)}</span>
                    </div>
                </div>

                {/* Inventory Distribution */}
                <div className="admin-section-card">
                    <h3><Archive /> Inventory Distribution</h3>
                    {stock.inventories.map((inv: any) => (
                        <div key={inv.id} style={{
                            padding: '12px',
                            background: 'var(--admin-bg)',
                            borderRadius: 'var(--admin-radius-sm)',
                            marginBottom: 8,
                            border: '1px solid var(--admin-border)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--admin-text)' }}>{inv.name}</span>
                                <span style={{ fontSize: 11, padding: '2px 8px', background: 'var(--admin-primary-light)', color: 'var(--admin-primary)', borderRadius: 10, fontWeight: 600 }}>
                                    {inv.type}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--admin-text-secondary)' }}>
                                <span>L&P Records: {inv.material_records}</span>
                                <span>Areal Pieces: {inv.areal_pieces}</span>
                            </div>
                        </div>
                    ))}
                    {stock.inventories.length === 0 && <div className="admin-empty">No inventories</div>}
                </div>

                {/* Low Stock Alerts */}
                {stock.low_stock_materials.length > 0 && (
                    <div className="admin-section-card" style={{ gridColumn: '1 / -1' }}>
                        <h3><AlertTriangle /> Low Stock Alerts</h3>
                        {stock.low_stock_materials.map((mat) => (
                            <div
                                key={mat.id}
                                className="admin-low-stock-item clickable-row"
                                onClick={() => onMaterialClick?.(mat.id)}
                            >
                                <div>
                                    <span className="stock-name">{mat.name}</span>
                                    <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                                        {TYPE_LABELS[mat.type] || mat.type} · {LABEL_DISPLAY[mat.lable] || mat.lable}
                                    </div>
                                </div>
                                <div className="stock-values">
                                    <span className="stock-current">Available: {Number(mat.available).toFixed(1)}</span>
                                    <span className="stock-threshold">Min: {mat.min_threshold}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
