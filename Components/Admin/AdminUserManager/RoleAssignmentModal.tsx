import { useState, useEffect } from 'react'
import { TeamUser, TeamRoleOption } from '@/hooks/useTeams'

interface RoleAssignmentModalProps {
  user: TeamUser | null
  availableRoles: TeamRoleOption[]
  onClose: () => void
  onUpdateRoles: (telegramId: number, roleIds: number[],id:number) => Promise<void>
}

export const RoleAssignmentModal = ({ 
  user, 
  availableRoles, 
  onClose, 
  onUpdateRoles 
}: RoleAssignmentModalProps) => {
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
        console.log(user)
      setSelectedRoleIds(user.role.map(r => r.id))
    }
  }, [user])

  const handleRoleToggle = (roleId: number) => {
    setSelectedRoleIds(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    )
  }

  const handleSubmit = async () => {
    console.log(user,'user')
    if (!user) return

    setLoading(true)
    setError(null)
    try {
      await onUpdateRoles(user.telegram_id, selectedRoleIds,user.id)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Assign Roles to {user.telegram_user_name || `User ${user.telegram_id}`}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {availableRoles.map((role) => (
              <label key={role.id} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRoleIds.includes(role.id)}
                  onChange={() => handleRoleToggle(role.id)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-gray-900 dark:text-white">{role.Name}</span>
              </label>
            ))}
          </div>

          {error && (
            <p className="mt-4 text-red-600 dark:text-red-400 text-sm">{error}</p>
          )}

          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              {loading ? 'Updating...' : 'Update Roles'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}