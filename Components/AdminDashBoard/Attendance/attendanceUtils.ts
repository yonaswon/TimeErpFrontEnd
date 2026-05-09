import { FilterPreset, DailyLog, LocalEditsMap, HolidaySet, DayExemptionMap } from './attendanceTypes';

/**
 * Expected hours = all non-exempted days in the log × 8.
 * This correctly counts absent days as required work days.
 */
export function calculateExpectedHoursFromLogs(
    logs: DailyLog[],
    employeeId: string,
    holidays: HolidaySet,
    exemptions: DayExemptionMap
): number {
    const billableDays = logs.filter(
        (l) => !isDayExempted(l.date, employeeId, holidays, exemptions)
    ).length;
    return billableDays * 8;
}

/** Legacy helper — kept for places that only have working_days count */
export function calculateExpectedHours(workingDays: number): number {
    return workingDays * 8;
}

function parseTime12h(timeStr: string): number | null {
    if (!timeStr || timeStr === 'Missed' || timeStr === 'Absent') return null;
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'AM' && hours === 12) hours = 0;
    if (period === 'PM' && hours !== 12) hours += 12;
    return hours * 60 + minutes;
}

function parseTime24h(timeStr: string): number | null {
    if (!timeStr) return null;
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
}

export function calculateHoursWorked(checkIn: string, checkOut: string): number {
    const inMin = parseTime12h(checkIn);
    const outMin = parseTime12h(checkOut);
    if (inMin === null || outMin === null) return 0;
    const diff = outMin - inMin;
    return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
}

export function convertTo12Hour(time24: string): string {
    const mins = parseTime24h(time24);
    if (mins === null) return '';
    const hours24 = Math.floor(mins / 60);
    const minutes = mins % 60;
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function isValidTime(str: string): boolean {
    if (!str) return false;
    const match = str.match(/^(\d{2}):(\d{2})$/);
    if (!match) return false;
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export function buildApiParams(
    filter: FilterPreset,
    customRange: { start: string; end: string }
): Record<string, string> {
    const params: Record<string, string> = { filter };
    if (filter === 'custom' && customRange.start && customRange.end) {
        params.start_date = customRange.start;
        params.end_date = customRange.end;
    }
    return params;
}

export function formatSalary(amount: number, currency = 'ETB'): string {
    return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Check if a day is exempted (holiday or known leave).
 * Holidays apply globally; leave is per-employee.
 */
export function isDayExempted(
    date: string,
    employeeId: string,
    holidays: HolidaySet,
    exemptions: DayExemptionMap
): boolean {
    return holidays.has(date) || !!exemptions[`${employeeId}:${date}`];
}

/**
 * Merge local edits + apply exemptions into a daily log array.
 * Exempted days get hours = 8 (full day, no penalty).
 */
export function mergeEditsIntoLogs(
    logs: DailyLog[],
    edits: LocalEditsMap,
    employeeId: string,
    holidays: HolidaySet = new Set(),
    exemptions: DayExemptionMap = {}
): DailyLog[] {
    return logs.map((log) => {
        const key = `${employeeId}:${log.date}`;
        const edit = edits[key];
        const exempted = isDayExempted(log.date, employeeId, holidays, exemptions);

        // Exempted days (holiday / known leave) → full 8h, no penalty
        if (exempted) {
            return { ...log, hours: 8, missed_in: false, missed_out: false, absent: false };
        }

        // Absent days (no biometric tap at all, not exempted) → -8h penalty
        if (log.absent && !edit) {
            return { ...log, hours: -8 };
        }

        // Absent day that has been manually edited → recalculate from entered times
        if (log.absent && edit) {
            const checkIn  = edit.check_in  ? convertTo12Hour(edit.check_in)  : '';
            const checkOut = edit.check_out ? convertTo12Hour(edit.check_out) : '';
            const hours = calculateHoursWorked(checkIn, checkOut);
            return {
                ...log,
                check_in: checkIn || 'Absent',
                check_out: checkOut || 'Absent',
                hours,
                missed_in: !checkIn,
                missed_out: !checkOut,
                absent: false,
            };
        }

        // Normal day with no edit
        if (!edit) return log;

        // Normal day with edit
        const checkIn  = edit.check_in  ? convertTo12Hour(edit.check_in)  : log.check_in;
        const checkOut = edit.check_out ? convertTo12Hour(edit.check_out) : log.check_out;
        const hours = calculateHoursWorked(checkIn, checkOut);

        return {
            ...log,
            check_in: checkIn,
            check_out: checkOut,
            hours,
            missed_in:  checkIn  === 'Missed' || checkIn  === '' || checkIn  === 'Absent',
            missed_out: checkOut === 'Missed' || checkOut === '' || checkOut === 'Absent',
            absent: false,
        };
    });
}

/**
 * Parse a display date string like "06 May 2026" and return the day of week (0=Sun, 6=Sat).
 * Returns -1 if unparseable.
 */
export function getDayOfWeek(displayDate: string): number {
    try {
        const d = new Date(displayDate);
        if (isNaN(d.getTime())) return -1;
        return d.getDay();
    } catch {
        return -1;
    }
}

/**
 * Extract all Sunday date strings from a list of EmployeeStat daily logs.
 * Returns a Set of date strings (e.g. "06 Apr 2025") that fall on Sunday.
 */
export function extractSundaysFromStats(
    stats: import('./attendanceTypes').EmployeeStat[]
): HolidaySet {
    const sundays = new Set<string>();
    for (const emp of stats) {
        for (const log of emp.daily_logs) {
            // Parse "06 May 2026" → Date
            const d = new Date(log.date);
            if (!isNaN(d.getTime()) && d.getDay() === 0) {
                sundays.add(log.date);
            }
        }
    }
    return sundays;
}

// ─── Ethiopian Income Tax (Proclamation 1395/2025) ────────────────────────────
// Monthly brackets:
//   0 – 2,000      → 0%
//   2,001 – 4,000  → 15%  deduction = 300
//   4,001 – 7,000  → 20%  deduction = 500
//   7,001 – 10,000 → 25%  deduction = 850
//   10,001 – 14,000→ 30%  deduction = 1350
//   > 14,000       → 35%  deduction = 2050

interface TaxBracket {
    min: number;
    max: number;
    rate: number;
    deduction: number;
}

const ETH_TAX_BRACKETS: TaxBracket[] = [
    { min: 0,     max: 2000,     rate: 0,    deduction: 0    },
    { min: 2001,  max: 4000,     rate: 0.15, deduction: 300  },
    { min: 4001,  max: 7000,     rate: 0.20, deduction: 500  },
    { min: 7001,  max: 10000,    rate: 0.25, deduction: 850  },
    { min: 10001, max: 14000,    rate: 0.30, deduction: 1350 },
    { min: 14001, max: Infinity, rate: 0.35, deduction: 2050 },
];

export function calculateEthiopianIncomeTax(monthlyIncome: number): number {
    if (monthlyIncome <= 0) return 0;
    const bracket = ETH_TAX_BRACKETS.find(
        (b) => monthlyIncome >= b.min && monthlyIncome <= b.max
    );
    if (!bracket || bracket.rate === 0) return 0;
    return Math.max(0, Math.round((monthlyIncome * bracket.rate - bracket.deduction) * 100) / 100);
}

/**
 * Back-calculate gross salary from a desired net pay.
 *
 * For each tax bracket with rate r and deduction d:
 *   net = gross - (gross*r - d) - gross*0.07 + transport
 *   net = gross*(1 - r - 0.07) + d + transport
 *   gross = (net - d - transport) / (1 - r - 0.07)
 *
 * We try each bracket and accept the result that falls within that bracket's range.
 * Returns 0 if no valid solution found (e.g. net <= 0).
 */
export function solveGrossFromNet(desiredNet: number, transport: number): number {
    if (desiredNet <= 0) return 0;
    const netMinusTransport = desiredNet - transport;

    for (const bracket of ETH_TAX_BRACKETS) {
        const divisor = 1 - bracket.rate - 0.07;
        if (divisor <= 0) continue;
        const gross = (netMinusTransport - bracket.deduction) / divisor;
        if (gross >= bracket.min && gross <= bracket.max) {
            return Math.round(gross * 100) / 100;
        }
    }

    // Fallback: if net is very small (below tax threshold), gross ≈ net - transport + transport
    // i.e. no tax, no pension deduction scenario — shouldn't normally happen
    return Math.max(0, Math.round((netMinusTransport / 0.93) * 100) / 100);
}

/**
 * Calculate overtime pay for a single entry.
 * Hourly rate = targetNetPay / 30 / 8
 * Multipliers: after_work=1.75, sunday=2.0, holiday=2.5
 */
export function calculateOvertimeAmount(
    targetNetPay: number,
    hours: number,
    type: import('./attendanceTypes').OvertimeType
): number {
    if (targetNetPay <= 0 || hours <= 0) return 0;
    const hourlyRate = targetNetPay / 30 / 8;
    const multiplier = type === 'holiday' ? 2.5 : type === 'sunday' ? 2.0 : 1.75;
    return Math.round(hourlyRate * hours * multiplier * 100) / 100;
}

/**
 * Calculate payroll row using penalty-based time calculation.
 *
 * The admin enters the TARGET NET PAY (what the employee takes home at full attendance).
 * Logic:
 *   1. expectedHours = non-exempted days × 8
 *   2. penaltyHours  = total late/early/absent penalty hours
 *   3. effectiveActual = expectedHours - penaltyHours
 *   4. hourDiff = -penaltyHours  (always ≤ 0)
 *   5. hourPenalty = hourDiff × hourlyRate  (always ≤ 0)
 *   6. finalNetPay = targetNetPay + hourPenalty
 *   7. totalNetPay = finalNetPay + overtimeTotal - loanAmount
 *   8. grossSalary = solveGrossFromNet(totalNetPay, transport)
 *
 * @param penaltyHoursOverride - if provided, use this instead of calculating from logs
 * @param overtimeTotal - total overtime pay to add
 * @param loanAmount - loan deduction
 */
export function calculatePayrollRow(
    emp: import('./attendanceTypes').EmployeeStat,
    targetNetPay: number,
    transport: number,
    actualHours: number,
    expectedHours?: number,
    penaltyHoursOverride?: number,
    overtimeTotal = 0,
    loanAmount = 0,
): import('./attendanceTypes').PayrollRow {
    const expected = expectedHours !== undefined
        ? expectedHours
        : calculateExpectedHours(emp.working_days);

    const penaltyHours = penaltyHoursOverride !== undefined
        ? penaltyHoursOverride
        : Math.max(0, expected - actualHours);

    const hourDiff = -penaltyHours;
    const hourlyRate = expected > 0 ? targetNetPay / expected : 0;
    const hourPenalty = penaltyHours > 0 ? Math.round(hourDiff * hourlyRate * 100) / 100 : 0;
    const finalNetPay = Math.max(0, Math.round((targetNetPay + hourPenalty) * 100) / 100);

    // grossBase = the net the employee should receive (before loan deduction).
    // Loan doesn't affect gross — it was already paid out, just recovered from this month's payout.
    const grossBase = Math.max(0, Math.round((finalNetPay + overtimeTotal) * 100) / 100);

    // Back-calculate gross so that: gross - tax - pension(7%) + transport = grossBase
    const grossSalary = solveGrossFromNet(grossBase, transport);
    const incomeTax = calculateEthiopianIncomeTax(grossSalary);
    const pensionEmployee = Math.round(grossSalary * 0.07 * 100) / 100;
    const pensionEmployer = Math.round(grossSalary * 0.11 * 100) / 100;
    const totalDeduction = Math.round((incomeTax + pensionEmployee) * 100) / 100;

    // totalNetPay = what the employee physically receives (grossBase minus loan recovery)
    const totalNetPay = Math.max(0, Math.round((grossBase - loanAmount) * 100) / 100);

    return {
        zkt_user_id: emp.zkt_user_id,
        name: emp.name,
        targetNetPay,
        transport,
        actualHours: expected - penaltyHours,
        expectedHours: expected,
        hourDiff,
        penaltyHours,
        hourPenalty,
        finalNetPay,
        overtimeTotal,
        loanAmount,
        totalNetPay,
        grossSalary,
        incomeTax,
        pensionEmployee,
        pensionEmployer,
        totalDeduction,
    };
}

export function recalculateTotalHours(logs: DailyLog[]): number {
    return Math.round(logs.reduce((sum, l) => sum + l.hours, 0) * 100) / 100;
}

// ─── Penalty-based time calculation ──────────────────────────────────────────
//
// Work schedule (in the time format shown in the UI / biometric display):
//   Late threshold  = 08:30 AM = 510 minutes since midnight
//   Early threshold = 05:30 PM = 1050 minutes since midnight
//
// The biometric display times are already in local (Ethiopian) time.
// An employee arriving at 08:28 AM is 2 minutes early → no morning penalty.
// An employee leaving at 05:28 PM is 2 minutes early → 2 min early-leave penalty.

const LATE_THRESHOLD_MIN  = 510;   // 08:30 AM
const EARLY_THRESHOLD_MIN = 1050;  // 05:30 PM
const FULL_DAY_PENALTY_MIN = 480;  // 8 hours in minutes

/**
 * Format penalty minutes as "HH:MM" string for display.
 */
export function formatPenaltyMinutes(minutes: number): string {
    const h = Math.floor(Math.abs(minutes) / 60);
    const m = Math.abs(minutes) % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Calculate penalty minutes for a single day.
 *
 * @param checkIn  - "HH:MM AM/PM" string or "Missed"/"Absent"
 * @param checkOut - "HH:MM AM/PM" string or "Missed"/"Absent"
 * @param isAbsent - true if no biometric tap at all
 * @param isMissedIn  - true if check-in is missing
 * @param isMissedOut - true if check-out is missing
 */
export function calculateDayPenaltyMinutes(
    checkIn: string,
    checkOut: string,
    isAbsent: boolean,
    isMissedIn: boolean,
    isMissedOut: boolean
): number {
    // Full absent day = full penalty
    if (isAbsent) return FULL_DAY_PENALTY_MIN;

    const inMin  = parseTime12h(checkIn);
    const outMin = parseTime12h(checkOut);

    // Both missing = full penalty
    if (inMin === null && outMin === null) return FULL_DAY_PENALTY_MIN;

    let morningDelay: number;
    let earlyLeave: number;

    if (isMissedIn || inMin === null) {
        // No check-in recorded → full morning penalty
        morningDelay = FULL_DAY_PENALTY_MIN;
    } else {
        morningDelay = Math.max(0, inMin - LATE_THRESHOLD_MIN);
    }

    if (isMissedOut || outMin === null) {
        // No check-out recorded → full afternoon penalty
        earlyLeave = FULL_DAY_PENALTY_MIN;
    } else {
        earlyLeave = Math.max(0, EARLY_THRESHOLD_MIN - outMin);
    }

    // Cap total at full day penalty
    return Math.min(morningDelay + earlyLeave, FULL_DAY_PENALTY_MIN);
}

/**
 * Calculate total penalty hours for an employee across all non-exempted logs.
 */
export function calculateTotalPenaltyHours(
    logs: DailyLog[],
    employeeId: string,
    holidays: HolidaySet,
    exemptions: DayExemptionMap
): number {
    let totalMinutes = 0;
    for (const log of logs) {
        if (isDayExempted(log.date, employeeId, holidays, exemptions)) continue;
        totalMinutes += calculateDayPenaltyMinutes(
            log.check_in,
            log.check_out,
            log.absent,
            log.missed_in,
            log.missed_out
        );
    }
    return Math.round((totalMinutes / 60) * 100) / 100;
}
