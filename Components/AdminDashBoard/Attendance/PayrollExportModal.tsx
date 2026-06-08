'use client';
import React from 'react';
import { X, Download } from 'lucide-react';
import { PayrollRow } from './attendanceTypes';
import { exportPayrollExcel } from './attendanceExport';
import { formatSalary } from './attendanceUtils';

interface PayrollExportModalProps {
    rows: PayrollRow[];
    period: string;
    onClose: () => void;
}

export default function PayrollExportModal({ rows, period, onClose }: PayrollExportModalProps) {
    const previewRows = rows.slice(0, 5);
    const totals = {
        grossPay: rows.reduce((s, r) => s + r.grossPay, 0),
        netPay: rows.reduce((s, r) => s + r.netPay, 0),
        incomeTax: rows.reduce((s, r) => s + r.incomeTax, 0),
    };

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
                style={{ background: '#1e2433', border: '1px solid #2d3548', width: '95vw', maxWidth: 700, maxHeight: '92vh', overflow: 'hidden' }}>

                <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#2d3548' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(22,163,74,0.15)' }}>
                            <Download size={16} style={{ color: '#16A34A' }} />
                        </div>
                        <div>
                            <p className="font-semibold text-sm" style={{ color: '#f1f5f9' }}>Export Payroll</p>
                            <p className="text-xs" style={{ color: '#94a3b8' }}>{period} · {rows.length} employees · matches Payroll_May_2026 format</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>
                        Preview (first {Math.min(5, rows.length)} employees)
                    </p>
                    <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#2d3548' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse" style={{ fontSize: 11 }}>
                                <thead>
                                    <tr>
                                        {['Name', 'Basic Salary', 'Gross Pay', 'Income Tax', 'Net Pay'].map((h) => (
                                            <th key={h} style={{ ...TH, background: '#161c2d', color: '#94a3b8', borderBottom: '2px solid #2d3548' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewRows.map((row, i) => (
                                        <tr key={row.zkt_user_id} style={{ background: i % 2 === 0 ? '#1e2433' : '#161c2d' }}>
                                            <td style={{ ...TD, color: '#e2e8f0', borderBottom: '1px solid #2d3548' }}>{row.name}</td>
                                            <td style={{ ...TD, color: '#e2e8f0', borderBottom: '1px solid #2d3548' }}>{formatSalary(row.basicSalary)}</td>
                                            <td style={{ ...TD, color: '#e2e8f0', borderBottom: '1px solid #2d3548' }}>{formatSalary(row.grossPay)}</td>
                                            <td style={{ ...TD, color: '#e2e8f0', borderBottom: '1px solid #2d3548' }}>{formatSalary(row.incomeTax)}</td>
                                            <td style={{ ...TD, color: '#16A34A', fontWeight: 700, borderBottom: '1px solid #2d3548' }}>{formatSalary(row.netPay)}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ background: '#161c2d', borderTop: '2px solid #2d3548' }}>
                                        <td style={{ ...TD, fontWeight: 700, color: '#f1f5f9' }}>TOTAL</td>
                                        <td style={{ ...TD, color: '#94a3b8' }}>—</td>
                                        <td style={{ ...TD, fontWeight: 700, color: '#f1f5f9' }}>{formatSalary(totals.grossPay)}</td>
                                        <td style={{ ...TD, fontWeight: 700, color: '#f1f5f9' }}>{formatSalary(totals.incomeTax)}</td>
                                        <td style={{ ...TD, fontWeight: 700, color: '#16A34A' }}>{formatSalary(totals.netPay)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <p className="text-xs mt-4" style={{ color: '#94a3b8' }}>
                        Export includes payroll sheet with journal voucher section matching the reference Excel.
                    </p>
                </div>

                <div className="flex items-center justify-between px-6 py-4 border-t"
                    style={{ borderColor: '#2d3548', background: '#161c2d' }}>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>{rows.length} employees</p>
                    <div className="flex gap-2">
                        <button onClick={onClose}
                            className="rounded-xl text-sm font-medium"
                            style={{ padding: '8px 18px', background: '#2d3548', border: '1px solid #3d4a63', color: '#94a3b8', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button
                            onClick={() => { void exportPayrollExcel(rows, period).then(onClose); }}
                            className="flex items-center gap-2 rounded-xl text-sm font-semibold"
                            style={{ padding: '8px 20px', background: '#2563EB', color: '#fff', border: 'none', cursor: 'pointer' }}>
                            <Download size={14} />Export Excel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
