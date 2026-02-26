'use client'
import { useTelegramAuth } from '@/hooks/useTelegramAuth'
import { AuthenticatedUser } from '@/Components/AuthComponents/AuthenticatedUser'
import { LoadingScreen } from '@/Components/AuthComponents/LoadingScreen'
import { ErrorScreen } from '@/Components/AuthComponents/ErrorScreen'
import { Navigation } from '@/Components/Navigation/Navigation'
import { useState,useEffect } from 'react'
 
export default function Home() {
  const { userData, loading, error, retryAuth } = useTelegramAuth()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  useEffect(() => {
    if (userData?.role && userData.role.length > 0 && !selectedRole) {
      setSelectedRole(userData.role[0].Name)
    }
  }, [userData, selectedRole])

  const handleRoleSelect = (roleName: string) => {
    setSelectedRole(roleName)
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={retryAuth} />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 transition-colors duration-300">
      {/* <Navigation 
        userData={userData} 
        selectedRole={selectedRole} 
        onRoleSelect={handleRoleSelect} 
      /> */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        {userData ? (
          <AuthenticatedUser 
            userData={userData} 
            selectedRole={selectedRole} 
            onRoleSelect={handleRoleSelect} 
          />
        ) : (
          <div className="text-xl text-gray-600 dark:text-gray-400">Authentication required</div>
        )}
      </div>
    </div>
  )
}