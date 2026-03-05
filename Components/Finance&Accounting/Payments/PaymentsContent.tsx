'use client'

import { useState, useEffect } from 'react'
import {
    Search, RefreshCw, Loader, ChevronRight, X,
    DollarSign, CreditCard, CheckCircle, Clock, XCircle,
    Calendar, AlertCircle, Image as ImageIcon, Receipt,
    Package, User
} from 'lucide-react'
import api from '@/api'

type SubTab = 'prepayments' | 'expected' | 'done'

const STATUS_MAP: Record<SubTab, string> = {
    prepayments: 'PRE-ACCEPTED,PRE-CONFIRMED',
    expected: 'CNC-STARTED,CNC-COMPLETED,ASSEMBLY-STARTED,ASSEMBLY-COMPLETED,DANDI-STARTED',
    done: 'REM-ACCEPTED,REM-CONFIRMED',
}

// --- Fullscreen Image Overlay ---
const ImageOverlay = ({ src, onClose }: { src: string; onClose: () => void }) => (
    <div
        className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
    >
        <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
        >
            <X size={24} />
        </button>
        <img
            src={src}
            alt="Full screen"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
        />
    </div>
)

// --- Container Detail Overlay ---
const ContainerDetailOverlay = ({ container, onClose }: { container: any; onClose: () => void }) => {
    const [payments, setPayments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                setLoading(true)
                const res = await api.get(`/finance/payment/?order_container=${container.id}`)
                setPayments(res.data.results || [])
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchPayments()
    }, [container.id])

    const formatCurrency = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount
        return new Intl.NumberFormat('en-ET', {
            style: 'currency', currency: 'ETB',
            minimumFractionDigits: 0, maximumFractionDigits: 0,
        }).format(num)
    }

    const formatDate = (d: string) => {
        if (!d) return 'N/A'
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const getStatusLabel = (s: string) => {
        const m: Record<string, string> = { C: 'Confirmed', P: 'Pending', R: 'Rejected' }
        return m[s] || s
    }

    const getStatusColor = (s: string) => {
        if (s === 'C') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
        if (s === 'R') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
    }

    const getReasonText = (r: string) => {
        const m: Record<string, string> = { PRE: 'Advance', REM: 'Remaining', FULL: 'Full', SALES: 'Sales' }
        return m[r] || r
    }

    const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0)
    const fullPay = parseFloat(container.full_payment || 0)
    const pct = fullPay > 0 ? Math.min((totalPaid / fullPay) * 100, 100) : 0

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 dark:border-zinc-800">
                {/* Header */}
                <div className="shrink-0 p-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{container.client}</h2>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {container.orders?.slice(0, 3).map((o: any) => (
                                <span key={o.order_code} className="font-mono text-[11px] bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                                    ORD-{o.order_code}{o.order_name ? ` - ${o.order_name}` : ''}
                                </span>
                            ))}
                            {container.orders?.length > 3 && (
                                <span className="text-[11px] text-blue-600 dark:text-blue-400 ml-1">+{container.orders.length - 3}</span>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Payment Summary */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg">
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Full</p>
                            <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(fullPay)}</p>
                        </div>
                        <div className="text-center p-3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg">
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Paid</p>
                            <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(totalPaid)}</p>
                        </div>
                        <div className="text-center p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg">
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Advance</p>
                            <p className="text-base font-bold text-amber-700 dark:text-amber-400">{formatCurrency(container.advance_payment)}</p>
                        </div>
                        <div className="text-center p-3 bg-rose-50/50 dark:bg-rose-900/10 rounded-lg">
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Remaining</p>
                            <p className="text-base font-bold text-rose-700 dark:text-rose-400">{formatCurrency(container.remaining_payment)}</p>
                        </div>
                    </div>

                    {/* Progress */}
                    <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{Math.round(pct)}% Paid</span>
                            <span>{payments.length} payment{payments.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>

                    {/* Payments List */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                            <CreditCard size={14} className="text-blue-600" /> Payments
                        </h3>

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader className="animate-spin h-6 w-6 text-blue-500" />
                            </div>
                        ) : payments.length === 0 ? (
                            <p className="text-center text-gray-400 py-6 text-sm">No payments recorded</p>
                        ) : (
                            <div className="space-y-3">
                                {payments.map((pay: any) => (
                                    <div key={pay.id} className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 relative overflow-hidden">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${pay.status === 'C' ? 'bg-emerald-500' : pay.status === 'R' ? 'bg-rose-500' : 'bg-amber-500'}`} />

                                        <div className="flex justify-between items-start ml-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(pay.amount)}</span>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getStatusColor(pay.status)}`}>
                                                        {getStatusLabel(pay.status)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {getReasonText(pay.reason)} • {pay.method} • {formatDate(pay.created_at)}
                                                </p>
                                                {pay.note && <p className="text-xs text-gray-400 mt-1 italic">{pay.note}</p>}
                                            </div>
                                        </div>

                                        {/* Images */}
                                        {(pay.confirmation_image || pay.invoice_image) && (
                                            <div className="flex gap-2 mt-2 ml-2">
                                                {pay.confirmation_image && (
                                                    <button
                                                        onClick={() => setFullscreenImage(pay.confirmation_image)}
                                                        className="flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded"
                                                    >
                                                        <ImageIcon size={12} /> Screenshot
                                                    </button>
                                                )}
                                                {pay.invoice_image && (
                                                    <button
                                                        onClick={() => setFullscreenImage(pay.invoice_image)}
                                                        className="flex items-center gap-1 text-[11px] font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded"
                                                    >
                                                        <Receipt size={12} /> Receipt
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Orders List */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Package size={14} className="text-blue-600" /> Sub-Orders
                        </h3>
                        <div className="space-y-2">
                            {container.orders?.map((o: any) => (
                                <div key={o.order_code} className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 flex items-center justify-between">
                                    <div>
                                        <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                                            ORD-{o.order_code}
                                        </span>
                                        {o.order_name && <span className="text-sm text-gray-500 ml-2">{o.order_name}</span>}
                                        <p className="text-xs text-gray-400 mt-0.5">{o.design_type}</p>
                                    </div>
                                    <span className="text-[11px] font-bold px-2 py-1 rounded bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-400">
                                        {o.order_status?.replace(/-/g, ' ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {fullscreenImage && <ImageOverlay src={fullscreenImage} onClose={() => setFullscreenImage(null)} />}
        </div>
    )
}

// --- Main Component ---
const PaymentsContent = () => {
    const [activeTab, setActiveTab] = useState<SubTab>('prepayments')
    const [containers, setContainers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [nextPage, setNextPage] = useState<string | null>(null)
    const [totalCount, setTotalCount] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedContainer, setSelectedContainer] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const fetchContainers = async (url?: string, isLoadMore = false) => {
        try {
            isLoadMore ? setLoadingMore(true) : setLoading(true)
            setError(null)

            const baseUrl = url || `/api/order-container/?ordering=-created_at&order_status=${STATUS_MAP[activeTab]}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`
            const res = await api.get(baseUrl)

            if (isLoadMore) {
                setContainers(prev => [...prev, ...(res.data.results || [])])
            } else {
                setContainers(res.data.results || [])
            }
            setNextPage(res.data.next)
            setTotalCount(res.data.count || 0)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load')
            if (!isLoadMore) setContainers([])
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    useEffect(() => {
        setContainers([])
        fetchContainers()
    }, [activeTab])

    const handleSearch = () => {
        fetchContainers()
    }

    const subTabs = [
        { id: 'prepayments' as SubTab, label: 'Prepayments' },
        { id: 'expected' as SubTab, label: 'Expected' },
        { id: 'done' as SubTab, label: 'Done' },
    ]

    const formatCurrency = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount
        return new Intl.NumberFormat('en-ET', {
            style: 'currency', currency: 'ETB',
            minimumFractionDigits: 0, maximumFractionDigits: 0,
        }).format(num)
    }

    const getMainStatus = (container: any) => {
        const status = container.orders?.[0]?.order_status || ''
        return status.replace(/-/g, ' ')
    }

    const getMainStatusColor = (container: any) => {
        const status = container.orders?.[0]?.order_status || ''
        if (status.includes('CONFIRMED') || status.includes('COMPLETED')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
        if (status.includes('STARTED') || status.includes('ACCEPTED')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
        if (status.includes('PRE')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
        return 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-400'
    }

    return (
        <div className="w-full min-h-screen bg-gray-50 dark:bg-zinc-900">
            {/* Sub-Tabs */}
            <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 sticky top-0 z-10">
                <div className="flex">
                    {subTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSearchQuery('') }}
                            className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search + Refresh */}
            <div className="p-4 pb-2">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by client, order name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="p-2.5 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
                    >
                        <Search size={16} />
                    </button>
                    <button
                        onClick={() => fetchContainers()}
                        className="p-2.5 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">{totalCount} containers</p>
            </div>

            {/* Content */}
            <div className="px-4 pb-4">
                {loading ? (
                    <div className="flex flex-col items-center py-16">
                        <Loader className="animate-spin h-8 w-8 text-blue-500 mb-3" />
                        <p className="text-sm text-gray-400">Loading...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
                        <AlertCircle className="mx-auto h-6 w-6 text-red-500 mb-2" />
                        <p className="text-red-600 dark:text-red-400 text-sm mb-2">{error}</p>
                        <button onClick={() => fetchContainers()} className="text-sm text-red-600 underline">Retry</button>
                    </div>
                ) : containers.length === 0 ? (
                    <div className="text-center py-16">
                        <Package size={48} className="mx-auto text-gray-300 dark:text-zinc-600 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No containers found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {containers.map((c) => {
                            const fullPay = parseFloat(c.full_payment || 0)
                            // Done tab = remaining payment accepted/confirmed → fully paid
                            const paidAmount = activeTab === 'done' ? fullPay : parseFloat(c.advance_payment || 0)
                            const pct = activeTab === 'done' ? 100 : (fullPay > 0 ? Math.min((paidAmount / fullPay) * 100, 100) : 0)

                            return (
                                <div
                                    key={c.id}
                                    onClick={() => setSelectedContainer(c)}
                                    className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all active:scale-[0.99]"
                                >
                                    {/* Top row: client + status */}
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">{c.client}</h3>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {c.orders?.slice(0, 2).map((o: any) => (
                                                    <span key={o.order_code} className="font-mono text-[11px] text-gray-500 dark:text-gray-400">
                                                        ORD-{o.order_code}{o.order_name ? ` ${o.order_name}` : ''}
                                                    </span>
                                                ))}
                                                {c.orders?.length > 2 && (
                                                    <span className="text-[11px] text-blue-600">+{c.orders.length - 2}</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`shrink-0 ml-2 text-[10px] font-bold px-2 py-1 rounded-md ${getMainStatusColor(c)}`}>
                                            {getMainStatus(c)}
                                        </span>
                                    </div>

                                    {/* Amounts row */}
                                    <div className="flex items-center justify-between text-sm mt-2">
                                        <span className="text-gray-500 dark:text-gray-400">
                                            {formatCurrency(paidAmount)} / {formatCurrency(fullPay)}
                                        </span>
                                        <span className={`text-xs font-bold ${pct >= 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
                                            {Math.round(pct)}%
                                        </span>
                                    </div>

                                    {/* Mini progress */}
                                    <div className="h-1 w-full bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden mt-2">
                                        <div
                                            className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Load More */}
                {loadingMore && (
                    <div className="flex justify-center py-4">
                        <Loader className="animate-spin h-5 w-5 text-blue-500" />
                    </div>
                )}
                {nextPage && !loadingMore && (
                    <button
                        onClick={() => fetchContainers(nextPage, true)}
                        className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Loader size={16} /> Load More
                    </button>
                )}

                {!nextPage && containers.length > 0 && (
                    <p className="text-center text-xs text-gray-400 mt-4">
                        Showing {containers.length} of {totalCount}
                    </p>
                )}
            </div>

            {/* Detail Overlay */}
            {selectedContainer && (
                <ContainerDetailOverlay
                    container={selectedContainer}
                    onClose={() => setSelectedContainer(null)}
                />
            )}
        </div>
    )
}

export default PaymentsContent
