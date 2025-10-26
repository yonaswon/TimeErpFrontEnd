'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState, useRef } from 'react'
import { UserData } from '@/hooks/useTelegramAuth'

interface NavigationProps {
  userData?: UserData | null
  selectedRole: string | null
  onRoleSelect: (roleName: string) => void
}

export const Navigation = ({ userData, selectedRole, onRoleSelect }: NavigationProps) => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get Telegram user data for profile picture
  const tgUser = typeof window !== 'undefined' ? window?.Telegram?.WebApp?.initDataUnsafe?.user : null
  const profilePic = tgUser?.photo_url
  const userName = tgUser?.first_name || userData?.telegram_user_name || 'User'

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_data')
    
    // Close Telegram Mini App
    if (typeof window !== 'undefined' && window?.Telegram?.WebApp?.close) {
      window.Telegram.WebApp.close()
    } else {
      // Fallback: reload the page if not in Telegram
      window.location.reload()
    }
    
    setIsDropdownOpen(false)
  }

  if (!mounted) {
    return (
      <nav className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="text-xl font-bold text-gray-900 dark:text-white">TimeErp</div>
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 px-6 py-4 transition-colors duration-300">
      <div className="flex justify-between items-center">
        {/* Left side - Logo and Selected Role */}
        <div className="flex items-center space-x-4">
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            TimeErp
          </div>
          {selectedRole && (
            <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium border border-green-200 dark:border-green-800">
              {selectedRole}
            </div>
          )}
        </div>

        {/* Right side - Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            {profilePic ? (
              <img 
                src={profilePic} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-zinc-600"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold border-2 border-gray-300 dark:border-zinc-600">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 py-2 z-50">
              {/* User Info */}
              <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-700">
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {userName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  @{userData?.telegram_user_name || 'user'}
                </p>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => {
                  setTheme(theme === 'light' ? 'dark' : 'light')
                  setIsDropdownOpen(false)
                }}
                className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between"
              >
                <span>Toggle Theme</span>
                <span className="text-sm bg-gray-200 dark:bg-zinc-600 px-2 py-1 rounded">
                  {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
                </span>
              </button>

              {/* Roles Section */}
              <div className="border-t border-gray-100 dark:border-zinc-700">
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Select Role
                  </p>
                  {userData?.role && userData.role.length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {userData.role.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            onRoleSelect(r.Name)
                            setIsDropdownOpen(false)
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

              {/* Logout Button */}
              <div className="border-t border-gray-100 dark:border-zinc-700 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout & Close</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}