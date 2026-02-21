"use client";
import React, { useState, useEffect } from "react";
import api, { base_url } from "@/api";
import { ChevronRight, ChevronLeft, ArrowLeft, Layers, Download, Image as ImageIcon, Activity, Package, LayoutList, LayoutGrid } from "lucide-react";
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

interface CuttingFile {
    id: number;
    status: string;
    date: string;
    image: string | null;
    crv3d: string | null;
    orders: string[];
}

interface MaterialDetail {
    name: string;
    stats: {
        available: number;
        code_name: string;
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

    // View Modes & Refs
    const [piecesViewMode, setPiecesViewMode] = useState<"LIST" | "GRID">("LIST");
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);

    const scrollTimeline = (direction: 'left' | 'right') => {
        if (scrollAreaRef.current) {
            const amount = direction === 'left' ? -350 : 350;
            scrollAreaRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

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
                                            <div className="piece-grid-thumbnail">
                                                {latestCut?.image ? (
                                                    <img src={resolveMediaUrl(latestCut.image)} alt="Latest Cut" />
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

                                        <div className="piece-list-thumbnail">
                                            {latestCut?.image ? (
                                                <img src={resolveMediaUrl(latestCut.image)} alt="Latest Cut" />
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
          LEVEL 3: Detailed Timeline for a Specific Piece
         ------------------------------------------------------------- */}
            <div className={`areal-level-view areal-level-3 ${level === "TIMELINE" ? "active-view" : "hidden-right"}`}>
                <div className="areal-detail-header">
                    <button className="areal-back-btn" onClick={goBackToPieces}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className="areal-detail-title-group">
                        <h2 className="areal-detail-title">
                            {materialDetail?.stats.code_name}-{selectedPiece?.code || selectedPiece?.id} Timeline
                        </h2>
                        <div className="areal-detail-available">
                            {selectedPiece?.width} × {selectedPiece?.height} • {selectedPiece && calculateArea(selectedPiece.width, selectedPiece.height)} m²
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
                                // Every cut is its own portrait card now, sliding horizontally.
                                const isLatest = index === 0;
                                return (
                                    <div key={cut.id} className="areal-piece-column">
                                        {isLatest && (
                                            <div className="areal-latest-badge mb-2 text-center text-xs font-bold text-blue-500 uppercase tracking-widest">LATEST CUT</div>
                                        )}
                                        <div className={`areal-cut-card ${isLatest ? 'is-latest outline outline-2 outline-blue-500' : ''}`}>
                                            <div className="areal-cut-image-wrapper">
                                                {cut.image ? (
                                                    <img
                                                        src={resolveMediaUrl(cut.image)}
                                                        alt={`Cut ${cut.status}`}
                                                        className="areal-cut-image"
                                                        onClick={() => window.open(resolveMediaUrl(cut.image), "_blank")}
                                                    />
                                                ) : (
                                                    <div className="areal-cut-placeholder">
                                                        <ImageIcon size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                                                        <span style={{ fontSize: 12 }}>No Image</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="areal-cut-content">
                                                <div className="areal-cut-header">
                                                    <h4 className="areal-cut-status">{cut.status}</h4>
                                                    <span className="areal-cut-date">{formatDate(cut.date)}</span>
                                                </div>

                                                {/* Orders List */}
                                                <div style={{ flex: 1 }}>
                                                    {cut.orders && cut.orders.length > 0 ? (
                                                        <div>
                                                            <div style={{ fontSize: 11, color: 'var(--admin-text-secondary)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>
                                                                <Package size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                                                                Orders
                                                            </div>
                                                            <div className="areal-cut-orders">
                                                                {cut.orders.map(o => (
                                                                    <span key={o} className="areal-order-badge">{o}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--admin-text-muted)', marginTop: 8 }}>No explicit orders.</div>
                                                    )}
                                                </div>

                                                {cut.crv3d && (
                                                    <a href={resolveMediaUrl(cut.crv3d)} download target="_blank" rel="noopener noreferrer" className="areal-download-btn">
                                                        <Download size={18} /> CRV3D File
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Simple Navigation Arrows for Timeline */}
                        <div className="areal-timeline-nav">
                            <button className="timeline-nav-arrow" onClick={() => scrollTimeline('left')}>
                                <ChevronLeft size={24} />
                            </button>
                            <button className="timeline-nav-arrow" onClick={() => scrollTimeline('right')}>
                                <ChevronRight size={24} />
                            </button>
                        </div>
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
