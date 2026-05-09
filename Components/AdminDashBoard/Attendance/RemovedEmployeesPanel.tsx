'use client';
import React from 'react';
import { UserX, RotateCcw } from 'lucide-react';

export interface HiddenEmployee {
    zkt_user_id: string;
    name: string;
    is_hidden: boolean;
    hidden_at: string | null;
}

interface RemovedEmployeesPanelProps {
    hiddenEmployees: HiddenEmployee[];
    onRestore: (zktUserId: string) => void;
}

export default function RemovedEmployeesPanel({ hiddenEmployees, onRestore }: RemovedEmployeesPanelProps) {
    if (hiddenEmployees.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border text-center"
                style={{ background: 'var(--admin-card)', borderColor: 'var(--admin-border)' }}>
                <UserX size={40} style={{ color: 'var(--admin-border)', marginBottom: 16 }} />
                <p className="font-semibold" style={{ color: 'var(--admin-text)' }}>No removed employees</p>
                <p className="text-sm mt-1" style={{ color: 'var(--admin-text-secondary)' }}>
                    Employees you remove from the attendance list will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--admin-card)', borderColor: 'var(--admin-border)' }}>
            <div className="px-5 py-3 border-b flex items-center gap-2"
                style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg)' }}>
                <UserX size={14} style={{ color: 'var(--admin-danger, #DC2626)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--admin-text)' }}>
                    Removed Employees ({hiddenEmployees.length})
                </span>
            </div>
            <table className="w-full border-collapse" style={{ fontSize: 13 }}>
                <thead>
                    <tr style={{ background: 'var(--admin-bg)' }}>
                        {['Employee', 'ID', 'Removed At', 'Action'].map((h) => (
                            <th key={h} style={{
                                padding: '8px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                color: 'var(--admin-text-secondary)', borderBottom: '2px solid var(--admin-border)',
                            }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {hiddenEmployees.map((emp, i) => (
                        <tr key={emp.zkt_user_id} style={{
                            background: i % 2 === 0 ? 'var(--admin-card)' : 'var(--admin-bg)',
                            borderBottom: '1px solid var(--admin-border)',
                        }}>
                            <td style={{ padding: '10px 16px' }}>
                                <div className="flex items-center gap-2">
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 6, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: 11,
                                        background: 'rgba(220,38,38,0.1)', color: 'var(--admin-danger, #DC2626)',
                                        flexShrink: 0,
                                    }}>
                                        {emp.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{emp.name}</span>
                                </div>
                            </td>
                            <td style={{ padding: '10px 16px', color: 'var(--admin-text-secondary)', fontFamily: 'monospace', fontSize: 11 }}>
                                {emp.zkt_user_id}
                            </td>
                            <td style={{ padding: '10px 16px', color: 'var(--admin-text-secondary)', fontSize: 12 }}>
                                {emp.hidden_at
                                    ? new Date(emp.hidden_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                    : '—'}
                            </td>
                            <td style={{ padding: '10px 16px' }}>
                                <button
                                    onClick={() => onRestore(emp.zkt_user_id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                        background: 'rgba(22,163,74,0.1)', color: 'var(--admin-success, #16A34A)',
                                        border: '1px solid rgba(22,163,74,0.25)', cursor: 'pointer',
                                    }}
                                >
                                    <RotateCcw size={11} />Restore
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
