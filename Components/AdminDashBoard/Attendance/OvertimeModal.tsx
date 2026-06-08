'use client';
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock } from 'lucide-react';
import { OvertimeEntry, OvertimeType } from './attendanceTypes';
import { calculateOvertimeAmount, formatSalary } from './attendanceUtils';

interface OvertimeModalProps {
    employeeName: string;
    basicSalary: number;
    entries: OvertimeEntry[];
    onSave: (entries: OvertimeEntry[]) => void;
    onClose: () => void;
}

const OT_TYPES: { value: OvertimeType; label: string; multiplier: number }[] = [
    { value: 'after_work', label: 'After Work',  multiplier: 1.75 },
    { value: 'sunday',     label: 'Sunday',      multiplier: 2.0  },
    { value: 'holiday',    label: 'Holiday',     multiplier: 2.5  },
];

function newEntry(): OvertimeEntry {
    return { id: Math.random().toString(36).slice(2), hours: 0, type: 'after_work', amount: 0 };
}

export default function OvertimeModal({ employeeName, basicSalary, entries, onSave, onClose }: OvertimeModalProps) {
    const [rows, setRows] = useState<OvertimeEntry[]>(() =>
        entries.length > 0 ? entries.map((e) => ({ ...e })) : [newEntry()]
    );

    // Recalculate amounts whenever rows change
    useEffect(() => {
        setRows((prev) => prev.map((r) => ({
            ...r,
            amount: calculateOvertimeAmount(basicSalary, r.hours, r.type),
        })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [basicSalary]);

    const updateRow = (id: string, field: keyof OvertimeEntry, value: string | number | OvertimeType) => {
        setRows((prev) => prev.map((r) => {
            if (r.id !== id) return r;
            const updated = { ...r, [field]: value };
            updated.amount = calculateOvertimeAmount(basicSalary, Number(updated.hours), updated.type);
            return updated;
        }));
    };

    const addRow = () => setRows((prev) => [...prev, newEntry()]);
    const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

    const total = rows.reduce((s, r) => s + r.amount, 0);
    const hourlyRate = basicSalary > 0 ? basicSalary / 30 / 8 : 0;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="flex flex-col rounded-2xl shadow-2xl"
                style={{
                    background: 'var(--admin-card)', border: '1px solid var(--admin-border)',
                    width: '100%', maxWidth: 620, maxHeight: '90vh', overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b"
                    style={{ borderColor: 'var(--admin-border)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(245,158,11,0.12)' }}>
                            <Clock size={16} style={{ color: 'var(--admin-warning, #F59E0B)' }} />
                        </div>
                        <div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--admin-text)' }}>
                                Overtime — {employeeName}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--admin-text-secondary)' }}>
                                Hourly rate: {formatSalary(hourlyRate)} &nbsp;·&nbsp; Basic salary: {formatSalary(basicSalary)}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-secondary)' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
                    {/* Column headers */}
                    <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 160px 120px 32px' }}>
                        {['Type', 'Hours', 'Amount', ''].map((h) => (
                            <span key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-secondary)' }}>{h}</span>
                        ))}
                    </div>

                    {rows.map((row) => (
                        <div key={row.id} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 160px 120px 32px' }}>
                            {/* Type */}
                            <select
                                value={row.type}
                                onChange={(e) => updateRow(row.id, 'type', e.target.value as OvertimeType)}
                                className="rounded-lg px-3 text-sm outline-none"
                                style={{ height: 36, background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                            >
                                {OT_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label} (×{t.multiplier})
                                    </option>
                                ))}
                            </select>

                            {/* Hours */}
                            <input
                                type="number" min="0" step="0.5" placeholder="0"
                                value={row.hours || ''}
                                onChange={(e) => updateRow(row.id, 'hours', parseFloat(e.target.value) || 0)}
                                className="rounded-lg px-3 text-sm outline-none"
                                style={{ height: 36, background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                            />

                            {/* Amount (read-only) */}
                            <div className="rounded-lg px-3 flex items-center text-sm font-semibold"
                                style={{ height: 36, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--admin-warning, #F59E0B)' }}>
                                {row.amount > 0 ? `+${formatSalary(row.amount)}` : '—'}
                            </div>

                            {/* Delete */}
                            <button
                                onClick={() => removeRow(row.id)}
                                disabled={rows.length === 1}
                                style={{ background: 'none', border: 'none', cursor: rows.length === 1 ? 'not-allowed' : 'pointer', color: 'var(--admin-danger, #DC2626)', opacity: rows.length === 1 ? 0.3 : 1, padding: 4 }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={addRow}
                        className="flex items-center gap-2 text-sm font-medium rounded-xl"
                        style={{ padding: '8px 14px', background: 'var(--admin-bg)', border: '1px dashed var(--admin-border)', color: 'var(--admin-text-secondary)', cursor: 'pointer', alignSelf: 'flex-start' }}
                    >
                        <Plus size={13} />Add overtime entry
                    </button>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t"
                    style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg)' }}>
                    <div>
                        <span className="text-xs" style={{ color: 'var(--admin-text-secondary)' }}>Total overtime: </span>
                        <span className="text-sm font-bold" style={{ color: 'var(--admin-warning, #F59E0B)' }}>
                            +{formatSalary(total)}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose}
                            className="rounded-xl text-sm font-medium"
                            style={{ padding: '8px 18px', background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button
                            onClick={() => { onSave(rows.filter((r) => r.hours > 0)); onClose(); }}
                            className="rounded-xl text-sm font-semibold"
                            style={{ padding: '8px 20px', background: 'var(--admin-primary, #2563EB)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
