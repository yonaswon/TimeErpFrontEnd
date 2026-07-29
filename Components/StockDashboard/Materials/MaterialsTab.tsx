'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/api';
import { formatAbsoluteTime, formatRelativeTime } from '../formatRelativeTime';

interface MaterialRow {
    id: number;
    name: string;
    type: 'L' | 'A' | 'P';
    type_display: string;
    code_name: string | null;
    total_available: number;
    stock_keeper_available: number;
    inventories_with_stock: number;
}

interface Distribution {
    inventory_id: number;
    inventory_name: string;
    amount: number;
    is_admin: boolean;
    is_stock_keeper: boolean;
}

interface MaterialDetail extends MaterialRow {
    distribution: Distribution[];
}

interface InboundItem {
    id: number;
    event_type: string;
    delta: number;
    balance_after: number;
    occurred_at: string;
    username: string | null;
    label: string;
    from_inventory_name?: string;
}

export default function MaterialsTab() {
    const [rows, setRows] = useState<MaterialRow[]>([]);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const pageSize = 20;
    const totalPages = Math.max(1, Math.ceil(count / pageSize));

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                page_size: String(pageSize),
            });
            if (search) params.set('search', search);
            if (typeFilter) params.set('type', typeFilter);
            const res = await api.get(`/stock-dashboard/materials/?${params}`);
            setRows(res.data.results || []);
            setCount(res.data.count || 0);
        } catch (e) {
            console.error(e);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [page, search, typeFilter]);

    useEffect(() => {
        load();
    }, [load]);

    if (selectedId != null) {
        return (
            <MaterialDetailView
                materialId={selectedId}
                onBack={() => setSelectedId(null)}
            />
        );
    }

    return (
        <div className="stock-panel">
            <div className="stock-toolbar">
                <input
                    className="stock-search"
                    placeholder="Search materials…"
                    value={search}
                    onChange={(e) => {
                        setPage(1);
                        setSearch(e.target.value);
                    }}
                />
                <select
                    className="stock-select"
                    value={typeFilter}
                    onChange={(e) => {
                        setPage(1);
                        setTypeFilter(e.target.value);
                    }}
                >
                    <option value="">All types</option>
                    <option value="L">Length</option>
                    <option value="A">Areal</option>
                    <option value="P">Piece</option>
                </select>
            </div>

            <div className="stock-table-wrap">
                {loading ? (
                    <div className="stock-empty">Loading materials…</div>
                ) : rows.length === 0 ? (
                    <div className="stock-empty">No materials yet.</div>
                ) : (
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th>Material</th>
                                <th>Type</th>
                                <th>Total available</th>
                                <th>In Stock Keeper</th>
                                <th># Inventories</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((m) => (
                                <tr key={m.id} onClick={() => setSelectedId(m.id)}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                                        {m.code_name && (
                                            <div className="stock-metric-sub">{m.code_name}</div>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`stock-type-badge ${m.type}`}>{m.type}</span>
                                    </td>
                                    <td className="stock-metric">{m.total_available}</td>
                                    <td className="stock-metric">{m.stock_keeper_available}</td>
                                    <td className="stock-metric">{m.inventories_with_stock}</td>
                                    <td>
                                        <Eye size={16} color="#9CA3AF" aria-label="View" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {totalPages > 1 && (
                <div className="stock-pagination">
                    <button
                        type="button"
                        className="stock-page-btn"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        ‹
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let p = i + 1;
                        if (totalPages > 7) {
                            const start = Math.max(1, Math.min(page - 3, totalPages - 6));
                            p = start + i;
                        }
                        return (
                            <button
                                key={p}
                                type="button"
                                className={`stock-page-btn ${page === p ? 'active' : ''}`}
                                onClick={() => setPage(p)}
                            >
                                {p}
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        className="stock-page-btn"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        ›
                    </button>
                </div>
            )}
        </div>
    );
}

function MaterialDetailView({
    materialId,
    onBack,
}: {
    materialId: number;
    onBack: () => void;
}) {
    const [detail, setDetail] = useState<MaterialDetail | null>(null);
    const [history, setHistory] = useState<InboundItem[]>([]);
    const [nextUrl, setNextUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const [d, h] = await Promise.all([
                    api.get(`/stock-dashboard/materials/${materialId}/`),
                    api.get(`/stock-dashboard/materials/${materialId}/inbound-history/?page_size=15`),
                ]);
                if (cancelled) return;
                setDetail(d.data);
                setHistory(h.data.results || []);
                setNextUrl(h.data.next || null);
            } catch (e) {
                console.error(e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [materialId]);

    const loadMore = async () => {
        if (!nextUrl || loadingMore) return;
        setLoadingMore(true);
        try {
            // next may be absolute; axios baseURL handles relative — strip host if needed
            const path = nextUrl.includes('/stock-dashboard/')
                ? nextUrl.slice(nextUrl.indexOf('/stock-dashboard/'))
                : nextUrl;
            const res = await api.get(path);
            setHistory((prev) => [...prev, ...(res.data.results || [])]);
            setNextUrl(res.data.next || null);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMore(false);
        }
    };

    const maxDist = detail
        ? Math.max(...detail.distribution.map((d) => d.amount), 1)
        : 1;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                className="stock-panel"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
            >
                <button type="button" className="stock-back-btn" onClick={onBack}>
                    <ArrowLeft size={16} /> Back to materials
                </button>

                {loading || !detail ? (
                    <div className="stock-empty">Loading detail…</div>
                ) : (
                    <>
                        <h2 className="stock-detail-title">{detail.name}</h2>
                        <p className="stock-detail-meta">
                            <span className={`stock-type-badge ${detail.type}`}>{detail.type_display}</span>
                            {detail.code_name ? ` · ${detail.code_name}` : ''}
                        </p>

                        <div className="stock-kpi-row">
                            <div className="stock-kpi peach">
                                <div className="label">Total available</div>
                                <div className="value">{detail.total_available}</div>
                            </div>
                            <div className="stock-kpi mint">
                                <div className="label">In Stock Keeper</div>
                                <div className="value">{detail.stock_keeper_available}</div>
                            </div>
                            <div className="stock-kpi sky">
                                <div className="label">Inventories with stock</div>
                                <div className="value">{detail.inventories_with_stock}</div>
                            </div>
                        </div>

                        <h3 className="stock-section-title">Inventory distribution</h3>
                        {detail.distribution.length === 0 ? (
                            <div className="stock-empty" style={{ padding: 20 }}>No stock distributed.</div>
                        ) : (
                            detail.distribution.map((d) => (
                                <div key={d.inventory_id} className="stock-dist-row">
                                    <div className="stock-dist-name">
                                        {d.inventory_name}
                                        {d.is_admin ? ' (Admin)' : ''}
                                        {d.is_stock_keeper ? ' (SK)' : ''}
                                    </div>
                                    <div className="stock-dist-bar-track">
                                        <div
                                            className="stock-dist-bar-fill"
                                            style={{ width: `${(d.amount / maxDist) * 100}%` }}
                                        />
                                    </div>
                                    <div className="stock-dist-amt">{d.amount}</div>
                                </div>
                            ))
                        )}

                        <h3 className="stock-section-title" style={{ marginTop: 24 }}>
                            Added to Stock Keeper
                        </h3>
                        <div className="stock-history-list">
                            {history.length === 0 ? (
                                <div className="stock-empty" style={{ padding: 20 }}>
                                    No inbound history for Stock Keeper.
                                </div>
                            ) : (
                                history.map((item) => {
                                    const initial = (item.username || '?').replace('@', '').slice(0, 2).toUpperCase();
                                    return (
                                        <div key={item.id} className="stock-history-row">
                                            <div className="stock-history-avatar">{initial}</div>
                                            <div className="stock-history-body">
                                                <div className="title">
                                                    +{item.delta} · {item.label}
                                                </div>
                                                <div className="meta">
                                                    {item.username ? `@${item.username.replace(/^@/, '')}` : 'System'}
                                                    {item.from_inventory_name
                                                        ? ` · from ${item.from_inventory_name}`
                                                        : ''}
                                                </div>
                                            </div>
                                            <div
                                                className="stock-history-time"
                                                title={formatAbsoluteTime(item.occurred_at)}
                                            >
                                                {formatRelativeTime(item.occurred_at)}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        {nextUrl && (
                            <button
                                type="button"
                                className="stock-load-more"
                                onClick={loadMore}
                                disabled={loadingMore}
                            >
                                {loadingMore ? 'Loading…' : 'Load more'}
                            </button>
                        )}
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
