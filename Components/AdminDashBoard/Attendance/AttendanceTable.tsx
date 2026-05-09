'use client';
import React, { useState, useMemo } from 'react';
import {
    AlertTriangle, Edit3, ChevronDown, ChevronUp,
    Umbrella, BookOpen, X, Download, Search,
    ChevronsDownUp, ChevronsUpDown, Clock, UserMinus,
} from 'lucide-react';
import { EmployeeStat, EditTarget, LocalEditsMap, HolidaySet, DayExemptionMap, DayExemption } from './attendanceTypes';
import {
    mergeEditsIntoLogs, isDayExempted,
    calculateDayPenaltyMinutes, calculateTotalPenaltyHours, formatPenaltyMinutes,
    calculateExpectedHoursFromLogs,
} from './attendanceUtils';

interface AttendanceTableProps {
    employees: EmployeeStat[];
    localEdits: LocalEditsMap;
    holidays: HolidaySet;
    exemptions: DayExemptionMap;
    onEditClick: (target: EditTarget) => void;
    onSetExemption: (employeeId: string, date: string, type: DayExemption | null) => void;
    onExport: () => void;
    onBulkFillCheckout: (employeeId: string) => void;
    onFillDefaultDay: (employeeId: string, date: string) => void;
    onHideEmployee: (employeeId: string) => void;
}

const LUNCH_OUT = '07:00 AM';
const LUNCH_IN  = '08:00 AM';

const TH: React.CSSProperties = {
    padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.05em',
    color: 'var(--admin-text-secondary)', borderBottom: '2px solid var(--admin-border)',
    whiteSpace: 'nowrap', background: 'var(--admin-bg)',
};

export default function AttendanceTable({
    employees, localEdits, holidays, exemptions, onEditClick, onSetExemption, onExport, onBulkFillCheckout, onFillDefaultDay, onHideEmployee,
}: AttendanceTableProps) {
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        employees.forEach((e) => { init[e.zkt_user_id] = true; });
        return init;
    });
    const [search, setSearch] = useState('');

    const toggle = (id: string) => setCollapsed((p) => ({ ...p, [id]: !p[id] }));
    const collapseAll = () => {
        const next: Record<string, boolean> = {};
        employees.forEach((e) => { next[e.zkt_user_id] = true; });
        setCollapsed(next);
    };
    const expandAll = () => {
        const next: Record<string, boolean> = {};
        employees.forEach((e) => { next[e.zkt_user_id] = false; });
        setCollapsed(next);
    };

    const filtered = useMemo(() =>
        search.trim()
            ? employees.filter((e) => e.name.toLowerCase().includes(search.trim().toLowerCase()))
            : employees,
        [employees, search]
    );

    return (
        <div className="flex flex-col gap-3">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-secondary)', pointerEvents: 'none' }} />
                    <input
                        type="text" placeholder="Search by name…" value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl text-sm outline-none"
                        style={{ height: 36, paddingLeft: 30, paddingRight: 12, background: 'var(--admin-card)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                    />
                </div>
                <button onClick={collapseAll} className="flex items-center gap-1.5 rounded-xl text-xs font-semibold"
                    style={{ padding: '7px 14px', background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}>
                    <ChevronsDownUp size={13} />Collapse All
                </button>
                <button onClick={expandAll} className="flex items-center gap-1.5 rounded-xl text-xs font-semibold"
                    style={{ padding: '7px 14px', background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}>
                    <ChevronsUpDown size={13} />Expand All
                </button>
                <div style={{ flex: 1 }} />
                <button onClick={onExport} className="flex items-center gap-2 rounded-xl text-sm font-semibold"
                    style={{ padding: '8px 18px', background: 'var(--admin-primary, #2563EB)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    <Download size={14} />Export Excel
                </button>
            </div>

            {/* Table */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--admin-card)', borderColor: 'var(--admin-border)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse" style={{ minWidth: 1000, fontSize: 12 }}>
                        <thead>
                            <tr>
                                {[
                                    'Employee / Date', 'Time In', 'Lunch Out', 'Lunch In', 'Time Out',
                                    'Late (morn.)', 'Early Leave', 'Day Penalty',
                                    'Status', 'Actions'
                                ].map((h) => <th key={h} style={TH}>{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((emp) => {
                                const mergedLogs = mergeEditsIntoLogs(emp.daily_logs, localEdits, emp.zkt_user_id, holidays, exemptions);
                                const totalPenaltyHours = calculateTotalPenaltyHours(mergedLogs, emp.zkt_user_id, holidays, exemptions);
                                const totalPenaltyMin = Math.round(totalPenaltyHours * 60);
                                const expectedHours = calculateExpectedHoursFromLogs(mergedLogs, emp.zkt_user_id, holidays, exemptions);
                                const attentionCount = mergedLogs.filter((l) =>
                                    (l.missed_in || l.missed_out || l.absent) &&
                                    !isDayExempted(l.date, emp.zkt_user_id, holidays, exemptions)
                                ).length;
                                // Count absent days excluding exempted ones
                                const absentCount = mergedLogs.filter((l) =>
                                    l.absent && !isDayExempted(l.date, emp.zkt_user_id, holidays, exemptions)
                                ).length;
                                const isCollapsed = collapsed[emp.zkt_user_id] !== false;

                                return (
                                    <React.Fragment key={emp.zkt_user_id}>
                                        {/* ── Employee summary row ── */}
                                        <tr
                                            onClick={() => toggle(emp.zkt_user_id)}
                                            className="cursor-pointer select-none"
                                            style={{ background: 'var(--admin-bg)', borderTop: '2px solid var(--admin-border)' }}
                                        >
                                            <td style={{ padding: '10px 10px' }}>
                                                <div className="flex items-center gap-2">
                                                    <div style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10, background: 'rgba(37,99,235,0.12)', color: 'var(--admin-primary, #2563EB)', flexShrink: 0 }}>
                                                        {emp.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: 12 }}>{emp.name}</span>
                                                    {attentionCount > 0 && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(245,158,11,0.12)', color: 'var(--admin-warning, #F59E0B)' }}>
                                                            <AlertTriangle size={9} />{attentionCount} attention
                                                        </span>
                                                    )}
                                                    {absentCount > 0 && (
                                                        <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(220,38,38,0.1)', color: 'var(--admin-danger, #DC2626)' }}>
                                                            {absentCount} absent
                                                        </span>
                                                    )}
                                                    {/* Fill Checkout button — only if there are missed-checkout days */}
                                                    {mergedLogs.some((l) => l.missed_out && !l.absent && !isDayExempted(l.date, emp.zkt_user_id, holidays, exemptions)) && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onBulkFillCheckout(emp.zkt_user_id); }}
                                                            title="Set all missed checkouts to 05:30 PM"
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: 3,
                                                                padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                                                                background: 'rgba(37,99,235,0.1)', color: 'var(--admin-primary, #2563EB)',
                                                                border: '1px solid rgba(37,99,235,0.2)', cursor: 'pointer',
                                                            }}
                                                        >
                                                            <Clock size={9} />Fill Checkout
                                                        </button>
                                                    )}
                                                    {/* Remove employee button */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onHideEmployee(emp.zkt_user_id); }}
                                                        title="Remove employee from attendance list"
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: 3,
                                                            padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                                                            background: 'rgba(220,38,38,0.08)', color: 'var(--admin-danger, #DC2626)',
                                                            border: '1px solid rgba(220,38,38,0.2)', cursor: 'pointer',
                                                        }}
                                                    >
                                                        <UserMinus size={9} />Remove
                                                    </button>
                                                    <span style={{ marginLeft: 'auto', color: 'var(--admin-text-secondary)' }}>
                                                        {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '10px 10px', color: 'var(--admin-text-secondary)' }}>—</td>
                                            <td style={{ padding: '10px 10px', color: 'var(--admin-text-secondary)' }}>—</td>
                                            <td style={{ padding: '10px 10px', color: 'var(--admin-text-secondary)' }}>—</td>
                                            <td style={{ padding: '10px 10px', color: 'var(--admin-text-secondary)' }}>—</td>
                                            <td style={{ padding: '10px 10px', color: 'var(--admin-text-secondary)' }}>—</td>
                                            <td style={{ padding: '10px 10px', color: 'var(--admin-text-secondary)' }}>—</td>
                                            {/* Total penalty summary */}
                                            <td style={{ padding: '10px 10px' }}>
                                                <span style={{
                                                    padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: 12,
                                                    background: totalPenaltyMin > 0 ? 'rgba(220,38,38,0.1)' : 'rgba(22,163,74,0.1)',
                                                    color: totalPenaltyMin > 0 ? 'var(--admin-danger, #DC2626)' : 'var(--admin-success, #16A34A)',
                                                }}>
                                                    {totalPenaltyMin > 0 ? `−${formatPenaltyMinutes(totalPenaltyMin)}` : '✓ 0:00'}
                                                </span>
                                                <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--admin-text-secondary)' }}>
                                                    / {expectedHours}h exp.
                                                </span>
                                            </td>
                                            <td colSpan={2} />
                                        </tr>

                                        {/* ── Daily log rows ── */}
                                        {!isCollapsed && mergedLogs.map((log, i) => {
                                            const key = `${emp.zkt_user_id}:${log.date}`;
                                            const editEntry = localEdits[key];
                                            const isEdited = !!editEntry;
                                            const wasAbsent    = editEntry?.was_absent    ?? false;
                                            const wasMissedOut = editEntry?.was_missed_out ?? false;
                                            const origIn  = editEntry?.original_check_in  ?? '';
                                            const origOut = editEntry?.original_check_out ?? '';

                                            const isHoliday = holidays.has(log.date);
                                            const isLeave = exemptions[key] === 'leave';
                                            const isExempted = isHoliday || isLeave;
                                            const isAbsent = log.absent && !isExempted;
                                            const isAttention = (log.missed_in || log.missed_out) && !isExempted;

                                            // Per-day penalty breakdown
                                            const dayPenaltyMin = isExempted ? 0 : calculateDayPenaltyMinutes(
                                                log.check_in, log.check_out, log.absent, log.missed_in, log.missed_out
                                            );

                                            // Morning delay component
                                            const inMin = (() => {
                                                if (isExempted || log.absent || log.missed_in) return null;
                                                const m = log.check_in.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
                                                if (!m) return null;
                                                let h = parseInt(m[1]); const mn = parseInt(m[2]); const p = m[3].toUpperCase();
                                                if (p === 'AM' && h === 12) h = 0;
                                                if (p === 'PM' && h !== 12) h += 12;
                                                return h * 60 + mn;
                                            })();
                                            const morningDelayMin = isExempted ? 0 : log.absent ? 480 : log.missed_in ? 480 : inMin !== null ? Math.max(0, inMin - 510) : 0;

                                            // Early leave component
                                            const outMin = (() => {
                                                if (isExempted || log.absent || log.missed_out) return null;
                                                const m = log.check_out.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
                                                if (!m) return null;
                                                let h = parseInt(m[1]); const mn = parseInt(m[2]); const p = m[3].toUpperCase();
                                                if (p === 'AM' && h === 12) h = 0;
                                                if (p === 'PM' && h !== 12) h += 12;
                                                return h * 60 + mn;
                                            })();
                                            const earlyLeaveMin = isExempted ? 0 : log.absent ? 0 : log.missed_out ? 480 : outMin !== null ? Math.max(0, 1050 - outMin) : 0;

                                            // Row background — edited-absent gets teal, edited-attention gets blue, originals unchanged
                                            let rowBg = i % 2 === 0 ? 'var(--admin-card)' : 'var(--admin-bg)';
                                            if (isExempted) {
                                                rowBg = isHoliday ? 'rgba(37,99,235,0.05)' : 'rgba(139,92,246,0.05)';
                                            } else if (isEdited && wasAbsent) {
                                                rowBg = 'rgba(20,184,166,0.07)'; // teal — was absent, now fixed
                                            } else if (isEdited && wasMissedOut) {
                                                rowBg = 'rgba(37,99,235,0.06)'; // blue — was attention, now fixed
                                            } else if (isAbsent) {
                                                rowBg = 'rgba(220,38,38,0.05)';
                                            } else if (dayPenaltyMin > 0) {
                                                rowBg = 'rgba(245,158,11,0.04)';
                                            }

                                            // Left border
                                            let leftBorder = '3px solid transparent';
                                            if (isEdited && wasAbsent)    leftBorder = '3px solid rgba(20,184,166,0.7)';
                                            else if (isEdited && wasMissedOut) leftBorder = '3px solid rgba(37,99,235,0.5)';
                                            else if (isEdited)            leftBorder = '3px solid var(--admin-primary, #2563EB)';

                                            return (
                                                <tr key={i} style={{
                                                    background: rowBg,
                                                    borderBottom: '1px solid var(--admin-border)',
                                                    borderLeft: leftBorder,
                                                }}>
                                                    {/* Date */}
                                                    <td style={{ padding: '7px 10px 7px 32px', whiteSpace: 'nowrap', color: 'var(--admin-text-secondary)' }}>
                                                        {log.date}
                                                        {isEdited && wasAbsent && (
                                                            <span style={{ marginLeft: 6, padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 600, background: 'rgba(20,184,166,0.15)', color: '#0d9488' }}>was absent · edited</span>
                                                        )}
                                                        {isEdited && wasMissedOut && (
                                                            <span style={{ marginLeft: 6, padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 600, background: 'rgba(37,99,235,0.12)', color: 'var(--admin-primary, #2563EB)' }}>was attention · edited</span>
                                                        )}
                                                        {isEdited && !wasAbsent && !wasMissedOut && (
                                                            <span style={{ marginLeft: 6, padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 600, background: 'rgba(37,99,235,0.12)', color: 'var(--admin-primary, #2563EB)' }}>edited</span>
                                                        )}
                                                    </td>

                                                    {/* Time In */}
                                                    <td style={{ padding: '7px 10px', whiteSpace: 'nowrap', fontWeight: 500 }}>
                                                        {isAbsent ? <span style={{ color: 'var(--admin-danger, #DC2626)' }}>Absent</span>
                                                            : log.missed_in && !isExempted ? <span style={{ color: 'var(--admin-warning, #F59E0B)' }}>Missed</span>
                                                            : isExempted ? <span style={{ color: 'var(--admin-text-secondary)' }}>—</span>
                                                            : (
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span style={{ color: morningDelayMin > 0 ? 'var(--admin-warning, #F59E0B)' : 'var(--admin-success, #16A34A)' }}>{log.check_in}</span>
                                                                    {isEdited && (wasAbsent || (editEntry?.check_in && origIn !== log.check_in)) && (
                                                                        <span style={{ fontSize: 9, color: wasAbsent ? 'var(--admin-danger, #DC2626)' : 'var(--admin-text-secondary)', opacity: 0.8 }}>
                                                                            was: {wasAbsent ? 'Absent' : origIn || '—'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )
                                                        }
                                                    </td>

                                                    {/* Lunch Out */}
                                                    <td style={{ padding: '7px 10px', whiteSpace: 'nowrap', color: 'var(--admin-text-secondary)' }}>
                                                        {!isAbsent && !isExempted && log.hours > 0 ? LUNCH_OUT : '—'}
                                                    </td>

                                                    {/* Lunch In */}
                                                    <td style={{ padding: '7px 10px', whiteSpace: 'nowrap', color: 'var(--admin-text-secondary)' }}>
                                                        {!isAbsent && !isExempted && log.hours > 0 ? LUNCH_IN : '—'}
                                                    </td>

                                                    {/* Time Out */}
                                                    <td style={{ padding: '7px 10px', whiteSpace: 'nowrap', fontWeight: 500 }}>
                                                        {isAbsent ? <span style={{ color: 'var(--admin-danger, #DC2626)' }}>Absent</span>
                                                            : log.missed_out && !isExempted ? <span style={{ color: 'var(--admin-warning, #F59E0B)' }}>Missed</span>
                                                            : isExempted ? <span style={{ color: 'var(--admin-text-secondary)' }}>—</span>
                                                            : (
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span style={{ color: earlyLeaveMin > 0 ? 'var(--admin-warning, #F59E0B)' : 'var(--admin-primary, #2563EB)' }}>{log.check_out}</span>
                                                                    {isEdited && (wasAbsent || wasMissedOut || (editEntry?.check_out && origOut !== log.check_out)) && (
                                                                        <span style={{ fontSize: 9, color: (wasAbsent || wasMissedOut) ? 'var(--admin-warning, #F59E0B)' : 'var(--admin-text-secondary)', opacity: 0.8 }}>
                                                                            was: {wasAbsent ? 'Absent' : wasMissedOut ? 'Missed' : origOut || '—'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )
                                                        }
                                                    </td>

                                                    {/* Morning delay */}
                                                    <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                                                        {isExempted ? <span style={{ color: 'var(--admin-text-secondary)' }}>—</span>
                                                            : morningDelayMin > 0
                                                                ? <span style={{ color: 'var(--admin-danger, #DC2626)', fontWeight: 600 }}>−{formatPenaltyMinutes(morningDelayMin)}</span>
                                                                : <span style={{ color: 'var(--admin-success, #16A34A)', fontSize: 10 }}>✓</span>
                                                        }
                                                    </td>

                                                    {/* Early leave */}
                                                    <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                                                        {isExempted ? <span style={{ color: 'var(--admin-text-secondary)' }}>—</span>
                                                            : earlyLeaveMin > 0
                                                                ? <span style={{ color: 'var(--admin-danger, #DC2626)', fontWeight: 600 }}>−{formatPenaltyMinutes(earlyLeaveMin)}</span>
                                                                : <span style={{ color: 'var(--admin-success, #16A34A)', fontSize: 10 }}>✓</span>
                                                        }
                                                    </td>

                                                    {/* Day penalty total */}
                                                    <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                                                        {isExempted
                                                            ? <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(37,99,235,0.08)', color: 'var(--admin-primary, #2563EB)' }}>Holiday ✓</span>
                                                            : dayPenaltyMin > 0
                                                                ? <span style={{ padding: '2px 6px', borderRadius: 4, fontWeight: 700, fontSize: 11, background: 'rgba(220,38,38,0.1)', color: 'var(--admin-danger, #DC2626)' }}>−{formatPenaltyMinutes(dayPenaltyMin)}</span>
                                                                : <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(22,163,74,0.1)', color: 'var(--admin-success, #16A34A)' }}>✓ 0:00</span>
                                                        }
                                                    </td>

                                                    {/* Status */}
                                                    <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                                                        <div className="flex flex-col gap-0.5">
                                                            {isHoliday && <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(37,99,235,0.1)', color: 'var(--admin-primary, #2563EB)' }}>Holiday</span>}
                                                            {isLeave && !isHoliday && <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(139,92,246,0.1)', color: '#7C3AED' }}>Known Leave</span>}
                                                            {isAbsent && <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(220,38,38,0.1)', color: 'var(--admin-danger, #DC2626)' }}>Absent</span>}
                                                            {isAttention && !isAbsent && <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(245,158,11,0.1)', color: 'var(--admin-warning, #F59E0B)' }}>Attention</span>}
                                                            {/* Edit history badges */}
                                                            {isEdited && wasAbsent && !isAbsent && (
                                                                <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 600, background: 'rgba(220,38,38,0.08)', color: 'var(--admin-danger, #DC2626)' }}>Was Absent</span>
                                                            )}
                                                            {isEdited && wasMissedOut && !isAttention && (
                                                                <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 600, background: 'rgba(245,158,11,0.08)', color: 'var(--admin-warning, #F59E0B)' }}>Was Attention</span>
                                                            )}
                                                            {isEdited && (wasAbsent || wasMissedOut) && (
                                                                <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 600, background: 'rgba(20,184,166,0.12)', color: '#0d9488' }}>✓ Edited</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Actions */}
                                                    <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                                                        <div className="flex items-center gap-1">
                                                            {/* Default button — only on absent rows */}
                                                            {isAbsent && (
                                                                <button
                                                                    onClick={() => onFillDefaultDay(emp.zkt_user_id, log.date)}
                                                                    title="Fill default full day (8:30 AM – 5:30 PM)"
                                                                    style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '3px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(22,163,74,0.1)', color: 'var(--admin-success, #16A34A)', border: '1px solid rgba(22,163,74,0.25)', cursor: 'pointer' }}
                                                                >
                                                                    Default
                                                                </button>
                                                            )}
                                                            {/* Edit In — always on non-exempted rows */}
                                                            {!isExempted && (
                                                                <button
                                                                    onClick={() => onEditClick({ employeeId: emp.zkt_user_id, date: log.date, missingField: 'check_in', existingTime: log.absent ? '' : log.check_out })}
                                                                    title="Edit check-in time"
                                                                    style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '3px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: (log.absent || log.missed_in) ? 'rgba(220,38,38,0.1)' : 'rgba(22,163,74,0.08)', color: (log.absent || log.missed_in) ? 'var(--admin-danger, #DC2626)' : 'var(--admin-success, #16A34A)', border: `1px solid ${(log.absent || log.missed_in) ? 'rgba(220,38,38,0.2)' : 'rgba(22,163,74,0.2)'}`, cursor: 'pointer' }}
                                                                >
                                                                    <Edit3 size={8} />In
                                                                </button>
                                                            )}
                                                            {/* Edit Out — on non-exempted, non-absent rows */}
                                                            {!isExempted && !log.absent && (
                                                                <button
                                                                    onClick={() => onEditClick({ employeeId: emp.zkt_user_id, date: log.date, missingField: 'check_out', existingTime: log.check_in })}
                                                                    title="Edit check-out time"
                                                                    style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '3px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: log.missed_out ? 'rgba(245,158,11,0.1)' : 'rgba(37,99,235,0.08)', color: log.missed_out ? 'var(--admin-warning, #F59E0B)' : 'var(--admin-primary, #2563EB)', border: `1px solid ${log.missed_out ? 'rgba(245,158,11,0.2)' : 'rgba(37,99,235,0.2)'}`, cursor: 'pointer' }}
                                                                >
                                                                    <Edit3 size={8} />Out
                                                                </button>
                                                            )}
                                                            {!isHoliday && (log.absent || isAttention) && (
                                                                isLeave ? (
                                                                    <button onClick={() => onSetExemption(emp.zkt_user_id, log.date, null)}
                                                                        style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(139,92,246,0.1)', color: '#7C3AED', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer' }}>
                                                                        <X size={9} />Leave
                                                                    </button>
                                                                ) : (
                                                                    <button onClick={() => onSetExemption(emp.zkt_user_id, log.date, 'leave')}
                                                                        style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(139,92,246,0.08)', color: '#7C3AED', border: '1px solid rgba(139,92,246,0.15)', cursor: 'pointer' }}>
                                                                        <BookOpen size={9} />Leave
                                                                    </button>
                                                                )
                                                            )}
                                                            {isHoliday && (
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(37,99,235,0.1)', color: 'var(--admin-primary, #2563EB)', border: '1px solid rgba(37,99,235,0.2)' }}>
                                                                    <Umbrella size={9} />Holiday
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
