'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FinanceDashboard from '@/Components/FinanceDashboard/FinanceDashboard';
import { WebDashboardRolePicker } from '@/Components/AuthComponents/WebDashboardRolePicker';
import {
    applyWebDashboardChoice,
    getWebDashboardChoice,
    getWebDashboardRoles,
    parseUserData,
    type WebUserData,
} from '@/lib/webDashboardAuth';

type PageState = 'loading' | 'picker' | 'ready';

export default function FinancePage() {
    const router = useRouter();
    const [state, setState] = useState<PageState>('loading');
    const [userData, setUserData] = useState<WebUserData | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const user = parseUserData();

        if (!token || !user) {
            router.replace('/finance/login');
            return;
        }

        const { isAdmin, isFinance, isDual } = getWebDashboardRoles(user);

        if (isAdmin && !isFinance) {
            router.replace('/admin');
            return;
        }

        if (!isAdmin && !isFinance) {
            router.replace('/finance/login');
            return;
        }

        if (isDual) {
            const choice = getWebDashboardChoice();
            if (choice === 'admin') {
                router.replace('/admin');
                return;
            }
            if (!choice) {
                setUserData(user);
                setState('picker');
                return;
            }
        }

        setUserData(user);
        setState('ready');
    }, [router]);

    const handleDashboardSelect = (choice: 'admin' | 'finance') => {
        const path = applyWebDashboardChoice(choice);
        if (choice === 'admin') {
            router.replace(path);
        } else {
            setState('ready');
        }
    };

    if (state === 'loading') {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--admin-bg, #F9FAFB)',
            }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    border: '4px solid #E5E7EB', borderTopColor: '#7C3AED',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (state === 'picker' && userData) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center p-4">
                <WebDashboardRolePicker
                    userName={userData.telegram_user_name}
                    onSelect={handleDashboardSelect}
                />
            </div>
        );
    }

    return (
        <FinanceDashboard
            userName={userData?.telegram_user_name ?? 'user'}
        />
    );
}
