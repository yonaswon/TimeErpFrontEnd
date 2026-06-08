'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashBoard from '../../Components/AdminDashBoard/AdminDashBoard';
import { WebDashboardRolePicker } from '@/Components/AuthComponents/WebDashboardRolePicker';
import {
    applyWebDashboardChoice,
    getWebDashboardChoice,
    getWebDashboardRoles,
    parseUserData,
    type WebUserData,
} from '@/lib/webDashboardAuth';

type PageState = 'loading' | 'picker' | 'ready';

export default function AdminPage() {
    const router = useRouter();
    const [state, setState] = useState<PageState>('loading');
    const [userData, setUserData] = useState<WebUserData | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const user = parseUserData();

        if (!token || !user) {
            router.replace('/');
            return;
        }

        const { isAdmin, isFinance, isDual } = getWebDashboardRoles(user);

        if (!isAdmin && isFinance) {
            router.replace('/finance');
            return;
        }

        if (!isAdmin && !isFinance) {
            router.replace('/');
            return;
        }

        if (isDual) {
            const choice = getWebDashboardChoice();
            if (choice === 'finance') {
                router.replace('/finance');
                return;
            }
            if (!choice) {
                setUserData(user);
                setState('picker');
                return;
            }
        }

        setState('ready');
    }, [router]);

    const handleDashboardSelect = (choice: 'admin' | 'finance') => {
        const path = applyWebDashboardChoice(choice);
        if (choice === 'finance') {
            router.replace(path);
        } else {
            setState('ready');
        }
    };

    if (state === 'loading') {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#F9FAFB',
            }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    border: '4px solid #E5E7EB', borderTopColor: '#2563EB',
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

    return <AdminDashBoard />;
}
