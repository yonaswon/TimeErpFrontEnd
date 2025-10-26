import { UserData } from '@/hooks/useTelegramAuth'
import { useEffect } from 'react'

interface UserRolesProps {
  userData: UserData
  selectedRole: string | null
  onRoleSelect: (roleName: string) => void
}

export const UserRoles = ({ userData, selectedRole, onRoleSelect }: UserRolesProps) => {
  const hasRoles = userData.role && userData.role.length > 0

  if (!hasRoles) {
    return null
  }


  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Your Roles:</h3>
      <ul className="space-y-2">
        {userData.role.map((r) => (
          <li 
            key={r.id} 
            onClick={() => onRoleSelect(r.Name)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors duration-300 cursor-pointer ${
              selectedRole === r.Name 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-2 border-green-500 dark:border-green-400' 
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/30'
            }`}
          >
            {selectedRole === r.Name ? '⭐ ' : '✅ '}{r.Name}
          </li>
        ))}
      </ul>
      {selectedRole && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Selected role: <span className="font-semibold text-green-600 dark:text-green-400">{selectedRole}</span>
          </p>
        </div>
      )}
    </div>
  )
}