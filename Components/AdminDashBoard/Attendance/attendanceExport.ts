/**
 * Excel export utilities for Attendance and Payroll.
 * Matches the reference spreadsheet format (Main Salary Meskerem.xlsx / Payroll Yonas.xlsx).
 */
import * as XLSX from 'xlsx';
import { EmployeeStat, PayrollRow, HolidaySet, DayExemptionMap, LocalEditsMap } from './attendanceTypes';
import { mergeEditsIntoLogs, recalculateTotalHours, calculateExpectedHours, isDayExempted } from './attendanceUtils';

// ─── helpers ─────────────────────────────────────────────────────────────────

function calcRegular(hours: number) { return Math.min(hours, 8); }
function calcOT(hours: number) { return Math.max(0, Math.round((hours - 8) * 100) / 100); }

function saveWorkbook(wb: XLSX.WorkBook, filename: string) {
    XLSX.writeFile(wb, filename);
}

// ─── Attendance Export ────────────────────────────────────────────────────────
// One sheet per employee, matching the "Main Salary Meskerem.xlsx" layout:
// Header rows: Company name, employee name, period
// Columns: DATE | TIME IN | LUNCH OUT | LUNCH IN | TIME OUT | HOURS WORKED | REGULAR | OVER TIME

export function exportAttendanceExcel(
    employees: EmployeeStat[],
    localEdits: LocalEditsMap,
    holidays: HolidaySet,
    exemptions: DayExemptionMap,
    period: string,
    companyName = 'NAHOM ALI ABDORAZAK'
) {
    const wb = XLSX.utils.book_new();

    employees.forEach((emp) => {
        const logs = mergeEditsIntoLogs(emp.daily_logs, localEdits, emp.zkt_user_id, holidays, exemptions);
        const totalHours = recalculateTotalHours(logs);
        const totalRegular = logs.reduce((s, l) => s + calcRegular(l.hours), 0);
        const totalOT = logs.reduce((s, l) => s + calcOT(l.hours), 0);

        const rows: (string | number)[][] = [];

        // ── Title block ──
        rows.push([companyName]);
        rows.push(['EMPLOYEE ATTENDANCE SHEET']);
        rows.push([`For The Period Of: ${period}`]);
        rows.push([`Employee: ${emp.name}`]);
        rows.push([]); // blank

        // ── Column headers ──
        rows.push(['DATE', 'TIME IN', 'LUNCH OUT', 'LUNCH IN', 'TIME OUT', 'HOURS WORKED', 'REGULAR', 'OVER TIME', 'STATUS']);

        // ── Daily rows ──
        const sortedLogs = [...logs].sort((a, b) => {
            // sort ascending by date for the sheet
            const da = new Date(a.date);
            const db = new Date(b.date);
            return da.getTime() - db.getTime();
        });

        sortedLogs.forEach((log) => {
            const exempted = isDayExempted(log.date, emp.zkt_user_id, holidays, exemptions);
            const isHoliday = holidays.has(log.date);
            const isLeave = exemptions[`${emp.zkt_user_id}:${log.date}`] === 'leave';

            let status = '';
            if (isHoliday) status = 'Holiday';
            else if (isLeave) status = 'Known Leave';
            else if (log.absent) status = 'Absent';
            else if (log.missed_in || log.missed_out) status = 'Attention';

            const timeIn = exempted ? '—' : log.absent ? 'Absent' : log.check_in;
            const timeOut = exempted ? '—' : log.absent ? 'Absent' : log.check_out;
            const lunchOut = (!exempted && log.hours > 0) ? '07:00 AM' : '—';
            const lunchIn  = (!exempted && log.hours > 0) ? '08:00 AM' : '—';
            const hoursWorked = exempted ? 8 : log.hours;
            const regular = calcRegular(hoursWorked);
            const ot = calcOT(hoursWorked);

            rows.push([
                log.date,
                timeIn,
                lunchOut,
                lunchIn,
                timeOut,
                hoursWorked,
                regular,
                ot,
                status,
            ]);
        });

        // ── Totals row ──
        rows.push([]);
        rows.push([
            'TOTAL',
            '', '', '', '',
            Math.round(totalHours * 100) / 100,
            Math.round(totalRegular * 100) / 100,
            Math.round(totalOT * 100) / 100,
            '',
        ]);

        // ── Summary block ──
        rows.push([]);
        rows.push(['Working Days', emp.working_days]);
        rows.push(['Absent Days', emp.absent_days]);
        rows.push(['Delays', emp.delays]);
        rows.push(['Early Birds', emp.early_birds]);
        rows.push(['Avg Hours/Day', emp.avg_hours.toFixed(2)]);
        rows.push(['Expected Hours', calculateExpectedHours(emp.working_days)]);
        rows.push(['Actual Hours', totalHours.toFixed(2)]);
        rows.push(['Difference', (totalHours - calculateExpectedHours(emp.working_days)).toFixed(2)]);

        const ws = XLSX.utils.aoa_to_sheet(rows);

        // Column widths
        ws['!cols'] = [
            { wch: 14 }, // Date
            { wch: 12 }, // Time In
            { wch: 12 }, // Lunch Out
            { wch: 12 }, // Lunch In
            { wch: 12 }, // Time Out
            { wch: 14 }, // Hours Worked
            { wch: 10 }, // Regular
            { wch: 10 }, // OT
            { wch: 14 }, // Status
        ];

        // Safe sheet name (max 31 chars, no special chars)
        const sheetName = emp.name.replace(/[\\/*?[\]:]/g, '').substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    // Summary sheet — all employees on one sheet
    const summaryRows: (string | number)[][] = [];
    summaryRows.push([companyName]);
    summaryRows.push(['ATTENDANCE SUMMARY']);
    summaryRows.push([`Period: ${period}`]);
    summaryRows.push([]);
    summaryRows.push([
        'Name', 'Working Days', 'Absent Days', 'Total Hours',
        'Expected Hours', 'Difference', 'Avg Hours', 'Delays', 'Early Birds',
        'Missed Check-ins', 'Missed Check-outs',
    ]);

    employees.forEach((emp) => {
        const logs = mergeEditsIntoLogs(emp.daily_logs, localEdits, emp.zkt_user_id, holidays, exemptions);
        const totalHours = recalculateTotalHours(logs);
        const expected = calculateExpectedHours(emp.working_days);
        summaryRows.push([
            emp.name,
            emp.working_days,
            emp.absent_days,
            Math.round(totalHours * 100) / 100,
            expected,
            Math.round((totalHours - expected) * 100) / 100,
            emp.avg_hours,
            emp.delays,
            emp.early_birds,
            emp.missed_checkins,
            emp.missed_checkouts,
        ]);
    });

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
    summaryWs['!cols'] = [
        { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 13 },
        { wch: 15 }, { wch: 12 }, { wch: 11 }, { wch: 8 }, { wch: 11 },
        { wch: 18 }, { wch: 19 },
    ];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    saveWorkbook(wb, `Attendance_${period.replace(/\s/g, '_')}.xlsx`);
}

// ─── Payroll Export ───────────────────────────────────────────────────────────

export interface ExportColumn {
    key: string;
    label: string;
    selected: boolean;
}

export const ALL_PAYROLL_COLUMNS: ExportColumn[] = [
    { key: 'name',            label: 'Employee Name',    selected: true },
    { key: 'targetNetPay',    label: 'Target Net Pay',   selected: true },
    { key: 'transport',       label: 'Transport',        selected: true },
    { key: 'expectedHours',   label: 'Expected Hrs',     selected: true },
    { key: 'penaltyHours',    label: 'Penalty Hrs',      selected: true },
    { key: 'hourPenalty',     label: 'Hour Penalty',     selected: true },
    { key: 'overtimeTotal',   label: 'Overtime',         selected: true },
    { key: 'loanAmount',      label: 'Loan',             selected: true },
    { key: 'finalNetPay',     label: 'Final Net Pay',    selected: true },
    { key: 'totalNetPay',     label: 'Total Net Pay',    selected: true },
    { key: 'grossSalary',     label: 'Gross Salary',     selected: true },
    { key: 'incomeTax',       label: 'Income Tax',       selected: true },
    { key: 'pensionEmployee', label: 'Pension 7%',       selected: true },
    { key: 'pensionEmployer', label: 'Pension 11%',      selected: true },
    { key: 'totalDeduction',  label: 'Total Deduction',  selected: true },
];

function getRowValue(row: PayrollRow, key: string): string | number {
    switch (key) {
        case 'name':            return row.name;
        case 'targetNetPay':    return Math.round(row.targetNetPay * 100) / 100;
        case 'transport':       return Math.round(row.transport * 100) / 100;
        case 'expectedHours':   return row.expectedHours;
        case 'penaltyHours':    return Math.round(row.penaltyHours * 100) / 100;
        case 'hourPenalty':     return Math.round(row.hourPenalty * 100) / 100;
        case 'overtimeTotal':   return Math.round((row.overtimeTotal ?? 0) * 100) / 100;
        case 'loanAmount':      return Math.round((row.loanAmount ?? 0) * 100) / 100;
        case 'finalNetPay':     return Math.round(row.finalNetPay * 100) / 100;
        case 'totalNetPay':     return Math.round((row.totalNetPay ?? row.finalNetPay) * 100) / 100;
        case 'grossSalary':     return Math.round(row.grossSalary * 100) / 100;
        case 'incomeTax':       return Math.round(row.incomeTax * 100) / 100;
        case 'pensionEmployee': return Math.round(row.pensionEmployee * 100) / 100;
        case 'pensionEmployer': return Math.round(row.pensionEmployer * 100) / 100;
        case 'totalDeduction':  return Math.round(row.totalDeduction * 100) / 100;
        default:                return '';
    }
}

export function exportPayrollExcel(
    rows: PayrollRow[],
    period: string,
    columns?: ExportColumn[],
    companyName = 'NAHOM ALI ABDORAZAK'
) {
    const cols = (columns ?? ALL_PAYROLL_COLUMNS).filter((c) => c.selected);
    const wb = XLSX.utils.book_new();
    const sheetRows: (string | number)[][] = [];

    sheetRows.push([companyName]);
    sheetRows.push(['EMPLOYEE SALARY SHEET']);
    sheetRows.push([`For The Month Of: ${period}`]);
    sheetRows.push([]);
    sheetRows.push(cols.map((c) => c.label));

    rows.forEach((row) => {
        sheetRows.push(cols.map((c) => getRowValue(row, c.key)));
    });

    // Totals row
    const totalsRow = cols.map((c) => {
        if (c.key === 'name') return 'TOTAL';
        const val = rows.reduce((s, r) => s + (Number(getRowValue(r, c.key)) || 0), 0);
        return Math.round(val * 100) / 100;
    });
    sheetRows.push(totalsRow);
    sheetRows.push([]);
    sheetRows.push(['Prepared By', '', '', 'Checked By', '', '', '', 'Approved By']);

    const ws = XLSX.utils.aoa_to_sheet(sheetRows);
    ws['!cols'] = cols.map((c) => ({ wch: c.key === 'name' ? 22 : 14 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
    saveWorkbook(wb, `Payroll_${period.replace(/\s/g, '_')}.xlsx`);
}
