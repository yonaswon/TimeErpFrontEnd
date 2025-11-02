'use client'

import { useEffect, useState } from 'react'
import {
  Wallet,
  Package,
  Wrench,
  UserCircle2,
} from 'lucide-react'
import FinanceContent from './Finace/FinanceContent'

type TabType = 'finance' | 'stock' | 'workshop' | 'profile'

const AdminMobile = ({userData,selectedRole,onRoleSelect}:any) => {
  const [activeTab, setActiveTab] = useState<TabType>('finance')
  const [user, setUser] = useState<any>(null)

  // ✅ Telegram Mini App setup
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      setUser(tg.initDataUnsafe?.user)
      tg.expand()
    }
  }, [])

  const tabs = [
    { id: 'finance' as TabType, label: 'Finance', icon: Wallet },
    { id: 'stock' as TabType, label: 'Stock', icon: Package },
    { id: 'workshop' as TabType, label: 'Workshop', icon: Wrench },
    { id: 'profile' as TabType, label: 'Profile', icon: null },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'finance':
        return <FinanceContent />
      case 'stock':
        return <StockContent />
      case 'workshop':
        return <WorkshopContent />
      case 'profile':
        return <ProfileContent user={user}
        userData={userData} 
            selectedRole={selectedRole} 
            onRoleSelect={onRoleSelect}  />
      default:
        return <FinanceContent />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 transition-colors duration-300">
      <div className="flex-1 p-3">{renderContent()}</div>

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
                    (e.target as HTMLImageElement).src =
                      'https://telegram.org/img/t_logo.png'
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

export default AdminMobile

// ---------------------------
// 📊 Tab Content Components
// ---------------------------

const ScrollableMenu = ({ items }: { items: string[] }) => (
  <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
    {items.map((item) => (
      <button
        key={item}
        className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 rounded-full text-sm font-medium whitespace-nowrap hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
      >
        {item}
      </button>
    ))}
  </div>
)


const StockContent = () => (
  <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
    <ScrollableMenu items={['Current Stock', 'Incoming Orders']} />
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
      Stock Component
    </h2>
  </div>
)

const WorkshopContent = () => (
  <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
    <ScrollableMenu items={['Active Jobs', 'Pending Jobs']} />
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
      Workshop Component
    </h2>
  </div>
)

import { useTheme } from 'next-themes'
const ProfileContent = ({ user,onRoleSelect,userData,selectedRole}: any) => {
  const { theme, setTheme } = useTheme()
  return (
    <div className="flex flex-col items-center justify-center text-center mt-10">
      <div
        onClick={() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('user_data')

          if (
            typeof window !== 'undefined' &&
            window?.Telegram?.WebApp?.close
          ) {
            window.Telegram.WebApp.close()
          } else {
            window.location.reload()
          }
        }}
        className="mb-4 text-sm text-red-500 font-medium cursor-pointer hover:underline"
      >
        LOGOUT
      </div>
     <button
                onClick={() => {
                  setTheme(theme === 'light' ? 'dark' : 'light')
                }}
                className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between"
              >
                <span>Toggle Theme</span>
                <span className="text-sm bg-gray-200 dark:bg-zinc-600 px-2 py-1 rounded">
                  {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
                </span>
              </button>

      {user ? (
        <>
          <img
            src={`https://t.me/i/userpic/320/${user.username}.jpg`}
            alt="Profile"
            className="w-24 h-24 rounded-full border-2 border-blue-500 mb-3"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://telegram.org/img/t_logo.png'
            }}
          />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user.first_name} {user.last_name || ''}
          </h2>
          {user.username && (
            <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
          )}
        </>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          Unable to load Telegram user info.
        </p>
      )}
       <div className="border-t border-gray-100 dark:border-zinc-700">
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Select Role
                  </p>
                  {userData?.role && userData.role.length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {userData.role.map((r:any) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            onRoleSelect(r.Name)
                          }}
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
