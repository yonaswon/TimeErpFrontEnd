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
    amount: number;      // calculated: basicSalary/30/8 * hours * multiplier
}

export interface PayrollExtra {
    overtime_entries: OvertimeEntry[];
    loan_amount: number;
}

/** Keyed by zkt_user_id */
export type PayrollExtrasMap = Record<string, PayrollExtra>;

// ─── Payroll types ───────────────────────────────────────────────────────────

export interface PayrollConfig {
    /** Per-employee agreed net pay at full attendance (no OT, no penalty), keyed by zkt_user_id */
    agreedNetPays: Record<string, string>;
    /** Per-employee working days (col E, default 30) */
    workingDays: Record<string, string>;
    /** Per-employee non-taxable transport allowance (col G) */
    transports: Record<string, string>;
    /** Per-employee taxable transport allowance (col H) */
    taxableTransports: Record<string, string>;
    /** Global default non-taxable transport allowance (ETB) */
    defaultTransport: string;
    /** Employees whose time penalty is ignored */
    ignoreTimePenalty: Record<string, boolean>;
}

/** Payroll row matching Payroll_May_2026.xlsx column layout */
export interface PayrollRow {
    zkt_user_id: string;
    name: string;
    position: string;
    /** What admin enters — agreed take-home at full attendance (no OT, no penalty) */
    agreedNetPay: number;
    /** D: Basic Salary (gross monthly) — derived from agreedNetPay */
    basicSalary: number;
    /** E: Working days */
    workingDays: number;
    /** F: Salary for working days = D/30 × E */
    salaryForWorkingDays: number;
    /** G: Non-taxable transportation allowance */
    nonTaxableTransport: number;
    /** H: Taxable transportation allowance */
    taxableTransport: number;
    /** I: Over Time Payment */
    overtimeTotal: number;
    /** J: Hour Penalty (ETB, negative) */
    hourPenaltyAmount: number;
    /** K: Gross pay = F+G+H+I+J */
    grossPay: number;
    /** L: Taxable income = F+H+I (penalty excluded) */
    taxableIncome: number;
    /** M: Income Tax (PAYE on L) */
    incomeTax: number;
    /** N: Pension 7% */
    pensionEmployee: number;
    /** O: Pension 11% */
    pensionEmployer: number;
    /** P: Loan Deduction */
    loanAmount: number;
    /** Q: Total Deductions = M+N+P */
    totalDeduction: number;
    /** R: Net Pay = K − Q */
    netPay: number;
    /** Attendance: total penalty hours (for display) */
    penaltyHours: number;
    /** Attendance: expected hours in period */
    expectedHours: number;
}
