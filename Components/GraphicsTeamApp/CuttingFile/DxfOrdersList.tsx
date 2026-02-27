import { useState, useEffect } from 'react'
import { Download, FileUp, CheckCircle, XCircle, Package, FileText } from 'lucide-react'
import api from '@/api'

interface DxfOrder {
    order_code: number
    order_status: string
    dxf_file_ready: boolean
    mockup: {
        mockup_image: string
        designer: { telegram_user_name: string }
    } | null
    mockup_modification: {
        mockup_image: string
        name: string
    } | null
    boms: Array<{ id: number; material: any }>
    dxf_files?: Array<{
        id: number
        order: number
        dxf_file: Array<{
            id: number
            dxf: string
            date: string
        }>
        date: string
    }>
    created_at: string
}

type FilterType = 'ready' | 'not_ready'

export const DxfOrdersList = () => {
    const [orders, setOrders] = useState<DxfOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<FilterType>('ready')
    const [nextPage, setNextPage] = useState<string | null>(null)
    const [totalCount, setTotalCount] = useState(0)
    const [togglingId, setTogglingId] = useState<number | null>(null)

    const fetchOrders = async (reset: boolean = true) => {
        try {
            if (reset) {
                setLoading(true)
                setOrders([])
            } else {
                setLoadingMore(true)
            }
            setError(null)

            const dxfReady = filter === 'ready' ? 'true' : 'false'
            const url = reset
                ? `/api/orders/?dxf_file_ready=${dxfReady}&order_status=PRE-ACCEPTED,PRE-CONFIRMED&ordering=-created_at`
                : nextPage

            if (!url) return

            const response = await api.get(url)
            const newOrders = response.data.results || []

            if (reset) {
                setOrders(newOrders)
            } else {
                setOrders(prev => [...prev, ...newOrders])
            }
            setNextPage(response.data.next)
            setTotalCount(response.data.count || 0)
        } catch (err) {
            setError('Failed to fetch orders')
            console.error('Error fetching orders:', err)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    useEffect(() => {
        fetchOrders(true)
    }, [filter])

    const toggleDxfReady = async (orderCode: number) => {
        try {
            setTogglingId(orderCode)
            const response = await api.post(`/api/orders/${orderCode}/toggle_dxf_ready/`)
            if (response.status === 200) {
                // Remove from current list since the filter changed
                setOrders(prev => prev.filter(o => o.order_code !== orderCode))
                setTotalCount(prev => prev - 1)
            }
        } catch (error) {
            console.error('Error toggling DXF ready:', error)
        } finally {
            setTogglingId(null)
        }
    }

    const handleDownload = (fileUrl: string, fileName: string) => {
        if ((window as any).Telegram?.WebApp) {
            (window as any).Telegram.WebApp.openLink(fileUrl)
        } else {
            const link = document.createElement('a')
            link.href = fileUrl
            link.download = fileName
            link.target = '_blank'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    const formatStatus = (status: string) => {
        return status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PRE-ACCEPTED':
                return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
            case 'PRE-CONFIRMED':
                return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
            default:
                return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
        }
    }

    return (
        <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-xl p-1">
                <button
                    onClick={() => setFilter('ready')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${filter === 'ready'
                        ? 'bg-white dark:bg-zinc-700 text-green-700 dark:text-green-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <CheckCircle className="w-4 h-4" />
                    Ready
                </button>
                <button
                    onClick={() => setFilter('not_ready')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${filter === 'not_ready'
                        ? 'bg-white dark:bg-zinc-700 text-orange-700 dark:text-orange-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <XCircle className="w-4 h-4" />
                    Not Ready
                </button>
            </div>

            {/* Count */}
            <p className="text-xs text-gray-500 dark:text-gray-400">
                {totalCount} {filter === 'ready' ? 'ready' : 'not ready'} order{totalCount !== 1 ? 's' : ''}
            </p>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="text-center py-8">
                    <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
                    <button
                        onClick={() => fetchOrders(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && orders.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
                    <Package className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No {filter === 'ready' ? 'ready' : 'not ready'} orders found
                    </p>
                </div>
            )}

            {/* Orders List */}
            {!loading && orders.length > 0 && (
                <div className="space-y-3">
                    {orders.map((order) => {
                        const dxfFiles = order.dxf_files?.flatMap(d => d.dxf_file) || []

                        return (
                            <div
                                key={order.order_code}
                                className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden"
                            >
                                {/* Order Header */}
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                                #ORD-{order.order_code}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.order_status)}`}>
                                                {formatStatus(order.order_status)}
                                            </span>
                                            {dxfFiles.length > 0 && (
                                                order.dxf_file_ready ? (
                                                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Ready
                                                    </span>
                                                ) : (
                                                    <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <XCircle className="w-3 h-3" />
                                                        Not Ready
                                                    </span>
                                                )
                                            )}
                                        </div>

                                        {/* Toggle Button */}
                                        {dxfFiles.length > 0 && (
                                            <button
                                                onClick={() => toggleDxfReady(order.order_code)}
                                                disabled={togglingId === order.order_code}
                                                title={order.dxf_file_ready ? 'Unmark as ready' : 'Mark as ready'}
                                                className={`p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${order.dxf_file_ready
                                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100'
                                                        : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100'
                                                    } disabled:opacity-50`}
                                            >
                                                {togglingId === order.order_code ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                                ) : order.dxf_file_ready ? (
                                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {/* Designer */}
                                    {order.mockup && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Designer: @{order.mockup.designer.telegram_user_name}
                                        </p>
                                    )}
                                </div>

                                {/* DXF Files */}
                                {dxfFiles.length > 0 && (
                                    <div className="px-4 pb-4">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <FileUp className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                DXF Files ({dxfFiles.length})
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {dxfFiles.map((file, idx) => {
                                                const fileName = file.dxf.split('/').pop() || `file-${idx}.dxf`
                                                const baseUrl = api.defaults.baseURL || ''
                                                const url = file.dxf.startsWith('http') ? file.dxf : `${baseUrl}${file.dxf}`

                                                return (
                                                    <div
                                                        key={file.id}
                                                        className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-700/50 border border-gray-100 dark:border-zinc-700"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                                                {fileName}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDownload(url, fileName)}
                                                            className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors flex-shrink-0"
                                                            title="Download DXF"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Load More */}
            {nextPage && !loading && (
                <button
                    onClick={() => fetchOrders(false)}
                    disabled={loadingMore}
                    className="w-full py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                    {loadingMore ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                            Loading...
                        </span>
                    ) : (
                        'Load More'
                    )}
                </button>
            )}
        </div>
    )
}
