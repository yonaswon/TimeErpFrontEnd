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
// Styled export matching Payroll_May_2026 (1)(1).xlsx layout (purple headers, borders, merges).

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

function sumCol(rows: PayrollRow[], fn: (r: PayrollRow) => number): number {
    return round2(rows.reduce((s, r) => s + fn(r), 0));
}

const PAYROLL_PURPLE = 'FF7030A0';
const NUM_FMT = '#,##0.00';

type PayrollCellStyle = 'title-tnr' | 'title-arial' | 'title-arial-lg' | 'title-arial-xl' | 'header' | 'header-sm' | 'data' | 'data-name' | 'data-text' | 'total' | 'sig' | 'journal-hdr' | 'journal-row' | 'journal-total';

function applyPayrollBorder(cell: { border?: Partial<import('exceljs').Borders> }) {
    const side = { style: 'thin' as const, color: { argb: 'FF000000' } };
    cell.border = { top: side, left: side, bottom: side, right: side };
}

function stylePayrollCell(cell: import('exceljs').Cell, kind: PayrollCellStyle) {
    applyPayrollBorder(cell);
    switch (kind) {
        case 'title-tnr':
            cell.font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: PAYROLL_PURPLE } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            break;
        case 'title-arial':
            cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: PAYROLL_PURPLE } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            break;
        case 'title-arial-lg':
            cell.font = { name: 'Arial', size: 14, bold: true, color: { argb: PAYROLL_PURPLE } };
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
            break;
        case 'title-arial-xl':
            cell.font = { name: 'Arial', size: 22, color: { argb: PAYROLL_PURPLE } };
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
            break;
        case 'header':
            cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: PAYROLL_PURPLE } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            break;
        case 'header-sm':
            cell.font = { name: 'Calibri', size: 11, color: { argb: PAYROLL_PURPLE } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            break;
        case 'data':
            cell.font = { name: 'Times New Roman', size: 12 };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.numFmt = NUM_FMT;
            break;
        case 'data-name':
            cell.font = { name: 'Times New Roman', size: 12 };
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
            break;
        case 'data-text':
            cell.font = { name: 'Times New Roman', size: 12 };
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            break;
        case 'total':
            cell.font = { name: 'Times New Roman', size: 12, bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.numFmt = NUM_FMT;
            break;
        case 'sig':
            cell.font = { name: 'Arial', size: 9 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            break;
        case 'journal-hdr':
            cell.font = { name: 'Times New Roman', size: 12, bold: true };
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
            break;
        case 'journal-row':
            cell.font = { name: 'Times New Roman', size: 12 };
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
            cell.numFmt = NUM_FMT;
            break;
        case 'journal-total':
            cell.font = { name: 'Times New Roman', size: 12, bold: true };
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
            cell.numFmt = NUM_FMT;
            break;
    }
}

function setPayrollCell(
    sheet: import('exceljs').Worksheet,
    row: number,
    col: number,
    value: string | number | null | undefined,
    kind: PayrollCellStyle
) {
    const cell = sheet.getCell(row, col);
    cell.value = value ?? null;
    stylePayrollCell(cell, kind);
}

function mergeStyled(
    sheet: import('exceljs').Worksheet,
    range: string,
    value: string,
    kind: PayrollCellStyle
) {
    sheet.mergeCells(range);
    const topLeft = range.split(':')[0];
    const cell = sheet.getCell(topLeft);
    cell.value = value;
    stylePayrollCell(cell, kind);
}

async function downloadExcelWorkbook(workbook: import('exceljs').Workbook, filename: string) {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob(
        [buffer],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

export async function exportPayrollExcel(
    rows: PayrollRow[],
    period: string,
    companyName = 'NAHOM ALI ABDORAZAK'
) {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Payroll-Nahom', {
        views: [{ showGridLines: true }],
    });

    // Column widths — match reference Payroll_May_2026
    const colWidths = [2.875, 22.625, 8.125, 11.625, 8.625, 12.125, 10.75, 6, 10.75, 11.5, 12.5, 12, 10.25, 11.75, 11.25, 9.25, 12, 12.625, 11.875];
    sheet.columns = colWidths.map((w) => ({ width: w }));

    // ── Title block ──
    mergeStyled(sheet, 'A1:R1', companyName, 'title-tnr');
    mergeStyled(sheet, 'A2:R2', `Salary Payment For The Month Of ${period}`, 'title-arial');

    // ── Two-row headers (rows 3–4) ──
    const headerRow1 = [
        'NO', 'Employee Name', 'Position', 'Basic Salary', 'Working days',
        'Salary for working days', 'Non-taxable transportation allownace',
        'Taxable transportation allownace', 'Over Time Payemnt', 'Hour Penality',
        'Gross pay', 'Taxable income',
    ];
    headerRow1.forEach((label, i) => {
        const col = i + 1;
        sheet.mergeCells(3, col, 4, col);
        setPayrollCell(sheet, 3, col, label, 'header');
    });
    mergeStyled(sheet, 'M3:Q3', 'Deductions', 'header');
    ['Income  Tax', 'Pension 7%', 'Pension 11%', 'Loan Deduction', 'Total Deductions'].forEach((label, i) => {
        setPayrollCell(sheet, 4, 13 + i, label, 'header');
    });
    sheet.mergeCells('R3:R4');
    setPayrollCell(sheet, 3, 18, 'Net Pay', 'header');
    setPayrollCell(sheet, 4, 19, 'Signe', 'header-sm');

    sheet.getRow(4).height = 31.5;

    // ── Employee data rows ──
    const dataStart = 5;
    rows.forEach((row, idx) => {
        const r = dataStart + idx;
        sheet.getRow(r).height = 24;
        setPayrollCell(sheet, r, 1, idx + 1, 'data-text');
        setPayrollCell(sheet, r, 2, row.name, 'data-name');
        setPayrollCell(sheet, r, 3, row.position || '', 'data');
        setPayrollCell(sheet, r, 4, round2(row.basicSalary), 'data');
        setPayrollCell(sheet, r, 5, row.workingDays, 'data');
        setPayrollCell(sheet, r, 6, round2(row.salaryForWorkingDays), 'data');
        setPayrollCell(sheet, r, 7, round2(row.nonTaxableTransport), 'data');
        setPayrollCell(sheet, r, 8, round2(row.taxableTransport), 'data');
        setPayrollCell(sheet, r, 9, round2(row.overtimeTotal), 'data');
        setPayrollCell(sheet, r, 10, round2(row.hourPenaltyAmount), 'data');
        setPayrollCell(sheet, r, 11, round2(row.grossPay), 'data');
        setPayrollCell(sheet, r, 12, round2(row.taxableIncome), 'data');
        setPayrollCell(sheet, r, 13, round2(row.incomeTax), 'data');
        setPayrollCell(sheet, r, 14, round2(row.pensionEmployee), 'data');
        setPayrollCell(sheet, r, 15, round2(row.pensionEmployer), 'data');
        setPayrollCell(sheet, r, 16, round2(row.loanAmount), 'data');
        setPayrollCell(sheet, r, 17, round2(row.totalDeduction), 'data');
        setPayrollCell(sheet, r, 18, round2(row.netPay), 'data');
        setPayrollCell(sheet, r, 19, '', 'data');
    });

    // ── Totals row ──
    const totalsRow = dataStart + rows.length;
    const totals = {
        basicSalary: sumCol(rows, (r) => r.basicSalary),
        workingDays: sumCol(rows, (r) => r.workingDays),
        salaryForWorkingDays: sumCol(rows, (r) => r.salaryForWorkingDays),
        nonTaxableTransport: sumCol(rows, (r) => r.nonTaxableTransport),
        taxableTransport: sumCol(rows, (r) => r.taxableTransport),
        overtimeTotal: sumCol(rows, (r) => r.overtimeTotal),
        hourPenaltyAmount: sumCol(rows, (r) => r.hourPenaltyAmount),
        grossPay: sumCol(rows, (r) => r.grossPay),
        taxableIncome: sumCol(rows, (r) => r.taxableIncome),
        incomeTax: sumCol(rows, (r) => r.incomeTax),
        pensionEmployee: sumCol(rows, (r) => r.pensionEmployee),
        pensionEmployer: sumCol(rows, (r) => r.pensionEmployer),
        loanAmount: sumCol(rows, (r) => r.loanAmount),
        totalDeduction: sumCol(rows, (r) => r.totalDeduction),
        netPay: sumCol(rows, (r) => r.netPay),
    };
    [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].forEach((col) => {
        const key = [
            'basicSalary', 'workingDays', 'salaryForWorkingDays', 'nonTaxableTransport',
            'taxableTransport', 'overtimeTotal', 'hourPenaltyAmount', 'grossPay',
            'taxableIncome', 'incomeTax', 'pensionEmployee', 'pensionEmployer',
            'loanAmount', 'totalDeduction', 'netPay',
        ][col - 4] as keyof typeof totals;
        setPayrollCell(sheet, totalsRow, col, totals[key], 'total');
    });

    // ── Signatures ──
    const sigRow = totalsRow + 3;
    mergeStyled(sheet, `A${sigRow}:B${sigRow}`, 'Prepared By', 'sig');
    mergeStyled(sheet, `F${sigRow}:G${sigRow}`, 'Checked By', 'sig');
    mergeStyled(sheet, `M${sigRow}:Q${sigRow}`, 'Approved By', 'sig');

    // ── Journal voucher ──
    const totalGrossPay = totals.grossPay;
    const totalPension11 = totals.pensionEmployer;
    const totalPension7 = totals.pensionEmployee;
    const totalIncomeTax = totals.incomeTax;
    const totalLoans = totals.loanAmount;
    const totalNetPay = totals.netPay;
    const pensionPayable = round2(totalPension7 + totalPension11);
    const totalDr = round2(totalGrossPay + totalPension11);
    const totalCr = round2(totalLoans + pensionPayable + totalIncomeTax + totalNetPay);

    const jStart = sigRow + 4;
    mergeStyled(sheet, `B${jStart}:G${jStart}`, companyName, 'title-arial-lg');
    mergeStyled(sheet, `B${jStart + 1}:G${jStart + 1}`, `Salary Payment For The Month Of ${period}`, 'title-arial-lg');
    sheet.getRow(jStart + 1).height = 24.75;
    mergeStyled(sheet, `B${jStart + 2}:G${jStart + 2}`, 'Journal Voucher', 'title-arial-xl');
    sheet.getRow(jStart + 2).height = 27;

    const hdr = jStart + 3;
    setPayrollCell(sheet, hdr, 2, 'Account Description', 'journal-hdr');
    sheet.mergeCells(`C${hdr}:D${hdr}`);
    setPayrollCell(sheet, hdr, 3, 'Dr', 'journal-hdr');
    mergeStyled(sheet, `E${hdr}:G${hdr}`, 'Cr', 'journal-hdr');

    const addJvDr = (row: number, label: string, amount: number) => {
        setPayrollCell(sheet, row, 2, label, 'journal-row');
        sheet.mergeCells(`C${row}:D${row}`);
        setPayrollCell(sheet, row, 3, amount, 'journal-row');
    };
    const addJvCr = (row: number, label: string, amount: number) => {
        setPayrollCell(sheet, row, 2, label, 'journal-row');
        sheet.mergeCells(`E${row}:G${row}`);
        setPayrollCell(sheet, row, 5, amount, 'journal-row');
    };

    addJvDr(hdr + 1, 'Salary Expense', totalGrossPay);
    addJvDr(hdr + 2, 'Pension Expense', totalPension11);
    addJvCr(hdr + 3, '                   Staff Loan', totalLoans);
    addJvCr(hdr + 4, '                 Pension Payable', pensionPayable);
    addJvCr(hdr + 5, '           Income tax payable', totalIncomeTax);
    addJvCr(hdr + 6, '           Cash', totalNetPay);

    const totalJvRow = hdr + 7;
    setPayrollCell(sheet, totalJvRow, 2, 'Total', 'journal-total');
    sheet.mergeCells(`C${totalJvRow}:D${totalJvRow}`);
    setPayrollCell(sheet, totalJvRow, 3, totalDr, 'journal-total');
    sheet.mergeCells(`E${totalJvRow}:G${totalJvRow}`);
    setPayrollCell(sheet, totalJvRow, 5, totalCr, 'journal-total');

    await downloadExcelWorkbook(workbook, `Payroll_${period.replace(/\s/g, '_')}.xlsx`);
}
