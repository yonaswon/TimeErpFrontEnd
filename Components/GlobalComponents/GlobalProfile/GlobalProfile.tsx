'use client'

import { useTheme } from 'next-themes'
import { AdminUserManager } from '../../Admin/AdminUserManager/AdminUserManager'

interface GlobalProfileProps {
    user: any;
    userData: any;
    selectedRole: string;
    onRoleSelect: (roleName: string) => void;
}

export const GlobalProfile = ({ user, userData, selectedRole, onRoleSelect }: GlobalProfileProps) => {
    const { theme, setTheme } = useTheme()

    const handleLogout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_data')

        if (typeof window !== 'undefined' && window?.Telegram?.WebApp?.close) {
            window.Telegram.WebApp.close()
        } else {
            window.location.reload()
        }
    }

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light')
    }

    const roleDescriptions: Record<string, string> = {
        'Admin': 'Manage users, roles, and overall system configuration.',
        'Sales Team': 'Manage leads, request mockups, and track customer conversions.',
        'Graphic Design': 'Create mockups, handle CNC ready files, and prepare cutting dimensions.',
        'Assembly Delivery and Installation': 'Manage field installations, team assignments, and delivery schedules.',
        'Finance and Accounting': 'Manage incoming payments, outbound transactions, and pity wallet.',
        'Workshop Supervisor': 'Oversee machine operators, assign jobs, and run quality checks.',
        'Stock Manager': 'Control inventory flow, purchase requests, and material tracking.',
        'CNC Operators': 'Operate CNC machines, process active jobs, and log work hours.'
    }

    return (
        <div className="flex flex-col items-center justify-center text-center mt-10 space-y-6 pb-20">
            {/* Logout Button */}
            <div
                onClick={handleLogout}
                className="mb-2 text-sm text-red-500 font-medium cursor-pointer hover:underline"
            >
                LOGOUT
            </div>

            {/* Theme Toggle */}
            <div className="w-full max-w-sm px-4">
                <button
                    onClick={toggleTheme}
                    className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between"
                >
                    <span className="font-medium text-sm">Theme</span>
                    <span className="text-xs bg-gray-100 dark:bg-zinc-700 px-3 py-1.5 rounded-md border border-gray-200 dark:border-zinc-600 shadow-sm flex items-center gap-2">
                        {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                    </span>
                </button>
            </div>

            {user ? (
                <div className="flex flex-col items-center">
                    <img
                        src={`https://t.me/i/userpic/320/${user.username}.jpg`}
                        alt="Profile"
                        className="w-24 h-24 rounded-full border-2 border-blue-500 mb-3"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://telegram.org/img/t_logo.png'
                        }}
                    />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {user.first_name} {user.last_name || ''}
                    </h2>
                    {user.username && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">@{user.username}</p>
                    )}

                    {/* Role Info Box (Dynamic based on selectedRole) */}
                    {selectedRole && (
                        <div className="mt-4 p-4 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 max-w-sm w-full shadow-sm text-left">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-2">{selectedRole}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                {roleDescriptions[selectedRole] || 'System assigned role for operational workflows.'}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/50 text-sm max-w-sm w-full mx-4">
                    Unable to load Telegram user info.
                </div>
            )}

            {/* Role Selection */}
            <div className="w-full max-w-sm px-4">
                <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden shadow-sm">
                    <div className="px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            System Roles
                        </p>
                    </div>

                    {userData?.role && userData.role.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-zinc-700/50 max-h-48 overflow-y-auto">
                            {userData.role.map((r: any) => (
                                <button
                                    key={r.id}
                                    onClick={() => onRoleSelect(r.Name)}
                                    className={`w-full text-left flex items-center justify-between px-4 py-3 transition-colors ${selectedRole === r.Name
                                            ? 'bg-blue-50/50 dark:bg-blue-900/10'
                                            : 'hover:bg-gray-50 dark:hover:bg-zinc-700/50'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-2.5 h-2.5 rounded-full ${selectedRole === r.Name
                                                ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                                                : 'bg-gray-300 dark:bg-zinc-600'
                                            }`}></div>
                                        <span className={`text-sm ${selectedRole === r.Name
                                                ? 'font-medium text-blue-700 dark:text-blue-400'
                                                : 'text-gray-600 dark:text-gray-400'
                                            }`}>
                                            {r.Name}
                                        </span>
                                    </div>
                                    {selectedRole === r.Name && (
                                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">Active</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                No roles assigned to your account.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Admin Specific Features */}
            {selectedRole === 'Admin' && (
                <div className="w-full max-w-sm px-4 pt-2">
                    <div className="border-t border-gray-200 dark:border-zinc-700 pt-6">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider text-left">
                            Admin Configuration
                        </h3>
                        <AdminUserManager />
                    </div>
                </div>
            )}
        </div>
    )
}
