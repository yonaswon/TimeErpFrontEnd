'use client'

import { UserData } from '@/hooks/useTelegramAuth'
import { UserProfile } from './UserProfile'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface NoRolesScreenProps {
  userData: UserData
}

export const NoRolesScreen = ({ userData }: NoRolesScreenProps) => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="text-center min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-md p-6 max-w-md w-full mx-auto">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900 transition-colors duration-300">
      <h1 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-4">
        👋 Welcome!
      </h1>

      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-md p-6 max-w-md w-full mx-auto transition-colors duration-300">
        <UserProfile userData={userData} />
        
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg transition-colors duration-300">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Account Pending
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            Please come back when you are assigned roles. 
            Contact administrator if you believe this is an error.
          </p>
        </div>

        
      </div>
    </div>
  )
}