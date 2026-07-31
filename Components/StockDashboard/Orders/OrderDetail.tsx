'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/api';
import { formatAbsoluteTime, formatRelativeTime } from '../formatRelativeTime';
import { getWebDashboardRoles, parseUserData } from '@/lib/webDashboardAuth';

type BomRow = {
    id: number;
    material: { id: number; name: string; type: string; type_display: string };
    amount: number | null;
    width: number | null;
    height: number | null;
    released: boolean;
    release_date: string | null;
};

type ReleaseRow = {
    id: number;
    reason: string;
    reason_display: string;
    material: { id: number; name: string; type: string };
    amount: number | null;
    confirmed: boolean;
    date: string | null;
    released_by: string | null;
    inventory_name: string | null;
};

type OrderDetailData = {
    order_code: number;
    order_name: string | null;
    order_status: string;
    order_status_display: string;
    assembly_status: string;
    created_at: string | null;
    dxf_file_ready: boolean;
    design_type: string | null;
    boms: BomRow[];
    releases: ReleaseRow[];
    meta: {
        designer: string | null;
        sales_person: string | null;
        client: string | null;
        contact: string | null;
        location: string | null;
        mockup_image: string | null;
        status_dates: Record<string, string | null>;
        cutting_files: Array<{
            id: number;
            status: string;
            status_display: string;
            material_name: string | null;
            image: string | null;
            line_image: string | null;
            is_mass: boolean;
            mass_range_label: string | null;
            assigned_to: string | null;
            date: string | null;
        }>;
        assembly_assigns: Array<{
            id: number;
            status: string;
            status_display: string;
            assigned_to: Array<{ id: number; username: string | null }>;
            start_date: string | null;
            complate_date: string | null;
            date: string | null;
            is_mass: boolean;
        }>;
    };
};

type BomFilter = 'all' | 'released' | 'unreleased';

type PreviewMaterial = {
    bom_id: number;
    material_id: number;
    material_name: string;
    material_type: string;
    amount: number;
    unit: string;
    available: number;
    sufficient: boolean;
};

type BehalfAssignee = { id: number; username: string | null };

function fmtBomQty(bom: BomRow): string {
    if (bom.material.type === 'A') {
        const w = bom.width ?? '—';
        const h = bom.height ?? '—';
        return `${w} × ${h}`;
    }
    if (bom.amount == null) return '—';
    if (bom.material.type === 'L') return `${bom.amount} m`;
    if (bom.material.type === 'P') return `${bom.amount} pcs`;
    return String(bom.amount);
}

function fmtAddQty(amount: number, type: string): string {
    if (type === 'L') return `${amount} m`;
    if (type === 'P') return `${amount} pcs`;
    return String(amount);
}

function atName(name: string | null | undefined): string {
    if (!name) return '—';
    return `@${String(name).replace(/^@/, '')}`;
}

function round3(n: number): number {
    return Math.round(n * 1000) / 1000;
}

export default function OrderDetail({
    orderCode,
    onBack,
}: {
    orderCode: number;
    onBack: () => void;
}) {
    const [data, setData] = useState<OrderDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lightbox, setLightbox] = useState<string | null>(null);
    const [bomFilter, setBomFilter] = useState<BomFilter>('all');

    const [behalfUser, setBehalfUser] = useState<BehalfAssignee | null>(null);
    const [behalfMaterials, setBehalfMaterials] = useState<PreviewMaterial[]>([]);
    const [behalfSelectedIds, setBehalfSelectedIds] = useState<Set<number>>(new Set());
    const [behalfInventoryName, setBehalfInventoryName] = useState<string | null>(null);
    const [behalfError, setBehalfError] = useState<string | null>(null);
    const [behalfStep, setBehalfStep] = useState<'closed' | 'preview' | 'code'>('closed');
    const [behalfCode, setBehalfCode] = useState('');
    const [behalfBusy, setBehalfBusy] = useState(false);
    const [behalfMsg, setBehalfMsg] = useState<string | null>(null);
    const [deletingBomId, setDeletingBomId] = useState<number | null>(null);

    const canDeleteUnreleasedBom = useMemo(() => {
        const roles = getWebDashboardRoles(parseUserData());
        return roles.isAdmin && roles.isStock;
    }, []);

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/stock-dashboard/orders/${orderCode}/`);
            setData(res.data);
        } catch (e) {
            console.error(e);
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [orderCode]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await api.get(`/stock-dashboard/orders/${orderCode}/`);
                if (!cancelled) setData(res.data);
            } catch (e) {
                console.error(e);
                if (!cancelled) setData(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [orderCode]);

    const addByMaterial = useMemo(() => {
        const map = new Map<number, number>();
        if (!data) return map;
        for (const rel of data.releases) {
            if (rel.reason !== 'ADD') continue;
            if (rel.amount == null) continue;
            const prev = map.get(rel.material.id) || 0;
            map.set(rel.material.id, round3(prev + Number(rel.amount)));
        }
        return map;
    }, [data]);

    const rows = useMemo(() => {
        if (!data) return [];
        return data.boms
            .filter((bom) => {
                // Areal always shown — not part of release filters
                if (bom.material.type === 'A') return true;
                if (bomFilter === 'released') return bom.released;
                if (bomFilter === 'unreleased') return !bom.released;
                return true;
            })
            .map((bom) => ({
                bom,
                additional: addByMaterial.get(bom.material.id) || 0,
            }));
    }, [data, bomFilter, addByMaterial]);

    const counts = useMemo(() => {
        if (!data) return { all: 0, released: 0, unreleased: 0 };
        // Counts ignore areal — L/P only
        const lp = data.boms.filter((b) => b.material.type !== 'A');
        const released = lp.filter((b) => b.released).length;
        return {
            all: lp.length,
            released,
            unreleased: lp.length - released,
        };
    }, [data]);

    const behalfAssignees = useMemo(() => {
        if (!data || counts.unreleased === 0) return [] as BehalfAssignee[];
        const map = new Map<number, BehalfAssignee>();
        for (const a of data.meta.assembly_assigns) {
            for (const u of a.assigned_to) {
                if (!map.has(u.id)) {
                    map.set(u.id, { id: u.id, username: u.username });
                }
            }
        }
        return Array.from(map.values());
    }, [data, counts.unreleased]);

    const closeBehalf = () => {
        setBehalfStep('closed');
        setBehalfUser(null);
        setBehalfMaterials([]);
        setBehalfSelectedIds(new Set());
        setBehalfInventoryName(null);
        setBehalfError(null);
        setBehalfCode('');
        setBehalfMsg(null);
        setBehalfBusy(false);
    };

    const selectedMaterials = useMemo(
        () => behalfMaterials.filter((m) => behalfSelectedIds.has(m.bom_id)),
        [behalfMaterials, behalfSelectedIds]
    );

    const selectedCanRelease = useMemo(() => {
        if (selectedMaterials.length === 0) return false;
        return selectedMaterials.every((m) => m.sufficient);
    }, [selectedMaterials]);

    const allSelected =
        behalfMaterials.length > 0 &&
        behalfMaterials.every((m) => behalfSelectedIds.has(m.bom_id));

    const toggleBehalfBom = (bomId: number) => {
        if (behalfStep !== 'preview') return;
        setBehalfSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(bomId)) next.delete(bomId);
            else next.add(bomId);
            return next;
        });
        setBehalfError(null);
        setBehalfMsg(null);
    };

    const selectAllBehalf = () => {
        if (behalfStep !== 'preview') return;
        setBehalfSelectedIds(new Set(behalfMaterials.map((m) => m.bom_id)));
        setBehalfError(null);
    };

    const clearBehalfSelection = () => {
        if (behalfStep !== 'preview') return;
        setBehalfSelectedIds(new Set());
        setBehalfError(null);
    };

    const openBehalf = async (user: BehalfAssignee) => {
        setBehalfUser(user);
        setBehalfStep('preview');
        setBehalfError(null);
        setBehalfMsg(null);
        setBehalfCode('');
        setBehalfInventoryName(null);
        setBehalfSelectedIds(new Set());
        setBehalfBusy(true);
        try {
            const res = await api.post(
                `/stock-dashboard/orders/${orderCode}/release-behalf/preview/`,
                { assembly_user_id: user.id }
            );
            const materials: PreviewMaterial[] = res.data.materials || [];
            setBehalfMaterials(materials);
            setBehalfSelectedIds(new Set(materials.map((m) => m.bom_id)));
            setBehalfInventoryName(res.data.inventory_name || null);
            if (!materials.length) {
                setBehalfError('No unreleased Length/Piece materials.');
            }
            // Shortages stay visible per-line (have/need); selection can exclude them.
        } catch (e: unknown) {
            const err = e as { response?: { data?: { error?: string; detail?: string } } };
            setBehalfError(
                err.response?.data?.error || err.response?.data?.detail || 'Preview failed'
            );
            setBehalfMaterials([]);
            setBehalfSelectedIds(new Set());
        } finally {
            setBehalfBusy(false);
        }
    };

    const sendBehalfCode = async (mode: 'all' | 'selected' | number) => {
        if (!behalfUser) return;

        let bomIds: number[];
        if (mode === 'all') {
            bomIds = behalfMaterials.map((m) => m.bom_id);
        } else if (mode === 'selected') {
            bomIds = Array.from(behalfSelectedIds);
        } else {
            bomIds = [mode];
            setBehalfSelectedIds(new Set([mode]));
        }

        if (bomIds.length === 0) {
            setBehalfError('Select at least one material to release.');
            return;
        }

        const selected = behalfMaterials.filter((m) => bomIds.includes(m.bom_id));
        const short = selected.filter((m) => !m.sufficient);
        if (short.length) {
            setBehalfError(
                `Insufficient stock in ${atName(behalfUser.username || String(behalfUser.id))}'s inventory for: ` +
                    short.map((s) => s.material_name).join(', ')
            );
            return;
        }

        setBehalfBusy(true);
        setBehalfError(null);
        setBehalfMsg(null);
        try {
            const res = await api.post(
                `/stock-dashboard/orders/${orderCode}/release-behalf/request-code/`,
                { assembly_user_id: behalfUser.id, bom_ids: bomIds }
            );
            setBehalfStep('code');
            setBehalfSelectedIds(new Set(res.data.bom_ids || bomIds));
            setBehalfInventoryName(res.data.inventory_name || behalfInventoryName);
            setBehalfMsg(res.data.message || 'Code sent on Telegram.');
            if (res.data.materials) setBehalfMaterials(res.data.materials);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { error?: string } } };
            setBehalfError(err.response?.data?.error || 'Failed to send code');
        } finally {
            setBehalfBusy(false);
        }
    };

    const confirmBehalf = async () => {
        if (!behalfUser || behalfCode.length !== 4) return;
        setBehalfBusy(true);
        setBehalfError(null);
        try {
            const res = await api.post(
                `/stock-dashboard/orders/${orderCode}/release-behalf/confirm/`,
                { assembly_user_id: behalfUser.id, code: behalfCode }
            );
            closeBehalf();
            await reload();
            alert(res.data.message || 'Released successfully');
        } catch (e: unknown) {
            const err = e as { response?: { data?: { error?: string } } };
            setBehalfError(err.response?.data?.error || 'Confirm failed');
        } finally {
            setBehalfBusy(false);
        }
    };

    const deleteBom = async (bom: BomRow) => {
        if (!canDeleteUnreleasedBom || bom.released) return;
        const label = bom.material.name;
        if (!window.confirm(`Remove unreleased BOM “${label}” from this order?`)) {
            return;
        }
        setDeletingBomId(bom.id);
        try {
            await api.delete(`/stock-dashboard/orders/${orderCode}/boms/${bom.id}/`);
            await reload();
        } catch (e: unknown) {
            const err = e as { response?: { data?: { error?: string; detail?: string } } };
            alert(err.response?.data?.error || err.response?.data?.detail || 'Delete failed');
        } finally {
            setDeletingBomId(null);
        }
    };

    if (loading) {
        return <div className="stock-empty">Loading order…</div>;
    }
    if (!data) {
        return (
            <div className="stock-panel">
                <button type="button" className="stock-back-btn" onClick={onBack}>
                    <ArrowLeft size={14} /> Back to orders
                </button>
                <div className="stock-empty">Order not found.</div>
            </div>
        );
    }

    const meta = data.meta;

    return (
        <motion.div
            className="stock-panel stock-order-detail"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
        >
            <div className="stock-order-detail-top">
                <button type="button" className="stock-back-btn" onClick={onBack}>
                    <ArrowLeft size={14} /> Back to orders
                </button>

                <div className="stock-order-detail-header">
                    <div>
                        <h2 className="stock-detail-title">
                            ORD-{data.order_code}
                            {data.order_name ? ` · ${data.order_name}` : ''}
                        </h2>
                        <p className="stock-detail-meta">
                            {data.order_status_display}
                            {meta.client ? ` · ${meta.client}` : ''}
                            {meta.location ? ` · ${meta.location}` : ''}
                        </p>
                    </div>
                    <span className={`stock-order-asm-badge ${data.assembly_status}`}>
                        {data.assembly_status === 'not_started' && 'Assembly not started'}
                        {data.assembly_status === 'started' && 'Assembly started'}
                        {data.assembly_status === 'completed' && 'Assembly completed'}
                    </span>
                </div>

                <div className="stock-order-bom-filters">
                    {(
                        [
                            ['all', 'All', counts.all],
                            ['released', 'Released only', counts.released],
                            ['unreleased', 'Unreleased only', counts.unreleased],
                        ] as const
                    ).map(([key, label, count]) => (
                        <button
                            key={key}
                            type="button"
                            className={`stock-order-pill ${bomFilter === key ? 'active' : ''}`}
                            onClick={() => setBomFilter(key)}
                        >
                            {label}
                            <span className="stock-order-pill-count">{count}</span>
                        </button>
                    ))}
                </div>

                {behalfAssignees.length > 0 && (
                    <div className="stock-order-behalf-actions">
                        {behalfAssignees.map((u) => (
                            <button
                                key={u.id}
                                type="button"
                                className="stock-order-behalf-btn"
                                onClick={() => openBehalf(u)}
                            >
                                Release on behalf of {atName(u.username || String(u.id))}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="stock-order-bom-list">
                {rows.length === 0 ? (
                    <div className="stock-empty">
                        {bomFilter === 'all'
                            ? 'No BOM lines.'
                            : bomFilter === 'released'
                              ? 'No released materials.'
                              : 'No unreleased materials.'}
                    </div>
                ) : (
                    rows.map(({ bom, additional }) => (
                        <div key={bom.id} className="stock-order-bom-row">
                            <div className="stock-order-bom-row-main">
                                <span className="stock-order-line-name">{bom.material.name}</span>
                                <span className={`stock-type-badge ${bom.material.type}`}>
                                    {bom.material.type}
                                </span>
                                <span className="stock-order-line-qty">{fmtBomQty(bom)}</span>
                            </div>
                            <div className="stock-order-bom-row-tags">
                                <span
                                    className={`stock-order-release-badge ${bom.released ? 'yes' : 'no'}`}
                                >
                                    {bom.released ? 'Released' : 'Not released'}
                                </span>
                                {additional > 0 && (
                                    <span
                                        className="stock-order-add-tag"
                                        title="Additional release beyond BOM"
                                    >
                                        <span className="plus">+</span>
                                        Additional {fmtAddQty(additional, bom.material.type)}
                                    </span>
                                )}
                                {canDeleteUnreleasedBom && !bom.released && (
                                    <button
                                        type="button"
                                        className="stock-order-bom-delete"
                                        title="Delete unreleased BOM"
                                        disabled={deletingBomId === bom.id}
                                        onClick={() => deleteBom(bom)}
                                    >
                                        <Trash2 size={13} />
                                        {deletingBomId === bom.id ? 'Deleting…' : 'Delete'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <section className="stock-order-meta">
                <h3 className="stock-order-meta-title">Order details</h3>

                <div className="stock-order-meta-grid">
                    <div className="stock-order-meta-item">
                        <span className="stock-order-meta-label">Graphic designer</span>
                        <span className="stock-order-meta-value">{atName(meta.designer)}</span>
                    </div>
                    <div className="stock-order-meta-item">
                        <span className="stock-order-meta-label">Sales person</span>
                        <span className="stock-order-meta-value">{atName(meta.sales_person)}</span>
                    </div>
                    <div className="stock-order-meta-item">
                        <span className="stock-order-meta-label">Client</span>
                        <span className="stock-order-meta-value">{meta.client || '—'}</span>
                    </div>
                    <div className="stock-order-meta-item">
                        <span className="stock-order-meta-label">Contact</span>
                        <span className="stock-order-meta-value">{meta.contact || '—'}</span>
                    </div>
                    <div className="stock-order-meta-item">
                        <span className="stock-order-meta-label">Location</span>
                        <span className="stock-order-meta-value">{meta.location || '—'}</span>
                    </div>
                    <div className="stock-order-meta-item">
                        <span className="stock-order-meta-label">Design type</span>
                        <span className="stock-order-meta-value">{data.design_type || '—'}</span>
                    </div>
                    <div className="stock-order-meta-item">
                        <span className="stock-order-meta-label">DXF ready</span>
                        <span className="stock-order-meta-value">
                            {data.dxf_file_ready ? 'Yes' : 'No'}
                        </span>
                    </div>
                    <div className="stock-order-meta-item">
                        <span className="stock-order-meta-label">Created</span>
                        <span
                            className="stock-order-meta-value"
                            title={data.created_at ? formatAbsoluteTime(data.created_at) : undefined}
                        >
                            {data.created_at ? formatRelativeTime(data.created_at) : '—'}
                        </span>
                    </div>
                </div>

                {(meta.mockup_image ||
                    meta.assembly_assigns.length > 0 ||
                    meta.cutting_files.length > 0) && (
                    <div className="stock-order-meta-extras">
                        {meta.mockup_image && (
                            <div className="stock-order-media-block">
                                <div className="stock-order-meta-label">Mockup</div>
                                <button
                                    type="button"
                                    className="stock-order-thumb-btn"
                                    onClick={() => setLightbox(meta.mockup_image)}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={meta.mockup_image}
                                        alt="Mockup"
                                        className="stock-order-thumb"
                                    />
                                </button>
                            </div>
                        )}

                        {meta.assembly_assigns.length > 0 && (
                            <div className="stock-order-media-block">
                                <div className="stock-order-meta-label">Assembly</div>
                                <div className="stock-order-asm-list">
                                    {meta.assembly_assigns.map((a) => (
                                        <div key={a.id} className="stock-order-asm-row">
                                            <span className="stock-order-asm-status">
                                                {a.status_display}
                                            </span>
                                            <span>
                                                {a.assigned_to
                                                    .map((u) => atName(u.username || String(u.id)))
                                                    .join(', ') || '—'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {meta.cutting_files.length > 0 && (
                            <div className="stock-order-media-block">
                                <div className="stock-order-meta-label">CNC cutting files</div>
                                <div className="stock-order-cutting-row">
                                    {meta.cutting_files.map((cf) => {
                                        const img = cf.image || cf.line_image;
                                        return (
                                            <div key={cf.id} className="stock-order-cutting-item">
                                                {img ? (
                                                    <button
                                                        type="button"
                                                        className="stock-order-thumb-btn"
                                                        onClick={() => setLightbox(img)}
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={img}
                                                            alt={`Cutting ${cf.id}`}
                                                            className="stock-order-thumb"
                                                        />
                                                    </button>
                                                ) : (
                                                    <div className="stock-order-thumb placeholder">
                                                        No image
                                                    </div>
                                                )}
                                                <div className="stock-order-cutting-meta">
                                                    <span>
                                                        #{cf.id} · {cf.status_display}
                                                    </span>
                                                    {cf.material_name && (
                                                        <span>{cf.material_name}</span>
                                                    )}
                                                    {cf.mass_range_label && (
                                                        <span>Mass {cf.mass_range_label}</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {behalfStep !== 'closed' && behalfUser && (
                <div className="stock-order-modal-backdrop" role="presentation" onClick={closeBehalf}>
                    <div
                        className="stock-order-modal"
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="stock-order-modal-head">
                            <h3>
                                Release on behalf of{' '}
                                {atName(behalfUser.username || String(behalfUser.id))}
                            </h3>
                            <button type="button" className="stock-back-btn" onClick={closeBehalf}>
                                Close
                            </button>
                        </div>
                        <p className="stock-detail-meta">
                            Deduct from {atName(behalfUser.username || String(behalfUser.id))}
                            {behalfInventoryName ? ` · ${behalfInventoryName}` : ' · personal stock'}
                            {behalfStep === 'preview'
                                ? '. Select materials, then send a Telegram approval code.'
                                : '. Enter the Telegram code to confirm the selection below.'}
                        </p>

                        {behalfStep === 'preview' && behalfMaterials.length > 0 && (
                            <div className="stock-order-behalf-select-bar">
                                <button
                                    type="button"
                                    className="stock-order-behalf-link"
                                    onClick={selectAllBehalf}
                                    disabled={behalfBusy || allSelected}
                                >
                                    Select all
                                </button>
                                <button
                                    type="button"
                                    className="stock-order-behalf-link"
                                    onClick={clearBehalfSelection}
                                    disabled={behalfBusy || behalfSelectedIds.size === 0}
                                >
                                    Clear
                                </button>
                                <span className="stock-order-behalf-select-count">
                                    {behalfSelectedIds.size} / {behalfMaterials.length} selected
                                </span>
                            </div>
                        )}

                        {behalfBusy && !behalfMaterials.length ? (
                            <div className="stock-empty">Loading…</div>
                        ) : behalfStep === 'preview' ? (
                            <ul className="stock-order-behalf-list">
                                {behalfMaterials.map((m) => {
                                    const checked = behalfSelectedIds.has(m.bom_id);
                                    return (
                                        <li
                                            key={m.bom_id}
                                            className={`stock-order-behalf-row ${checked ? 'selected' : ''} ${!m.sufficient ? 'short' : ''}`}
                                        >
                                            <label className="stock-order-behalf-check">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    disabled={behalfBusy}
                                                    onChange={() => toggleBehalfBom(m.bom_id)}
                                                />
                                                <span className="stock-order-line-name">
                                                    {m.material_name}
                                                </span>
                                            </label>
                                            <span className={`stock-type-badge ${m.material_type}`}>
                                                {m.material_type}
                                            </span>
                                            <span className="stock-order-line-qty">
                                                need {m.amount} {m.unit}
                                            </span>
                                            <span
                                                className={`stock-order-avail ${m.sufficient ? 'ok' : 'no'}`}
                                            >
                                                have {m.available} {m.unit}
                                            </span>
                                            <button
                                                type="button"
                                                className="stock-order-behalf-one"
                                                disabled={behalfBusy || !m.sufficient}
                                                onClick={() => sendBehalfCode(m.bom_id)}
                                                title="Release this material only"
                                            >
                                                Release this
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <ul className="stock-order-behalf-list code-only">
                                {selectedMaterials.map((m) => (
                                    <li key={`code-${m.bom_id}`} className="stock-order-behalf-row selected">
                                        <span className="stock-order-line-name">{m.material_name}</span>
                                        <span className={`stock-type-badge ${m.material_type}`}>
                                            {m.material_type}
                                        </span>
                                        <span className="stock-order-line-qty">
                                            {m.amount} {m.unit}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {behalfError && <p className="stock-order-behalf-error">{behalfError}</p>}
                        {behalfMsg && <p className="stock-order-behalf-ok">{behalfMsg}</p>}

                        {behalfStep === 'preview' && (
                            <div className="stock-order-modal-actions dual">
                                <button
                                    type="button"
                                    className="stock-order-apply secondary"
                                    disabled={!selectedCanRelease || behalfBusy}
                                    onClick={() => sendBehalfCode('selected')}
                                >
                                    {behalfBusy
                                        ? 'Sending…'
                                        : `Release selected (${behalfSelectedIds.size})`}
                                </button>
                                <button
                                    type="button"
                                    className="stock-order-apply"
                                    disabled={
                                        behalfBusy ||
                                        behalfMaterials.length === 0 ||
                                        !behalfMaterials.every((m) => m.sufficient)
                                    }
                                    onClick={() => sendBehalfCode('all')}
                                >
                                    {behalfBusy ? 'Sending…' : 'Release all'}
                                </button>
                            </div>
                        )}

                        {behalfStep === 'code' && (
                            <div className="stock-order-modal-actions code">
                                <label className="stock-order-meta-label">
                                    4-digit code from{' '}
                                    {atName(behalfUser.username || String(behalfUser.id))}{' '}
                                    (expires in 5 minutes)
                                </label>
                                <input
                                    className="stock-search stock-order-code-input"
                                    inputMode="numeric"
                                    maxLength={4}
                                    placeholder="••••"
                                    value={behalfCode}
                                    onChange={(e) =>
                                        setBehalfCode(e.target.value.replace(/\D/g, '').slice(0, 4))
                                    }
                                />
                                <button
                                    type="button"
                                    className="stock-order-apply"
                                    disabled={behalfCode.length !== 4 || behalfBusy}
                                    onClick={confirmBehalf}
                                >
                                    {behalfBusy
                                        ? 'Releasing…'
                                        : `Confirm release (${selectedMaterials.length})`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {lightbox && (
                <div
                    className="stock-order-lightbox"
                    role="presentation"
                    onClick={() => setLightbox(null)}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={lightbox} alt="Preview" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </motion.div>
    );
}
