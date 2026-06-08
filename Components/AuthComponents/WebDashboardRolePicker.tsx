'use client';

import { LayoutDashboard, Wallet } from 'lucide-react';
import type { WebDashboardChoice } from '@/lib/webDashboardAuth';

interface WebDashboardRolePickerProps {
    userName?: string;
    onSelect: (choice: WebDashboardChoice) => void;
}

export function WebDashboardRolePicker({ userName, onSelect }: WebDashboardRolePickerProps) {
    return (
        <div className="w-full max-w-md p-4 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <div className="text-center mb-6">
                <h2 className="text-[18px] font-bold text-gray-900 dark:text-gray-100">
                    Choose Dashboard
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {userName
                        ? `Welcome, ${userName}. You have access to both dashboards.`
                        : 'You have access to both dashboards. Select where to continue.'}
                </p>
            </div>

            <div className="space-y-3">
                <button
                    type="button"
                    onClick={() => onSelect('admin')}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent hover:border-blue-500 bg-blue-50 dark:bg-blue-900/20 transition-colors text-left cursor-pointer"
                >
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
                        style={{ background: '#2563EB' }}
                    >
                        <LayoutDashboard size={22} />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Admin</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Full admin dashboard — orders, finance, attendance, CRM
                        </p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onSelect('finance')}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent hover:border-violet-500 bg-violet-50 dark:bg-violet-900/20 transition-colors text-left cursor-pointer"
                >
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
                        style={{ background: '#7C3AED' }}
                    >
                        <Wallet size={22} />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Finance &amp; Accounting</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Finance dashboard — attendance and payroll
                        </p>
                    </div>
                </button>
            </div>
        </div>
    );
}
