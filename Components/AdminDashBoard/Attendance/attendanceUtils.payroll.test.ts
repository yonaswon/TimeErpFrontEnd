import { describe, it, expect } from 'vitest';
import {
    calculateEthiopianIncomeTax,
    calculateSalaryForWorkingDays,
    calculateHourPenaltyAmount,
    calculateOvertimeAmount,
    calculatePayrollRow,
    calculateTaxableIncome,
    solveBasicFromAgreedNet,
} from './attendanceUtils';
import { EmployeeStat } from './attendanceTypes';

const stubEmp = (name: string): EmployeeStat => ({
    zkt_user_id: '1',
    name,
    telegram_username: '',
    working_days: 22,
    absent_days: 0,
    total_hours: 176,
    avg_hours: 8,
    delays: 0,
    early_birds: 0,
    missed_checkouts: 0,
    missed_checkins: 0,
    daily_logs: [],
});

/** Test helper using direct basic salary (Excel golden vectors) */
function payrollFromBasic(
    basicSalary: number,
    opts: {
        workingDays?: number;
        transport?: number;
        overtime?: number;
        penaltyHours?: number;
        loan?: number;
    } = {}
) {
    return calculatePayrollRow({
        emp: stubEmp('test'),
        basicSalary,
        workingDays: opts.workingDays ?? 30,
        nonTaxableTransport: opts.transport ?? 0,
        penaltyHours: opts.penaltyHours ?? 0,
        overtimeTotal: opts.overtime ?? 0,
        loanAmount: opts.loan ?? 0,
    });
}

/** Production path: agreed net pay input */
function payrollFromAgreed(
    agreedNetPay: number,
    opts: {
        transport?: number;
        overtime?: number;
        penaltyHours?: number;
        loan?: number;
    } = {}
) {
    return calculatePayrollRow({
        emp: stubEmp('test'),
        agreedNetPay,
        nonTaxableTransport: opts.transport ?? 0,
        penaltyHours: opts.penaltyHours ?? 0,
        overtimeTotal: opts.overtime ?? 0,
        loanAmount: opts.loan ?? 0,
    });
}

describe('solveBasicFromAgreedNet', () => {
    it('Tseagye: 15500 agreed net → basic 22155.17', () => {
        expect(solveBasicFromAgreedNet(15500, 600)).toBeCloseTo(22155.17, 1);
    });

    it('Yohannes: 22000 agreed net → basic 30603.45', () => {
        expect(solveBasicFromAgreedNet(22000, 2200)).toBeCloseTo(30603.45, 1);
    });

    it('Tseganesh: 25000 agreed net → basic 35775.86', () => {
        expect(solveBasicFromAgreedNet(25000, 2200)).toBeCloseTo(35775.86, 1);
    });

    it('full attendance net matches agreed input', () => {
        const r = payrollFromAgreed(15500, { transport: 600 });
        expect(r.netPay).toBeCloseTo(15500, 1);
        expect(r.basicSalary).toBeCloseTo(22155.17, 1);
    });
});

describe('calculateEthiopianIncomeTax', () => {
    it('returns 0 below 2000', () => {
        expect(calculateEthiopianIncomeTax(1500)).toBe(0);
    });

    it('applies 35% bracket', () => {
        expect(calculateEthiopianIncomeTax(30603.45)).toBeCloseTo(8661.21, 1);
    });
});

describe('Reference Excel golden vectors (via basic)', () => {
    it('Yohannes: full month, net = 22000', () => {
        const r = payrollFromBasic(30603.45, { transport: 2200 });
        expect(r.netPay).toBeCloseTo(22000, 1);
    });

    it('Tseagye: OT + penalty from basic', () => {
        const hourly = 22155.17 / 30 / 8;
        const r = payrollFromBasic(22155.17, {
            transport: 600,
            overtime: 1846.2641666666664,
            penaltyHours: 71.6 / hourly,
        });
        expect(r.netPay).toBeCloseTo(16628.47, 1);
        expect(r.taxableIncome).toBeCloseTo(24001.43, 1);
    });
});

describe('Tseagye agreed-net pipeline (production path)', () => {
    it('derives basic and matches Excel with OT + Excel penalty', () => {
        const basic = solveBasicFromAgreedNet(15500, 600);
        const hourly = basic / 30 / 8;
        const ot = calculateOvertimeAmount(basic, 8, 'holiday');
        const r = payrollFromAgreed(15500, {
            transport: 600,
            overtime: ot,
            penaltyHours: 71.6 / hourly,
        });
        expect(r.basicSalary).toBeCloseTo(22155.17, 1);
        expect(r.overtimeTotal).toBeCloseTo(1846.26, 1);
        expect(r.netPay).toBeCloseTo(16628.47, 1);
        expect(r.agreedNetPay).toBe(15500);
    });

    it('Tebebe via agreed net equivalent', () => {
        const r = payrollFromBasic(17844.82, {
            transport: 600,
            penaltyHours: 294.62 / (17844.82 / 30 / 8),
            loan: 6956.52,
        });
        expect(r.netPay).toBeCloseTo(5748.86, 1);
    });

    it('penalty does not reduce taxable income', () => {
        const basic = solveBasicFromAgreedNet(15500, 600);
        const ot = calculateOvertimeAmount(basic, 8, 'holiday');
        const base = payrollFromAgreed(15500, { transport: 600, overtime: ot });
        const penalized = payrollFromAgreed(15500, { transport: 600, overtime: ot, penaltyHours: 2 });
        expect(penalized.taxableIncome).toBe(base.taxableIncome);
        expect(penalized.netPay).toBeLessThan(base.netPay);
    });
});

describe('calculateTaxableIncome', () => {
    it('excludes penalty', () => {
        expect(calculateTaxableIncome(10000, 0, 500)).toBe(10500);
    });
});
