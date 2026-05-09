'use client';
import React, { useState } from 'react';
import { Plus, X, Umbrella } from 'lucide-react';
import { FilterPreset, HolidaySet } from './attendanceTypes';

interface AttendanceFilterBarProps {
    filter: FilterPreset;
    customRange: { start: string; end: string };
    holidays: HolidaySet;
    onFilterChange: (f: FilterPreset) => void;
    onCustomRangeChange: (range: { start: string; end: string }) => void;
    onToggleHoliday: (date: string) => void;
}

const PRESETS: { id: FilterPreset; label: string }[] = [
    { id: 'today',      label: 'Today' },
    { id: 'yesterday',  label: 'Yesterday' },
    { id: 'this_week',  label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'custom',     label: 'Custom' },
];

/** Convert "YYYY-MM-DD" → "DD Mon YYYY" to match backend date format */
function isoToDisplayDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AttendanceFilterBar({
    filter, customRange, holidays,
    onFilterChange, onCustomRangeChange, onToggleHoliday,
}: AttendanceFilterBarProps) {
    const [holidayInput, setHolidayInput] = useState('');

    const handleAddHoliday = () => {
        if (!holidayInput) return;
        const display = isoToDisplayDate(holidayInput);
        if (display) onToggleHoliday(display);
        setHolidayInput('');
    };

    return (
        <div
            className="flex flex-col gap-3 px-6 py-4 border-b"
            style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-card)' }}
        >
            {/* Row 1: presets + custom dates */}
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => onFilterChange(p.id)}
                            className="rounded-lg text-sm font-medium transition-all"
                            style={{
                                padding: '8px 16px',
                                background: filter === p.id ? 'var(--admin-primary, #2563EB)' : 'var(--admin-bg)',
                                color: filter === p.id ? '#fff' : 'var(--admin-text-secondary)',
                                border: `1px solid ${filter === p.id ? 'var(--admin-primary, #2563EB)' : 'var(--admin-border)'}`,
                                cursor: 'pointer',
                            }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {filter === 'custom' && (
                    <div className="flex flex-wrap gap-3 items-end">
                        {(['start', 'end'] as const).map((field) => (
                            <div key={field} className="flex flex-col gap-1">
                                <label className="text-xs font-medium" style={{ color: 'var(--admin-text-secondary)' }}>
                                    {field === 'start' ? 'Start Date' : 'End Date'}
                                </label>
                                <input
                                    type="date"
                                    value={customRange[field]}
                                    onChange={(e) => onCustomRangeChange({ ...customRange, [field]: e.target.value })}
                                    className="rounded-lg px-3 text-sm outline-none"
                                    style={{
                                        height: '36px',
                                        background: 'var(--admin-bg)',
                                        border: '1px solid var(--admin-border)',
                                        color: 'var(--admin-text)',
                                        colorScheme: 'dark',
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Row 2: holiday manager */}
            <div className="flex flex-wrap items-center gap-3">
                <div
                    className="flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: 'var(--admin-text-secondary)' }}
                >
                    <Umbrella size={13} />
                    Holidays:
                </div>

                {/* Existing holiday chips */}
                {[...holidays].map((date) => (
                    <span
                        key={date}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                        style={{
                            background: 'rgba(37,99,235,0.1)',
                            color: 'var(--admin-primary, #2563EB)',
                            border: '1px solid rgba(37,99,235,0.2)',
                        }}
                    >
                        {date}
                        <button
                            onClick={() => onToggleHoliday(date)}
                            style={{ lineHeight: 0, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                        >
                            <X size={10} style={{ color: 'var(--admin-primary, #2563EB)' }} />
                        </button>
                    </span>
                ))}

                {/* Add holiday input */}
                <div className="flex items-center gap-1">
                    <input
                        type="date"
                        value={holidayInput}
                        onChange={(e) => setHolidayInput(e.target.value)}
                        className="rounded-lg px-2 text-xs outline-none"
                        style={{
                            height: '30px',
                            background: 'var(--admin-bg)',
                            border: '1px solid var(--admin-border)',
                            color: 'var(--admin-text)',
                            colorScheme: 'dark',
                        }}
                    />
                    <button
                        onClick={handleAddHoliday}
                        disabled={!holidayInput}
                        className="flex items-center gap-1 rounded-lg text-xs font-semibold transition-all"
                        style={{
                            padding: '5px 10px',
                            height: '30px',
                            background: holidayInput ? 'var(--admin-primary, #2563EB)' : 'var(--admin-border)',
                            color: holidayInput ? '#fff' : 'var(--admin-text-secondary)',
                            border: 'none',
                            cursor: holidayInput ? 'pointer' : 'not-allowed',
                        }}
                    >
                        <Plus size={11} />
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}
