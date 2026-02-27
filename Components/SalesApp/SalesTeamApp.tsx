'use client'
import { useEffect, useState } from 'react'
import {
  Home,
  Clock,
  User,
  Zap,
} from 'lucide-react'
import HomeContent from './Home/Home'
import ActionsContent from './Actions/ActionsContent'
import OrdersContent from './Orders/OrdersContent'
import { GlobalProfile } from '../GlobalComponents/GlobalProfile/GlobalProfile'

type TabType = 'home' | 'actions' | 'history' | 'profile'

const SalesTeamApp = ({ userData, selectedRole, onRoleSelect }: any) => {
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const [user, setUser] = useState<any>(null)

  const [isNavHidden, setIsNavHidden] = useState(false)

  // ✅ Get Telegram user info (Mini App context)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      setUser(tg.initDataUnsafe?.user)
      tg.expand()
    }
  }, [])

  // ✅ Watch for the "hide-sales-nav" class injected by DetailLead/Chat overlays
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateNavVisibility = () => {
      setIsNavHidden(document.body.classList.contains('hide-sales-nav'));
    };

    updateNavVisibility();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          updateNavVisibility();
        }
      }
    });

    observer.observe(document.body, { attributes: true });

    return () => observer.disconnect();
  }, []);

  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'actions' as TabType, label: 'Actions', icon: Zap },
    { id: 'history' as TabType, label: 'History', icon: Clock },
    { id: 'profile' as TabType, label: 'Profile', icon: null },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeContent />
      case 'actions':
        return <ActionsContent />
      case 'history':
        return <OrdersContent />
      case 'profile':
        return <GlobalProfile
          user={user}
          userData={userData}
          selectedRole={selectedRole}
          onRoleSelect={onRoleSelect}
        />
      default:
        return <HomeContent />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col pb-20 transition-colors duration-300">
      {/* Main Content */}
      <div className="flex-1 w-full max-w-full overflow-x-hidden">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      {!isNavHidden && (
        <nav className="sales-bottom-nav fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex justify-around py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] z-[50] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
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
                  className="flex flex-col items-center justify-center flex-1 gap-1"
                >
                  <div className={`relative p-0.5 rounded-full transition-all duration-300 ${isActive ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}>
                    <img
                      src={imageUrl}
                      alt="Profile"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://telegram.org/img/t_logo.png'
                      }}
                      className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-800 object-cover"
                    />
                  </div>
                  <span
                    className={`text-[10px] font-medium transition-colors duration-200 ${isActive
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
                className={`flex flex-col items-center justify-center flex-1 gap-1 group`}
              >
                {Icon && (
                  <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }`}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                )}
                <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
                  }`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}

export default SalesTeamApp

// ----------------------------


const HistoryContent = () => (
  <div className="space-y-4">
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Activity History</h2>

      {/* Timeline */}
      <div className="space-y-4">
        <div className="flex space-x-3">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="w-0.5 h-full bg-gray-200 dark:bg-zinc-600 mt-1"></div>
          </div>
          <div className="flex-1 pb-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">Lead Converted</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">XYZ Store - Window Graphics</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">2 hours ago</div>
          </div>
        </div>

        <div className="flex space-x-3">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="w-0.5 h-full bg-gray-200 dark:bg-zinc-600 mt-1"></div>
          </div>
          <div className="flex-1 pb-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">Mockup Returned</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">ABC Company - LED Signage</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">5 hours ago</div>
          </div>
        </div>

        <div className="flex space-x-3">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <div className="w-0.5 h-full bg-gray-200 dark:bg-zinc-600 mt-1"></div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white">New Lead Created</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">New Customer - Store Front</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">Yesterday</div>
          </div>
        </div>
      </div>
    </div>

    {/* Statistics */}
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">This Month</h2>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">8</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">New Leads</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">3</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Converted</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">12</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Mockups</div>
        </div>
      </div>
    </div>
  </div>
)

// Removed local ProfileContent in favor of GlobalProfile