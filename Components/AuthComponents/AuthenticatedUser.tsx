'use client'
import { AdminUserManager } from '../Admin/AdminUserManager/AdminUserManager'
import { UserData } from '@/hooks/useTelegramAuth'
import { NoRolesScreen } from './NoRolesScreen'
import { UserProfile } from './UserProfile'
import { UserRoles } from './UserRoles'
import FinanceAndAccounting from '../Finance&Accounting/FinanceAndAccounting'
import { useRouter } from 'next/navigation'

interface AuthenticatedUserProps {
  userData: UserData
  selectedRole: string | null
  onRoleSelect: (roleName: string) => void
}

export const AuthenticatedUser = ({ userData, selectedRole, onRoleSelect }: AuthenticatedUserProps) => {
  const hasRoles = userData.role && userData.role.length > 0
  const route = useRouter()
  if (!hasRoles) {
    return <NoRolesScreen userData={userData} />
  }

  return (
    <div className="text-center w-full max-w-md">
      {selectedRole && selectedRole == "Finance&Accounting" && <FinanceAndAccounting  />}
        {/* <AdminUserManager /> */}

        {/* {selectedRole && <div className='ext-2xl font-bold text-green-600 dark:text-green-400 mb-4'>{selectedRole}</div>} */}
      {/* <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">
        ✅ Authenticated
      </h1>
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-md p-6 transition-colors duration-300">
        <UserProfile userData={userData} />
        <UserRoles userData={userData} selectedRole={selectedRole} onRoleSelect={onRoleSelect} />
      </div> */}
    </div>
  )
}