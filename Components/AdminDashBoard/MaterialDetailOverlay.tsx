'use client';
import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
    X, Package, TrendingUp, TrendingDown, ArrowRightLeft, AlertTriangle,
    Warehouse, ShoppingCart, Layers, Check, XCircle, ChevronRight, Download
} from 'lucide-react';
import ArealPieceDetailOverlay from './ArealPieceDetailOverlay';

interface Props {
    materialId: number | null;
    onClose: () => void;
}

const STATUS_COLOR: Record<string, string> = {
    P: '#f59e0b', D: '#3b82f6', C: '#10b981',
};

export default function MaterialDetailOverlay({ materialId, onClose }: Props) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedPiece, setSelectedPiece] = useState<any>(null);
    const isOpen = !!materialId;

    useEffect(() => {
        if (materialId) {
            setActiveTab('overview');
            fetchDetails();
        }
    }, [materialId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/admin/material-details/${materialId}/`);
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d: string | null) => {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };
    const formatBirr = (n: number) => `${Math.round(n).toLocaleString()} Birr`;

    if (!isOpen) return null;

    const renderOverviewTab = () => {
        if (!data) return null;
        return (
            <>
                {/* Stats */}
                <div className="admin-section-card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 18 }}>{data.name}</h3>
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <span className="admin-status-badge">{data.type}</span>
                                {data.label && <span className="admin-status-badge" style={{ background: 'var(--admin-primary-light)', color: 'var(--admin-primary)' }}>{data.label}</span>}
                                {data.stats.code_name && <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>Code: {data.stats.code_name}</span>}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--admin-text)' }}>
                                {Math.round(data.stats.available).toLocaleString()}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>Available</div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        <KpiMini label="Reserved" value={Math.round(data.stats.reserved).toLocaleString()} color="var(--admin-primary)" />
                        <KpiMini label="Min Threshold" value={data.stats.min_threshold} color="var(--admin-warning)" />
                        {(data.stats.width > 0 || data.stats.height > 0) && (
                            <KpiMini label="Dimensions" value={`${data.stats.width} x ${data.stats.height}`} color="var(--admin-text-secondary)" />
                        )}
                    </div>
                </div>

                {/* Low Stock Warning */}
                {data.stats.available < data.stats.min_threshold && (
                    <div className="admin-section-card" style={{ borderColor: 'var(--admin-danger)', background: 'rgba(239,68,68,0.05)', padding: 16 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'var(--admin-danger)', fontWeight: 600 }}>
                            <AlertTriangle size={20} />
                            <span>Low Stock Alert! Below minimum threshold.</span>
                        </div>
                    </div>
                )}

                {/* Inventory Distribution */}
                <div className="admin-section-card" style={{ padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)' }}>
                        <Warehouse size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        Inventory Distribution
                    </h4>
                    {data.inventory_distribution?.length > 0 ? (
                        data.inventory_distribution.map((inv: any) => {
                            const maxAmt = Math.max(...data.inventory_distribution.map((i: any) => i.amount), 1);
                            return (
                                <div key={inv.inventory_id} style={{ marginBottom: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                                        <span style={{ fontWeight: 600 }}>{inv.inventory_name}</span>
                                        <span style={{ fontWeight: 700 }}>{Math.round(inv.amount).toLocaleString()}</span>
                                    </div>
                                    <div style={{ height: 6, background: 'var(--admin-border)', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${(inv.amount / maxAmt) * 100}%`, height: '100%',
                                            background: 'var(--admin-primary)', borderRadius: 3,
                                        }} />
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                                        {inv.record_count} record{inv.record_count !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ padding: 12, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No inventory records</div>
                    )}
                </div>

                {/* BOM Usage */}
                {data.bom_usage?.length > 0 && (
                    <div className="admin-section-card" style={{ padding: 16 }}>
                        <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)' }}>
                            <Layers size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                            BOM Usage ({data.bom_usage.length})
                        </h4>
                        {data.bom_usage.slice(0, 10).map((b: any) => (
                            <div key={b.id} style={{
                                padding: '8px 12px', background: 'var(--admin-bg)', borderRadius: 8,
                                marginBottom: 6, border: '1px solid var(--admin-border)', fontSize: 12,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        {b.order_code && <span style={{ fontWeight: 700, color: 'var(--admin-primary)', marginRight: 8 }}>ORD-{b.order_code}</span>}
                                        <span>Qty: {b.amount}</span>
                                        {b.width > 0 && <span style={{ color: 'var(--admin-text-muted)', marginLeft: 6 }}>{b.width}×{b.height}</span>}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {b.released ? (
                                            <span style={{ fontSize: 10, color: 'var(--admin-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><Check size={10} /> Released</span>
                                        ) : (
                                            <span style={{ fontSize: 10, color: 'var(--admin-warning)', fontWeight: 600 }}>Pending</span>
                                        )}
                                        <span style={{ fontWeight: 700 }}>{formatBirr(b.total_price)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    };

    const renderPurchasesTab = () => {
        if (!data) return null;
        return (
            <div className="admin-section-card" style={{ padding: 16 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)' }}>
                    Purchase History ({data.purchases?.length || 0})
                </h4>
                {data.purchases?.length > 0 ? data.purchases.map((p: any) => (
                    <div key={p.id} style={{
                        padding: 12, background: 'var(--admin-bg)', borderRadius: 8,
                        marginBottom: 8, border: '1px solid var(--admin-border)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <ShoppingCart size={14} color="var(--admin-success)" />
                                <span style={{ fontWeight: 700, fontSize: 13 }}>Purchase #{p.id}</span>
                                <span className="admin-status-badge" style={{
                                    fontSize: 9, padding: '2px 6px', height: 'auto',
                                    background: STATUS_COLOR[p.status] || 'var(--admin-border)',
                                    color: '#fff', border: 'none',
                                }}>{p.status_display}</span>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--admin-success)' }}>+{Math.round(p.amount).toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12 }}>
                            <DetailLine label="Cost" value={formatBirr(p.cost)} />
                            <DetailLine label="Inventory" value={p.inventory} />
                            <DetailLine label="Created By" value={p.created_by} />
                            <DetailLine label="Date" value={formatDate(p.date)} />
                            {p.confirmed_by && <DetailLine label="Confirmed" value={p.confirmed_by} />}
                        </div>
                    </div>
                )) : (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No purchase history</div>
                )}
            </div>
        );
    };

    const renderReleasesTab = () => {
        if (!data) return null;
        return (
            <div className="admin-section-card" style={{ padding: 16 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)' }}>
                    Release History ({data.releases?.length || 0})
                </h4>
                {data.releases?.length > 0 ? data.releases.map((r: any) => (
                    <div key={r.id} style={{
                        padding: 12, background: 'var(--admin-bg)', borderRadius: 8,
                        marginBottom: 8, border: '1px solid var(--admin-border)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <TrendingDown size={14} color="#dc2626" />
                                {r.order_code && <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--admin-primary)' }}>ORD-{r.order_code}</span>}
                                <span className="admin-status-badge" style={{
                                    fontSize: 9, padding: '2px 6px', height: 'auto',
                                    background: r.reason === 'ADD' ? '#f59e0b' : r.reason === 'WAST' ? '#dc2626' : 'var(--admin-primary)',
                                    color: '#fff', border: 'none',
                                }}>{r.reason_display}</span>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 14, color: '#dc2626' }}>-{Math.round(r.amount).toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12 }}>
                            <DetailLine label="Inventory" value={r.inventory} />
                            <DetailLine label="Released By" value={r.released_by} />
                            <DetailLine label="Date" value={formatDate(r.date)} />
                            <DetailLine label="Confirmed" value={r.confirmed ? 'Yes' : 'No'} highlight={r.confirmed} />
                        </div>
                    </div>
                )) : (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No release history</div>
                )}
            </div>
        );
    };

    const renderTransfersTab = () => {
        if (!data) return null;
        return (
            <div className="admin-section-card" style={{ padding: 16 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)' }}>
                    Transfer History ({data.transfers?.length || 0})
                </h4>
                {data.transfers?.length > 0 ? data.transfers.map((t: any) => (
                    <div key={t.id} style={{
                        padding: 12, background: 'var(--admin-bg)', borderRadius: 8,
                        marginBottom: 8, border: '1px solid var(--admin-border)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <ArrowRightLeft size={14} color="var(--admin-primary)" />
                                <span style={{ fontWeight: 600, fontSize: 13 }}>{t.type} Transfer</span>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--admin-primary)' }}>{Math.round(t.amount).toLocaleString()}</span>
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            fontSize: 12, padding: '6px 10px', background: 'var(--admin-surface)',
                            borderRadius: 6, marginBottom: 6,
                        }}>
                            <span style={{ fontWeight: 600 }}>{t.from_inventory}</span>
                            <ChevronRight size={14} color="var(--admin-text-muted)" />
                            <span style={{ fontWeight: 600 }}>{t.to_inventory}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12 }}>
                            <DetailLine label="Date" value={formatDate(t.date)} />
                            <DetailLine label="Detail" value={t.detail} />
                        </div>
                    </div>
                )) : (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No transfer history</div>
                )}
            </div>
        );
    };

    const renderPiecesTab = () => {
        if (!data || data.type_code !== 'A') return null;

        const allPieces = data.areal_pieces || [];
        const availablePieces = allPieces.filter((p: any) => !p.started && !p.finished);
        const activePieces = allPieces.filter((p: any) => p.started || p.finished);

        // Sort active pieces: started first, then finished
        activePieces.sort((a: any, b: any) => {
            if (a.started && !a.finished && b.finished) return -1;
            if (a.finished && b.started && !b.finished) return 1;
            return 0;
        });

        return (
            <div className="admin-section-card" style={{ padding: 16 }}>
                <h4 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)' }}>
                    Areal Pieces Overview
                </h4>

                {/* Available Summary */}
                <div style={{
                    padding: 16, background: 'var(--admin-surface)', borderRadius: 12,
                    marginBottom: 24, border: '1px solid var(--admin-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--admin-text)' }}>
                            Available Full Sheets
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                            Clean sheets with no cutting files yet.
                        </div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--admin-primary)' }}>
                        {availablePieces.length}
                    </div>
                </div>

                <h4 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--admin-text-secondary)' }}>
                    Active & Completed Sheets ({activePieces.length})
                </h4>

                {activePieces.length > 0 ? activePieces.map((piece: any) => {
                    const estimatedArea = (piece.width * piece.height) / 10000; // Assuming cm, convert to sqm
                    return (
                        <div key={piece.id} style={{
                            padding: 16, background: 'var(--admin-bg)', borderRadius: 12,
                            marginBottom: 16, border: '1px solid var(--admin-border)',
                        }}>
                            {/* Piece Header - Clickable */}
                            <div
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16, cursor: 'pointer', padding: '8px 12px', margin: '-8px -12px 16px', borderRadius: 8, transition: 'background 0.2s' }}
                                onMouseOver={e => e.currentTarget.style.background = 'var(--admin-surface)'}
                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                onClick={() => setSelectedPiece(piece)}
                            >
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--admin-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {data.stats.code_name}-{piece.code || piece.id}
                                        <ChevronRight size={16} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--admin-text-muted)' }}>
                                        <span><Warehouse size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />{piece.inventory}</span>
                                        <span><Layers size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />{piece.width} × {piece.height}</span>
                                        <span style={{ color: 'var(--admin-text)', fontWeight: 600 }}>Est. Area: {estimatedArea.toFixed(2)} m²</span>
                                    </div>
                                </div>
                                <span className="admin-status-badge" style={{
                                    background: piece.finished ? '#10b981' : '#f59e0b',
                                    color: '#fff', fontSize: 11, padding: '4px 8px'
                                }}>
                                    {piece.finished ? 'Completed' : 'Started'}
                                </span>
                            </div>

                            {/* Cutting Files */}
                            {piece.cutting_files?.length > 0 ? (
                                <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 16 }}>
                                    <h5 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: 'var(--admin-text)' }}>
                                        Latest Cutting File
                                    </h5>

                                    {/* Latest Cutting File Prominently */}
                                    {(() => {
                                        const latest = piece.cutting_files[0];
                                        return (
                                            <div style={{
                                                display: 'flex', gap: 20, alignItems: 'stretch', background: 'var(--admin-surface)',
                                                padding: 16, borderRadius: 12, border: '1px solid var(--admin-border)', marginBottom: 16
                                            }}>
                                                {/* Zoomable Image Container */}
                                                <div
                                                    className="cutting-file-img-container"
                                                    style={{
                                                        width: 140, height: 140, flexShrink: 0,
                                                        borderRadius: 8, overflow: 'hidden',
                                                        border: '1px solid var(--admin-border)',
                                                        background: 'var(--admin-bg)',
                                                        position: 'relative',
                                                        cursor: latest.image ? 'zoom-in' : 'default'
                                                    }}
                                                    onClick={() => {
                                                        if (latest.image) {
                                                            // Simple native full-screen view for the image
                                                            window.open(latest.image, '_blank');
                                                        }
                                                    }}
                                                >
                                                    {latest.image ? (
                                                        <>
                                                            <img src={latest.image} alt="Cutting File" style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.2s' }}
                                                                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                                            />
                                                            <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: 4, padding: '2px 6px', fontSize: 10 }}>Zoom</div>
                                                        </>
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>No Image</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Details */}
                                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'start' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--admin-primary)' }}>{latest.status}</div>
                                                            <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>Date: {formatDate(latest.date)}</div>
                                                        </div>
                                                        {latest.crv3d && (
                                                            <a href={latest.crv3d} download target="_blank" rel="noopener noreferrer" className="admin-button-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 12, height: 'fit-content' }}>
                                                                <Download size={16} /> Download CRV3D
                                                            </a>
                                                        )}
                                                    </div>

                                                    {/* Orders List */}
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>Orders fulfilled from this cut</div>
                                                        {latest.orders?.length > 0 ? (
                                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                                {latest.orders.map((ord: string) => (
                                                                    <span key={ord} style={{
                                                                        fontSize: 12, background: 'var(--admin-primary-light)',
                                                                        color: 'var(--admin-primary)', padding: '4px 10px',
                                                                        borderRadius: 6, fontWeight: 700, border: '1px solid rgba(37,99,235,0.2)'
                                                                    }}>
                                                                        {ord}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>No orders assigned</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Older Cutting Files */}
                                    {piece.cutting_files.length > 1 && (
                                        <div style={{ marginTop: 16 }}>
                                            <h5 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>
                                                Previous Cuts ({piece.cutting_files.length - 1})
                                            </h5>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {piece.cutting_files.slice(1).map((cf: any) => (
                                                    <div key={cf.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '10px 16px', background: 'var(--admin-surface)', borderRadius: 8, border: '1px dashed var(--admin-border)' }}>
                                                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                                            <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{cf.status}</span>
                                                            <span style={{ color: 'var(--admin-text-muted)' }}>{formatDate(cf.date)}</span>
                                                            {cf.orders?.length > 0 && (
                                                                <span style={{ color: 'var(--admin-primary)', fontSize: 11, fontWeight: 700, background: 'var(--admin-primary-light)', padding: '2px 8px', borderRadius: 4 }}>
                                                                    {cf.orders.join(', ')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 12 }}>
                                                            {cf.image && (
                                                                <button onClick={() => window.open(cf.image, '_blank')} style={{ background: 'none', border: 'none', color: 'var(--admin-text)', cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    View Image
                                                                </button>
                                                            )}
                                                            {cf.crv3d && (
                                                                <a href={cf.crv3d} download target="_blank" rel="noopener noreferrer" style={{ color: 'var(--admin-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    <Download size={14} /> crv3d
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ padding: 24, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13, borderTop: '1px solid var(--admin-border)', background: 'var(--admin-surface)', borderRadius: '0 0 12px 12px', margin: '0 -16px -16px' }}>
                                    No cutting files associated with this piece yet.
                                </div>
                            )}
                        </div>
                    );
                }) : (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 14, background: 'var(--admin-bg)', borderRadius: 12, border: '1px dashed var(--admin-border)' }}>
                        No started or completed sheets found.
                    </div>
                )}
            </div>
        );
    };

    const tabs = data?.type_code === 'A'
        ? ['overview', 'pieces', 'purchases', 'releases', 'transfers']
        : ['overview', 'purchases', 'releases', 'transfers'];

    return (
        <>
            <div className={`admin-overlay-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <div className={`admin-overlay ${isOpen ? 'open' : ''}`}>
                <div className="admin-overlay-header">
                    <div>
                        <h2 style={{ marginBottom: 4 }}>Material Details</h2>
                        {data && <span style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>{data.name}</span>}
                    </div>
                    <button className="admin-overlay-close" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="admin-overlay-body" style={{ padding: 0 }}>
                    <div className="admin-tabs" style={{ padding: '0 24px', paddingTop: 12 }}>
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                className={`admin-tab ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab === 'overview' ? 'Overview' : tab === 'pieces' ? 'Pieces & Files' : tab === 'purchases' ? 'Purchases' : tab === 'releases' ? 'Releases' : 'Transfers'}
                            </button>
                        ))}
                    </div>
                    <div style={{ padding: '0 24px 24px' }}>
                        {loading ? (
                            <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>
                        ) : data ? (
                            <>
                                {activeTab === 'overview' && renderOverviewTab()}
                                {activeTab === 'pieces' && renderPiecesTab()}
                                {activeTab === 'purchases' && renderPurchasesTab()}
                                {activeTab === 'releases' && renderReleasesTab()}
                                {activeTab === 'transfers' && renderTransfersTab()}
                            </>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Sub-overlay for specific Piece Details */}
            <ArealPieceDetailOverlay
                piece={selectedPiece}
                materialName={data ? data.name : ''}
                onClose={() => setSelectedPiece(null)}
            />
        </>
    );
}

function KpiMini({ label, value, color }: { label: string; value: string | number; color: string }) {
    return (
        <div style={{ padding: '8px 12px', background: 'var(--admin-surface)', borderRadius: 8, border: '1px solid var(--admin-border)', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--admin-text-muted)', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color }}>{value}</div>
        </div>
    );
}

function DetailLine({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div>
            <span style={{ color: 'var(--admin-text-muted)', fontSize: 11 }}>{label}: </span>
            <span style={{ fontWeight: highlight ? 700 : 500, color: highlight ? 'var(--admin-success)' : 'var(--admin-text)' }}>{value}</span>
        </div>
    );
}
