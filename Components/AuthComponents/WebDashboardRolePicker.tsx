'use client';

import { LayoutDashboard, Package, Wallet } from 'lucide-react';
import type { WebDashboardChoice } from '@/lib/webDashboardAuth';

interface WebDashboardRolePickerProps {
    userName?: string;
    availableChoices?: WebDashboardChoice[];
    onSelect: (choice: WebDashboardChoice) => void;
}

const ALL_OPTIONS: Array<{
    choice: WebDashboardChoice;
    title: string;
    description: string;
    color: string;
    hoverBorder: string;
    bg: string;
    Icon: typeof LayoutDashboard;
}> = [
    {
        choice: 'admin',
        title: 'Admin',
        description: 'Full admin dashboard — orders, finance, attendance, CRM',
        color: '#2563EB',
        hoverBorder: 'hover:border-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        Icon: LayoutDashboard,
    },
    {
        choice: 'finance',
        title: 'Finance & Accounting',
        description: 'Finance dashboard — attendance and payroll',
        color: '#7C3AED',
        hoverBorder: 'hover:border-violet-500',
        bg: 'bg-violet-50 dark:bg-violet-900/20',
        Icon: Wallet,
    },
    {
        choice: 'stock',
        title: 'Time Stock',
        description: 'Stock Manager — materials, inventories, and movement history',
        color: '#84CC16',
        hoverBorder: 'hover:border-lime-500',
        bg: 'bg-lime-50 dark:bg-lime-900/20',
        Icon: Package,
    },
];

export function WebDashboardRolePicker({
    userName,
    availableChoices,
    onSelect,
}: WebDashboardRolePickerProps) {
    const choices = availableChoices?.length
        ? ALL_OPTIONS.filter((o) => availableChoices.includes(o.choice))
        : ALL_OPTIONS.filter((o) => o.choice !== 'stock');

    return (
        <div className="w-full max-w-md p-4 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <div className="text-center mb-6">
                <h2 className="text-[18px] font-bold text-gray-900 dark:text-gray-100">
                    Choose Dashboard
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {userName
                        ? `Welcome, ${userName}. Select where to continue.`
                        : 'Select where to continue.'}
                </p>
            </div>

            <div className="space-y-3">
                {choices.map(({ choice, title, description, color, hoverBorder, bg, Icon }) => (
                    <button
                        key={choice}
                        type="button"
                        onClick={() => onSelect(choice)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent ${hoverBorder} ${bg} transition-colors text-left cursor-pointer`}
                    >
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
                            style={{ background: color }}
                        >
                            <Icon size={22} />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
