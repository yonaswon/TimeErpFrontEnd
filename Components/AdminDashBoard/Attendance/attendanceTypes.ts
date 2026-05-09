// Types for the Attendance & Salary Dashboard feature

export type FilterPreset = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom';

export type DayExemption = 'holiday' | 'leave';

/** Keyed by date string "06 May 2026" — global holidays apply to all employees */
export type HolidaySet = Set<string>;

/** Keyed by "zkt_user_id:date" — per-employee known leave */
export type DayExemptionMap = Record<string, DayExemption>;

export interface DailyLog {
    date: string;           // "06 May 2026"
    check_in: string;       // "08:05 AM", "Missed", or "Absent"
    check_out: string;      // "05:10 PM", "Missed", or "Absent"
    all_punches: string[];
    hours: number;
    missed_in: boolean;
    missed_out: boolean;
    absent: boolean;        // true = no biometric tap at all that day
}

export interface EmployeeStat {
    zkt_user_id: string;
    name: string;
    telegram_username: string;
    working_days: number;
    absent_days: number;
    total_hours: number;
    avg_hours: number;
    delays: number;
    early_birds: number;
    missed_checkouts: number;
    missed_checkins: number;
    daily_logs: DailyLog[];
}

export interface AttendanceResponse {
    start_date: string;
    end_date: string;
    stats: EmployeeStat[];
}

export interface EditTarget {
    employeeId: string;
    date: string;
    missingField: 'check_in' | 'check_out';
    existingTime: string;
}

// Keyed by "zkt_user_id:date"
export type LocalEditsMap = Record<string, {
    check_in?: string;
    check_out?: string;
    /** What the biometric originally recorded (empty string = absent) */
    original_check_in?: string;
    original_check_out?: string;
    /** True if the day was fully absent before the edit */
    was_absent?: boolean;
    /** True if the day had check-in but no check-out before the edit */
    was_missed_out?: boolean;
}>;
export type DayEdits = { check_in?: string; check_out?: string };

export type SalaryMode = 'hourly' | 'monthly';

// ─── Overtime & Loan types ────────────────────────────────────────────────────

export type OvertimeType = 'after_work' | 'sunday' | 'holiday';

export interface OvertimeEntry {
    id: string;          // client-side uuid
    hours: number;
    type: OvertimeType;
    amount: number;      // calculated: netSalary/30/8 * hours * multiplier
}

export interface PayrollExtra {
    overtime_entries: OvertimeEntry[];
    loan_amount: number;
}

/** Keyed by zkt_user_id */
export type PayrollExtrasMap = Record<string, PayrollExtra>;

// ─── Payroll types ───────────────────────────────────────────────────────────

export interface PayrollConfig {
    /** Per-employee target net pay, keyed by zkt_user_id */
    targetNetPays: Record<string, string>;
    /** Per-employee transport allowance overrides */
    transports: Record<string, string>;
    /** Global default transport allowance (ETB) */
    defaultTransport: string;
    /** Employees whose time penalty is ignored (always get full target net pay) */
    ignoreTimePenalty: Record<string, boolean>;
}

export interface PayrollRow {
    zkt_user_id: string;
    name: string;
    /** What admin entered — the desired take-home pay */
    targetNetPay: number;
    transport: number;
    actualHours: number;
    expectedHours: number;
    hourDiff: number;
    /** Total penalty in hours (late arrival + early departure + absences) */
    penaltyHours: number;
    /** Penalty deducted from net for missing hours (always <= 0) */
    hourPenalty: number;
    /** targetNetPay + hourPenalty (the actual net after penalty, before overtime/loan) */
    finalNetPay: number;
    /** Total overtime pay added to net */
    overtimeTotal: number;
    /** Loan deducted from net */
    loanAmount: number;
    /** finalNetPay + overtimeTotal - loanAmount */
    totalNetPay: number;
    /** Back-calculated gross so that gross - tax - pension7% + transport = totalNetPay */
    grossSalary: number;
    incomeTax: number;
    pensionEmployee: number;   // 7% of gross
    pensionEmployer: number;   // 11% of gross
    totalDeduction: number;    // incomeTax + pensionEmployee
}
