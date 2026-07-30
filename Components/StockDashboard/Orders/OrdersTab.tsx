'use client';

import { useCallback, useEffect, useState } from 'react';
import { Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/api';
import { formatAbsoluteTime, formatRelativeTime } from '../formatRelativeTime';
import OrdersFilters from './OrdersFilters';
import OrderDetail from './OrderDetail';
import {
    countActiveFilters,
    emptyOrderFilters,
    filtersToParams,
    type FilterOptions,
    type OrderFiltersState,
    type OrderRow,
} from './orderTypes';

const PAGE_SIZE = 20;

function assemblyLabel(status: OrderRow['assembly_status']): string {
    if (status === 'started') return 'Assembly started';
    if (status === 'completed') return 'Assembly completed';
    return 'Assembly not started';
}

export default function OrdersTab() {
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedCode, setSelectedCode] = useState<number | null>(null);

    const [rows, setRows] = useState<OrderRow[]>([]);
    const [nextUrl, setNextUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [filtersOpen, setFiltersOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<OrderFiltersState>(emptyOrderFilters);
    const [draftFilters, setDraftFilters] = useState<OrderFiltersState>(emptyOrderFilters);
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/stock-dashboard/orders/filter-options/');
                setFilterOptions(res.data);
            } catch (e) {
                console.error(e);
            }
        })();
    }, []);

    const buildListUrl = useCallback(
        (page = 1) => {
            const params = new URLSearchParams({
                page: String(page),
                page_size: String(PAGE_SIZE),
            });
            if (debouncedSearch) params.set('search', debouncedSearch);
            const filterParams = filtersToParams(appliedFilters);
            Object.entries(filterParams).forEach(([k, v]) => params.set(k, v));
            return `/stock-dashboard/orders/?${params}`;
        },
        [debouncedSearch, appliedFilters]
    );

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(buildListUrl(1));
            setRows(res.data.results || []);
            setNextUrl(res.data.next || null);
        } catch (e) {
            console.error(e);
            setRows([]);
            setNextUrl(null);
        } finally {
            setLoading(false);
        }
    }, [buildListUrl]);

    useEffect(() => {
        load();
    }, [load]);

    const loadMore = async () => {
        if (!nextUrl || loadingMore) return;
        setLoadingMore(true);
        try {
            const res = await api.get(nextUrl);
            setRows((prev) => [...prev, ...(res.data.results || [])]);
            setNextUrl(res.data.next || null);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMore(false);
        }
    };

    const openFilters = () => {
        setDraftFilters(appliedFilters);
        setFiltersOpen(true);
    };

    const applyFilters = () => {
        setAppliedFilters(draftFilters);
        setFiltersOpen(false);
    };

    const clearFilters = () => {
        const empty = emptyOrderFilters();
        setDraftFilters(empty);
        setAppliedFilters(empty);
        setFiltersOpen(false);
    };

    const activeCount = countActiveFilters(appliedFilters);

    if (view === 'detail' && selectedCode != null) {
        return (
            <OrderDetail
                orderCode={selectedCode}
                onBack={() => {
                    setView('list');
                    setSelectedCode(null);
                }}
            />
        );
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                className="stock-panel"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
            >
                <div className="stock-toolbar">
                    <input
                        className="stock-search"
                        placeholder="Search name or exact order code…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button
                        type="button"
                        className={`stock-order-filter-btn ${activeCount ? 'active' : ''}`}
                        onClick={openFilters}
                    >
                        <Filter size={14} />
                        Filters
                        {activeCount > 0 && (
                            <span className="stock-order-filter-count">{activeCount}</span>
                        )}
                    </button>
                </div>

                <OrdersFilters
                    open={filtersOpen}
                    draft={draftFilters}
                    options={filterOptions}
                    onChange={setDraftFilters}
                    onApply={applyFilters}
                    onClear={clearFilters}
                    onClose={() => setFiltersOpen(false)}
                />

                {loading ? (
                    <div className="stock-empty">Loading orders…</div>
                ) : rows.length === 0 ? (
                    <div className="stock-empty">No orders match.</div>
                ) : (
                    <div className="stock-order-list-wrap">
                        <div className="stock-order-table">
                            {rows.map((row) => {
                                const team = row.assembly_team
                                    .slice(0, 3)
                                    .map((u) => `@${String(u.username || u.id).replace(/^@/, '')}`)
                                    .join(' ');
                                return (
                                    <button
                                        key={row.order_code}
                                        type="button"
                                        className="stock-order-row"
                                        onClick={() => {
                                            setSelectedCode(row.order_code);
                                            setView('detail');
                                        }}
                                    >
                                        <div className="stock-order-row-main">
                                            <strong>ORD-{row.order_code}</strong>
                                            <span className="stock-order-row-name">
                                                {row.order_name || '—'}
                                            </span>
                                        </div>
                                        <div className="stock-order-row-meta">
                                            <span className="stock-order-status">
                                                {row.order_status_display}
                                            </span>
                                            <span
                                                className={`stock-order-asm-badge ${row.assembly_status}`}
                                            >
                                                {assemblyLabel(row.assembly_status)}
                                            </span>
                                            {row.has_unreleased_bom && (
                                                <span className="stock-order-unreleased">
                                                    {row.unreleased_bom_count} unreleased
                                                </span>
                                            )}
                                        </div>
                                        <div className="stock-order-row-foot">
                                            <span>
                                                {row.client || '—'}
                                                {row.location ? ` · ${row.location}` : ''}
                                            </span>
                                            <span>{team || 'No assembly team'}</span>
                                            <span
                                                title={
                                                    row.created_at
                                                        ? formatAbsoluteTime(row.created_at)
                                                        : undefined
                                                }
                                            >
                                                {row.created_at
                                                    ? formatRelativeTime(row.created_at)
                                                    : '—'}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {nextUrl && (
                            <button
                                type="button"
                                className="stock-load-more stock-order-load-more"
                                onClick={loadMore}
                                disabled={loadingMore}
                            >
                                {loadingMore ? 'Loading…' : 'Load more'}
                            </button>
                        )}
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
