import { UserData } from '@/hooks/useTelegramAuth'

interface UserProfileProps {
  userData: UserData
}

export const UserProfile = ({ userData }: UserProfileProps) => {
  // Get Telegram WebApp user object for additional info
  const tgUser = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initDataUnsafe?.user : null

  return (
    <div className="flex items-center justify-center mb-4">
      {tgUser?.photo_url ? (
        <img 
          src={tgUser.photo_url} 
          alt="Profile" 
          className="w-12 h-12 rounded-full mr-3 border border-gray-300 dark:border-gray-600"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white font-bold mr-3 border border-gray-300 dark:border-gray-600">
          {userData.telegram_user_name?.charAt(0) || 'U'}
        </div>
      )}
      <div className="text-left">
        <p className="font-semibold text-gray-900 dark:text-gray-100">
          {tgUser?.first_name || userData.telegram_user_name}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          @{userData.telegram_user_name || 'no_username'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          ID: {userData.telegram_id}
        </p>
      </div>
    </div>
  )
}