'use client'
import { useEffect, useState } from 'react'
import {
  Home,
  Scissors,
  User,
} from 'lucide-react'
import { CuttingTasksContent } from './CuttingTasksContent'
import { CncStats } from './CncStats'
import { GlobalProfile } from '../GlobalComponents/GlobalProfile/GlobalProfile'
type TabType = 'overview' | 'cutting-tasks' | 'profile'

const CncOperatorApp = ({ userData, selectedRole, onRoleSelect }: any) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [user, setUser] = useState<any>(null)

  // ✅ Get Telegram user info (Mini App context)
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
    { id: 'cutting-tasks' as TabType, label: 'Tasks', icon: Scissors },
    { id: 'profile' as TabType, label: 'Profile', icon: null },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <CncStats />
      case 'cutting-tasks':
        return <CuttingTasksContent />
      case 'profile':
        return <GlobalProfile
          user={user}
          userData={userData}
          selectedRole={selectedRole}
          onRoleSelect={onRoleSelect}
        />
      default:
        return <CncStats />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 transition-colors duration-300">
      {/* Main Content */}
      <div className="flex-1 p-3">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 flex justify-around py-2 z-20">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon

          // ✅ Profile Tab with User Image
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
                  className={`text-xs ${isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                    }`}
                >
                  Profile
                </span>
              </button>
            )
          }

          // ✅ Other Tabs
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
              <span className="text-xs">{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default CncOperatorApp

const CncOverviewContent = () => (
  <div className="space-y-4">
    {/* CNC Operator Stats */}
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Today's Performance</h2>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">8</div>
          <div className="text-xs text-blue-700 dark:text-blue-300">Assigned Tasks</div>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">5</div>
          <div className="text-xs text-green-700 dark:text-green-300">Completed</div>
        </div>
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">2</div>
          <div className="text-xs text-yellow-700 dark:text-yellow-300">In Progress</div>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">1</div>
          <div className="text-xs text-red-700 dark:text-red-300">Delayed</div>
        </div>
      </div>
    </div>

    {/* Machine Status */}
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Machine Status</h2>

      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">CNC Router #1</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Running - Job #245</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-green-600 dark:text-green-400">Active</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">2h 15m</div>
          </div>
        </div>

        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">CNC Router #2</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Setup Required</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Idle</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">30 min</div>
          </div>
        </div>

        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Laser Cutter #1</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Maintenance</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-red-600 dark:text-red-400">Offline</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">4h</div>
          </div>
        </div>
      </div>
    </div>

    {/* Material Inventory */}
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Material Inventory</h2>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Plywood 18mm</span>
            <span className="font-medium text-green-600 dark:text-green-400">45%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '45%' }}></div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">12 sheets remaining</div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">MDF Board</span>
            <span className="font-medium text-yellow-600 dark:text-yellow-400">25%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
            <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '25%' }}></div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">8 sheets remaining</div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Acrylic Sheet</span>
            <span className="font-medium text-red-600 dark:text-red-400">15%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
            <div className="bg-red-600 h-2 rounded-full" style={{ width: '15%' }}></div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">3 sheets remaining</div>
        </div>
      </div>
    </div>

    {/* Quick Actions */}
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h2>

      <div className="grid grid-cols-2 gap-3">
        <button className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
          <div className="text-sm font-medium">Start New Job</div>
          <div className="text-xs opacity-75">Begin cutting task</div>
        </button>
        <button className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
          <div className="text-sm font-medium">Report Issue</div>
          <div className="text-xs opacity-75">Machine problem</div>
        </button>
        <button className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
          <div className="text-sm font-medium">Request Material</div>
          <div className="text-xs opacity-75">Stock needed</div>
        </button>
        <button className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
          <div className="text-sm font-medium">Quality Check</div>
          <div className="text-xs opacity-75">Submit for review</div>
        </button>
      </div>
    </div>
  </div>
)

// Removed local CncProfileContent in favor of GlobalProfile