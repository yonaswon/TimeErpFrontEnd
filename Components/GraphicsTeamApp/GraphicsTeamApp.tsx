'use client'
import { useEffect, useState } from 'react'
import {
  Home,
  Package,
  Clock,
  User,
} from 'lucide-react'

type TabType = 'mockups' | 'orders' | 'manufacturing' | 'profile'
import MockupPage from './Mockup/Mockup'

const GraphicsTeamApp = ({ userData, selectedRole, onRoleSelect }: any) => {
  const [activeTab, setActiveTab] = useState<TabType>('mockups')
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
    { id: 'mockups' as TabType, label: 'Mockups', icon: Home },
    { id: 'orders' as TabType, label: 'Orders', icon: Package },
    { id: 'manufacturing' as TabType, label: 'Manufacturing', icon: Clock },
    { id: 'profile' as TabType, label: 'Profile', icon: null },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'mockups':
        return <MockupPage />
      case 'orders':
        return <OrdersContent />
      case 'manufacturing':
        return <ManufacturingContent />
      case 'profile':
        return <ProfileContent 
          user={user} 
          userData={userData} 
          selectedRole={selectedRole} 
          onRoleSelect={onRoleSelect} 
        />
      default:
        return <MockupPage />
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

export default GraphicsTeamApp

const OrdersContent = () => (
  <div className="space-y-4">
    {/* Active Orders */}
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Active Orders</h2>
      
      <div className="space-y-3">
        <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">#ORD-001</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">ABC Company - Window Graphics</div>
            </div>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">In Progress</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Due: Dec 15, 2023 • Size: 48" x 36"</div>
        </div>
        
        <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">#ORD-002</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">XYZ Store - LED Signage</div>
            </div>
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded">Pending Review</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Due: Dec 18, 2023 • Materials: Acrylic, LED</div>
        </div>
        
        <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">#ORD-003</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">New Restaurant - Store Front</div>
            </div>
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded">Ready</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Due: Dec 20, 2023 • Type: Illuminated Sign</div>
        </div>
      </div>
    </div>

    {/* Order Statistics */}
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Order Overview</h2>
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">8</div>
          <div className="text-xs text-blue-700 dark:text-blue-300">In Progress</div>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">12</div>
          <div className="text-xs text-green-700 dark:text-green-300">Completed</div>
        </div>
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">3</div>
          <div className="text-xs text-yellow-700 dark:text-yellow-300">Pending</div>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">1</div>
          <div className="text-xs text-red-700 dark:text-red-300">Delayed</div>
        </div>
      </div>
    </div>
  </div>
)

const ManufacturingContent = () => (
  <div className="space-y-4">
    {/* Production Queue */}
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Production Queue</h2>
      
      <div className="space-y-3">
        <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium text-gray-900 dark:text-white">Cutting</div>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">2 Jobs</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Vinyl cutting and weeding</div>
        </div>
        
        <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium text-gray-900 dark:text-white">Printing</div>
            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded">3 Jobs</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Large format digital printing</div>
        </div>
        
        <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium text-gray-900 dark:text-white">Assembly</div>
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded">1 Job</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">LED signage assembly</div>
        </div>
        
        <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium text-gray-900 dark:text-white">Quality Check</div>
            <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-1 rounded">4 Jobs</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Final inspection and packaging</div>
        </div>
      </div>
    </div>

    {/* Manufacturing Stats */}
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">This Week</h2>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Completed Jobs</span>
          <span className="font-medium text-green-600 dark:text-green-400">15</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
          <span className="font-medium text-blue-600 dark:text-blue-400">8</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Pending Materials</span>
          <span className="font-medium text-yellow-600 dark:text-yellow-400">3</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">On Time Rate</span>
          <span className="font-medium text-purple-600 dark:text-purple-400">94%</span>
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
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Graphics Team</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create mockups, manage orders, and track manufacturing progress.
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