'use client'
import { useEffect, useState } from 'react'
import {
  Home,
  ClipboardList,
  User,
  Scissors,
  Wrench,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  RefreshCw,
  History,
} from 'lucide-react'
import { TasksContent } from './Tasks/TaskContent'
import { ReleaseHistory } from '../StockManager/TransferContent/ReleaseHistory'
import api from '@/api'

type TabType = 'overview' | 'tasks' | 'releases' | 'profile'

// ── Stats interface ──
interface OrderStats {
  readyForCutting: number;
  cuttingInProgress: number;
  readyForAssembly: number;
  assemblyInProgress: number;
  paymentPending: number;
  completed: number;
  total: number;
  loading: boolean;
}

const WorkshopSupervisorApp = ({ userData, selectedRole, onRoleSelect }: any) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      setUser(tg.initDataUnsafe?.user)
      tg.expand()
    }
  }, [])

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Home },
    { id: 'tasks' as TabType, label: 'Tasks', icon: ClipboardList },
    { id: 'releases' as TabType, label: 'History', icon: History },
    { id: 'profile' as TabType, label: 'Profile', icon: null },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewContent />
      case 'tasks':
        return <TasksContent />
      case 'releases':
        return <div className="pt-2"><ReleaseHistory /></div>
      case 'profile':
        return <ProfileContent
          user={user}
          userData={userData}
          selectedRole={selectedRole}
          onRoleSelect={onRoleSelect}
        />
      default:
        return <OverviewContent />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 transition-colors duration-300">
      {/* Main Content */}
      <div className="flex-1 px-4 pt-4 pb-4">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 flex justify-around py-2 z-20">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon

          if (tab.id === 'profile') {
            const imageUrl = user?.username
              ? `https://t.me/i/userpic/160/${user.username}.jpg`
              : 'https://telegram.org/img/t_logo.png'

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center flex-1 py-1"
              >
                <img
                  src={imageUrl}
                  alt="Profile"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://telegram.org/img/t_logo.png'
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${isActive ? 'border-blue-500 scale-110' : 'border-transparent'
                    }`}
                />
                <span
                  className={`text-xs mt-0.5 ${isActive
                    ? 'text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-500 dark:text-gray-400'
                    }`}
                >
                  Profile
                </span>
              </button>
            )
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400'
                }`}
            >
              {Icon && <Icon size={20} />}
              <span className={`text-xs mt-0.5 ${isActive ? 'font-medium' : ''}`}>{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default WorkshopSupervisorApp

// ── Overview Content with Live Stats ──
const OverviewContent = () => {
  const [stats, setStats] = useState<OrderStats>({
    readyForCutting: 0,
    cuttingInProgress: 0,
    readyForAssembly: 0,
    assemblyInProgress: 0,
    paymentPending: 0,
    completed: 0,
    total: 0,
    loading: true,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setStats(prev => ({ ...prev, loading: true }))
    try {
      // Fetch order counts by status using individual queries
      const [
        preAccepted,
        preConfirmed,
        cncStarted,
        cncCompleted,
        assemblyStarted,
        assemblyCompleted,
        dandiStarted,
        remAccepted,
      ] = await Promise.all([
        api.get('/api/orders/?order_status=PRE-ACCEPTED&p=1').catch(() => ({ data: { count: 0 } })),
        api.get('/api/orders/?order_status=PRE-CONFIRMED&p=1').catch(() => ({ data: { count: 0 } })),
        api.get('/api/orders/?order_status=CNC-STARTED&p=1').catch(() => ({ data: { count: 0 } })),
        api.get('/api/orders/?order_status=CNC-COMPLETED&p=1').catch(() => ({ data: { count: 0 } })),
        api.get('/api/orders/?order_status=ASSEMBLY-STARTED&p=1').catch(() => ({ data: { count: 0 } })),
        api.get('/api/orders/?order_status=ASSEMBLY-COMPLETED&p=1').catch(() => ({ data: { count: 0 } })),
        api.get('/api/orders/?order_status=DANDI-STARTED&p=1').catch(() => ({ data: { count: 0 } })),
        api.get('/api/orders/?order_status=REM-ACCEPTED&p=1').catch(() => ({ data: { count: 0 } })),
      ])

      // Ready for cutting = PRE-CONFIRMED (payment confirmed, waiting for cutting assignment)
      const readyForCutting = preConfirmed.data.count || 0
      // Cutting in progress
      const cuttingInProgress = cncStarted.data.count || 0
      // Ready for assembly = CNC-COMPLETED
      const readyForAssembly = cncCompleted.data.count || 0
      // Assembly in progress
      const assemblyInProgress = assemblyStarted.data.count || 0
      // Payment pending = PRE-ACCEPTED (waiting for advance payment)
      const paymentPending = preAccepted.data.count || 0
      // Completed = ASSEMBLY-COMPLETED + DANDI-STARTED + REM-ACCEPTED
      const completed = (assemblyCompleted.data.count || 0) + (dandiStarted.data.count || 0) + (remAccepted.data.count || 0)

      const total = paymentPending + readyForCutting + cuttingInProgress + readyForAssembly + assemblyInProgress + completed

      setStats({
        readyForCutting,
        cuttingInProgress,
        readyForAssembly,
        assemblyInProgress,
        paymentPending,
        completed,
        total,
        loading: false,
      })

      // Fetch latest orders for the order list
      try {
        const recent = await api.get('/api/orders/?ordering=-created_at&p=1')
        setRecentOrders(recent.data.results?.slice(0, 8) || [])
      } catch {
        setRecentOrders([])
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      'PRE-ACCEPTED': { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', label: 'Payment Pending' },
      'PRE-CONFIRMED': { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', label: 'Ready for Cutting' },
      'CNC-STARTED': { bg: 'bg-indigo-100 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', label: 'Cutting' },
      'CNC-COMPLETED': { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', label: 'Ready for Assembly' },
      'ASSEMBLY-STARTED': { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', label: 'Assembling' },
      'ASSEMBLY-COMPLETED': { bg: 'bg-teal-100 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-300', label: 'Assembly Done' },
      'DANDI-STARTED': { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', label: 'Delivering' },
      'REM-ACCEPTED': { bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', label: 'Rem Accepted' },
      'REM-CONFIRMED': { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', label: 'Completed' },
    }
    const s = map[status] || { bg: 'bg-gray-100 dark:bg-zinc-700', text: 'text-gray-700 dark:text-gray-300', label: status.replace('-', ' ') }
    return s
  }

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading workshop data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Workshop</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Production overview</p>
        </div>
        <button
          onClick={fetchStats}
          className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Grid — 2 columns, mobile-first */}
      <div className="grid grid-cols-2 gap-3">
        {/* Payment Pending */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Payment Pending</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.paymentPending}</div>
        </div>

        {/* Ready for Cutting */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Scissors className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Ready to Cut</span>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.readyForCutting}</div>
        </div>

        {/* Cutting In Progress */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
              <Scissors className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Cutting</span>
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.cuttingInProgress}</div>
        </div>

        {/* Ready for Assembly */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20">
              <Wrench className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Ready to Assemble</span>
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.readyForAssembly}</div>
        </div>

        {/* Assembly In Progress */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <Wrench className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Assembling</span>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.assemblyInProgress}</div>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Completed</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</div>
        </div>
      </div>

      {/* Production Pipeline — visual flow */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Production Pipeline</h2>
        <div className="space-y-3">
          {[
            { label: 'Payment Pending', count: stats.paymentPending, color: 'bg-yellow-500', total: stats.total },
            { label: 'Ready for Cutting', count: stats.readyForCutting, color: 'bg-blue-500', total: stats.total },
            { label: 'Cutting', count: stats.cuttingInProgress, color: 'bg-indigo-500', total: stats.total },
            { label: 'Ready for Assembly', count: stats.readyForAssembly, color: 'bg-green-500', total: stats.total },
            { label: 'Assembling', count: stats.assemblyInProgress, color: 'bg-purple-500', total: stats.total },
            { label: 'Completed', count: stats.completed, color: 'bg-emerald-500', total: stats.total },
          ].map((stage) => {
            const pct = stage.total > 0 ? Math.round((stage.count / stage.total) * 100) : 0
            return (
              <div key={stage.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{stage.label}</span>
                  <span className="text-gray-900 dark:text-white font-semibold">{stage.count}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-zinc-700 rounded-full h-2">
                  <div className={`${stage.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Recent Orders
          </h2>
          <div className="space-y-2">
            {recentOrders.map((order: any) => {
              const badge = getStatusBadge(order.order_status)
              return (
                <div
                  key={order.order_code}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50 dark:bg-zinc-900/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      ORD-{order.order_code}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ETB {order.price?.toLocaleString()}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}


const ProfileContent = ({ user, userData, selectedRole, onRoleSelect }: any) => {
  return (
    <div className="flex flex-col items-center justify-center text-center mt-8 space-y-6">
      {/* Logout Button */}
      <button
        onClick={() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('user_data')

          if (typeof window !== 'undefined' && window?.Telegram?.WebApp?.close) {
            window.Telegram.WebApp.close()
          } else {
            window.location.reload()
          }
        }}
        className="px-6 py-3 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-xl font-medium transition-all"
      >
        LOGOUT
      </button>

      {user ? (
        <>
          <img
            src={`https://t.me/i/userpic/320/${user.username}.jpg`}
            alt="Profile"
            className="w-24 h-24 rounded-full border-2 border-blue-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://telegram.org/img/t_logo.png'
            }}
          />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user.first_name} {user.last_name || ''}
          </h2>
          {user.username && (
            <p className="text-gray-500 dark:text-gray-400 text-sm">@{user.username}</p>
          )}
          <div className="p-4 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Workshop Supervisor</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage workshop operations, assign tasks, and monitor production progress.
            </p>
          </div>
        </>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          Unable to load Telegram user info.
        </p>
      )}

      {/* Role Selection */}
      <div className="border-t border-gray-200 dark:border-zinc-700 w-full max-w-sm pt-4">
        <div className="px-4 py-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Select Role
          </p>
          {userData?.role && userData.role.length > 0 ? (
            <div className="space-y-2">
              {userData.role.map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => onRoleSelect(r.Name)}
                  className={`w-full text-left flex items-center space-x-3 text-sm px-3 py-2.5 rounded-xl transition-colors ${selectedRole === r.Name
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-zinc-700'
                    }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${selectedRole === r.Name ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                  <span className="font-medium">{r.Name}</span>
                  {selectedRole === r.Name && <span className="text-xs ml-auto">✓</span>}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No roles assigned
            </p>
          )}
        </div>
      </div>
    </div>
  )
}