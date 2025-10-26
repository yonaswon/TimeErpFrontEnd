import { TeamUser } from '@/hooks/useTeams'

interface UserListProps {
  users: TeamUser[]
  onAssignRoles: (user: TeamUser) => void
}

export const UserList = ({ users, onAssignRoles }: UserListProps) => {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Members</h2>
      {users.map((user,i) => (
        <div
          key={i}
          className="bg-white dark:bg-zinc-800 rounded-lg p-3 border dark:border-zinc-700"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {user.telegram_user_name || `User ${user.telegram_id}`}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                ID: {user.telegram_id}
              </p>
              <div className="flex flex-wrap gap-1">
                { user.role && user.role.map((role,i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded"
                  >
                    {role.Name}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => onAssignRoles(user)}
              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded transition-colors"
            >
              Assign Roles
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}