'use client'

import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, AlertTriangle, CheckCircle, Search, UserX, UserMinus, ChevronRight } from 'lucide-react'
import api from '../../../api'

interface DailyLog {
    date: string;
    check_in: string;
    check_out: string;
    all_punches: string[];
    hours: number;
    missed_in: boolean;
    missed_out: boolean;
}

interface AttendanceStat {
    zkt_user_id: string;
    name: string;
    telegram_username: string;
    working_days: number;
    total_hours: number;
    avg_hours: number;
    delays: number;
    early_birds: number;
    missed_checkouts: number;
    missed_checkins: number;
    daily_logs: DailyLog[];
}

interface AttendanceDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AttendanceDashboard({ isOpen, onClose }: AttendanceDashboardProps) {
    const [filter, setFilter] = useState('today')
    const [customStart, setCustomStart] = useState('')
    const [customEnd, setCustomEnd] = useState('')
    const [stats, setStats] = useState<AttendanceStat[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [selectedUser, setSelectedUser] = useState<AttendanceStat | null>(null)

    const fetchAttendance = async () => {
        setLoading(true)
        setError('')
        try {
            let url = `/lead/attendance/dashboard/?filter=${filter}`
            if (filter === 'custom' && customStart && customEnd) {
                url += `&start_date=${customStart}&end_date=${customEnd}`
            }
            const res = await api.get(url)
            setStats(res.data.stats || [])
        } catch (err: any) {
            setError(err.message || 'Failed to fetch attendance data.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            if (filter !== 'custom' || (filter === 'custom' && customStart && customEnd)) {
                fetchAttendance()
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, filter, customStart, customEnd])

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-zinc-900 flex flex-col w-full h-full text-left overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-4 py-4 z-10 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Attendance</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Team biometric logging</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Filter Controls */}
            <div className="p-4 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 shadow-sm flex flex-col gap-4">
                <div className="flex gap-2 w-full overflow-x-auto no-scrollbar pb-1 text-sm">
                    {['today', 'yesterday', 'this_week', 'this_month', 'custom'].map((f) => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setSelectedUser(null); }}
                            className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-colors border ${filter === f
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700 dark:hover:bg-zinc-700'
                                }`}
                        >
                            {f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                    ))}
                </div>

                {filter === 'custom' && (
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={customStart}
                                onChange={e => { setCustomStart(e.target.value); setSelectedUser(null); }}
                                className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={e => { setCustomEnd(e.target.value); setSelectedUser(null); }}
                                className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="flex-1 p-4 pb-24">
                {loading && (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                )}
                {!loading && error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-900/50 flex gap-3 text-left">
                        <AlertTriangle size={18} className="shrink-0" />
                        <p>{error}</p>
                    </div>
                )}
                {!loading && !error && stats.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm mt-4 text-center">
                        <Search className="text-gray-300 dark:text-zinc-600 mb-4" size={48} />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No records found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try selecting a different date range.</p>
                    </div>
                )}

                {!loading && !error && stats.length > 0 && (
                    <div className="flex flex-col gap-4">
                        {stats.map((user, idx) => (
                            <div key={idx} className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 flex flex-col overflow-hidden">
                                <div
                                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors"
                                    onClick={() => setSelectedUser(user)}
                                >
                                    <div className="flex justify-between items-start border-b border-gray-100 dark:border-zinc-700/50 pb-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-base flex items-center gap-2">
                                                {user.name}
                                                <ChevronRight size={16} className="text-gray-400" />
                                            </h3>
                                            <p className={`text-xs mt-1 px-2 py-0.5 rounded inline-block bg-gray-100 dark:bg-zinc-700 ${user.telegram_username === 'not connected' ? 'text-gray-500 dark:text-gray-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                {user.telegram_username !== 'not connected' ? '@' + user.telegram_username : 'Telegram not connected'}
                                            </p>
                                        </div>
                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-lg text-xs font-semibold border border-emerald-100 dark:border-emerald-800/50 text-center flex flex-col items-center justify-center">
                                            <span className="block text-lg font-bold leading-none mb-0.5">{user.working_days}</span>
                                            Days
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm mt-4">
                                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                                            <div className="text-blue-500 bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-md"><Clock size={16} /></div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-none mb-1">Avg Hours</p>
                                                <p className="font-semibold text-gray-900 dark:text-white leading-none">{user.avg_hours.toFixed(1)} h</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                                            <div className="text-orange-500 bg-orange-100 dark:bg-orange-900/30 p-1.5 rounded-md"><AlertTriangle size={16} /></div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-none mb-1">Delays</p>
                                                <p className="font-semibold text-gray-900 dark:text-white leading-none">{user.delays}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                                            <div className="text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-md"><CheckCircle size={16} /></div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-none mb-1">Early Birds</p>
                                                <p className="font-semibold text-gray-900 dark:text-white leading-none">{user.early_birds}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                                            <div className="text-red-500 bg-red-100 dark:bg-red-900/30 p-1.5 rounded-md"><UserX size={16} /></div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-none mb-1">Missed Out</p>
                                                <p className="font-semibold text-gray-900 dark:text-white leading-none">{user.missed_checkouts}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-zinc-900 rounded-lg col-span-2">
                                            <div className="text-red-500 bg-red-100 dark:bg-red-900/30 p-1.5 rounded-md"><UserMinus size={16} /></div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-none mb-1">Missed In</p>
                                                <p className="font-semibold text-gray-900 dark:text-white leading-none">{user.missed_checkins}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Left Sidebar for detailed view */}
            {selectedUser && (
                <>
                    <div
                        className="fixed inset-0 z-[55] bg-black/50 animate-in fade-in transition-opacity"
                        onClick={() => setSelectedUser(null)}
                    />
                    <div className="fixed inset-y-0 left-0 z-[60] w-full max-w-sm bg-gray-50 dark:bg-zinc-900 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 border-r border-gray-200 dark:border-zinc-700">
                        <div className="sticky top-0 p-4 border-b border-gray-200 dark:border-zinc-700 flex justify-between items-center bg-white dark:bg-zinc-800 shadow-sm z-10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                                    <Clock size={16} />
                                </div>
                                <div>
                                    <h3 className="font-semibold md:text-lg text-gray-900 dark:text-white leading-tight">{selectedUser.name}</h3>
                                    <p className="text-xs text-gray-500">Log Details</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="p-2 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-12">
                            {selectedUser.daily_logs.length > 0 ? (
                                selectedUser.daily_logs.map((log, i) => (
                                    <div key={i} className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-zinc-700 flex flex-col">
                                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-700/50 pb-2 mb-3">
                                            <span className="font-semibold text-gray-900 dark:text-white">{log.date}</span>
                                            <span className="text-sm font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/50">
                                                {log.hours > 0 ? `${log.hours}h` : '-'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between text-sm mb-1">
                                            <div>
                                                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Check In</p>
                                                <p className={`font-semibold text-lg ${log.missed_in ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                    {log.check_in}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Check Out</p>
                                                <p className={`font-semibold text-lg ${log.missed_out ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                                    {log.check_out}
                                                </p>
                                            </div>
                                        </div>

                                        {log.all_punches.length >= 2 && (
                                            <div className="mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-zinc-700/50">
                                                <p className="text-xs text-gray-500 mb-2 font-medium">All Recorded Punches</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {log.all_punches.map((p, idx) => (
                                                        <span key={idx} className="bg-gray-100 dark:bg-zinc-700/50 border border-gray-200 dark:border-zinc-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-medium shadow-sm">
                                                            {p}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-500 text-sm mt-10">
                                    <Search className="mx-auto mb-3 opacity-30" size={32} />
                                    No detailed logs found.
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
