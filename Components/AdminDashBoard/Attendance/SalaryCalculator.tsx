'use client';
import React, { useMemo, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { EmployeeStat, LocalEditsMap, SalaryMode } from './attendanceTypes';
import { calculateExpectedHours, formatSalary, mergeEditsIntoLogs, recalculateTotalHours } from './attendanceUtils';

interface SalaryCalculatorProps {
    employees: EmployeeStat[];
    localEdits: LocalEditsMap;
}

export default function SalaryCalculator({ employees, localEdits }: SalaryCalculatorProps) {
    const [mode, setMode] = useState<SalaryMode>('hourly');
    const [rate, setRate] = useState<string>('');

    const rateNum = parseFloat(rate) || 0;

    const rows = useMemo(() => {
        return employees.map((emp) => {
            const mergedLogs = mergeEditsIntoLogs(emp.daily_logs, localEdits, emp.zkt_user_id);
            const actualHours = recalculateTotalHours(mergedLogs);
            const expectedHours = calculateExpectedHours(emp.working_days);
            const diff = actualHours - expectedHours;

            let salary: number | null = null;
            if (rateNum > 0) {
                if (mode === 'hourly') {
                    salary = actualHours * rateNum;
                } else {
                    // monthly mode: derive effective hourly rate
                    if (expectedHours > 0) {
                        const effectiveRate = rateNum / expectedHours;
                        salary = actualHours * effectiveRate;
                    }
                }
            }

            return { emp, actualHours, expectedHours, diff, salary };
        });
    }, [employees, localEdits, mode, rateNum]);

    const totalSalary = rows.reduce((s, r) => s + (r.salary ?? 0), 0);

    return (
        <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: 'var(--admin-card)', borderColor: 'var(--admin-border)' }}
        >
            {/* Header */}
            <div
                className="flex items-center gap-3 px-6 py-4 border-b"
                style={{ borderColor: 'var(--admin-border)' }}
            >
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(37,99,235,0.12)' }}
                >
                    <Calculator size={18} style={{ color: 'var(--admin-primary, #2563EB)' }} />
                </div>
                <div>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--admin-text)' }}>
                        Salary Calculator
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--admin-text-secondary)' }}>
                        Configure rate to compute payroll
                    </p>
                </div>
            </div>

            {/* Config panel */}
            <div
                className="px-6 py-4 border-b flex flex-wrap gap-4 items-end"
                style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg)' }}
            >
                {/* Mode toggle */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium" style={{ color: 'var(--admin-text-secondary)' }}>
                        Calculation Mode
                    </label>
                    <div
                        className="flex rounded-xl overflow-hidden border"
                        style={{ borderColor: 'var(--admin-border)' }}
                    >
                        {(['hourly', 'monthly'] as SalaryMode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className="px-4 text-sm font-medium transition-colors"
                                style={{
                                    height: '36px',
                                    background: mode === m ? 'var(--admin-primary, #2563EB)' : 'var(--admin-card)',
                                    color: mode === m ? '#fff' : 'var(--admin-text-secondary)',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                {m === 'hourly' ? 'Hourly Rate' : 'Monthly Salary'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Rate input */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
                    <label className="text-xs font-medium" style={{ color: 'var(--admin-text-secondary)' }}>
                        {mode === 'hourly' ? 'Rate per Hour (ETB)' : 'Monthly Salary (ETB)'}
                    </label>
                    <div className="relative">
                        <span
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                            style={{ color: 'var(--admin-text-secondary)' }}
                        >
                            ETB
                        </span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            placeholder="0.00"
                            className="w-full rounded-xl pl-12 pr-4 text-sm font-medium outline-none focus:ring-2"
                            style={{
                                height: '44px',
                                background: 'var(--admin-card)',
                                border: '1px solid var(--admin-border)',
                                color: 'var(--admin-text)',
                            }}
                        />
                    </div>
                </div>

                {/* Total */}
                {rateNum > 0 && (
                    <div
                        className="flex flex-col gap-0.5 px-4 py-2 rounded-xl border"
                        style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-card)' }}
                    >
                        <span className="text-xs" style={{ color: 'var(--admin-text-secondary)' }}>Total Payroll</span>
                        <span className="text-base font-bold" style={{ color: 'var(--admin-primary, #2563EB)' }}>
                            {formatSalary(totalSalary)}
                        </span>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr style={{ background: 'var(--admin-bg)' }}>
                            {['Employee', 'Actual Hrs', 'Expected Hrs', 'Difference', 'Salary'].map((h) => (
                                <th
                                    key={h}
                                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                                    style={{ color: 'var(--admin-text-secondary)', borderBottom: '1px solid var(--admin-border)' }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(({ emp, actualHours, expectedHours, diff, salary }) => (
                            <tr
                                key={emp.zkt_user_id}
                                className="transition-colors hover:opacity-90"
                                style={{ borderBottom: '1px solid var(--admin-border)' }}
                            >
                                <td className="px-4 py-3 font-medium" style={{ color: 'var(--admin-text)' }}>
                                    {emp.name}
                                </td>
                                <td className="px-4 py-3" style={{ color: 'var(--admin-text)' }}>
                                    {actualHours.toFixed(2)}h
                                </td>
                                <td className="px-4 py-3" style={{ color: 'var(--admin-text-secondary)' }}>
                                    {expectedHours}h
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className="flex items-center gap-1 font-semibold"
                                        style={{
                                            color: diff >= 0
                                                ? 'var(--admin-success, #16A34A)'
                                                : 'var(--admin-danger, #DC2626)',
                                        }}
                                    >
                                        {diff >= 0
                                            ? <TrendingUp size={14} />
                                            : <TrendingDown size={14} />}
                                        {diff >= 0 ? '+' : ''}{diff.toFixed(2)}h
                                    </span>
                                </td>
                                <td className="px-4 py-3 font-semibold" style={{ color: 'var(--admin-text)' }}>
                                    {salary !== null
                                        ? formatSalary(salary)
                                        : <span style={{ color: 'var(--admin-text-secondary)' }}>—</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
