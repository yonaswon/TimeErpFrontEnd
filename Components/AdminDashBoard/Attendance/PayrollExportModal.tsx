'use client';
import React, { useState, useRef } from 'react';
import { X, Download, GripVertical, CheckSquare, Square } from 'lucide-react';
import { PayrollRow } from './attendanceTypes';
import { ExportColumn, ALL_PAYROLL_COLUMNS, exportPayrollExcel } from './attendanceExport';
import { formatSalary } from './attendanceUtils';

interface PayrollExportModalProps {
    rows: PayrollRow[];
    period: string;
    onClose: () => void;
}

function getDisplayValue(row: PayrollRow, key: string): string {
    switch (key) {
        case 'name':            return row.name;
        case 'targetNetPay':    return formatSalary(row.targetNetPay);
        case 'transport':       return formatSalary(row.transport);
        case 'expectedHours':   return `${row.expectedHours}h`;
        case 'penaltyHours':    return row.penaltyHours > 0 ? `−${row.penaltyHours.toFixed(2)}h` : '0h';
        case 'hourPenalty':     return row.hourPenalty < 0 ? `−${formatSalary(Math.abs(row.hourPenalty))}` : '—';
        case 'overtimeTotal':   return (row.overtimeTotal ?? 0) > 0 ? `+${formatSalary(row.overtimeTotal ?? 0)}` : '—';
        case 'loanAmount':      return (row.loanAmount ?? 0) > 0 ? formatSalary(row.loanAmount ?? 0) : '—';
        case 'finalNetPay':     return formatSalary(row.finalNetPay);
        case 'totalNetPay':     return formatSalary(row.totalNetPay ?? row.finalNetPay);
        case 'grossSalary':     return formatSalary(row.grossSalary);
        case 'incomeTax':       return formatSalary(row.incomeTax);
        case 'pensionEmployee': return formatSalary(row.pensionEmployee);
        case 'pensionEmployer': return formatSalary(row.pensionEmployer);
        case 'totalDeduction':  return formatSalary(row.totalDeduction);
        default:                return '—';
    }
}

export default function PayrollExportModal({ rows, period, onClose }: PayrollExportModalProps) {
    const [columns, setColumns] = useState<ExportColumn[]>(() =>
        ALL_PAYROLL_COLUMNS.map((c) => ({ ...c }))
    );
    const dragIdx = useRef<number | null>(null);
    const dragOverIdx = useRef<number | null>(null);

    const toggleCol = (key: string) =>
        setColumns((prev) => prev.map((c) => c.key === key ? { ...c, selected: !c.selected } : c));

    const selectAll = () => setColumns((prev) => prev.map((c) => ({ ...c, selected: true })));
    const deselectAll = () => setColumns((prev) => prev.map((c) => ({ ...c, selected: false })));

    const onDragStart = (idx: number) => { dragIdx.current = idx; };
    const onDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        dragOverIdx.current = idx;
    };
    const onDrop = () => {
        const from = dragIdx.current;
        const to = dragOverIdx.current;
        if (from === null || to === null || from === to) return;
        setColumns((prev) => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
        dragIdx.current = null;
        dragOverIdx.current = null;
    };

    const selectedCols = columns.filter((c) => c.selected);
    const previewRows = rows.slice(0, 5);

    const TH: React.CSSProperties = {
        padding: '7px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        color: 'var(--admin-text-secondary)', borderBottom: '2px solid var(--admin-border)',
        whiteSpace: 'nowrap', background: 'var(--admin-bg)',
    };
    const TD: React.CSSProperties = {
        padding: '6px 10px', fontSize: 11, borderBottom: '1px solid var(--admin-border)',
        whiteSpace: 'nowrap', color: 'var(--admin-text)',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="flex flex-col rounded-2xl shadow-2xl"
                style={{ background: '#1e2433', border: '1px solid #2d3548', width: '95vw', maxWidth: 900, maxHeight: '92vh', overflow: 'hidden' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b"
                    style={{ borderColor: '#2d3548' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(22,163,74,0.15)' }}>
                            <Download size={16} style={{ color: '#16A34A' }} />
                        </div>
                        <div>
                            <p className="font-semibold text-sm" style={{ color: '#f1f5f9' }}>Export Payroll</p>
                            <p className="text-xs" style={{ color: '#94a3b8' }}>{period} · {rows.length} employees · {selectedCols.length} columns selected</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* Column selector */}
                    <div className="px-6 pt-5 pb-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                                Columns — drag to reorder
                            </p>
                            <div className="flex gap-2">
                                <button onClick={selectAll}
                                    className="flex items-center gap-1 text-xs font-medium rounded-lg px-3 py-1"
                                    style={{ background: '#2d3548', border: '1px solid #3d4a63', color: '#94a3b8', cursor: 'pointer' }}>
                                    <CheckSquare size={11} />Select All
                                </button>
                                <button onClick={deselectAll}
                                    className="flex items-center gap-1 text-xs font-medium rounded-lg px-3 py-1"
                                    style={{ background: '#2d3548', border: '1px solid #3d4a63', color: '#94a3b8', cursor: 'pointer' }}>
                                    <Square size={11} />Deselect All
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {columns.map((col, idx) => (
                                <div
                                    key={col.key}
                                    draggable
                                    onDragStart={() => onDragStart(idx)}
                                    onDragOver={(e) => onDragOver(e, idx)}
                                    onDrop={onDrop}
                                    onClick={() => toggleCol(col.key)}
                                    className="flex items-center gap-1.5 rounded-lg select-none cursor-pointer"
                                    style={{
                                        padding: '5px 10px',
                                        fontSize: 12, fontWeight: 500,
                                        background: col.selected ? 'rgba(37,99,235,0.2)' : '#2d3548',
                                        border: `1px solid ${col.selected ? 'rgba(37,99,235,0.5)' : '#3d4a63'}`,
                                        color: col.selected ? '#93c5fd' : '#94a3b8',
                                        transition: 'all 0.12s',
                                    }}
                                >
                                    <GripVertical size={11} style={{ opacity: 0.4, cursor: 'grab', flexShrink: 0 }} />
                                    {col.selected
                                        ? <CheckSquare size={11} style={{ flexShrink: 0 }} />
                                        : <Square size={11} style={{ flexShrink: 0 }} />}
                                    {col.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="px-6 pb-5">
                        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>
                            Preview (first {Math.min(5, rows.length)} rows)
                        </p>
                        {selectedCols.length === 0 ? (
                            <div className="flex items-center justify-center h-20 rounded-xl border text-sm"
                                style={{ borderColor: '#2d3548', color: '#94a3b8' }}>
                                Select at least one column to preview
                            </div>
                        ) : (
                            <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#2d3548' }}>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse" style={{ fontSize: 11 }}>
                                        <thead>
                                            <tr>
                                                {selectedCols.map((c) => (
                                                    <th key={c.key} style={{ ...TH, background: '#161c2d', color: '#94a3b8', borderBottom: '2px solid #2d3548' }}>{c.label}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewRows.map((row, i) => (
                                                <tr key={row.zkt_user_id} style={{ background: i % 2 === 0 ? '#1e2433' : '#161c2d' }}>
                                                    {selectedCols.map((c) => (
                                                        <td key={c.key} style={{ ...TD, color: '#e2e8f0', borderBottom: '1px solid #2d3548' }}>{getDisplayValue(row, c.key)}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                            {/* Totals preview */}
                                            <tr style={{ background: '#161c2d', borderTop: '2px solid #2d3548' }}>
                                                {selectedCols.map((c) => {
                                                    if (c.key === 'name') return <td key={c.key} style={{ ...TD, fontWeight: 700, color: '#f1f5f9', borderBottom: '1px solid #2d3548' }}>TOTAL</td>;
                                                    if (['targetNetPay','transport','hourPenalty','overtimeTotal','loanAmount','finalNetPay','totalNetPay','grossSalary','incomeTax','pensionEmployee','pensionEmployer','totalDeduction'].includes(c.key)) {
                                                        const total = rows.reduce((s, r) => {
                                                            const v = r[c.key as keyof PayrollRow];
                                                            return s + (typeof v === 'number' ? v : 0);
                                                        }, 0);
                                                        return <td key={c.key} style={{ ...TD, fontWeight: 700, color: '#f1f5f9', borderBottom: '1px solid #2d3548' }}>{formatSalary(total)}</td>;
                                                    }
                                                    return <td key={c.key} style={{ ...TD, color: '#94a3b8', borderBottom: '1px solid #2d3548' }}>—</td>;
                                                })}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t"
                    style={{ borderColor: '#2d3548', background: '#161c2d' }}>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>
                        {selectedCols.length} of {columns.length} columns · {rows.length} employees
                    </p>
                    <div className="flex gap-2">
                        <button onClick={onClose}
                            className="rounded-xl text-sm font-medium"
                            style={{ padding: '8px 18px', background: '#2d3548', border: '1px solid #3d4a63', color: '#94a3b8', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button
                            disabled={selectedCols.length === 0}
                            onClick={() => { exportPayrollExcel(rows, period, columns); onClose(); }}
                            className="flex items-center gap-2 rounded-xl text-sm font-semibold"
                            style={{ padding: '8px 20px', background: selectedCols.length === 0 ? '#3d4a63' : '#2563EB', color: '#fff', border: 'none', cursor: selectedCols.length === 0 ? 'not-allowed' : 'pointer' }}>
                            <Download size={14} />Export Excel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
