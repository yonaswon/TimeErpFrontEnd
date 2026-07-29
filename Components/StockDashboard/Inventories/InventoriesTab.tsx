'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/api';
import { formatAbsoluteTime, formatRelativeTime } from '../formatRelativeTime';

interface InventoryRow {
    id: number;
    name: string;
    type: string;
    type_display: string;
    is_stock_keeper: boolean;
    material_count: number;
}

interface InvMaterial {
    id: number;
    name: string;
    type: string;
    code_name: string | null;
    available: number;
}

interface FlowEvent {
    id: number;
    sequence: number;
    event_type: string;
    delta: number;
    balance_after: number;
    occurred_at: string;
    username: string | null;
    label: string;
    order_display?: string;
    order_name?: string;
    order_code?: number | string;
    reason?: string;
    from_inventory_name?: string;
    to_inventory_name?: string;
}

type View =
    | { kind: 'list' }
    | { kind: 'materials'; inventory: InventoryRow }
    | { kind: 'flow'; inventory: InventoryRow; material: InvMaterial };

export default function InventoriesTab() {
    const [view, setView] = useState<View>({ kind: 'list' });
    const [rows, setRows] = useState<InventoryRow[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = search ? `?search=${encodeURIComponent(search)}` : '';
            const res = await api.get(`/stock-dashboard/inventories/${params}`);
            setRows(res.data.results || []);
        } catch (e) {
            console.error(e);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        if (view.kind === 'list') load();
    }, [load, view.kind]);

    if (view.kind === 'flow') {
        return (
            <FlowView
                inventory={view.inventory}
                material={view.material}
                onBack={() => setView({ kind: 'materials', inventory: view.inventory })}
            />
        );
    }

    if (view.kind === 'materials') {
        return (
            <InventoryMaterialsView
                inventory={view.inventory}
                onBack={() => setView({ kind: 'list' })}
                onSelectMaterial={(m) =>
                    setView({ kind: 'flow', inventory: view.inventory, material: m })
                }
            />
        );
    }

    return (
        <div className="stock-panel">
            <div className="stock-toolbar">
                <input
                    className="stock-search"
                    placeholder="Search inventories…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="stock-table-wrap">
                {loading ? (
                    <div className="stock-empty">Loading inventories…</div>
                ) : rows.length === 0 ? (
                    <div className="stock-empty">No inventories to show.</div>
                ) : (
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th>Inventory</th>
                                <th>Type</th>
                                <th>Materials</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((inv) => (
                                <tr
                                    key={inv.id}
                                    onClick={() => setView({ kind: 'materials', inventory: inv })}
                                >
                                    <td>
                                        <div style={{ fontWeight: 600 }}>
                                            {inv.name}
                                            {inv.is_stock_keeper ? ' · Stock Keeper' : ''}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="stock-type-badge P">{inv.type_display}</span>
                                    </td>
                                    <td className="stock-metric">{inv.material_count}</td>
                                    <td>
                                        <Eye size={16} color="#9CA3AF" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function InventoryMaterialsView({
    inventory,
    onBack,
    onSelectMaterial,
}: {
    inventory: InventoryRow;
    onBack: () => void;
    onSelectMaterial: (m: InvMaterial) => void;
}) {
    const [rows, setRows] = useState<InvMaterial[]>([]);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ page_size: '100' });
                if (search) params.set('search', search);
                if (typeFilter) params.set('type', typeFilter);
                const res = await api.get(
                    `/stock-dashboard/inventories/${inventory.id}/materials/?${params}`
                );
                if (!cancelled) setRows(res.data.results || []);
            } catch (e) {
                console.error(e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [inventory.id, search, typeFilter]);

    return (
        <motion.div
            className="stock-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
        >
            <button type="button" className="stock-back-btn" onClick={onBack}>
                <ArrowLeft size={16} /> Back to inventories
            </button>
            <h2 className="stock-detail-title">{inventory.name}</h2>
            <p className="stock-detail-meta">{inventory.type_display} · materials in this inventory</p>

            <div className="stock-toolbar">
                <input
                    className="stock-search"
                    placeholder="Search materials…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    className="stock-select"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                >
                    <option value="">All types</option>
                    <option value="L">Length</option>
                    <option value="A">Areal</option>
                    <option value="P">Piece</option>
                </select>
            </div>

            <div className="stock-table-wrap">
                {loading ? (
                    <div className="stock-empty">Loading…</div>
                ) : rows.length === 0 ? (
                    <div className="stock-empty">No materials in this inventory.</div>
                ) : (
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th>Material</th>
                                <th>Type</th>
                                <th>Available</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((m) => (
                                <tr key={m.id} onClick={() => onSelectMaterial(m)}>
                                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                                    <td>
                                        <span className={`stock-type-badge ${m.type}`}>{m.type}</span>
                                    </td>
                                    <td className="stock-metric">{m.available}</td>
                                    <td>
                                        <Eye size={16} color="#9CA3AF" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </motion.div>
    );
}

function FlowView({
    inventory,
    material,
    onBack,
}: {
    inventory: InventoryRow;
    material: InvMaterial;
    onBack: () => void;
}) {
    const [events, setEvents] = useState<FlowEvent[]>([]);
    const [currentAvailable, setCurrentAvailable] = useState<number>(0);
    const [footprintBalance, setFootprintBalance] = useState<number>(0);
    const [hasOlder, setHasOlder] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [building, setBuilding] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const didScroll = useRef(false);

    const load = useCallback(async () => {
        setLoading(true);
        setBuilding(true);
        try {
            const res = await api.get(
                `/stock-dashboard/inventories/${inventory.id}/materials/${material.id}/flow/?page_size=50`
            );
            setEvents(res.data.events || []);
            setCurrentAvailable(res.data.current_available ?? 0);
            setFootprintBalance(res.data.footprint_balance ?? 0);
            setHasOlder(!!res.data.has_older);
        } catch (e) {
            console.error(e);
            setEvents([]);
        } finally {
            setLoading(false);
            setBuilding(false);
        }
    }, [inventory.id, material.id]);

    useEffect(() => {
        didScroll.current = false;
        load();
    }, [load]);

    useEffect(() => {
        if (!loading && events.length && listRef.current && !didScroll.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
            didScroll.current = true;
        }
    }, [loading, events]);

    const loadOlder = async () => {
        if (!events.length || loadingOlder) return;
        setLoadingOlder(true);
        const oldest = events[0].sequence;
        const prevHeight = listRef.current?.scrollHeight || 0;
        try {
            const res = await api.get(
                `/stock-dashboard/inventories/${inventory.id}/materials/${material.id}/flow/?page_size=50&before_sequence=${oldest}`
            );
            const older: FlowEvent[] = res.data.events || [];
            setEvents((prev) => [...older, ...prev]);
            setHasOlder(!!res.data.has_older);
            requestAnimationFrame(() => {
                if (listRef.current) {
                    listRef.current.scrollTop = listRef.current.scrollHeight - prevHeight;
                }
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingOlder(false);
        }
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                className="stock-panel"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
            >
                <button type="button" className="stock-back-btn" onClick={onBack} style={{ marginBottom: 6 }}>
                    <ArrowLeft size={14} /> Back to materials
                </button>

                <div className="stock-flow-header">
                    <div className="stock-flow-header-row">
                        <div>
                            <h2 className="stock-detail-title">{material.name}</h2>
                            <p className="stock-detail-meta">
                                in {inventory.name} ·{' '}
                                <span className={`stock-type-badge ${material.type}`}>{material.type}</span>
                            </p>
                        </div>
                        <div className="stock-flow-stats">
                            <div className="stock-flow-stat mint">
                                Available <strong>{currentAvailable}</strong>
                            </div>
                            <div className="stock-flow-stat sky">
                                Ledger <strong>{footprintBalance}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {building && loading && (
                    <div className="stock-empty">Building history…</div>
                )}

                {!loading && (
                    <>
                        {hasOlder && (
                            <button
                                type="button"
                                className="stock-load-more"
                                onClick={loadOlder}
                                disabled={loadingOlder}
                                style={{ marginTop: 4, marginBottom: 6 }}
                            >
                                {loadingOlder ? 'Loading…' : 'Load older'}
                            </button>
                        )}
                        <div className="stock-flow-list" ref={listRef}>
                            {events.length === 0 ? (
                                <div className="stock-empty">
                                    No movement recorded for this material here.
                                </div>
                            ) : (
                                events.map((ev) => {
                                    const isIn = ev.delta >= 0;
                                    const sign = isIn ? '+' : '';
                                    const who = ev.username
                                        ? `@${String(ev.username).replace(/^@/, '')}`
                                        : '';
                                    const isAdditional = ev.reason === 'ADD';
                                    const orderRef =
                                        ev.order_display ||
                                        (ev.order_code != null ? `ORD-${ev.order_code}` : '');
                                    const orderTitle = orderRef
                                        ? `${orderRef}${ev.order_name ? ` · ${ev.order_name}` : ''}`
                                        : ev.label;
                                    const addTitle = `Additional release for ${orderTitle}`;
                                    const displayLabel = isAdditional
                                        ? (ev.label || '').replace(/^Additional release\s*·\s*/i, '') || orderTitle
                                        : ev.label;

                                    return (
                                        <div
                                            key={ev.id}
                                            className={`stock-flow-row ${isIn ? 'in' : 'out'}`}
                                        >
                                            <span className="stock-flow-delta">
                                                {sign}{ev.delta}
                                            </span>
                                            <span
                                                className="stock-flow-label"
                                                title={isAdditional ? addTitle : ev.label}
                                            >
                                                {isAdditional && (
                                                    <span className="stock-flow-add-badge" title={addTitle}>
                                                        <span className="plus">+</span>
                                                        ADD
                                                    </span>
                                                )}
                                                <span className="stock-flow-label-text">
                                                    {displayLabel}
                                                    {who ? <span className="who">{who}</span> : null}
                                                </span>
                                            </span>
                                            <span className="stock-flow-balance" title="Balance after">
                                                → {ev.balance_after}
                                            </span>
                                            <span
                                                className="stock-flow-when"
                                                title={formatAbsoluteTime(ev.occurred_at)}
                                            >
                                                {formatRelativeTime(ev.occurred_at)}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
