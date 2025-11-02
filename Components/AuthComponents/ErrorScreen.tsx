import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { AdminUserManager } from '../Admin/AdminUserManager/AdminUserManager'
interface ErrorScreenProps {
  error: string
  onRetry: () => void
}

export const ErrorScreen = ({ error, onRetry }: ErrorScreenProps) => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 transition-colors duration-300">
      {/* <AdminUserManager /> */}
      <div className="text-center">
        <div className="text-4xl mb-4">❌</div>
        <div className="text-xl text-red-600 dark:text-red-400 mb-4">Error: {error}</div>
        <button 
          onClick={onRetry}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg transition-colors duration-300"
        >
          Try Again
        </button>

        {/* Theme toggle button */}
        <div className="mt-6">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 dark:bg-gray-600 dark:hover:bg-gray-500 text-white rounded-lg transition-colors duration-300 text-sm"
          >
            Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        </div>
      </div>
    </div>
  )
}