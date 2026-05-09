'use client';
import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { EditTarget } from './attendanceTypes';
import { isValidTime, convertTo12Hour } from './attendanceUtils';

interface EditPunchModalProps {
    target: EditTarget | null;
    onSubmit: (time: string) => void;
    onClose: () => void;
}

export default function EditPunchModal({ target, onSubmit, onClose }: EditPunchModalProps) {
    const [timeValue, setTimeValue] = useState('');
    const [touched, setTouched] = useState(false);

    useEffect(() => {
        if (target) {
            setTimeValue('');
            setTouched(false);
        }
    }, [target]);

    if (!target) return null;

    const isCheckin = target.missingField === 'check_in';
    const label = isCheckin ? 'Check-In Time' : 'Check-Out Time';
    const preview = isValidTime(timeValue) ? convertTo12Hour(timeValue) : '';

    // Validate check-out is after check-in
    let crossError = '';
    if (isValidTime(timeValue) && target.existingTime && target.existingTime !== 'Missed') {
        const existingMatch = target.existingTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (existingMatch) {
            let eh = parseInt(existingMatch[1], 10);
            const em = parseInt(existingMatch[2], 10);
            const ep = existingMatch[3].toUpperCase();
            if (ep === 'AM' && eh === 12) eh = 0;
            if (ep === 'PM' && eh !== 12) eh += 12;
            const existingMins = eh * 60 + em;

            const [hStr, mStr] = timeValue.split(':');
            const newMins = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);

            if (!isCheckin && newMins <= existingMins) {
                crossError = 'Check-out must be after check-in';
            }
            if (isCheckin && newMins >= existingMins) {
                crossError = 'Check-in must be before check-out';
            }
        }
    }

    const canSubmit = isValidTime(timeValue) && !crossError;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (canSubmit) onSubmit(timeValue);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="pointer-events-auto w-full max-w-md rounded-2xl shadow-2xl border"
                    style={{
                        background: 'var(--admin-card)',
                        borderColor: 'var(--admin-border)',
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between px-6 py-4 border-b"
                        style={{ borderColor: 'var(--admin-border)' }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: 'var(--admin-warning-bg, rgba(245,158,11,0.12))' }}
                            >
                                <Clock size={18} style={{ color: 'var(--admin-warning, #F59E0B)' }} />
                            </div>
                            <div>
                                <p className="font-semibold text-sm" style={{ color: 'var(--admin-text)' }}>
                                    Edit Attendance
                                </p>
                                <p className="text-xs" style={{ color: 'var(--admin-text-secondary)' }}>
                                    {target.date}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                            style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-secondary)' }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
                        {/* Existing time info */}
                        {target.existingTime && target.existingTime !== 'Missed' && (
                            <div
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
                                style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-secondary)' }}
                            >
                                <CheckCircle2 size={16} style={{ color: 'var(--admin-success, #16A34A)', flexShrink: 0 }} />
                                <span>
                                    {isCheckin ? 'Check-out' : 'Check-in'} recorded:{' '}
                                    <strong style={{ color: 'var(--admin-text)' }}>{target.existingTime}</strong>
                                </span>
                            </div>
                        )}

                        {/* Time input */}
                        <div className="flex flex-col gap-2">
                            <label
                                className="text-sm font-medium"
                                style={{ color: 'var(--admin-text)' }}
                            >
                                {label}
                            </label>
                            <input
                                type="time"
                                value={timeValue}
                                onChange={(e) => { setTimeValue(e.target.value); setTouched(true); }}
                                className="w-full rounded-xl px-4 text-sm font-medium transition-all outline-none focus:ring-2"
                                style={{
                                    height: '44px',
                                    background: 'var(--admin-bg)',
                                    border: `1px solid ${touched && !isValidTime(timeValue) ? 'var(--admin-danger, #DC2626)' : 'var(--admin-border)'}`,
                                    color: 'var(--admin-text)',
                                    colorScheme: 'dark',
                                }}
                            />
                            {/* Preview */}
                            {preview && (
                                <p className="text-xs" style={{ color: 'var(--admin-text-secondary)' }}>
                                    Preview: <strong style={{ color: 'var(--admin-text)' }}>{preview}</strong>
                                </p>
                            )}
                            {/* Validation errors */}
                            {touched && !isValidTime(timeValue) && timeValue && (
                                <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--admin-danger, #DC2626)' }}>
                                    <AlertCircle size={12} /> Invalid time format
                                </p>
                            )}
                            {crossError && (
                                <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--admin-danger, #DC2626)' }}>
                                    <AlertCircle size={12} /> {crossError}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 rounded-xl text-sm font-medium transition-colors"
                                style={{
                                    height: '44px',
                                    background: 'var(--admin-bg)',
                                    border: '1px solid var(--admin-border)',
                                    color: 'var(--admin-text-secondary)',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="flex-1 rounded-xl text-sm font-semibold transition-all"
                                style={{
                                    height: '44px',
                                    background: canSubmit ? 'var(--admin-primary, #2563EB)' : 'var(--admin-border)',
                                    color: canSubmit ? '#fff' : 'var(--admin-text-secondary)',
                                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                                    border: 'none',
                                }}
                            >
                                Apply
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
