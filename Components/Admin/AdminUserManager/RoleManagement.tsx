import { useState } from 'react'
import { TeamRoleOption } from '@/hooks/useTeams'

interface RoleManagementProps {
  role: TeamRoleOption[]
  onCreateRole: (roleName: string) => Promise<void>
}

export const RoleManagement = ({ role, onCreateRole }: RoleManagementProps) => {
  const [isCreating, setIsCreating] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return

    setLoading(true)
    setError(null)
    try {
      await onCreateRole(newRoleName.trim())
      setNewRoleName('')
      setIsCreating(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-zinc-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Available Roles</h3>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
        >
          {isCreating ? 'Cancel' : 'Create Role'}
        </button>
      </div>

      {isCreating && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">
          <input
            type="text"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="Enter role name"
            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
          />
          {error && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>}
          <button
            onClick={handleCreateRole}
            disabled={loading || !newRoleName.trim()}
            className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            {loading ? 'Creating...' : 'Create Role'}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {role.map((role:any) => (
          <span
            key={role.id}
            className="px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-lg text-sm"
          >
            {role.Name}
          </span>
        ))}
      </div>
    </div>
  )
}