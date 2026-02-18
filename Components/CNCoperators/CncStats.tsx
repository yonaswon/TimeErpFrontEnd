import { useEffect, useState } from 'react'
import { Clock, AlertTriangle, CheckCircle, BarChart2, Activity } from 'lucide-react'
import api from '@/api'

interface CncStatsData {
    performance: {
        assigned_today: number
        completed_today: number
        in_progress: number
        delayed: number
    }
    timeline: Array<{
        id: number
        status: string
        start_time: string | null
        complete_time: string | null
        material: string
        order_code: string | number
    }>
    machine_status: {
        status: string
        current_job: string | null
        started_at: string | null
    }
}

export const CncStats = () => {
    const [stats, setStats] = useState<CncStatsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchStats()
        // Poll every minute
        const interval = setInterval(fetchStats, 60000)
        return () => clearInterval(interval)
    }, [])

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/cuttingfiles/statistics/')
            setStats(response.data)
            setError(null)
        } catch (err) {
            console.error('Error fetching stats:', err)
            setError('Failed to load statistics')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
            </div>
        )
    }

    if (!stats) return null

    return (
        <div className="space-y-4">
            {/* CNC Operator Stats */}
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Today's Performance</h2>

                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {stats.performance.assigned_today}
                        </div>
                        <div className="text-xs text-blue-700 dark:text-blue-300">Assigned Today</div>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {stats.performance.completed_today}
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-300">Completed</div>
                    </div>
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {stats.performance.in_progress}
                        </div>
                        <div className="text-xs text-yellow-700 dark:text-yellow-300">In Progress</div>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {stats.performance.delayed}
                        </div>
                        <div className="text-xs text-red-700 dark:text-red-300">Delayed</div>
                    </div>
                </div>
            </div>

            {/* Machine Status */}
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Current Status
                </h2>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${stats.machine_status.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                            }`}></div>
                        <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {stats.machine_status.status === 'Active' ? 'Machine Running' : 'Idle'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {stats.machine_status.current_job || 'No active job'}
                            </div>
                        </div>
                    </div>
                    {stats.machine_status.started_at && (
                        <div className="text-right">
                            <div className="text-sm font-medium text-green-600 dark:text-green-400">Active</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                Since {new Date(stats.machine_status.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Today's Timeline
                </h2>

                {stats.timeline.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No activity recorded today</p>
                ) : (
                    <div className="space-y-4 relative pl-4 border-l-2 border-gray-200 dark:border-zinc-700 ml-2">
                        {stats.timeline.map((item) => (
                            <div key={item.id} className="relative mb-4 last:mb-0">
                                <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-800 ${item.status === 'COMPLATED' ? 'bg-green-500' : 'bg-blue-500'
                                    }`}></div>

                                <div className="bg-gray-50 dark:bg-zinc-700/50 p-3 rounded-lg">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                                            {item.status === 'COMPLATED' ? 'Completed Task' : 'Started Task'}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(item.status === 'COMPLATED' && item.complete_time ? item.complete_time : item.start_time || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                        Order #{item.order_code}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {item.material}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
