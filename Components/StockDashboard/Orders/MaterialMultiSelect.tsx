'use client';

import { useMemo, useState } from 'react';
import type { MaterialPick } from './orderTypes';

type MaterialOption = { id: number; name: string; type: string };

interface Props {
    label: string;
    options: MaterialOption[];
    value: MaterialPick[];
    onChange: (next: MaterialPick[]) => void;
}

export default function MaterialMultiSelect({ label, options, value, onChange }: Props) {
    const [q, setQ] = useState('');
    const selectedIds = useMemo(() => new Set(value.map((v) => v.id)), [value]);

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return options.slice(0, 40);
        return options
            .filter((o) => o.name.toLowerCase().includes(term) || String(o.id) === term)
            .slice(0, 40);
    }, [options, q]);

    const add = (opt: MaterialOption) => {
        if (selectedIds.has(opt.id)) return;
        onChange([
            ...value,
            { id: opt.id, name: opt.name, type: opt.type, bom: true, released: true },
        ]);
        setQ('');
    };

    const remove = (id: number) => {
        onChange(value.filter((v) => v.id !== id));
    };

    const patch = (id: number, patchFields: Partial<MaterialPick>) => {
        onChange(
            value.map((v) => {
                if (v.id !== id) return v;
                const next = { ...v, ...patchFields };
                // Keep at least one of bom/released checked
                if (!next.bom && !next.released) {
                    if ('bom' in patchFields) next.released = true;
                    else next.bom = true;
                }
                return next;
            })
        );
    };

    return (
        <div className="stock-order-mat-select">
            <div className="stock-order-filter-label">{label}</div>
            <input
                className="stock-search"
                placeholder="Search materials to add…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
            />
            {q.trim() && (
                <div className="stock-order-mat-dropdown">
                    {filtered.length === 0 ? (
                        <div className="stock-empty" style={{ padding: 8 }}>
                            No materials match.
                        </div>
                    ) : (
                        filtered.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                className="stock-order-mat-option"
                                disabled={selectedIds.has(opt.id)}
                                onClick={() => add(opt)}
                            >
                                <span>{opt.name}</span>
                                <span className={`stock-type-badge ${opt.type}`}>{opt.type}</span>
                            </button>
                        ))
                    )}
                </div>
            )}
            <div className="stock-order-mat-selected">
                {value.length === 0 && (
                    <span className="stock-detail-meta">None selected</span>
                )}
                {value.map((m) => (
                    <div key={m.id} className="stock-order-mat-chip">
                        <div className="stock-order-mat-chip-head">
                            <strong>{m.name}</strong>
                            <span className={`stock-type-badge ${m.type}`}>{m.type}</span>
                            <button
                                type="button"
                                className="stock-order-chip-remove"
                                onClick={() => remove(m.id)}
                                aria-label="Remove"
                            >
                                ×
                            </button>
                        </div>
                        <div className="stock-order-mat-checks">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={m.bom}
                                    onChange={(e) => patch(m.id, { bom: e.target.checked })}
                                />
                                BOM
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={m.released}
                                    onChange={(e) => patch(m.id, { released: e.target.checked })}
                                />
                                Released
                            </label>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
