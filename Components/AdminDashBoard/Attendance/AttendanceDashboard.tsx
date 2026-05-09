'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, Search, CalendarCheck, DollarSign, UserX } from 'lucide-react';
import api from '../../../api';
import {
    FilterPreset, AttendanceResponse, EmployeeStat,
    EditTarget, LocalEditsMap, HolidaySet, DayExemptionMap, DayExemption,
} from './attendanceTypes';
import { buildApiParams, mergeEditsIntoLogs, recalculateTotalHours, extractSundaysFromStats, isDayExempted } from './attendanceUtils';
import { exportAttendanceExcel } from './attendanceExport';
import AttendanceFilterBar from './AttendanceFilterBar';
import AttendanceTable from './AttendanceTable';
import EditPunchModal from './EditPunchModal';
import PayrollDashboard from './PayrollDashboard';
import RemovedEmployeesPanel, { HiddenEmployee } from './RemovedEmployeesPanel';

type Tab = 'attendance' | 'payroll' | 'removed';

function isSundayDate(dateStr: string): boolean {
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) && d.getDay() === 0;
}

export default function AttendanceDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>('attendance');
    const [filter, setFilter] = useState<FilterPreset>('this_month');
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [attendanceData, setAttendanceData] = useState<AttendanceResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
    const [localEdits, setLocalEdits] = useState<LocalEditsMap>({});
    const [holidays, setHolidays] = useState<HolidaySet>(new Set());
    const [exemptions, setExemptions] = useState<DayExemptionMap>({});
    // Only manually-added holidays (not auto-Sundays) — shown in filter bar chips
    const [manualHolidays, setManualHolidays] = useState<Set<string>>(new Set());

    // Hidden employees
    const [hiddenEmployees, setHiddenEmployees] = useState<HiddenEmployee[]>([]);

    // Raw stats ref for looking up original times when saving edits
    const rawStatsRef = useRef<AttendanceResponse['stats']>([]);

    // ── Fetch attendance data + load overrides in sequence ────────────────────
    const fetchData = useCallback(async () => {
        if (filter === 'custom' && (!customRange.start || !customRange.end)) return;
        setLoading(true);
        setError('');
        try {
            // 1. Fetch attendance data
            const params = buildApiParams(filter, customRange);
            const res = await api.get('/lead/attendance/dashboard/', { params });
            const stats = res.data.stats ?? [];
            setAttendanceData(res.data);
            rawStatsRef.current = stats;

            // 2. Compute auto-Sundays from the loaded data
            const sundays = extractSundaysFromStats(stats);

            // 3. Load saved overrides from DB
            let savedEdits: LocalEditsMap = {};
            let savedExemptions: DayExemptionMap = {};
            let savedManualHolidays: Set<string> = new Set();

            try {
                const ovRes = await api.get('/lead/attendance/overrides/');
                const { edits = [], leaves = [], holidays: dbHolidays = [] } = ovRes.data;

                // Restore edits
                for (const e of edits) {
                    const key = `${e.zkt_user_id}:${e.date}`;
                    // Determine original state from stored originals
                    const origIn  = e.original_check_in  ?? '';
                    const origOut = e.original_check_out ?? '';
                    const wasAbsent    = origIn === '' && origOut === '';
                    const wasMissedOut = origIn !== '' && origOut === '';
                    savedEdits[key] = {
                        ...(e.check_in  ? { check_in:  e.check_in  } : {}),
                        ...(e.check_out ? { check_out: e.check_out } : {}),
                        original_check_in:  origIn,
                        original_check_out: origOut,
                        was_absent:    wasAbsent,
                        was_missed_out: wasMissedOut,
                    };
                }

                // Restore leaves
                for (const l of leaves) {
                    savedExemptions[`${l.zkt_user_id}:${l.date}`] = 'leave';
                }

                // Restore manual holidays
                savedManualHolidays = new Set<string>(dbHolidays as string[]);
            } catch {
                // overrides endpoint failed — continue without them
            }

            // 4. Set all state in one batch — merge sundays + manual holidays
            setLocalEdits(savedEdits);
            setExemptions(savedExemptions);
            setManualHolidays(savedManualHolidays);
            setHolidays(() => {
                const next = new Set<string>(sundays);
                savedManualHolidays.forEach((d) => next.add(d));
                return next;
            });

        } catch (err: any) {
            setError(
                err?.response?.data?.detail ||
                err?.response?.data?.error ||
                err?.message ||
                'Failed to load attendance data.'
            );
        } finally {
            setLoading(false);
        }
    }, [filter, customRange]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Persist helpers ───────────────────────────────────────────────────────

    const persistEdits = useCallback(async (edits: LocalEditsMap) => {
        const raw = rawStatsRef.current;
        const items = Object.entries(edits).map(([key, val]) => {
            const colonIdx = key.indexOf(':');
            const zkt_user_id = key.slice(0, colonIdx);
            const date = key.slice(colonIdx + 1);
            const empRaw = raw.find((e) => e.zkt_user_id === zkt_user_id);
            const logRaw = empRaw?.daily_logs.find((l) => l.date === date);
            // Use stored originals if already present (reload case), else derive from raw log
            const original_check_in  = val.original_check_in  ?? (logRaw?.absent ? '' : logRaw?.check_in  ?? '');
            const original_check_out = val.original_check_out ?? (logRaw?.absent ? '' : logRaw?.missed_out ? '' : logRaw?.check_out ?? '');
            return {
                zkt_user_id,
                date,
                original_check_in,
                original_check_out,
                check_in:  val.check_in  ?? '',
                check_out: val.check_out ?? '',
            };
        });
        if (items.length === 0) return;
        try {
            await api.post('/lead/attendance/overrides/', { edits: items, leaves: [], holidays: [] });
        } catch (err) {
            console.error('[AttendanceDashboard] Failed to save edits:', err);
        }
    }, []);

    const persistLeaveAdd = useCallback(async (employeeId: string, date: string) => {
        try { await api.post('/lead/attendance/overrides/', { edits: [], leaves: [{ zkt_user_id: employeeId, date }], holidays: [] }); }
        catch { /* silent */ }
    }, []);

    const persistLeaveRemove = useCallback(async (employeeId: string, date: string) => {
        try { await api.delete('/lead/attendance/overrides/', { data: { edits: [], leaves: [{ zkt_user_id: employeeId, date }], holidays: [] } }); }
        catch { /* silent */ }
    }, []);

    const persistHolidayAdd = useCallback(async (date: string) => {
        try {
            await api.post('/lead/attendance/overrides/', { edits: [], leaves: [], holidays: [date] });
        } catch (err) {
            console.error('[AttendanceDashboard] Failed to save holiday:', err);
        }
    }, []);

    const persistHolidayRemove = useCallback(async (date: string) => {
        try { await api.delete('/lead/attendance/overrides/', { data: { edits: [], leaves: [], holidays: [date] } }); }
        catch { /* silent */ }
    }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleEditSubmit = (time: string) => {
        if (!editTarget) return;
        const key = `${editTarget.employeeId}:${editTarget.date}`;
        setLocalEdits((prev) => {
            // Derive original state from raw logs if not already stored
            const raw = rawStatsRef.current;
            const empRaw = raw.find((e) => e.zkt_user_id === editTarget.employeeId);
            const logRaw = empRaw?.daily_logs.find((l) => l.date === editTarget.date);
            const existing = prev[key];
            const was_absent    = existing?.was_absent    ?? (logRaw?.absent ?? false);
            const was_missed_out = existing?.was_missed_out ?? (!logRaw?.absent && (logRaw?.missed_out ?? false));
            const original_check_in  = existing?.original_check_in  ?? (logRaw?.absent ? '' : logRaw?.check_in  ?? '');
            const original_check_out = existing?.original_check_out ?? (logRaw?.absent ? '' : logRaw?.missed_out ? '' : logRaw?.check_out ?? '');
            const next = {
                ...prev,
                [key]: {
                    ...existing,
                    [editTarget.missingField]: time,
                    was_absent,
                    was_missed_out,
                    original_check_in,
                    original_check_out,
                },
            };
            persistEdits(next);
            return next;
        });
        setEditTarget(null);
    };

    const handleFilterChange = (f: FilterPreset) => {
        setFilter(f);
        setLocalEdits({});
    };

    const handleToggleHoliday = (date: string) => {
        const sunday = isSundayDate(date);
        setManualHolidays((prev) => {
            const next = new Set(prev);
            if (next.has(date)) {
                next.delete(date);
                if (!sunday) persistHolidayRemove(date);
            } else {
                // Only call API if not already saved (avoids duplicate 500)
                if (!sunday && !prev.has(date)) persistHolidayAdd(date);
                next.add(date);
            }
            return next;
        });
        setHolidays((prev) => {
            const next = new Set(prev);
            if (next.has(date)) next.delete(date);
            else next.add(date);
            return next;
        });
    };

    const handleSetExemption = (employeeId: string, date: string, type: DayExemption | null) => {
        const key = `${employeeId}:${date}`;
        setExemptions((prev) => {
            const next = { ...prev };
            if (type === null) {
                delete next[key];
                persistLeaveRemove(employeeId, date);
            } else {
                next[key] = type;
                persistLeaveAdd(employeeId, date);
            }
            return next;
        });
    };

    const handleFillDefaultDay = (employeeId: string, date: string) => {
        const DEFAULT_CHECKIN  = '02:30';
        const DEFAULT_CHECKOUT = '17:30';
        const key = `${employeeId}:${date}`;
        setLocalEdits((prev) => {
            const existing = prev[key];
            const next = {
                ...prev,
                [key]: {
                    ...existing,
                    check_in: DEFAULT_CHECKIN,
                    check_out: DEFAULT_CHECKOUT,
                    was_absent: existing?.was_absent ?? true,
                    was_missed_out: existing?.was_missed_out ?? false,
                    original_check_in:  existing?.original_check_in  ?? '',
                    original_check_out: existing?.original_check_out ?? '',
                },
            };
            persistEdits(next);
            return next;
        });
    };

    const handleBulkFillCheckout = (employeeId: string) => {
        // Find all logs for this employee where check-in exists but check-out is missing
        // (missed_out = true, not absent, not exempted)
        const emp = enrichedStats.find((e) => e.zkt_user_id === employeeId);
        if (!emp) return;

        const DEFAULT_CHECKOUT = '17:30'; // 5:30 PM in 24h format

        setLocalEdits((prev) => {
            const next = { ...prev };
            emp.daily_logs.forEach((log) => {
                if (
                    log.missed_out &&
                    !log.absent &&
                    !isDayExempted(log.date, employeeId, holidays, exemptions)
                ) {
                    const key = `${employeeId}:${log.date}`;
                    next[key] = { ...next[key], check_out: DEFAULT_CHECKOUT };
                }
            });
            persistEdits(next);
            return next;
        });
    };

    // ── Fetch hidden employees ────────────────────────────────────────────────
    const fetchHiddenEmployees = useCallback(async () => {
        try {
            const res = await api.get('/lead/attendance/hidden-users/');
            const hidden = (res.data.users as HiddenEmployee[]).filter((u) => u.is_hidden);
            setHiddenEmployees(hidden);
        } catch {
            // silent
        }
    }, []);

    useEffect(() => { fetchHiddenEmployees(); }, [fetchHiddenEmployees]);

    const handleHideEmployee = useCallback(async (employeeId: string) => {
        try {
            await api.post('/lead/attendance/hidden-users/', { zkt_user_id: employeeId });
            // Remove from enriched stats immediately (re-fetch will also do it)
            setAttendanceData((prev) => {
                if (!prev) return prev;
                return { ...prev, stats: prev.stats.filter((e) => e.zkt_user_id !== employeeId) };
            });
            // Add to hidden list
            const allRes = await api.get('/lead/attendance/hidden-users/');
            const hidden = (allRes.data.users as HiddenEmployee[]).filter((u) => u.is_hidden);
            setHiddenEmployees(hidden);
        } catch (err) {
            console.error('[AttendanceDashboard] Failed to hide employee:', err);
        }
    }, []);

    const handleRestoreEmployee = useCallback(async (employeeId: string) => {
        try {
            await api.delete('/lead/attendance/hidden-users/', { data: { zkt_user_id: employeeId } });
            setHiddenEmployees((prev) => prev.filter((e) => e.zkt_user_id !== employeeId));
            // Re-fetch attendance so the restored employee appears
            fetchData();
        } catch (err) {
            console.error('[AttendanceDashboard] Failed to restore employee:', err);
        }
    }, [fetchData]);

    const handleExportAttendance = () => {
        const period = attendanceData
            ? `${attendanceData.start_date} to ${attendanceData.end_date}`
            : new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        exportAttendanceExcel(enrichedStats, localEdits, holidays, exemptions, period);
    };

    // ── Derived state ─────────────────────────────────────────────────────────

    const enrichedStats: EmployeeStat[] = (attendanceData?.stats ?? []).map((emp) => {
        const mergedLogs = mergeEditsIntoLogs(emp.daily_logs, localEdits, emp.zkt_user_id, holidays, exemptions);
        return { ...emp, daily_logs: mergedLogs, total_hours: recalculateTotalHours(mergedLogs) };
    });

    const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'attendance', label: 'Attendance', icon: <CalendarCheck size={15} /> },
        { id: 'payroll',    label: 'Payroll',    icon: <DollarSign size={15} /> },
        { id: 'removed',    label: `Removed${hiddenEmployees.length > 0 ? ` (${hiddenEmployees.length})` : ''}`, icon: <UserX size={15} /> },
    ];

    return (
        <div className="flex flex-col min-h-full" style={{ background: 'var(--admin-bg)' }}>
            <div className="px-6 pt-5 pb-0 border-b flex items-end gap-0"
                style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-card)' }}>
                <div className="flex items-center gap-3 mr-8 pb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.12)' }}>
                        <CalendarCheck size={18} style={{ color: 'var(--admin-primary, #2563EB)' }} />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold" style={{ color: 'var(--admin-text)' }}>Attendance & Payroll</h2>
                        {attendanceData && (
                            <p className="text-xs" style={{ color: 'var(--admin-text-secondary)' }}>
                                {attendanceData.start_date} → {attendanceData.end_date}
                                {' · '}{enrichedStats.length} employee{enrichedStats.length !== 1 ? 's' : ''}
                                {manualHolidays.size > 0 && ` · ${manualHolidays.size} holiday${manualHolidays.size !== 1 ? 's' : ''}`}
                            </p>
                        )}
                    </div>
                </div>
                {TABS.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all rounded-t-xl"
                        style={{
                            background: activeTab === tab.id ? 'var(--admin-bg)' : 'transparent',
                            color: activeTab === tab.id ? 'var(--admin-primary, #2563EB)' : 'var(--admin-text-secondary)',
                            borderTop: activeTab === tab.id ? '2px solid var(--admin-primary, #2563EB)' : '2px solid transparent',
                            borderLeft: activeTab === tab.id ? '1px solid var(--admin-border)' : '1px solid transparent',
                            borderRight: activeTab === tab.id ? '1px solid var(--admin-border)' : '1px solid transparent',
                            borderBottom: activeTab === tab.id ? '1px solid var(--admin-bg)' : 'none',
                            marginBottom: activeTab === tab.id ? '-1px' : 0, cursor: 'pointer',
                        }}>
                        {tab.icon}{tab.label}
                    </button>
                ))}
            </div>

            <AttendanceFilterBar
                filter={filter} customRange={customRange} holidays={manualHolidays}
                onFilterChange={handleFilterChange} onCustomRangeChange={setCustomRange}
                onToggleHoliday={handleToggleHoliday}
            />

            <div className="flex-1 p-6 flex flex-col gap-6">
                {loading && (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
                            style={{ borderColor: 'var(--admin-border)', borderTopColor: 'var(--admin-primary, #2563EB)' }} />
                    </div>
                )}
                {!loading && error && (
                    <div className="flex items-start gap-3 p-4 rounded-xl border text-sm"
                        style={{ background: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.25)', color: 'var(--admin-danger, #DC2626)' }}>
                        <AlertTriangle size={18} className="shrink-0 mt-0.5" /><p>{error}</p>
                    </div>
                )}
                {!loading && !error && enrichedStats.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 rounded-2xl border text-center"
                        style={{ background: 'var(--admin-card)', borderColor: 'var(--admin-border)' }}>
                        <Search size={40} style={{ color: 'var(--admin-border)', marginBottom: '16px' }} />
                        <p className="font-semibold" style={{ color: 'var(--admin-text)' }}>No attendance data</p>
                        <p className="text-sm mt-1" style={{ color: 'var(--admin-text-secondary)' }}>No active employees found for this period.</p>
                    </div>
                )}
                {!loading && !error && enrichedStats.length > 0 && (
                    <>
                        {activeTab === 'attendance' && (
                            <AttendanceTable
                                employees={enrichedStats} localEdits={localEdits}
                                holidays={holidays} exemptions={exemptions}
                                onEditClick={setEditTarget} onSetExemption={handleSetExemption}
                                onExport={handleExportAttendance}
                                onBulkFillCheckout={handleBulkFillCheckout}
                                onFillDefaultDay={handleFillDefaultDay}
                                onHideEmployee={handleHideEmployee}
                            />
                        )}
                        {activeTab === 'payroll' && (
                            <PayrollDashboard
                                employees={enrichedStats} localEdits={localEdits}
                                holidays={holidays} exemptions={exemptions}
                            />
                        )}
                    </>
                )}
                {activeTab === 'removed' && (
                    <RemovedEmployeesPanel
                        hiddenEmployees={hiddenEmployees}
                        onRestore={handleRestoreEmployee}
                    />
                )}
            </div>

            <EditPunchModal target={editTarget} onSubmit={handleEditSubmit} onClose={() => setEditTarget(null)} />
        </div>
    );
}
