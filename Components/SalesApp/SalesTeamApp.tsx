'use client'
import { useEffect, useState } from 'react'
import {
  Home,
  Clock,
  User,
  Zap,
} from 'lucide-react'
import HomeContent  from './Home/Home'
import ActionsContent from './Actions/ActionsContent'
import OrdersContent from './Orders/OrdersContent'

type TabType = 'home' | 'actions' | 'history' | 'profile'

const SalesTeamApp = ({ userData, selectedRole, onRoleSelect }: any) => {
  const [activeTab, setActiveTab] = useState<TabType>('home')
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
        return <ProfileContent 
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
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                    isActive ? 'border-blue-500 scale-110' : 'border-transparent'
                  }`}
                />
                <span
                  className={`text-xs ${
                    isActive
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
              className={`flex flex-col items-center justify-center flex-1 py-1 ${
                isActive
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

const ProfileContent = ({ user, userData, selectedRole, onRoleSelect }: any) => {
  return (
    <div className="flex flex-col items-center justify-center text-center mt-10 space-y-6">
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
        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg cursor-pointer transition-colors"
      >
        LOGOUT
      </button>
      
      {user ? (
        <>
          <img
            src={`https://t.me/i/userpic/320/${user.username}.jpg`}
            alt="Profile"
            className="w-24 h-24 rounded-full border-2 border-blue-500 mb-3"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://telegram.org/img/t_logo.png'
            }}
          />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user.first_name} {user.last_name || ''}
          </h2>
          {user.username && (
            <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
          )}
          <div className="mt-4 p-4 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 max-w-sm">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Sales Team</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage leads, request mockups, and track customer conversions.
            </p>
          </div>
        </>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          Unable to load Telegram user info.
        </p>
      )}
      
      {/* Role Selection */}
      <div className="border-t border-gray-100 dark:border-zinc-700 w-full max-w-sm pt-4">
        <div className="px-4 py-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Select Role
          </p>
          {userData?.role && userData.role.length > 0 ? (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {userData.role.map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => onRoleSelect(r.Name)}
                  className={`w-full text-left flex items-center space-x-2 text-sm px-2 py-1 rounded transition-colors ${
                    selectedRole === r.Name
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    selectedRole === r.Name ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <span>{r.Name}</span>
                  {selectedRole === r.Name && <span className="text-xs">⭐</span>}
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