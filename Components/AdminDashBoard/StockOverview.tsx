'use client';
import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Layers, Archive, Search } from 'lucide-react';
import { DashboardData } from './types';
import api from '../../api';

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

const TYPE_COLORS: Record<string, string> = {
    L: '#3b82f6', A: '#8b5cf6', P: '#10b981'
};

export default function StockOverview({ data, onMaterialClick }: Props) {
    const { stock } = data;
    const [materials, setMaterials] = useState<any[]>([]);
    const [matLoading, setMatLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            const res = await api.get('/materials/?ordering=name');
            setMaterials(res.data?.results || res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setMatLoading(false);
        }
    };

    const filtered = materials.filter((m: any) => {
        const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === 'ALL' || m.type === typeFilter;
        return matchSearch && matchType;
    });

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

            {/* All Materials List */}
            <div className="admin-section-card" style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                    <h3 style={{ margin: 0 }}><Package /> All Materials</h3>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'var(--admin-bg)', border: '1px solid var(--admin-border)',
                            borderRadius: 8, padding: '6px 12px', minWidth: 180,
                        }}>
                            <Search size={14} color="var(--admin-text-muted)" />
                            <input
                                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search materials..."
                                style={{
                                    border: 'none', outline: 'none', background: 'transparent', fontSize: 13,
                                    color: 'var(--admin-text)', width: '100%',
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {['ALL', 'L', 'A', 'P'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTypeFilter(t)}
                                    style={{
                                        padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6,
                                        border: `1px solid ${typeFilter === t ? 'var(--admin-primary)' : 'var(--admin-border)'}`,
                                        background: typeFilter === t ? 'var(--admin-primary)' : 'transparent',
                                        color: typeFilter === t ? '#fff' : 'var(--admin-text-secondary)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {t === 'ALL' ? 'All' : TYPE_LABELS[t]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                {matLoading ? (
                    <div className="admin-loading"><div className="admin-spinner" /> Loading materials...</div>
                ) : (
                    <>
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 8 }}>
                            Showing {filtered.length} of {materials.length} materials
                        </div>
                        {filtered.map((mat: any) => {
                            const isLow = Number(mat.available) < Number(mat.min_threshold);
                            return (
                                <div
                                    key={mat.id}
                                    onClick={() => onMaterialClick(mat.id)}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '10px 12px', background: 'var(--admin-bg)', borderRadius: 8,
                                        marginBottom: 6, border: `1px solid ${isLow ? 'rgba(239,68,68,0.3)' : 'var(--admin-border)'}`,
                                        cursor: 'pointer', transition: 'border-color 0.2s',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--admin-primary)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = isLow ? 'rgba(239,68,68,0.3)' : 'var(--admin-border)')}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--admin-text)' }}>{mat.name}</span>
                                            {isLow && <AlertTriangle size={12} color="#dc2626" />}
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <span style={{
                                                fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8,
                                                background: `${TYPE_COLORS[mat.type] || '#999'}20`, color: TYPE_COLORS[mat.type] || '#999',
                                            }}>{TYPE_LABELS[mat.type] || mat.type}</span>
                                            <span style={{
                                                fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8,
                                                background: 'var(--admin-border)', color: 'var(--admin-text-muted)',
                                            }}>{LABEL_DISPLAY[mat.lable] || mat.lable}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: 15, color: isLow ? '#dc2626' : 'var(--admin-text)' }}>
                                                {Number(mat.available).toFixed(1)}
                                            </div>
                                            <div style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>
                                                min: {mat.min_threshold}
                                            </div>
                                        </div>
                                        {mat.type === 'A' && (
                                            <button className="admin-button-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={(e) => { e.stopPropagation(); onMaterialClick(mat.id); }}>
                                                Show Detail
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {filtered.length === 0 && (
                            <div style={{ padding: 24, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>
                                No materials match your filters
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

