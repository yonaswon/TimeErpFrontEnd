'use client'

import { useState } from 'react'
import { useTeams, TeamUser } from '@/hooks/useTeams'
import { UserList } from './UserList'
import { RoleManagement } from './RoleManagement'
import { RoleAssignmentModal } from './RoleAssignmentModal'
import { LoadingScreen } from '@/Components/AuthComponents/LoadingScreen'
import { ErrorScreen } from '@/Components/AuthComponents/ErrorScreen'

export const AdminUserManager = () => {
  const { users, role, loading, error, refetch, createRole, updateUserRoles } = useTeams()
  const [selectedUser, setSelectedUser] = useState<TeamUser | null>(null)

  if (loading) {
    return <LoadingScreen />
  }

  if (error) {
    return (
      <ErrorScreen 
        error={error} 
        onRetry={refetch}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          User & Role Management
        </h1>
        
        <RoleManagement 
          role={role} 
          onCreateRole={createRole}
        />
        
        <UserList 
          users={users} 
          onAssignRoles={setSelectedUser}
        />

        <RoleAssignmentModal
          user={selectedUser}
          availableRoles={role}
          onClose={() => setSelectedUser(null)}
          onUpdateRoles={updateUserRoles}
        />
      </div>
    </div>
  )
}