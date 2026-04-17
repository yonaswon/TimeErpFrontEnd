"use client";
import React, { useState, useEffect } from "react";
import api, { base_url } from "@/api";
import { ChevronRight, ChevronLeft, ArrowLeft, Layers, Download, Image as ImageIcon, Activity, Package, LayoutList, LayoutGrid, RefreshCw, BarChart3, Shapes } from "lucide-react";
import "./ArealTimelineContent.css";

// Assuming types based on existing components
interface Material {
    id: number;
    name: string;
    type: string;
    available: number | string;
}

interface Piece {
    id: number;
    code: string;
    width: number;
    height: number;
    started: boolean;
    finished: boolean;
    inventory: string;
    cutting_files: CuttingFile[];
}

interface OrderAnalysis {
    order_code: number;
    accuracy: number | null;
    shape_similarity: number | null;
    usage: number | null;
    dxf_width: number | null;
    dxf_height: number | null;
    detected_width: number | null;
    detected_height: number | null;
    dxf_actual_area: number | null;
    detected_actual_area: number | null;
    area_delta: number | null;
    dxf_preview: string | null;
    status: string;
    sheet_count: number;
    other_sheets: number[];
    coverage_percent?: number;
    // DXF verification
    dxf_verification_status?: 'PENDING' | 'MATCHED' | 'UNMATCHED' | 'ERROR';
    dxf_verification_score?: number | null;
    coverage_percent_dxf?: number | null;
    matched_parts_count?: number | null;
    total_parts_count?: number | null;
    analysis_notes?: string | null;
}

interface CuttingFile {
    id: number;
    status: string;
    date: string;
    image: string | null;
    line_image: string | null;
    crv3d: string | null;
    orders: string[];
    analysis_status?: string;
    total_usage?: number | null;
    order_analyses?: OrderAnalysis[];
    history_integrity_status?: 'PENDING' | 'MATCHED' | 'MISMATCHED' | 'N/A' | null;
    history_integrity_score?: string | number | null;
    selected_layers?: string[] | null;
    // History area details
    history_area_m2?: number | null;
    history_current_area_m2?: number | null;
    history_diff_m2?: number | null;
    history_note?: string | null;
    prev_total_cut_area_m2?: number | null;
    prev_utilization_pct?: number | null;
}

interface MaterialDetail {
    name: string;
    stats: {
        available: number;
        code_name: string;
        width?: number;
        height?: number;
    };
    areal_pieces: Piece[];
}

type ViewLevel = "MATERIALS" | "PIECES" | "TIMELINE";

export default function ArealTimelineContent() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);

    // Navigation State
    const [level, setLevel] = useState<ViewLevel>("MATERIALS");

    const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
    const [materialDetail, setMaterialDetail] = useState<MaterialDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
    const [showColorsMap, setShowColorsMap] = useState<Record<number, boolean>>({});

    // View Modes & Refs
    const [piecesViewMode, setPiecesViewMode] = useState<"LIST" | "GRID">("LIST");
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const [expandedAnalysis, setExpandedAnalysis] = useState<Record<string, boolean>>({});
    const [activeCardTab, setActiveCardTab] = useState<Record<number, 'info' | 'dxf'>>({});

    const toggleAnalysis = (key: string) => {
        setExpandedAnalysis(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const getCardTab = (cutId: number): 'info' | 'dxf' => activeCardTab[cutId] || 'info';
    const setCardTab = (cutId: number, tab: 'info' | 'dxf') => setActiveCardTab(prev => ({ ...prev, [cutId]: tab }));

    const scrollTimeline = (direction: 'left' | 'right') => {
        if (scrollAreaRef.current) {
            const amount = direction === 'left' ? -350 : 350;
            scrollAreaRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    // Get material dimensions (always from material, never piece)
    const matWidth = materialDetail?.stats?.width || 0;
    const matHeight = materialDetail?.stats?.height || 0;
    const matArea = (matWidth * matHeight).toFixed(2);

    // Fetch materials on mount
    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                setLoading(true);
                // Only fetch Areal type materials
                const res = await api.get("/materials/?type=A");
                setMaterials(res.data?.results || res.data || []);
            } catch (err) {
                console.error("Failed to fetch materials", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMaterials();
    }, []);

    // Fetch material details when a material is selected
    useEffect(() => {
        if (!selectedMaterialId) return;

        const fetchDetails = async () => {
            try {
                setDetailLoading(true);
                const res = await api.get(`/api/admin/material-details/${selectedMaterialId}/`);
                setMaterialDetail(res.data);
            } catch (err) {
                console.error("Failed to fetch material details", err);
            } finally {
                setDetailLoading(false);
            }
        };
        fetchDetails();
    }, [selectedMaterialId]);

    const formatDate = (d: string | null) => {
        if (!d) return "-";
        return new Date(d).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const resolveMediaUrl = (url: string | null | undefined) => {
        if (!url) return undefined;
        if (url.startsWith("http")) return url;
        const cleanBase = base_url.replace(/\/$/, "");
        const cleanUrl = url.replace(/^\//, "");
        return `${cleanBase}/${cleanUrl}`;
    };

    const calculateArea = (w: number, h: number) => ((w * h) / 10000).toFixed(2);

    // Group pieces for Level 2
    const { availableCount, activePieces } = React.useMemo(() => {
        if (!materialDetail || !materialDetail.areal_pieces) {
            return { availableCount: 0, activePieces: [] as Piece[] };
        }
        const pieces = materialDetail.areal_pieces;

        // Available full sheets: not started, not finished
        const available = pieces.filter(p => !p.started && !p.finished);

        // Active/Finished sheets
        const active = pieces.filter((p) => p.started || p.finished || (p.cutting_files && p.cutting_files.length > 0));

        // Sort active: Started first, finished later.
        active.sort((a, b) => {
            if (a.started && !a.finished && b.finished) return -1;
            if (a.finished && b.started && !b.finished) return 1;
            return 0;
        });

        return { availableCount: available.length, activePieces: active };
    }, [materialDetail]);


    // Navigation Handlers
    const goBackToMaterials = () => {
        setLevel("MATERIALS");
        setTimeout(() => {
            setSelectedMaterialId(null);
            setMaterialDetail(null);
        }, 300); // Wait for transition
    };

    const goBackToPieces = () => {
        setLevel("PIECES");
        setTimeout(() => {
            setSelectedPiece(null);
        }, 300); // Wait for transition
    };

    return (
        <div className="areal-timeline-container">

            {/* -------------------------------------------------------------
          LEVEL 1: Materials List
          Always rendered at the back, sliding out of view smoothly
         ------------------------------------------------------------- */}
            <div className={`areal-level-view areal-level-1 ${level !== "MATERIALS" ? "dimmed-background" : ""}`}>
                <div className="areal-list-header px-4 pt-4 mb-4">
                    <h2 className="areal-list-title">Areal Processing</h2>
                    <p className="areal-list-subtitle">Select a material to view inventory and cuts</p>
                </div>

                {loading ? (
                    <div className="flex justify-center flex-col gap-4 py-8 px-4">
                        {/* Skeleton Loaders */}
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="animate-pulse bg-gray-200 dark:bg-zinc-800 h-20 rounded-xl w-full"></div>
                        ))}
                    </div>
                ) : (
                    <div className="areal-list-view">
                        {materials.map((mat) => (
                            <div
                                key={mat.id}
                                className="areal-material-item"
                                onClick={() => {
                                    setSelectedMaterialId(mat.id);
                                    setLevel("PIECES");
                                }}
                            >
                                <div className="areal-material-info">
                                    <h3>{mat.name}</h3>
                                    <div className="areal-material-meta">
                                        <span className="areal-material-badge">Available Total: {Number(mat.available).toFixed(1)}</span>
                                    </div>
                                </div>
                                <ChevronRight className="text-gray-400" size={20} />
                            </div>
                        ))}
                        {materials.length === 0 && (
                            <div className="text-center py-12 text-gray-500 text-sm">No areal materials found.</div>
                        )}
                    </div>
                )}
            </div>

            {/* -------------------------------------------------------------
          LEVEL 2: Pieces List for Selected Material
         ------------------------------------------------------------- */}
            <div className={`areal-level-view areal-level-2 ${level === "MATERIALS" ? "hidden-right" : level === "TIMELINE" ? "dimmed-background" : "active-view"}`}>
                <div className="areal-detail-header">
                    <button className="areal-back-btn" onClick={goBackToMaterials}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className="areal-detail-title-group">
                        <h2 className="areal-detail-title">
                            {detailLoading ? "Loading..." : materialDetail?.name || "Material Details"}
                        </h2>
                        {!detailLoading && materialDetail && (
                            <div className="areal-detail-available">
                                Total Stock Available: {Math.round(materialDetail.stats.available)}
                            </div>
                        )}
                    </div>
                </div>

                {detailLoading ? (
                    <div className="flex justify-center flex-col gap-4 py-8 px-4">
                        {[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-gray-200 dark:bg-zinc-800 h-24 rounded-xl w-full"></div>)}
                    </div>
                ) : materialDetail ? (
                    <div className="areal-list-view">
                        {/* Top Metric: Available Full Sheets */}
                        <div className="areal-full-sheets-metric">
                            <div className="metric-text">
                                <h3>Available Full Sheets</h3>
                                <p>Clean sheets with no cutting files yet</p>
                            </div>
                            <div className="metric-value">{availableCount}</div>
                        </div>

                        <div className="flex items-center justify-between mb-3 mx-1">
                            <h4 className="areal-section-heading mb-0">Active & Completed Pieces ({activePieces.length})</h4>
                            <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
                                <button
                                    onClick={() => setPiecesViewMode("LIST")}
                                    className={`p-1.5 rounded-md transition-all ${piecesViewMode === "LIST" ? "bg-white dark:bg-zinc-700 shadow-sm text-blue-600" : "text-gray-500"}`}
                                >
                                    <LayoutList size={16} />
                                </button>
                                <button
                                    onClick={() => setPiecesViewMode("GRID")}
                                    className={`p-1.5 rounded-md transition-all ${piecesViewMode === "GRID" ? "bg-white dark:bg-zinc-700 shadow-sm text-blue-600" : "text-gray-500"}`}
                                >
                                    <LayoutGrid size={16} />
                                </button>
                            </div>
                        </div>

                        <div className={`areal-pieces-grid ${piecesViewMode === "GRID" ? "areal-pieces-grid-mode" : ""}`}>
                            {activePieces.map(piece => {
                                const latestCut = piece.cutting_files?.[0];
                                const codeStr = `${materialDetail.stats.code_name}-${piece.code || piece.id}`;

                                if (piecesViewMode === "GRID") {
                                    // GRID / DETAILED CARD VIEW
                                    return (
                                        <div
                                            key={piece.id}
                                            className="areal-piece-grid-item"
                                            onClick={() => {
                                                setSelectedPiece(piece);
                                                setLevel("TIMELINE");
                                            }}
                                        >
                                            <div className={`piece-grid-thumbnail flex flex-col gap-1 ${latestCut?.line_image ? 'h-auto' : ''}`}>
                                                {latestCut?.image ? (
                                                    <div className="flex w-full gap-1">
                                                        <img src={resolveMediaUrl(latestCut.image)} alt="Latest Cut" className="flex-1 object-cover" />
                                                        {latestCut?.line_image && (
                                                            <img src={resolveMediaUrl(latestCut.line_image)} alt="Line Cut" className="flex-1 object-cover" />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="thumbnail-placeholder"><ImageIcon size={24} style={{ opacity: 0.5 }} /></div>
                                                )}
                                            </div>
                                            <div className="piece-grid-info">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="piece-code">{codeStr}</span>
                                                    <span className={`areal-piece-status inline ${piece.finished ? "completed" : piece.started ? "started" : "available"}`}>
                                                        {piece.finished ? "Finished" : piece.started ? "Started" : "New"}
                                                    </span>
                                                </div>
                                                <div className="piece-dims">
                                                    {piece.width} × {piece.height} • {calculateArea(piece.width, piece.height)} m²
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                // STANDARD LIST VIEW
                                return (
                                    <div
                                        key={piece.id}
                                        className="areal-piece-list-item"
                                        onClick={() => {
                                            setSelectedPiece(piece);
                                            setLevel("TIMELINE");
                                        }}
                                    >
                                        <div className="piece-list-info">
                                            <div className="piece-code-header">
                                                <span className="piece-code">{codeStr}</span>
                                                <span className={`areal-piece-status inline ${piece.finished ? "completed" : piece.started ? "started" : "available"}`}>
                                                    {piece.finished ? "Finished" : piece.started ? "Started" : "New"}
                                                </span>
                                            </div>
                                            <div className="piece-dims">
                                                <span>{piece.width} × {piece.height}</span>
                                                <span> • {calculateArea(piece.width, piece.height)} m²</span>
                                            </div>
                                            {latestCut && (
                                                <div className="piece-latest-status text-xs text-gray-500 mt-1 dark:text-gray-400">
                                                    Recent: {latestCut.status} ({formatDate(latestCut.date)})
                                                </div>
                                            )}
                                        </div>

                                        <div className={`piece-list-thumbnail flex gap-1 ${latestCut?.line_image ? 'w-[100px]' : ''}`}>
                                            {latestCut?.image ? (
                                                <div className="flex w-full gap-1">
                                                    <img src={resolveMediaUrl(latestCut.image)} alt="Latest Cut" className="flex-1 object-cover" />
                                                    {latestCut?.line_image && (
                                                        <img src={resolveMediaUrl(latestCut.line_image)} alt="Line Cut" className="flex-1 object-cover" />
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="thumbnail-placeholder"><ImageIcon size={16} style={{ opacity: 0.5 }} /></div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {activePieces.length === 0 && (
                                <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 mx-4">
                                    <Layers size={32} className="mb-2 text-gray-300 dark:text-gray-600" />
                                    <p className="text-sm">No active or completed pieces.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>

            {/* -------------------------------------------------------------
          LEVEL 3: Detailed Timeline for a Specific Piece (VERTICAL SCROLL)
         ------------------------------------------------------------- */}
            <div className={`areal-level-view areal-level-3 ${level === "TIMELINE" ? "active-view" : "hidden-right"}`}>
                <div className="areal-detail-header">
                    <button className="areal-back-btn" onClick={goBackToPieces}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className="areal-detail-title-group">
                        <h2 className="areal-detail-title">
                            {materialDetail?.stats.code_name}-{selectedPiece?.code || selectedPiece?.id}
                        </h2>
                        <div className="areal-detail-available">
                            {matWidth} × {matHeight} • {matArea} m²
                        </div>
                    </div>
                    {selectedPiece && (
                        <span className={`areal-piece-status inline shrink-0 ml-2 ${selectedPiece.finished ? "completed" : selectedPiece.started ? "started" : "available"}`}>
                            {selectedPiece.finished ? "Finished" : selectedPiece.started ? "Started" : "New"}
                        </span>
                    )}
                </div>

                {selectedPiece && selectedPiece.cutting_files && selectedPiece.cutting_files.length > 0 ? (
                    <>
                        <div className="areal-timeline-scroll-area" ref={scrollAreaRef}>
                            {selectedPiece.cutting_files.map((cut, index) => {
                                const isLatest = index === 0;
                                return (
                                    <div key={cut.id} className="areal-piece-column">
                                        {/* Timeline Card */}
                                        <div className={`timeline-card ${isLatest ? 'timeline-card-latest' : ''}`}>
                                            {/* ─── IMAGE SECTION ─── */}
                                            <div className="timeline-image-section">
                                                {/* Floating Status Pills */}
                                                <div className="timeline-floating-header">
                                                    <div className="timeline-floating-badges">
                                                        {isLatest && (
                                                            <div className="timeline-glass-pill latest-pill">LATEST</div>
                                                        )}
                                                        <div className={`timeline-glass-pill status-${cut.status.toLowerCase()}`}>
                                                            {cut.status}
                                                        </div>
                                                    </div>
                                                    <div className="timeline-glass-pill date-pill">
                                                        {formatDate(cut.date)}
                                                    </div>
                                                </div>

                                                {/* Image */}
                                                {cut.line_image || cut.image ? (
                                                    <>
                                                        <img
                                                            src={resolveMediaUrl(showColorsMap[cut.id] ? (cut.image || cut.line_image) : (cut.line_image || cut.image))}
                                                            alt={`Cut ${cut.status}`}
                                                            className="timeline-sheet-image"
                                                            onClick={() => window.open(resolveMediaUrl(showColorsMap[cut.id] ? (cut.image || cut.line_image) : (cut.line_image || cut.image)), "_blank")}
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                const placeholder = target.nextElementSibling as HTMLElement;
                                                                if (placeholder) placeholder.style.display = 'flex';
                                                            }}
                                                        />
                                                        <div className="timeline-image-fallback" style={{ display: 'none' }}>
                                                            <ImageIcon size={28} style={{ opacity: 0.4 }} />
                                                            <span>Image unavailable</span>
                                                        </div>
                                                        {cut.line_image && cut.image && (
                                                            <button
                                                                className="timeline-image-toggle"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setShowColorsMap(prev => ({...prev, [cut.id]: !prev[cut.id]}));
                                                                }}
                                                            >
                                                                <ImageIcon size={13} />
                                                                {showColorsMap[cut.id] ? "Line Drawing" : "Colored"}
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="timeline-image-fallback">
                                                        <ImageIcon size={28} style={{ opacity: 0.4 }} />
                                                        <span>No image</span>
                                                    </div>
                                                )}

                                                {/* Download CRV3D */}
                                                {cut.crv3d && (
                                                    <button
                                                        className="areal-download-btn"
                                                        title="Download CRV3D"
                                                        onClick={(e) => { e.stopPropagation(); window.open(resolveMediaUrl(cut.crv3d), '_blank'); }}
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                )}

                                                {/* ─── Stats Overlay Bar (embedded in image footer) ─── */}
                                                {cut.total_usage != null && matWidth > 0 && matHeight > 0 && (
                                                    <div className="timeline-stats-overlay">
                                                        <div className="stats-overlay-bar">
                                                            <div className="stats-overlay-fill" style={{ width: `${Math.min(cut.total_usage, 100)}%` }} />
                                                        </div>
                                                        <div className="stats-overlay-values">
                                                            <span>{matArea} m² total</span>
                                                            <span className="stats-overlay-accent">{cut.total_usage}% used</span>
                                                            <span>Rem: {(parseFloat(matArea) * ((100 - cut.total_usage) / 100)).toFixed(2)} m²</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* ─── TAB BAR ─── */}
                                            <div className="timeline-tab-bar">
                                                <button
                                                    className={`timeline-tab ${getCardTab(cut.id) === 'info' ? 'timeline-tab-active' : ''}`}
                                                    onClick={() => setCardTab(cut.id, 'info')}
                                                >
                                                    Info
                                                </button>
                                                <button
                                                    className={`timeline-tab ${getCardTab(cut.id) === 'dxf' ? 'timeline-tab-active' : ''}`}
                                                    onClick={() => setCardTab(cut.id, 'dxf')}
                                                >
                                                    DXF{' '}
                                                    {cut.order_analyses && cut.order_analyses.length > 0 && (() => {
                                                        const allMatched = cut.order_analyses.every(oa => oa.dxf_verification_status === 'MATCHED');
                                                        return <span className={`tab-status-dot ${allMatched ? 'tab-dot-ok' : 'tab-dot-warn'}`}>{allMatched ? '✅' : '⚠️'}</span>;
                                                    })()}
                                                </button>
                                            </div>

                                            {/* ─── TAB PANEL: INFO ─── */}
                                            {getCardTab(cut.id) === 'info' && (
                                                <div className="timeline-tab-panel">
                                                    {/* History Badge */}
                                                    {cut.history_note === 'First cut on this sheet' ? (
                                                        <div className="timeline-compact-badge timeline-badge-info">
                                                            🆕 First Cut
                                                        </div>
                                                    ) : cut.history_note === 'History DXF not available' ? (
                                                        <div className="timeline-compact-badge timeline-badge-warn">
                                                            ⚠️ No Prev DXF
                                                        </div>
                                                    ) : cut.history_integrity_status && cut.history_integrity_status !== 'N/A' && cut.history_integrity_status !== 'PENDING' ? (
                                                        <div className={`timeline-compact-badge ${cut.history_integrity_status === 'MATCHED' ? 'timeline-badge-success' : 'timeline-badge-error'}`}>
                                                            {cut.history_integrity_status === 'MATCHED' ? '✅' : '⚠️'}
                                                            <span>Hist: {cut.history_integrity_score ? `${parseFloat(String(cut.history_integrity_score)).toFixed(1)}%` : '—'}</span>
                                                        </div>
                                                    ) : null}

                                                    {/* Orders */}
                                                    {cut.orders && cut.orders.length > 0 && (
                                                        <div className="timeline-compact-orders">
                                                            <Package size={12} style={{ color: 'var(--admin-text-secondary)' }} />
                                                            <div className="timeline-compact-orders-list">
                                                                {cut.orders.map((o, idx) => (
                                                                    <span key={o}>
                                                                        {o.startsWith('ORD-') ? o : `ORD-${o}`}
                                                                        {idx < cut.orders!.length - 1 ? ', ' : ''}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Reanalyze */}
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                await api.post(`/api/cuttingfiles/${cut.id}/reanalyze/`);
                                                                alert('Reanalysis triggered! Refresh in a few seconds.');
                                                            } catch (err) {
                                                                console.error('Reanalyze failed:', err);
                                                                alert('Reanalysis failed.');
                                                            }
                                                        }}
                                                        disabled={cut.status === "STARTED"}
                                                        className="reanalyze-drawer-btn"
                                                    >
                                                        <RefreshCw size={14} />
                                                        Reanalyze Current Usage
                                                    </button>
                                                </div>
                                            )}

                                            {/* ─── TAB PANEL: DXF ─── */}
                                            {getCardTab(cut.id) === 'dxf' && (
                                                <div className="timeline-tab-panel">
                                                    {cut.order_analyses && cut.order_analyses.length > 0 ? (
                                                        <div className="timeline-verification-section">
                                                            {cut.order_analyses.map((oa) => {
                                                                const vStatus = oa.dxf_verification_status;
                                                                const covDxf = oa.coverage_percent_dxf;
                                                                const mParts = oa.matched_parts_count;
                                                                const tParts = oa.total_parts_count;
                                                                const orderArea = oa.dxf_actual_area;
                                                                const sheetArea = oa.detected_actual_area;
                                                                const areaDiff = orderArea != null && sheetArea != null ? Math.abs(sheetArea - orderArea) : null;
                                                                const areaMatchPct = orderArea != null && sheetArea != null && orderArea > 0
                                                                    ? Math.min((sheetArea / orderArea) * 100, 100) : null;
                                                                const analysisKey = `${cut.id}-${oa.order_code}`;
                                                                const isExpanded = expandedAnalysis[analysisKey];

                                                                return (
                                                                    <div key={oa.order_code} className="timeline-analysis-card">
                                                                        <div
                                                                            className="timeline-analysis-header"
                                                                            onClick={() => toggleAnalysis(analysisKey)}
                                                                        >
                                                                            <div className="timeline-analysis-left">
                                                                                <span className="timeline-analysis-code">ORD-{oa.order_code}</span>
                                                                                {vStatus && vStatus !== 'PENDING' && (
                                                                                    <span className={`timeline-status-dot ${vStatus === 'MATCHED' ? 'dot-matched' : vStatus === 'UNMATCHED' ? 'dot-unmatched' : 'dot-error'}`}>
                                                                                        {vStatus === 'MATCHED' && covDxf != null && covDxf >= 99 ? '✅' : vStatus === 'MATCHED' ? '🟡' : '❌'}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="timeline-analysis-right">
                                                                                {mParts != null && tParts != null && (
                                                                                    <span className="timeline-parts-badge">{mParts}/{tParts}</span>
                                                                                )}
                                                                                {orderArea != null && (
                                                                                    <span className="timeline-area-compact">{orderArea.toFixed(4)} m²</span>
                                                                                )}
                                                                                <Shapes size={14} style={{ color: 'var(--admin-text-muted)', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                                                                            </div>
                                                                        </div>

                                                                        {covDxf != null && (
                                                                            <div className="timeline-coverage-bar-wrap">
                                                                                <div className="timeline-coverage-track">
                                                                                    <div className="timeline-coverage-fill" style={{
                                                                                        width: `${Math.min(covDxf, 100)}%`,
                                                                                        background: covDxf >= 99 ? '#16a34a' : covDxf >= 50 ? '#d97706' : '#dc2626',
                                                                                    }} />
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {isExpanded && (
                                                                            <div className="timeline-analysis-expanded">
                                                                                {covDxf != null && (
                                                                                    <div className="timeline-detail-row">
                                                                                        <span>Parts Found</span>
                                                                                        <span className="timeline-detail-value" style={{ color: covDxf >= 99 ? '#16a34a' : covDxf >= 50 ? '#d97706' : '#dc2626' }}>
                                                                                            {mParts != null && tParts != null ? `${mParts}/${tParts}` : `${covDxf.toFixed(0)}%`}
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                                {orderArea != null && (
                                                                                    <div className="timeline-detail-row">
                                                                                        <span>Order DXF Area</span>
                                                                                        <span className="timeline-detail-value">{orderArea.toFixed(4)} m²</span>
                                                                                    </div>
                                                                                )}
                                                                                {sheetArea != null && (
                                                                                    <div className="timeline-detail-row">
                                                                                        <span>Found on Sheet</span>
                                                                                        <span className="timeline-detail-value">{sheetArea.toFixed(4)} m²</span>
                                                                                    </div>
                                                                                )}
                                                                                {areaDiff != null && (
                                                                                    <div className="timeline-detail-row">
                                                                                        <span>Difference</span>
                                                                                        <span className="timeline-detail-value" style={{ color: areaDiff < 0.001 ? '#16a34a' : '#d97706' }}>
                                                                                            {areaDiff.toFixed(4)} m²
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                                {areaMatchPct != null && (
                                                                                    <div className="timeline-detail-row">
                                                                                        <span>Area Match</span>
                                                                                        <span className="timeline-detail-value" style={{ color: areaMatchPct >= 95 ? '#16a34a' : areaMatchPct >= 70 ? '#d97706' : '#dc2626' }}>
                                                                                            {areaMatchPct.toFixed(1)}%
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                                {oa.usage != null && (
                                                                                    <div className="timeline-detail-row" style={{ borderTop: '1px dashed var(--admin-border)', paddingTop: 4, marginTop: 2 }}>
                                                                                        <span>Sheet Usage</span>
                                                                                        <span className="timeline-detail-value">{oa.usage.toFixed(1)}%</span>
                                                                                    </div>
                                                                                )}
                                                                                {oa.dxf_preview && (
                                                                                    <div style={{ marginTop: 4 }}>
                                                                                        <img
                                                                                            src={resolveMediaUrl(oa.dxf_preview)}
                                                                                            alt={`DXF ORD-${oa.order_code}`}
                                                                                            style={{
                                                                                                width: 52, height: 52, objectFit: 'contain', borderRadius: 4,
                                                                                                border: '1px solid var(--admin-border)', background: '#111',
                                                                                            }}
                                                                                            onClick={() => window.open(resolveMediaUrl(oa.dxf_preview), '_blank')}
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                                {(vStatus === 'ERROR' || vStatus === 'UNMATCHED') && oa.analysis_notes && (
                                                                                    <div className="timeline-analysis-note" style={{
                                                                                        color: vStatus === 'ERROR' ? '#dc2626' : '#92400e',
                                                                                        background: vStatus === 'ERROR' ? 'rgba(220,38,38,.06)' : 'rgba(217,119,6,.06)',
                                                                                    }}>
                                                                                        {oa.analysis_notes}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div style={{ color: 'var(--admin-text-muted)', fontSize: 12, textAlign: 'center', padding: 16 }}>
                                                            No DXF verification data available.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                    {/* Navigation Arrows for Level 3 */}
                    {selectedPiece.cutting_files.length > 2 && (
                        <div className="areal-timeline-nav">
                            <button className="timeline-nav-arrow" onClick={() => scrollTimeline('left')}>
                                <ChevronLeft size={20} />
                            </button>
                            <button className="timeline-nav-arrow" onClick={() => scrollTimeline('right')}>
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center flex-1 p-8 text-center text-gray-500">
                    <Activity size={48} className="mb-4 text-gray-300 dark:text-gray-700" />
                    <p>No cutting files recorded for this piece yet.</p>
                </div>
            )}
        </div>
    </div>
  );
}
