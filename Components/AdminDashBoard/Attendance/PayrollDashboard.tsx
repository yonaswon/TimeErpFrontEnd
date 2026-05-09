'use client';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Info, Save, CheckCircle2, AlertTriangle, Loader2, Download, Clock, Plus } from 'lucide-react';
import api from '../../../api';
import { EmployeeStat, LocalEditsMap, PayrollConfig, HolidaySet, DayExemptionMap, OvertimeEntry, PayrollExtrasMap } from './attendanceTypes';
import { mergeEditsIntoLogs, calculatePayrollRow, formatSalary, calculateExpectedHoursFromLogs, calculateTotalPenaltyHours, calculateOvertimeAmount } from './attendanceUtils';
import { exportPayrollExcel } from './attendanceExport';
import OvertimeModal from './OvertimeModal';
import PayrollExportModal from './PayrollExportModal';

interface PayrollDashboardProps {
    employees: EmployeeStat[];
    localEdits: LocalEditsMap;
    holidays: HolidaySet;
    exemptions: DayExemptionMap;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
const DEFAULT_TRANSPORT = '600';

/** Derive period string "May 2026" from current date */
function currentPeriod(): string {
    return new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export default function PayrollDashboard({ employees, localEdits, holidays, exemptions }: PayrollDashboardProps) {
    const period = useMemo(() => currentPeriod(), []);

    const [config, setConfig] = useState<PayrollConfig>({
        targetNetPays: {}, transports: {}, defaultTransport: DEFAULT_TRANSPORT, ignoreTimePenalty: {},
    });
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [saveError, setSaveError] = useState('');
    const [manualPenalties, setManualPenalties] = useState<Record<string, string>>({});
    const [extras, setExtras] = useState<PayrollExtrasMap>({});
    const [loanInputs, setLoanInputs] = useState<Record<string, string>>({});
    const [overtimeTarget, setOvertimeTarget] = useState<string | null>(null); // zkt_user_id
    const [showExportModal, setShowExportModal] = useState(false);

    // Load salary configs
    useEffect(() => {
        api.get('/lead/attendance/salary-config/')
            .then((res) => {
                const configs: { zkt_user_id: string; base_salary: string; transport_allowance: string }[] = res.data.configs ?? [];
                const targetNetPays: Record<string, string> = {};
                const transports: Record<string, string> = {};
                configs.forEach((c) => {
                    if (parseFloat(c.base_salary) > 0) targetNetPays[c.zkt_user_id] = c.base_salary;
                    transports[c.zkt_user_id] = c.transport_allowance;
                });
                setConfig((prev) => {
                    const allTransports = { ...transports };
                    employees.forEach((emp) => {
                        if (!(emp.zkt_user_id in allTransports)) allTransports[emp.zkt_user_id] = prev.defaultTransport;
                    });
                    return { ...prev, targetNetPays, transports: allTransports };
                });
            })
            .catch(() => {
                setConfig((prev) => {
                    const allTransports: Record<string, string> = {};
                    employees.forEach((emp) => { allTransports[emp.zkt_user_id] = prev.defaultTransport; });
                    return { ...prev, transports: allTransports };
                });
            });
    }, [employees]);

    // Load payroll extras (overtime + loans) for current period
    useEffect(() => {
        api.get('/lead/attendance/payroll-extra/', { params: { period } })
            .then((res) => {
                const map: PayrollExtrasMap = {};
                const loans: Record<string, string> = {};
                for (const e of res.data.extras ?? []) {
                    map[e.zkt_user_id] = {
                        overtime_entries: e.overtime_entries ?? [],
                        loan_amount: parseFloat(e.loan_amount) || 0,
                    };
                    loans[e.zkt_user_id] = String(parseFloat(e.loan_amount) || 0);
                }
                setExtras(map);
                setLoanInputs(loans);
            })
            .catch(() => {});
    }, [period]);

    const persistExtra = useCallback(async (zktId: string, overtimeEntries: OvertimeEntry[], loanAmount: number) => {
        try {
            await api.post('/lead/attendance/payroll-extra/', {
                period,
                zkt_user_id: zktId,
                overtime_entries: overtimeEntries,
                loan_amount: loanAmount,
            });
        } catch (err) {
            console.error('[PayrollDashboard] Failed to save payroll extra:', err);
        }
    }, [period]);

    const handleSaveOvertimeEntries = (zktId: string, entries: OvertimeEntry[]) => {
        const loan = parseFloat(loanInputs[zktId] || '0') || 0;
        setExtras((prev) => ({ ...prev, [zktId]: { overtime_entries: entries, loan_amount: loan } }));
        persistExtra(zktId, entries, loan);
    };

    const handleLoanChange = (zktId: string, val: string) => {
        setLoanInputs((prev) => ({ ...prev, [zktId]: val }));
        const loan = parseFloat(val) || 0;
        const ot = extras[zktId]?.overtime_entries ?? [];
        setExtras((prev) => ({ ...prev, [zktId]: { overtime_entries: ot, loan_amount: loan } }));
        persistExtra(zktId, ot, loan);
    };

    const handleSave = useCallback(async () => {
        setSaveStatus('saving'); setSaveError('');
        try {
            const configs = employees.map((emp) => ({
                zkt_user_id: emp.zkt_user_id,
                base_salary: parseFloat(config.targetNetPays[emp.zkt_user_id] || '0') || 0,
                transport_allowance: parseFloat(config.transports[emp.zkt_user_id] ?? config.defaultTransport) || 600,
            }));
            await api.post('/lead/attendance/salary-config/', { configs });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err: any) {
            setSaveStatus('error');
            setSaveError(err?.response?.data?.error || err?.message || 'Save failed');
        }
    }, [employees, config]);

    const rows = useMemo(() => {
        return employees.map((emp) => {
            const mergedLogs = mergeEditsIntoLogs(emp.daily_logs, localEdits, emp.zkt_user_id, holidays, exemptions);
            const expectedHours = calculateExpectedHoursFromLogs(mergedLogs, emp.zkt_user_id, holidays, exemptions);
            const targetNetPay = parseFloat(config.targetNetPays[emp.zkt_user_id] || '0') || 0;
            const transport = parseFloat(config.transports[emp.zkt_user_id] ?? config.defaultTransport) || 0;
            const penaltyHours = config.ignoreTimePenalty[emp.zkt_user_id]
                ? parseFloat(manualPenalties[emp.zkt_user_id] || '0') || 0
                : calculateTotalPenaltyHours(mergedLogs, emp.zkt_user_id, holidays, exemptions);

            const empExtras = extras[emp.zkt_user_id];
            const overtimeEntries = empExtras?.overtime_entries ?? [];
            // Recalculate amounts using current targetNetPay
            const overtimeTotal = overtimeEntries.reduce((s, e) => s + calculateOvertimeAmount(targetNetPay, e.hours, e.type), 0);
            const loanAmount = empExtras?.loan_amount ?? 0;

            return calculatePayrollRow(emp, targetNetPay, transport, expectedHours - penaltyHours, expectedHours, penaltyHours, overtimeTotal, loanAmount);
        });
    }, [employees, localEdits, config, manualPenalties, holidays, exemptions, extras]);

    const totals = useMemo(() => ({
        targetNetPay: rows.reduce((s, r) => s + r.targetNetPay, 0),
        transport: rows.reduce((s, r) => s + r.transport, 0),
        grossSalary: rows.reduce((s, r) => s + r.grossSalary, 0),
        incomeTax: rows.reduce((s, r) => s + r.incomeTax, 0),
        pensionEmployee: rows.reduce((s, r) => s + r.pensionEmployee, 0),
        pensionEmployer: rows.reduce((s, r) => s + r.pensionEmployer, 0),
        totalDeduction: rows.reduce((s, r) => s + r.totalDeduction, 0),
        totalNetPay: rows.reduce((s, r) => s + r.totalNetPay, 0),
        overtimeTotal: rows.reduce((s, r) => s + r.overtimeTotal, 0),
        loanAmount: rows.reduce((s, r) => s + r.loanAmount, 0),
    }), [rows]);

    const setTargetNet = (id: string, val: string) => setConfig((prev) => ({ ...prev, targetNetPays: { ...prev.targetNetPays, [id]: val } }));
    const setTransport = (id: string, val: string) => setConfig((prev) => ({ ...prev, transports: { ...prev.transports, [id]: val } }));
    const toggleIgnorePenalty = (id: string) => {
        const willIgnore = !config.ignoreTimePenalty[id];
        setConfig((prev) => ({ ...prev, ignoreTimePenalty: { ...prev.ignoreTimePenalty, [id]: willIgnore } }));
        if (willIgnore) setManualPenalties((prev) => ({ ...prev, [id]: '0' }));
    };
    const handleDefaultTransportChange = (newDefault: string) => {
        setConfig((prev) => {
            const updatedTransports = { ...prev.transports };
            employees.forEach((emp) => {
                if (prev.transports[emp.zkt_user_id] === undefined || prev.transports[emp.zkt_user_id] === prev.defaultTransport)
                    updatedTransports[emp.zkt_user_id] = newDefault;
            });
            return { ...prev, defaultTransport: newDefault, transports: updatedTransports };
        });
    };

    const HEAD: React.CSSProperties = {
        padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        color: 'var(--admin-text-secondary)', borderBottom: '2px solid var(--admin-border)',
        whiteSpace: 'nowrap', background: 'var(--admin-bg)',
    };
    const COL: React.CSSProperties = { padding: '9px 12px', borderBottom: '1px solid var(--admin-border)', whiteSpace: 'nowrap', fontSize: 12 };

    const overtimeEmployee = overtimeTarget ? employees.find((e) => e.zkt_user_id === overtimeTarget) : null;
    const overtimeTargetNet = overtimeTarget ? (parseFloat(config.targetNetPays[overtimeTarget] || '0') || 0) : 0;
    const overtimeEntries = overtimeTarget ? (extras[overtimeTarget]?.overtime_entries ?? []) : [];

    return (
        <div className="flex flex-col gap-4">
            {/* Config bar */}
            <div className="flex flex-wrap items-end gap-4 px-5 py-4 rounded-2xl border"
                style={{ background: 'var(--admin-card)', borderColor: 'var(--admin-border)' }}>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--admin-text-secondary)' }}>Default Transport (ETB)</label>
                    <input type="number" min="0" value={config.defaultTransport}
                        onChange={(e) => handleDefaultTransportChange(e.target.value)}
                        className="rounded-lg px-3 text-sm font-medium outline-none"
                        style={{ height: 36, width: 140, background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }} />
                </div>
                <div className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs flex-1"
                    style={{ background: 'rgba(37,99,235,0.08)', color: 'var(--admin-primary, #2563EB)' }}>
                    <Info size={13} className="shrink-0 mt-0.5" />
                    <span>Enter each employee's <strong>target net pay</strong>. Overtime = net÷30÷8 × hours × multiplier (After Work ×1.75, Sunday ×2, Holiday ×2.5). Loans are deducted from final net.</span>
                </div>
                <button onClick={handleSave} disabled={saveStatus === 'saving'}
                    className="flex items-center gap-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ padding: '8px 20px', height: 36, background: saveStatus === 'saved' ? 'rgba(22,163,74,0.12)' : saveStatus === 'error' ? 'rgba(220,38,38,0.12)' : 'var(--admin-primary, #2563EB)', color: saveStatus === 'saved' ? 'var(--admin-success, #16A34A)' : saveStatus === 'error' ? 'var(--admin-danger, #DC2626)' : '#fff', border: 'none', cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer', opacity: saveStatus === 'saving' ? 0.7 : 1 }}>
                    {saveStatus === 'saving' && <Loader2 size={14} className="animate-spin" />}
                    {saveStatus === 'saved' && <CheckCircle2 size={14} />}
                    {saveStatus === 'error' && <AlertTriangle size={14} />}
                    {saveStatus === 'idle' && <Save size={14} />}
                    {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
                </button>
                <button onClick={() => setShowExportModal(true)}
                    className="flex items-center gap-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ padding: '8px 18px', height: 36, background: 'rgba(22,163,74,0.12)', color: 'var(--admin-success, #16A34A)', border: '1px solid rgba(22,163,74,0.25)', cursor: 'pointer' }}>
                    <Download size={14} />Export Excel
                </button>
            </div>

            {saveStatus === 'error' && saveError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm border"
                    style={{ background: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.25)', color: 'var(--admin-danger, #DC2626)' }}>
                    <AlertTriangle size={15} />{saveError}
                </div>
            )}

            {/* Table */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--admin-card)', borderColor: 'var(--admin-border)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse" style={{ minWidth: 1500 }}>
                        <thead>
                            <tr>
                                {['Employee', 'Ignore Penalty', 'Target Net Pay', 'Transport', 'Expected Hrs', 'Penalty Hrs', 'Diff', 'Hour Penalty', 'Overtime', 'Loan', 'Final Net Pay', 'Gross Salary', 'Income Tax', 'Pension 7%', 'Pension 11%', 'Total Deduct.'].map((h) => (
                                    <th key={h} style={HEAD}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => {
                                const emp = employees[idx];
                                const hasNet = row.targetNetPay > 0;
                                const empOtEntries = extras[emp.zkt_user_id]?.overtime_entries ?? [];

                                return (
                                    <tr key={row.zkt_user_id} style={{ background: idx % 2 === 0 ? 'var(--admin-card)' : 'var(--admin-bg)' }}>
                                        <td style={{ ...COL, fontWeight: 600, color: 'var(--admin-text)' }}>{row.name}</td>

                                        {/* Ignore penalty toggle */}
                                        <td style={COL}>
                                            <button onClick={() => toggleIgnorePenalty(emp.zkt_user_id)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s', background: config.ignoreTimePenalty[emp.zkt_user_id] ? 'rgba(22,163,74,0.15)' : 'var(--admin-bg)', color: config.ignoreTimePenalty[emp.zkt_user_id] ? 'var(--admin-success, #16A34A)' : 'var(--admin-text-secondary)', outline: `1px solid ${config.ignoreTimePenalty[emp.zkt_user_id] ? 'rgba(22,163,74,0.3)' : 'var(--admin-border)'}` }}>
                                                <span style={{ width: 28, height: 16, borderRadius: 8, display: 'inline-flex', alignItems: 'center', background: config.ignoreTimePenalty[emp.zkt_user_id] ? 'var(--admin-success, #16A34A)' : 'var(--admin-border)', padding: '0 2px', transition: 'background 0.15s' }}>
                                                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', transform: config.ignoreTimePenalty[emp.zkt_user_id] ? 'translateX(12px)' : 'translateX(0)', transition: 'transform 0.15s', display: 'block' }} />
                                                </span>
                                                {config.ignoreTimePenalty[emp.zkt_user_id] ? 'Ignored' : 'Apply'}
                                            </button>
                                        </td>

                                        {/* Target net pay */}
                                        <td style={COL}>
                                            <input type="number" min="0" placeholder="0"
                                                value={config.targetNetPays[emp.zkt_user_id] ?? ''}
                                                onChange={(e) => setTargetNet(emp.zkt_user_id, e.target.value)}
                                                className="rounded-lg px-2 text-xs font-medium outline-none"
                                                style={{ height: 30, width: 110, background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }} />
                                        </td>

                                        {/* Transport */}
                                        <td style={COL}>
                                            <input type="number" min="0"
                                                value={config.transports[emp.zkt_user_id] ?? config.defaultTransport}
                                                onChange={(e) => setTransport(emp.zkt_user_id, e.target.value)}
                                                className="rounded-lg px-2 text-xs font-medium outline-none"
                                                style={{ height: 30, width: 80, background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }} />
                                        </td>

                                        <td style={{ ...COL, color: 'var(--admin-text)' }}>{row.expectedHours}h</td>

                                        {/* Penalty hours */}
                                        <td style={COL}>
                                            {config.ignoreTimePenalty[emp.zkt_user_id] ? (
                                                <input type="number" min="0" step="0.01"
                                                    value={manualPenalties[emp.zkt_user_id] ?? '0'}
                                                    onChange={(e) => setManualPenalties((prev) => ({ ...prev, [emp.zkt_user_id]: e.target.value }))}
                                                    className="rounded-lg px-2 text-xs font-medium outline-none"
                                                    style={{ height: 30, width: 80, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.3)', color: 'var(--admin-success, #16A34A)' }} />
                                            ) : (
                                                <span style={{ color: row.penaltyHours > 0 ? 'var(--admin-danger, #DC2626)' : 'var(--admin-success, #16A34A)', fontWeight: 600 }}>
                                                    {row.penaltyHours > 0 ? `−${row.penaltyHours.toFixed(2)}h` : '0h'}
                                                </span>
                                            )}
                                        </td>

                                        {/* Hour diff */}
                                        <td style={COL}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600, fontSize: 12, color: row.hourDiff >= 0 ? 'var(--admin-success, #16A34A)' : 'var(--admin-danger, #DC2626)' }}>
                                                {row.hourDiff >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                                {row.hourDiff >= 0 ? '+' : ''}{row.hourDiff.toFixed(2)}h
                                            </span>
                                        </td>

                                        {/* Hour penalty */}
                                        <td style={COL}>
                                            {hasNet ? (
                                                <span style={{ color: row.hourPenalty < 0 ? 'var(--admin-danger, #DC2626)' : 'var(--admin-text-secondary)', fontWeight: row.hourPenalty < 0 ? 600 : 400 }}>
                                                    {row.hourPenalty < 0 ? `- ${formatSalary(Math.abs(row.hourPenalty))}` : '—'}
                                                </span>
                                            ) : <span style={{ color: 'var(--admin-text-secondary)' }}>—</span>}
                                        </td>

                                        {/* Overtime */}
                                        <td style={COL}>
                                            <div className="flex items-center gap-1">
                                                {row.overtimeTotal > 0 && (
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-warning, #F59E0B)' }}>
                                                        +{formatSalary(row.overtimeTotal)}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => setOvertimeTarget(emp.zkt_user_id)}
                                                    title={empOtEntries.length > 0 ? `${empOtEntries.length} entry — click to edit` : 'Add overtime'}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: '1px solid', background: empOtEntries.length > 0 ? 'rgba(245,158,11,0.1)' : 'var(--admin-bg)', color: empOtEntries.length > 0 ? 'var(--admin-warning, #F59E0B)' : 'var(--admin-text-secondary)', borderColor: empOtEntries.length > 0 ? 'rgba(245,158,11,0.3)' : 'var(--admin-border)' }}>
                                                    {empOtEntries.length > 0 ? <Clock size={9} /> : <Plus size={9} />}
                                                    {empOtEntries.length > 0 ? `${empOtEntries.length}` : 'OT'}
                                                </button>
                                            </div>
                                        </td>

                                        {/* Loan */}
                                        <td style={COL}>
                                            <input type="number" min="0" placeholder="0"
                                                value={loanInputs[emp.zkt_user_id] ?? ''}
                                                onChange={(e) => handleLoanChange(emp.zkt_user_id, e.target.value)}
                                                title="Loan deduction (ETB)"
                                                className="rounded-lg px-2 text-xs font-medium outline-none"
                                                style={{ height: 30, width: 90, background: row.loanAmount > 0 ? 'rgba(220,38,38,0.06)' : 'var(--admin-bg)', border: `1px solid ${row.loanAmount > 0 ? 'rgba(220,38,38,0.25)' : 'var(--admin-border)'}`, color: row.loanAmount > 0 ? 'var(--admin-danger, #DC2626)' : 'var(--admin-text)' }} />
                                        </td>

                                        {/* Final net pay (after penalty + OT + loan) */}
                                        <td style={{ ...COL, fontWeight: 700, color: 'var(--admin-success, #16A34A)', fontSize: 13 }}>
                                            {hasNet ? formatSalary(row.totalNetPay) : '—'}
                                        </td>

                                        <td style={{ ...COL, fontWeight: 600, color: 'var(--admin-text)' }}>{hasNet ? formatSalary(row.grossSalary) : '—'}</td>
                                        <td style={{ ...COL, color: 'var(--admin-danger, #DC2626)', fontWeight: 600 }}>{hasNet ? formatSalary(row.incomeTax) : '—'}</td>
                                        <td style={{ ...COL, color: 'var(--admin-danger, #DC2626)' }}>{hasNet ? formatSalary(row.pensionEmployee) : '—'}</td>
                                        <td style={{ ...COL, color: 'var(--admin-text-secondary)' }}>{hasNet ? formatSalary(row.pensionEmployer) : '—'}</td>
                                        <td style={{ ...COL, color: 'var(--admin-danger, #DC2626)', fontWeight: 700 }}>{hasNet ? formatSalary(row.totalDeduction) : '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: 'var(--admin-bg)', borderTop: '2px solid var(--admin-border)' }}>
                                <td style={{ ...COL, fontWeight: 700, color: 'var(--admin-text)' }}>TOTAL ({rows.length})</td>
                                <td style={COL} />
                                <td style={{ ...COL, fontWeight: 700, color: 'var(--admin-text)' }}>{formatSalary(totals.targetNetPay)}</td>
                                <td style={{ ...COL, fontWeight: 700, color: 'var(--admin-text)' }}>{formatSalary(totals.transport)}</td>
                                <td colSpan={3} />
                                <td />
                                <td style={{ ...COL, fontWeight: 700, color: 'var(--admin-warning, #F59E0B)' }}>{totals.overtimeTotal > 0 ? `+${formatSalary(totals.overtimeTotal)}` : '—'}</td>
                                <td style={{ ...COL, fontWeight: 700, color: 'var(--admin-danger, #DC2626)' }}>{totals.loanAmount > 0 ? formatSalary(totals.loanAmount) : '—'}</td>
                                <td style={{ ...COL, fontWeight: 700, color: 'var(--admin-success, #16A34A)', fontSize: 13 }}>{formatSalary(totals.totalNetPay)}</td>
                                <td style={{ ...COL, fontWeight: 700, color: 'var(--admin-text)' }}>{formatSalary(totals.grossSalary)}</td>
                                <td style={{ ...COL, fontWeight: 700, color: 'var(--admin-danger, #DC2626)' }}>{formatSalary(totals.incomeTax)}</td>
                                <td style={{ ...COL, fontWeight: 700, color: 'var(--admin-danger, #DC2626)' }}>{formatSalary(totals.pensionEmployee)}</td>
                                <td style={{ ...COL, fontWeight: 700, color: 'var(--admin-text-secondary)' }}>{formatSalary(totals.pensionEmployer)}</td>
                                <td style={{ ...COL, fontWeight: 700, color: 'var(--admin-danger, #DC2626)' }}>{formatSalary(totals.totalDeduction)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Overtime modal */}
            {overtimeTarget && overtimeEmployee && (
                <OvertimeModal
                    employeeName={overtimeEmployee.name}
                    targetNetPay={overtimeTargetNet}
                    entries={overtimeEntries}
                    onSave={(entries) => handleSaveOvertimeEntries(overtimeTarget, entries)}
                    onClose={() => setOvertimeTarget(null)}
                />
            )}

            {/* Export modal */}
            {showExportModal && (
                <PayrollExportModal
                    rows={rows}
                    period={period}
                    onClose={() => setShowExportModal(false)}
                />
            )}
        </div>
    );
}
