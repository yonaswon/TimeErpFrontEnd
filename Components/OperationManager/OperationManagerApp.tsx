'use client'
import { useEffect, useState } from 'react'
import {
    Truck,
    TrendingUp,
} from 'lucide-react'
import DandIContent from './DandI/DandIContent'
import ProgressContent from './ProgressContent'
import { GlobalProfile } from '../GlobalComponents/GlobalProfile/GlobalProfile'

type TabType = 'dandi' | 'progress' | 'profile'

const OperationManagerApp = ({ userData, selectedRole, onRoleSelect }: any) => {
    const [activeTab, setActiveTab] = useState<TabType>('dandi')
    const [user, setUser] = useState<any>(null)
    const [isNavHidden, setIsNavHidden] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp
            tg.ready()
            setUser(tg.initDataUnsafe?.user)
            tg.expand()
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateNavVisibility = () => {
            setIsNavHidden(document.body.classList.contains('hide-sales-nav'));
        };

        updateNavVisibility();

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName === 'class') {
                    updateNavVisibility();
                }
            }
        });

        observer.observe(document.body, { attributes: true });

        return () => observer.disconnect();
    }, []);

    const tabs = [
        { id: 'dandi' as TabType, label: 'D and I', icon: Truck },
        { id: 'progress' as TabType, label: 'Progress', icon: TrendingUp },
        { id: 'profile' as TabType, label: 'Profile', icon: null },
    ]

    const renderContent = () => {
        switch (activeTab) {
            case 'dandi':
                return <DandIContent />
            case 'progress':
                return <ProgressContent />
            case 'profile':
                return <GlobalProfile
                    user={user}
                    userData={userData}
                    selectedRole={selectedRole}
                    onRoleSelect={onRoleSelect}
                />
            default:
                return <DandIContent />
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col pb-20 transition-colors duration-300">
            {/* Main Content */}
            <div className="flex-1 w-full max-w-full overflow-x-hidden">
                {renderContent()}
            </div>

            {/* Bottom Navigation */}
            {!isNavHidden && (
                <nav className="sales-bottom-nav fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex justify-around py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] z-[50] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id
                        const Icon = tab.icon

                        // Profile Tab with User Image
                        if (tab.id === 'profile') {
                            const imageUrl = user?.username
                                ? `https://t.me/i/userpic/160/${user.username}.jpg`
                                : 'https://telegram.org/img/t_logo.png'

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className="flex flex-col items-center justify-center flex-1 gap-1"
                                >
                                    <div className={`relative p-0.5 rounded-full transition-all duration-300 ${isActive ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}>
                                        <img
                                            src={imageUrl}
                                            alt="Profile"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://telegram.org/img/t_logo.png'
                                            }}
                                            className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-800 object-cover"
                                        />
                                    </div>
                                    <span
                                        className={`text-[10px] font-medium transition-colors duration-200 ${isActive
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                    >
                                        Profile
                                    </span>
                                </button>
                            )
                        }

                        // Other Tabs
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex flex-col items-center justify-center flex-1 gap-1 group`}
                            >
                                {Icon && (
                                    <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive
                                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                        : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                                        }`}>
                                        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                    </div>
                                )}
                                <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {tab.label}
                                </span>
                            </button>
                        )
                    })}
                </nav>
            )}
        </div>
    )
}

export default OperationManagerApp
