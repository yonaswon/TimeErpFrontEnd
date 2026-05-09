'use client';
import React, { useMemo, useState } from 'react';
import {
    Clock, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
    ChevronDown, ChevronUp, Edit3, User, Zap, Timer
} from 'lucide-react';
import { EmployeeStat, DailyLog, EditTarget, LocalEditsMap } from './attendanceTypes';
import { calculateExpectedHours, mergeEditsIntoLogs, recalculateTotalHours } from './attendanceUtils';

interface EmployeeCardProps {
    employee: EmployeeStat;
    localEdits: LocalEditsMap;
    onEditClick: (target: EditTarget) => void;
}

export default function EmployeeCard({ employee, localEdits, onEditClick }: EmployeeCardProps) {
    const [expanded, setExpanded] = useState(true);

    const mergedLogs = useMemo(
        () => mergeEditsIntoLogs(employee.daily_logs, localEdits, employee.zkt_user_id),
        [employee.daily_logs, localEdits, employee.zkt_user_id]
    );

    const totalHours = useMemo(() => recalculateTotalHours(mergedLogs), [mergedLogs]);
    const expectedHours = calculateExpectedHours(employee.working_days);
    const diff = totalHours - expectedHours;
    const attentionDays = mergedLogs.filter((l) => l.missed_in || l.missed_out).length;

    return (
        <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: 'var(--admin-card)', borderColor: 'var(--admin-border)' }}
        >
            {/* Card Header */}
            <div
                className="px-6 py-4 flex items-start justify-between gap-4 cursor-pointer select-none"
                style={{ borderBottom: '1px solid var(--admin-border)' }}
                onClick={() => setExpanded((v) => !v)}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
                        style={{ background: 'rgba(37,99,235,0.12)', color: 'var(--admin-primary, #2563EB)' }}
                    >
                        {employee.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <h3
                            className="font-semibold text-base truncate"
                            style={{ color: 'var(--admin-text)' }}
                        >
                            {employee.name}
                        </h3>
                        <p className="text-xs truncate" style={{ color: 'var(--admin-text-secondary)' }}>
                            {employee.telegram_username !== 'not connected'
                                ? `@${employee.telegram_username}`
                                : 'Telegram not connected'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {/* Attention badge */}
                    {attentionDays > 0 && (
                        <div
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                            style={{
                                background: 'rgba(245,158,11,0.12)',
                                color: 'var(--admin-warning, #F59E0B)',
                                border: '1px solid rgba(245,158,11,0.25)',
                            }}
                        >
                            <AlertTriangle size={12} />
                            {attentionDays} day{attentionDays !== 1 ? 's' : ''} need attention
                        </div>
                    )}
                    {expanded ? (
                        <ChevronUp size={18} style={{ color: 'var(--admin-text-secondary)' }} />
                    ) : (
                        <ChevronDown size={18} style={{ color: 'var(--admin-text-secondary)' }} />
                    )}
                </div>
            </div>

            {/* Summary stats row */}
            <div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px"
                style={{ background: 'var(--admin-border)' }}
            >
                {[
                    { label: 'Days', value: employee.working_days, icon: <User size={13} />, color: 'var(--admin-primary, #2563EB)' },
                    { label: 'Total Hrs', value: `${totalHours.toFixed(1)}h`, icon: <Clock size={13} />, color: 'var(--admin-primary, #2563EB)' },
                    { label: 'Avg Hrs', value: `${employee.avg_hours.toFixed(1)}h`, icon: <Timer size={13} />, color: 'var(--admin-text-secondary)' },
                    { label: 'Delays', value: employee.delays, icon: <AlertTriangle size={13} />, color: 'var(--admin-warning, #F59E0B)' },
                    { label: 'Early', value: employee.early_birds, icon: <Zap size={13} />, color: 'var(--admin-success, #16A34A)' },
                    {
                        label: 'vs Expected',
                        value: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}h`,
                        icon: diff >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />,
                        color: diff >= 0 ? 'var(--admin-success, #16A34A)' : 'var(--admin-danger, #DC2626)',
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="flex flex-col gap-1 px-4 py-3"
                        style={{ background: 'var(--admin-card)' }}
                    >
                        <div className="flex items-center gap-1.5" style={{ color: stat.color }}>
                            {stat.icon}
                            <span className="text-xs font-medium" style={{ color: 'var(--admin-text-secondary)' }}>
                                {stat.label}
                            </span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: stat.color }}>
                            {stat.value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Daily log table */}
            {expanded && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr style={{ background: 'var(--admin-bg)' }}>
                                {['Date', 'Check In', 'Check Out', 'All Punches', 'Hours'].map((h) => (
                                    <th
                                        key={h}
                                        className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                                        style={{
                                            color: 'var(--admin-text-secondary)',
                                            borderBottom: '1px solid var(--admin-border)',
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                                <th
                                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                                    style={{
                                        color: 'var(--admin-text-secondary)',
                                        borderBottom: '1px solid var(--admin-border)',
                                    }}
                                >
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {mergedLogs.map((log, i) => {
                                const isAttention = log.missed_in || log.missed_out;
                                const editKey = `${employee.zkt_user_id}:${log.date}`;
                                const isEdited = !!localEdits[editKey];

                                return (
                                    <DailyLogRow
                                        key={i}
                                        log={log}
                                        isAttention={isAttention}
                                        isEdited={isEdited}
                                        onEditClick={() => {
                                            const missingField = log.missed_in ? 'check_in' : 'check_out';
                                            const existingTime = log.missed_in ? log.check_out : log.check_in;
                                            onEditClick({
                                                employeeId: employee.zkt_user_id,
                                                date: log.date,
                                                missingField,
                                                existingTime,
                                            });
                                        }}
                                    />
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Hours summary footer */}
            <div
                className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t"
                style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg)' }}
            >
                <div className="flex items-center gap-6 text-sm">
                    <div>
                        <span style={{ color: 'var(--admin-text-secondary)' }}>Actual: </span>
                        <strong style={{ color: 'var(--admin-text)' }}>{totalHours.toFixed(2)}h</strong>
                    </div>
                    <div>
                        <span style={{ color: 'var(--admin-text-secondary)' }}>Expected: </span>
                        <strong style={{ color: 'var(--admin-text)' }}>{expectedHours}h</strong>
                    </div>
                </div>
                <div
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{
                        background: diff >= 0 ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                        color: diff >= 0 ? 'var(--admin-success, #16A34A)' : 'var(--admin-danger, #DC2626)',
                    }}
                >
                    {diff >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                    {diff >= 0 ? '+' : ''}{diff.toFixed(2)}h vs expected
                </div>
            </div>
        </div>
    );
}

// ─── DailyLogRow ────────────────────────────────────────────────────────────

interface DailyLogRowProps {
    log: DailyLog;
    isAttention: boolean;
    isEdited: boolean;
    onEditClick: () => void;
}

function DailyLogRow({ log, isAttention, isEdited, onEditClick }: DailyLogRowProps) {
    return (
        <tr
            style={{
                background: isAttention ? 'rgba(245,158,11,0.07)' : 'transparent',
                borderBottom: '1px solid var(--admin-border)',
                borderLeft: isEdited ? '3px solid var(--admin-primary, #2563EB)' : '3px solid transparent',
            }}
        >
            {/* Date */}
            <td className="px-4 py-2.5 whitespace-nowrap font-medium text-xs" style={{ color: 'var(--admin-text)' }}>
                {log.date}
                {isEdited && (
                    <span
                        className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-semibold"
                        style={{ background: 'rgba(37,99,235,0.12)', color: 'var(--admin-primary, #2563EB)' }}
                    >
                        edited
                    </span>
                )}
            </td>

            {/* Check In */}
            <td className="px-4 py-2.5 whitespace-nowrap text-xs font-semibold">
                {log.missed_in ? (
                    <span style={{ color: 'var(--admin-danger, #DC2626)' }}>Missed</span>
                ) : (
                    <span style={{ color: 'var(--admin-success, #16A34A)' }}>{log.check_in}</span>
                )}
            </td>

            {/* Check Out */}
            <td className="px-4 py-2.5 whitespace-nowrap text-xs font-semibold">
                {log.missed_out ? (
                    <span style={{ color: 'var(--admin-danger, #DC2626)' }}>Missed</span>
                ) : (
                    <span style={{ color: 'var(--admin-primary, #2563EB)' }}>{log.check_out}</span>
                )}
            </td>

            {/* All Punches */}
            <td className="px-4 py-2.5">
                <div className="flex flex-wrap gap-1">
                    {log.all_punches.slice(0, 6).map((p, idx) => (
                        <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{
                                background: 'var(--admin-bg)',
                                border: '1px solid var(--admin-border)',
                                color: 'var(--admin-text-secondary)',
                            }}
                        >
                            {p}
                        </span>
                    ))}
                    {log.all_punches.length > 6 && (
                        <span className="text-[10px]" style={{ color: 'var(--admin-text-secondary)' }}>
                            +{log.all_punches.length - 6}
                        </span>
                    )}
                </div>
            </td>

            {/* Hours */}
            <td className="px-4 py-2.5 whitespace-nowrap">
                <span
                    className="text-xs font-bold px-2 py-1 rounded-lg"
                    style={{
                        background: log.hours > 0 ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                        color: log.hours > 0 ? 'var(--admin-success, #16A34A)' : 'var(--admin-danger, #DC2626)',
                    }}
                >
                    {log.hours > 0 ? `${log.hours}h` : '0h'}
                </span>
            </td>

            {/* Action */}
            <td className="px-4 py-2.5">
                {isAttention && (
                    <button
                        onClick={onEditClick}
                        className="flex items-center gap-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                        style={{
                            padding: '6px 10px',
                            background: 'rgba(245,158,11,0.12)',
                            color: 'var(--admin-warning, #F59E0B)',
                            border: '1px solid rgba(245,158,11,0.25)',
                        }}
                    >
                        <Edit3 size={12} />
                        Edit
                    </button>
                )}
            </td>
        </tr>
    );
}
