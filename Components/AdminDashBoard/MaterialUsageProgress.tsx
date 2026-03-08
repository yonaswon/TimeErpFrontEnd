'use client';
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import {
    Package, Filter, Calendar, ArrowRightLeft, TrendingDown, Database,
    ChevronDown, ChevronUp, Warehouse, ShoppingCart, X, RefreshCw,
    Activity, Layers, ArrowRight, AlertCircle, CheckCircle, Edit3,
    Eye, AlertTriangle
} from 'lucide-react';

interface MaterialOption {
    id: number;
    name: string;
    type: string;
    code_name: string | null;
    available: number;
}

interface InventoryDistItem {
    inventory_id: number;
    inventory_name: string;
    amount: number;
}

interface TimelineEvent {
    type: 'record' | 'transfer' | 'release';
    source?: string;
    date: string;
    amount: number;
    current_amount?: number;
    is_active?: boolean;
    price?: number;
    inventory_id?: number;
    inventory_name?: string;
    from_inventory_id?: number;
    from_inventory_name?: string;
    to_inventory_id?: number;
    to_inventory_name?: string;
    created_by?: string | null;
    purchase_id?: number | null;
    record_id?: number;
    transfer_id?: number;
    release_id?: number;
    reason?: string;
    reason_display?: string;
    released_by?: string | null;
    confirmed?: boolean;
    is_edited?: boolean;
    order_code?: number;
    order_display?: string;
    order_name?: string | null;
}

interface InventoryOption {
    id: number;
    name: string;
    type: string;
}

interface UsageData {
    material: {
        id: number;
        name: string;
        type: string;
        type_code: string;
        code_name: string | null;
        total_available: number;
        lable: string;
    };
    inventory_distribution: InventoryDistItem[];
    timeline: TimelineEvent[];
    stats: {
        total_records: number;
        total_transfers: number;
        total_releases: number;
        total_released_amount: number;
        inventory_count: number;
    };
    inventories: InventoryOption[];
}

interface TraceEvent {
    type: string;
    date: string;
    amount: number;
    running_amount: number;
    transfer_id?: number;
    from_inventory?: string;
    to_inventory?: string;
    release_id?: number;
    reason?: string;
    reason_display?: string;
    inventory?: string;
    order_display?: string;
    order_name?: string | null;
}

interface RecordTrace {
    record: {
        id: number;
        first_amount: number;
        current_amount: number;
        price: number;
        is_active: boolean;
        inventory_id: number;
        inventory_name: string;
        material_name: string;
        material_type: string;
        created_by: string | null;
        created_at: string;
        purchase_id: number | null;
    };
    events: TraceEvent[];
    final_running_amount: number;
    matches_current: boolean;
    flaw_found: boolean;
}

function getInventoryLabel(id: number, name: string): string {
    if (id === 1) return `${name} (Admin)`;
    if (id === 2) return `${name} (StockKeeper)`;
    return `${name} (Personal)`;
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function formatNumber(n: number): string {
    return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function getUnit(materialTypeCode: string): string {
    return materialTypeCode === 'L' ? 'm' : '';
}

function formatWithUnit(n: number, typeCode: string): string {
    const unit = getUnit(typeCode);
    return `${formatNumber(n)}${unit ? ' ' + unit : ''}`;
}

export default function MaterialUsageProgress() {
    const [materials, setMaterials] = useState<MaterialOption[]>([]);
    const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
    const [data, setData] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(false);
    const [materialsLoading, setMaterialsLoading] = useState(true);
    const [error, setError] = useState('');

    // Toggle: with/without releases
    const [showReleases, setShowReleases] = useState(true);

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [inventoryFilter, setInventoryFilter] = useState('');
    const [eventTypeFilter, setEventTypeFilter] = useState<string[]>([]);
    const [reasonFilter, setReasonFilter] = useState('');

    // Timeline expand
    const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
    const [visibleCount, setVisibleCount] = useState(20);

    // Record trace overlay
    const [traceRecordId, setTraceRecordId] = useState<number | null>(null);
    const [traceData, setTraceData] = useState<RecordTrace | null>(null);
    const [traceLoading, setTraceLoading] = useState(false);

    // Fetch materials (L and P types)
    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                setMaterialsLoading(true);
                const [lengthRes, pieceRes] = await Promise.all([
                    api.get('/materials/', { params: { type: 'L', page_size: 500 } }),
                    api.get('/materials/', { params: { type: 'P', page_size: 500 } }),
                ]);
                const lengthMats = (lengthRes.data.results || lengthRes.data).map((m: any) => ({ ...m, type: 'Length' }));
                const pieceMats = (pieceRes.data.results || pieceRes.data).map((m: any) => ({ ...m, type: 'Piece' }));
                setMaterials([...lengthMats, ...pieceMats]);
            } catch (err: any) {
                setError('Failed to load materials');
            } finally {
                setMaterialsLoading(false);
            }
        };
        fetchMaterials();
    }, []);

    const fetchUsageData = useCallback(async (matId: number) => {
        try {
            setLoading(true);
            setError('');
            const params: Record<string, string> = {};
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            if (inventoryFilter) params.inventory = inventoryFilter;
            if (eventTypeFilter.length > 0) params.event_type = eventTypeFilter.join(',');
            if (reasonFilter) params.reason = reasonFilter;

            const res = await api.get(`/material-usage-progress/${matId}/`, { params });
            setData(res.data);
            setVisibleCount(20);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to load usage data');
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo, inventoryFilter, eventTypeFilter, reasonFilter]);

    useEffect(() => {
        if (selectedMaterialId) {
            fetchUsageData(selectedMaterialId);
        }
    }, [selectedMaterialId, fetchUsageData]);

    // Fetch record trace
    useEffect(() => {
        if (!traceRecordId) {
            setTraceData(null);
            return;
        }
        const fetchTrace = async () => {
            try {
                setTraceLoading(true);
                const res = await api.get(`/landp-record-trace/${traceRecordId}/`);
                setTraceData(res.data);
            } catch {
                setTraceData(null);
            } finally {
                setTraceLoading(false);
            }
        };
        fetchTrace();
    }, [traceRecordId]);

    const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedMaterialId(val ? parseInt(val) : null);
        setData(null);
        setExpandedEvents(new Set());
    };

    const clearFilters = () => {
        setDateFrom('');
        setDateTo('');
        setInventoryFilter('');
        setEventTypeFilter([]);
        setReasonFilter('');
    };

    const toggleEventType = (type: string) => {
        setEventTypeFilter(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const toggleExpand = (key: string) => {
        setExpandedEvents(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const getEventKey = (event: TimelineEvent, index: number): string => {
        return `${event.type}-${event.record_id || event.transfer_id || event.release_id}-${index}`;
    };

    const getEventDotClass = (event: TimelineEvent): string => {
        if (event.type === 'record') {
            if (event.source === 'purchased') return 'mup-dot-purchased';
            if (event.source === 'transfer') return 'mup-dot-transfer-record';
            return 'mup-dot-default';
        }
        if (event.type === 'transfer') return 'mup-dot-transfer';
        if (event.type === 'release') return 'mup-dot-release';
        return '';
    };

    const getEventTitle = (event: TimelineEvent): string => {
        if (event.type === 'record') {
            if (event.source === 'purchased') return 'Purchased';
            if (event.source === 'transfer') return 'Transfer Record';
            return 'Default Record';
        }
        if (event.type === 'transfer') return 'Transfer';
        if (event.type === 'release') return event.reason_display || 'Release';
        return '';
    };

    const getEventIcon = (event: TimelineEvent) => {
        if (event.type === 'record') {
            if (event.source === 'purchased') return <ShoppingCart size={14} />;
            return <Database size={14} />;
        }
        if (event.type === 'transfer') return <ArrowRightLeft size={14} />;
        if (event.type === 'release') return <TrendingDown size={14} />;
        return <Activity size={14} />;
    };

    const getReasonBadgeClass = (reason?: string): string => {
        switch (reason) {
            case 'ORDER': return 'mup-badge-order';
            case 'SALE': return 'mup-badge-sale';
            case 'WAST': return 'mup-badge-waste';
            case 'ADJ': return 'mup-badge-adjust';
            case 'MAINTENANCE': return 'mup-badge-maint';
            case 'EDIT': return 'mup-badge-edit';
            default: return 'mup-badge-default';
        }
    };

    // Filter timeline based on toggle
    const filteredTimeline = data
        ? showReleases
            ? data.timeline
            : data.timeline.filter(e => e.type !== 'release')
        : [];

    const visibleTimeline = filteredTimeline.slice(0, visibleCount);
    const hasMore = filteredTimeline.length > visibleCount;
    const totalDistribution = data ? data.inventory_distribution.reduce((s, d) => s + d.amount, 0) : 0;
    const hasActiveFilters = dateFrom || dateTo || inventoryFilter || eventTypeFilter.length > 0 || reasonFilter;
    const typeCode = data?.material.type_code || '';

    return (
        <div className="mup-container">
            {/* Material Selector */}
            <div className="mup-selector-card">
                <div className="mup-selector-header">
                    <Package size={20} />
                    <span>Select Material</span>
                </div>
                {materialsLoading ? (
                    <div className="mup-selector-loading">Loading materials...</div>
                ) : (
                    <select
                        className="mup-material-select"
                        value={selectedMaterialId ?? ''}
                        onChange={handleMaterialChange}
                    >
                        <option value="">— Choose a Length or Piece material —</option>
                        <optgroup label="📏 Length Materials">
                            {materials.filter(m => m.type === 'Length').map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.name} {m.code_name ? `(${m.code_name})` : ''} — Avail: {formatNumber(m.available)} m
                                </option>
                            ))}
                        </optgroup>
                        <optgroup label="🔢 Piece Materials">
                            {materials.filter(m => m.type === 'Piece').map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.name} {m.code_name ? `(${m.code_name})` : ''} — Avail: {formatNumber(m.available)}
                                </option>
                            ))}
                        </optgroup>
                    </select>
                )}
            </div>

            {/* Toggle + Filters */}
            {selectedMaterialId && (
                <div className="mup-controls-row">
                    {/* Release Toggle */}
                    <div className="mup-toggle-group">
                        <button
                            className={`mup-toggle-btn ${showReleases ? 'active' : ''}`}
                            onClick={() => setShowReleases(true)}
                        >
                            <TrendingDown size={14} /> With Releases
                        </button>
                        <button
                            className={`mup-toggle-btn ${!showReleases ? 'active' : ''}`}
                            onClick={() => setShowReleases(false)}
                        >
                            <Database size={14} /> Without Releases
                        </button>
                    </div>

                    {/* Filter Toggle */}
                    <button
                        className={`mup-filter-toggle ${hasActiveFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={16} />
                        <span>Filters</span>
                        {hasActiveFilters && <span className="mup-filter-count">{
                            [dateFrom, dateTo, inventoryFilter, reasonFilter].filter(Boolean).length + eventTypeFilter.length
                        }</span>}
                        {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            )}

            {/* Filters Panel */}
            {showFilters && selectedMaterialId && (
                <div className="mup-filters-panel">
                    <div className="mup-filters-grid">
                        <div className="mup-filter-group">
                            <label><Calendar size={14} /> Date From</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                        </div>
                        <div className="mup-filter-group">
                            <label><Calendar size={14} /> Date To</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                        </div>
                        <div className="mup-filter-group">
                            <label><Warehouse size={14} /> Inventory</label>
                            <select value={inventoryFilter} onChange={e => setInventoryFilter(e.target.value)}>
                                <option value="">All Inventories</option>
                                {data?.inventories.map(inv => (
                                    <option key={inv.id} value={inv.id}>
                                        {getInventoryLabel(inv.id, inv.name)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mup-filter-group">
                            <label><TrendingDown size={14} /> Release Reason</label>
                            <select value={reasonFilter} onChange={e => setReasonFilter(e.target.value)}>
                                <option value="">All Reasons</option>
                                <option value="ORDER">Order</option>
                                <option value="ADD">Additional</option>
                                <option value="SALE">Sale</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="WAST">Wastage</option>
                                <option value="ADJ">Adjustment</option>
                                <option value="EDIT">Edit</option>
                            </select>
                        </div>
                    </div>

                    <div className="mup-event-type-filters">
                        <label>Event Types:</label>
                        <div className="mup-event-chips">
                            {['record', 'transfer', 'release'].map(type => (
                                <button
                                    key={type}
                                    className={`mup-chip ${eventTypeFilter.includes(type) ? 'active' : ''}`}
                                    onClick={() => toggleEventType(type)}
                                >
                                    {type === 'record' && <Database size={12} />}
                                    {type === 'transfer' && <ArrowRightLeft size={12} />}
                                    {type === 'release' && <TrendingDown size={12} />}
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <button className="mup-clear-filters" onClick={clearFilters}>
                            <X size={14} /> Clear All Filters
                        </button>
                    )}
                </div>
            )}

            {/* Loading / Error */}
            {loading && (
                <div className="mup-loading">
                    <div className="admin-spinner" />
                    <span>Loading material usage data...</span>
                </div>
            )}
            {error && (
                <div className="mup-error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                    {selectedMaterialId && (
                        <button onClick={() => fetchUsageData(selectedMaterialId)}>
                            <RefreshCw size={14} /> Retry
                        </button>
                    )}
                </div>
            )}

            {/* Data Display */}
            {data && !loading && (
                <>
                    {/* KPI Cards */}
                    <div className="mup-kpi-grid">
                        <div className="mup-kpi-card mup-kpi-primary">
                            <div className="mup-kpi-icon"><Package size={20} /></div>
                            <div className="mup-kpi-content">
                                <span className="mup-kpi-value">{formatWithUnit(data.material.total_available, typeCode)}</span>
                                <span className="mup-kpi-label">Total Available</span>
                            </div>
                        </div>
                        <div className="mup-kpi-card mup-kpi-info">
                            <div className="mup-kpi-icon"><Warehouse size={20} /></div>
                            <div className="mup-kpi-content">
                                <span className="mup-kpi-value">{data.stats.inventory_count}</span>
                                <span className="mup-kpi-label">Inventories</span>
                            </div>
                        </div>
                        <div className="mup-kpi-card mup-kpi-success">
                            <div className="mup-kpi-icon"><Database size={20} /></div>
                            <div className="mup-kpi-content">
                                <span className="mup-kpi-value">{data.stats.total_records}</span>
                                <span className="mup-kpi-label">Total Records</span>
                            </div>
                        </div>
                        <div className="mup-kpi-card mup-kpi-warning">
                            <div className="mup-kpi-icon"><ArrowRightLeft size={20} /></div>
                            <div className="mup-kpi-content">
                                <span className="mup-kpi-value">{data.stats.total_transfers}</span>
                                <span className="mup-kpi-label">Transfers</span>
                            </div>
                        </div>
                        <div className="mup-kpi-card mup-kpi-danger">
                            <div className="mup-kpi-icon"><TrendingDown size={20} /></div>
                            <div className="mup-kpi-content">
                                <span className="mup-kpi-value">{data.stats.total_releases}</span>
                                <span className="mup-kpi-label">Released ({formatWithUnit(data.stats.total_released_amount, typeCode)})</span>
                            </div>
                        </div>
                    </div>

                    {/* Inventory Distribution */}
                    {data.inventory_distribution.length > 0 && (
                        <div className="mup-section-card">
                            <h3><Layers size={18} /> Inventory Distribution</h3>
                            <div className="mup-inventory-grid">
                                {data.inventory_distribution.map(dist => {
                                    const pct = totalDistribution > 0 ? (dist.amount / totalDistribution) * 100 : 0;
                                    return (
                                        <div key={dist.inventory_id} className="mup-inv-card">
                                            <div className="mup-inv-header">
                                                <span className="mup-inv-name">
                                                    {getInventoryLabel(dist.inventory_id, dist.inventory_name)}
                                                </span>
                                                <span className="mup-inv-amount">{formatWithUnit(dist.amount, typeCode)}</span>
                                            </div>
                                            <div className="mup-inv-bar-track">
                                                <div
                                                    className={`mup-inv-bar-fill ${dist.inventory_id === 1 ? 'admin' : dist.inventory_id === 2 ? 'stockkeeper' : 'personal'}`}
                                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                                />
                                            </div>
                                            <span className="mup-inv-pct">{pct.toFixed(1)}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="mup-section-card">
                        <h3>
                            <Activity size={18} />
                            Usage Timeline
                            {!showReleases && <span className="mup-mode-badge">Records & Transfers Only</span>}
                        </h3>
                        {visibleTimeline.length === 0 ? (
                            <div className="mup-empty">No events found{hasActiveFilters ? ' with current filters' : ''}</div>
                        ) : (
                            <div className="mup-timeline">
                                {visibleTimeline.map((event, idx) => {
                                    const key = getEventKey(event, idx);
                                    const isExpanded = expandedEvents.has(key);
                                    return (
                                        <div
                                            key={key}
                                            className={`mup-timeline-item ${isExpanded ? 'expanded' : ''}`}
                                            onClick={() => toggleExpand(key)}
                                        >
                                            <div className="mup-timeline-line-area">
                                                <div className={`mup-timeline-dot ${getEventDotClass(event)}`}>
                                                    {getEventIcon(event)}
                                                </div>
                                                {idx < visibleTimeline.length - 1 && <div className="mup-timeline-connector" />}
                                            </div>
                                            <div className="mup-timeline-content">
                                                <div className="mup-timeline-header">
                                                    <div className="mup-timeline-title-row">
                                                        <span className="mup-timeline-title">{getEventTitle(event)}</span>
                                                        {event.type === 'release' && event.reason && (
                                                            <span className={`mup-reason-badge ${getReasonBadgeClass(event.reason)}`}>
                                                                {event.reason}
                                                            </span>
                                                        )}
                                                        {event.type === 'release' && event.is_edited && (
                                                            <span className="mup-edited-badge">
                                                                <Edit3 size={10} /> Edited
                                                            </span>
                                                        )}
                                                        {event.type === 'record' && event.source === 'purchased' && (
                                                            <span className="mup-reason-badge mup-badge-purchased">Purchased</span>
                                                        )}
                                                    </div>
                                                    <div className="mup-timeline-right">
                                                        <span className="mup-timeline-date">{formatDate(event.date)}</span>
                                                        {event.type === 'record' && event.record_id && (
                                                            <button
                                                                className="mup-trace-btn"
                                                                title="View record trace"
                                                                onClick={(e) => { e.stopPropagation(); setTraceRecordId(event.record_id!); }}
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mup-timeline-summary">
                                                    {event.type === 'record' && (
                                                        <span>
                                                            <strong>{formatWithUnit(event.amount, typeCode)}</strong>
                                                            {' → '}
                                                            <span className={`mup-current-amount ${event.current_amount === 0 ? 'depleted' : ''}`}>
                                                                {formatWithUnit(event.current_amount || 0, typeCode)}
                                                            </span>
                                                            {' in '}
                                                            <em>{getInventoryLabel(event.inventory_id!, event.inventory_name!)}</em>
                                                            {!event.is_active && <span className="mup-depleted"> (Depleted)</span>}
                                                        </span>
                                                    )}
                                                    {event.type === 'transfer' && (
                                                        <span className="mup-transfer-flow">
                                                            <strong>{formatWithUnit(event.amount, typeCode)}</strong>
                                                            <span className="mup-flow-badge from">
                                                                {getInventoryLabel(event.from_inventory_id!, event.from_inventory_name!)}
                                                            </span>
                                                            <ArrowRight size={14} className="mup-flow-arrow" />
                                                            <span className="mup-flow-badge to">
                                                                {getInventoryLabel(event.to_inventory_id!, event.to_inventory_name!)}
                                                            </span>
                                                        </span>
                                                    )}
                                                    {event.type === 'release' && (
                                                        <span>
                                                            <strong>{formatWithUnit(event.amount, typeCode)}</strong> released from{' '}
                                                            <em>{getInventoryLabel(event.inventory_id!, event.inventory_name!)}</em>
                                                            {event.order_display && (
                                                                <span className="mup-order-link"> for {event.order_display}</span>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Expanded details */}
                                                {isExpanded && (
                                                    <div className="mup-event-details" onClick={e => e.stopPropagation()}>
                                                        <div className="mup-detail-grid">
                                                            <div className="mup-detail-row">
                                                                <span className="mup-detail-label">Date & Time</span>
                                                                <span className="mup-detail-value">{formatDateTime(event.date)}</span>
                                                            </div>
                                                            <div className="mup-detail-row">
                                                                <span className="mup-detail-label">Amount</span>
                                                                <span className="mup-detail-value">{formatWithUnit(event.amount, typeCode)}</span>
                                                            </div>

                                                            {event.type === 'record' && (
                                                                <>
                                                                    <div className="mup-detail-row">
                                                                        <span className="mup-detail-label">First Amount</span>
                                                                        <span className="mup-detail-value">{formatWithUnit(event.amount, typeCode)}</span>
                                                                    </div>
                                                                    <div className="mup-detail-row">
                                                                        <span className="mup-detail-label">Current Amount</span>
                                                                        <span className="mup-detail-value">
                                                                            {formatWithUnit(event.current_amount || 0, typeCode)}
                                                                            {!event.is_active && (
                                                                                <span className="mup-status-inactive"> (Inactive)</span>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <div className="mup-detail-row">
                                                                        <span className="mup-detail-label">Price</span>
                                                                        <span className="mup-detail-value">{formatNumber(event.price || 0)} ETB</span>
                                                                    </div>
                                                                    <div className="mup-detail-row">
                                                                        <span className="mup-detail-label">Inventory</span>
                                                                        <span className="mup-detail-value">
                                                                            {getInventoryLabel(event.inventory_id!, event.inventory_name!)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="mup-detail-row">
                                                                        <span className="mup-detail-label">Source</span>
                                                                        <span className="mup-detail-value">
                                                                            {event.source === 'purchased' ? '🛒 Purchased' :
                                                                                event.source === 'transfer' ? '🔄 From Transfer' :
                                                                                    '📋 Default Record'}
                                                                        </span>
                                                                    </div>
                                                                    {event.created_by && (
                                                                        <div className="mup-detail-row">
                                                                            <span className="mup-detail-label">Created By</span>
                                                                            <span className="mup-detail-value">{event.created_by}</span>
                                                                        </div>
                                                                    )}
                                                                    {event.is_active && event.amount > 0 && (
                                                                        <div className="mup-usage-progress">
                                                                            <div className="mup-detail-label">Usage</div>
                                                                            <div className="mup-progress-track">
                                                                                <div
                                                                                    className="mup-progress-fill"
                                                                                    style={{ width: `${((event.amount - (event.current_amount || 0)) / event.amount) * 100}%` }}
                                                                                />
                                                                            </div>
                                                                            <span className="mup-progress-text">
                                                                                {formatWithUnit(event.amount - (event.current_amount || 0), typeCode)} / {formatWithUnit(event.amount, typeCode)} used
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}

                                                            {event.type === 'transfer' && (
                                                                <>
                                                                    <div className="mup-detail-row">
                                                                        <span className="mup-detail-label">From</span>
                                                                        <span className="mup-detail-value">
                                                                            {getInventoryLabel(event.from_inventory_id!, event.from_inventory_name!)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="mup-detail-row">
                                                                        <span className="mup-detail-label">To</span>
                                                                        <span className="mup-detail-value">
                                                                            {getInventoryLabel(event.to_inventory_id!, event.to_inventory_name!)}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            )}

                                                            {event.type === 'release' && (
                                                                <>
                                                                    <div className="mup-detail-row">
                                                                        <span className="mup-detail-label">Reason</span>
                                                                        <span className="mup-detail-value">{event.reason_display}</span>
                                                                    </div>
                                                                    <div className="mup-detail-row">
                                                                        <span className="mup-detail-label">Inventory</span>
                                                                        <span className="mup-detail-value">
                                                                            {getInventoryLabel(event.inventory_id!, event.inventory_name!)}
                                                                        </span>
                                                                    </div>
                                                                    {event.order_display && (
                                                                        <div className="mup-detail-row">
                                                                            <span className="mup-detail-label">Order</span>
                                                                            <span className="mup-detail-value mup-order-tag">
                                                                                {event.order_display}
                                                                                {event.order_name && ` — ${event.order_name}`}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {event.released_by && (
                                                                        <div className="mup-detail-row">
                                                                            <span className="mup-detail-label">Released By</span>
                                                                            <span className="mup-detail-value">{event.released_by}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="mup-detail-row">
                                                                        <span className="mup-detail-label">Status</span>
                                                                        <span className="mup-detail-value">
                                                                            {event.confirmed ? (
                                                                                <span className="mup-confirmed"><CheckCircle size={12} /> Confirmed</span>
                                                                            ) : (
                                                                                <span className="mup-unconfirmed"><AlertCircle size={12} /> Pending</span>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {hasMore && (
                            <button
                                className="mup-load-more"
                                onClick={() => setVisibleCount(prev => prev + 20)}
                            >
                                Load More ({filteredTimeline.length - visibleCount} remaining)
                            </button>
                        )}
                    </div>
                </>
            )}

            {!selectedMaterialId && !loading && (
                <div className="mup-empty-state">
                    <Activity size={48} />
                    <h3>Material Usage Progress</h3>
                    <p>Select a Length or Piece material above to view its full usage timeline, transfers, and releases.</p>
                </div>
            )}

            {/* Record Trace Overlay */}
            <div className={`admin-overlay-backdrop ${traceRecordId ? 'open' : ''}`} onClick={() => setTraceRecordId(null)} />
            <div className={`admin-overlay ${traceRecordId ? 'open' : ''}`}>
                <div className="admin-overlay-header">
                    <h2>Record Trace</h2>
                    <button className="admin-overlay-close" onClick={() => setTraceRecordId(null)}>
                        <X size={18} />
                    </button>
                </div>
                <div className="admin-overlay-body">
                    {traceLoading && (
                        <div className="mup-loading">
                            <div className="admin-spinner" />
                            <span>Loading trace...</span>
                        </div>
                    )}
                    {traceData && !traceLoading && (
                        <>
                            {/* Record header */}
                            <div className="mup-trace-header">
                                <div className="mup-trace-material">{traceData.record.material_name}</div>
                                <div className="mup-trace-meta">
                                    {getInventoryLabel(traceData.record.inventory_id, traceData.record.inventory_name)}
                                    {' • '}
                                    {formatDate(traceData.record.created_at)}
                                    {traceData.record.created_by && ` • by ${traceData.record.created_by}`}
                                </div>
                                <div className="mup-trace-start-amount">
                                    Starting: <strong>{formatWithUnit(traceData.record.first_amount, traceData.record.material_type)}</strong>
                                </div>
                            </div>

                            {/* Waterfall */}
                            <div className="mup-trace-waterfall">
                                {/* Starting amount */}
                                <div className="mup-waterfall-row mup-waterfall-start">
                                    <div className="mup-waterfall-icon"><Database size={16} /></div>
                                    <div className="mup-waterfall-info">
                                        <span className="mup-waterfall-label">Initial Amount</span>
                                        <span className="mup-waterfall-date">{formatDate(traceData.record.created_at)}</span>
                                    </div>
                                    <div className="mup-waterfall-amount mup-waterfall-positive">
                                        {formatWithUnit(traceData.record.first_amount, traceData.record.material_type)}
                                    </div>
                                </div>

                                {/* Events */}
                                {traceData.events.map((ev, idx) => (
                                    <div key={idx} className={`mup-waterfall-row mup-waterfall-deduction`}>
                                        <div className={`mup-waterfall-icon ${ev.type === 'transfer' ? 'transfer' : 'release'}`}>
                                            {ev.type === 'transfer' ? <ArrowRightLeft size={14} /> : <TrendingDown size={14} />}
                                        </div>
                                        <div className="mup-waterfall-info">
                                            <span className="mup-waterfall-label">
                                                {ev.type === 'transfer'
                                                    ? `Transfer → ${ev.to_inventory}`
                                                    : `${ev.reason_display}${ev.order_display ? ` (${ev.order_display})` : ''}`
                                                }
                                            </span>
                                            <span className="mup-waterfall-date">{formatDate(ev.date)}</span>
                                        </div>
                                        <div className="mup-waterfall-amounts">
                                            <span className="mup-waterfall-neg">
                                                −{formatWithUnit(ev.amount, traceData.record.material_type)}
                                            </span>
                                            <span className="mup-waterfall-running">
                                                = {formatWithUnit(ev.running_amount, traceData.record.material_type)}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {/* Final */}
                                <div className={`mup-waterfall-row mup-waterfall-final ${traceData.flaw_found ? 'flaw' : 'ok'}`}>
                                    <div className={`mup-waterfall-icon ${traceData.flaw_found ? 'flaw' : 'ok'}`}>
                                        {traceData.flaw_found ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                                    </div>
                                    <div className="mup-waterfall-info">
                                        <span className="mup-waterfall-label">
                                            {traceData.flaw_found ? 'Flaw Found!' : 'Current Amount'}
                                        </span>
                                        {traceData.flaw_found && (
                                            <span className="mup-waterfall-flaw-detail">
                                                Expected: {formatWithUnit(traceData.final_running_amount, traceData.record.material_type)}
                                                {' • '}
                                                Actual: {formatWithUnit(traceData.record.current_amount, traceData.record.material_type)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mup-waterfall-amount mup-waterfall-final-val">
                                        {formatWithUnit(traceData.record.current_amount, traceData.record.material_type)}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
