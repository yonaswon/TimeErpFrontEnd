import React, { useState } from 'react';
import { X, Layers, Warehouse, Download, ChevronLeft, ChevronRight, Activity, Calendar, Package } from 'lucide-react';
import './AdminDashBoard.css';

interface Props {
    piece: any;
    materialName: string;
    onClose: () => void;
}

export default function ArealPieceDetailOverlay({ piece, materialName, onClose }: Props) {
    const isOpen = !!piece;
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const formatDate = (d: string | null) => {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    const estimatedArea = (piece.width * piece.height) / 10000;
    const files = piece.cutting_files || [];

    return (
        <>
            <div className={`admin-overlay-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} style={{ zIndex: 300 }} />
            <div className={`admin-center-modal ${isOpen ? 'open' : ''}`}>
                <div className="admin-overlay-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--admin-border)' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                            <h2 style={{ margin: 0, fontSize: 20 }}>{materialName}-{piece.code || piece.id}</h2>
                            <span className="admin-status-badge" style={{
                                background: piece.finished ? '#10b981' : piece.started ? '#f59e0b' : 'var(--admin-primary)',
                                color: '#fff', fontSize: 12, padding: '4px 10px'
                            }}>
                                {piece.finished ? 'Completed' : piece.started ? 'Started' : 'Available'}
                            </span>
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>{materialName}</span>
                    </div>
                    <button className="admin-overlay-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="admin-overlay-body" style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24, overflowY: 'auto' }}>

                    {/* Top Stats Bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                        <div style={{ padding: 16, background: 'var(--admin-surface)', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--admin-text-muted)', marginBottom: 8, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                                <Warehouse size={14} /> Location
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text)' }}>{piece.inventory}</div>
                        </div>
                        <div style={{ padding: 16, background: 'var(--admin-surface)', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--admin-text-muted)', marginBottom: 8, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                                <Layers size={14} /> Dimensions
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text)' }}>{piece.width} × {piece.height}</div>
                        </div>
                        <div style={{ padding: 16, background: 'var(--admin-surface)', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--admin-text-muted)', marginBottom: 8, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                                <Activity size={14} /> Est. Area
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text)' }}>{estimatedArea.toFixed(2)} m²</div>
                        </div>
                        <div style={{ padding: 16, background: 'var(--admin-surface)', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--admin-text-muted)', marginBottom: 8, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                                <Activity size={14} /> Total Cuts
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text)' }}>{files.length} operations</div>
                        </div>
                    </div>

                    {/* Timeline History */}
                    <div>
                        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Cutting History</h3>
                        {files.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
                                {/* Vertical connection line */}
                                <div style={{ position: 'absolute', left: 24, top: 40, bottom: 40, width: 2, background: 'var(--admin-border)', zIndex: 0 }} />

                                {files.map((cf: any, index: number) => (
                                    <div key={cf.id} style={{ display: 'flex', gap: 20, position: 'relative', zIndex: 1 }}>
                                        {/* Timeline Dot & Date */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 50, flexShrink: 0 }}>
                                            <div style={{
                                                width: 16, height: 16, borderRadius: '50%',
                                                background: index === 0 ? 'var(--admin-primary)' : 'var(--admin-bg)',
                                                border: `3px solid ${index === 0 ? 'var(--admin-primary-light)' : 'var(--admin-border)'}`,
                                                marginBottom: 8, marginTop: 4
                                            }} />
                                            <div style={{ fontSize: 10, color: 'var(--admin-text-muted)', textAlign: 'center', fontWeight: 600 }}>
                                                {new Date(cf.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </div>
                                        </div>

                                        {/* Content Card */}
                                        <div style={{
                                            flex: 1, background: index === 0 ? 'var(--admin-surface)' : 'var(--admin-bg)',
                                            borderRadius: 12, padding: 20, border: `1px solid ${index === 0 ? 'var(--admin-primary)' : 'var(--admin-border)'}`,
                                            boxShadow: index === 0 ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                                            display: 'flex', gap: 24, alignItems: 'stretch'
                                        }}>
                                            {/* Image Thumbnail */}
                                            <div
                                                style={{
                                                    width: 180, height: 180, borderRadius: 8, background: 'var(--admin-bg)',
                                                    border: '1px solid var(--admin-border)', overflow: 'hidden', flexShrink: 0,
                                                    cursor: cf.image ? 'zoom-in' : 'default',
                                                    position: 'relative'
                                                }}
                                                onClick={() => cf.image && setSelectedImage(cf.image)}
                                            >
                                                {cf.image ? (
                                                    <>
                                                        <img src={cf.image} alt="Cut preview" style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.3s ease' }}
                                                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                                        />
                                                        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>Click to Enlarge</div>
                                                    </>
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--admin-text-muted)' }}>
                                                        <Activity size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
                                                        <span style={{ fontSize: 12 }}>No Image Provide</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Cut Details */}
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                                                    <div>
                                                        <div style={{ fontSize: 18, fontWeight: 800, color: index === 0 ? 'var(--admin-primary)' : 'var(--admin-text)', marginBottom: 4 }}>
                                                            {cf.status}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <Calendar size={12} /> {formatDate(cf.date)}
                                                        </div>
                                                    </div>
                                                    {cf.crv3d && (
                                                        <a href={cf.crv3d} download target="_blank" rel="noopener noreferrer" className={index === 0 ? "admin-button-primary" : "admin-button-secondary"} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>
                                                            <Download size={16} /> Download CRV3D
                                                        </a>
                                                    )}
                                                </div>

                                                <div style={{ marginTop: 'auto' }}>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <Package size={14} /> Orders Fulfilled
                                                    </div>
                                                    {cf.orders?.length > 0 ? (
                                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                            {cf.orders.map((ord: string) => (
                                                                <span key={ord} style={{
                                                                    fontSize: 13, background: index === 0 ? 'var(--admin-primary-light)' : 'var(--admin-bg)',
                                                                    color: index === 0 ? 'var(--admin-primary)' : 'var(--admin-text)',
                                                                    padding: '4px 12px', borderRadius: 20, fontWeight: 700,
                                                                    border: `1px solid ${index === 0 ? 'rgba(37,99,235,0.2)' : 'var(--admin-border)'}`
                                                                }}>
                                                                    {ord}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', fontStyle: 'italic', padding: '8px 12px', background: 'var(--admin-bg)', borderRadius: 8, border: '1px dashed var(--admin-border)', display: 'inline-block' }}>
                                                            No specific orders assigned
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: 40, textAlign: 'center', background: 'var(--admin-surface)', borderRadius: 12, border: '1px dashed var(--admin-border)' }}>
                                <Activity size={32} color="var(--admin-text-muted)" style={{ marginBottom: 16 }} />
                                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text)', marginBottom: 4 }}>No Cutting History</div>
                                <div style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>This piece has not been processed yet.</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Full Screen Image Zoom Overlay */}
            {selectedImage && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 40
                }} onClick={() => setSelectedImage(null)}>
                    <button style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 8 }}>
                        <X size={32} />
                    </button>
                    <img src={selectedImage} alt="Zoomed cut view" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                </div>
            )}
        </>
    );
}
