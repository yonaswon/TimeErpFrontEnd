'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashBoard from '../../Components/AdminDashBoard/AdminDashBoard';
import { WebDashboardRolePicker } from '@/Components/AuthComponents/WebDashboardRolePicker';
import { LoadingScreen } from '@/Components/AuthComponents/LoadingScreen';
import {
    applyWebDashboardChoice,
    getWebDashboardChoice,
    getWebDashboardRoles,
    parseUserData,
    type WebDashboardChoice,
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

        const { isAdmin, availableChoices } = getWebDashboardRoles(user);

        if (!isAdmin) {
            if (availableChoices.length === 1) {
                router.replace(applyWebDashboardChoice(availableChoices[0]));
                return;
            }
            if (availableChoices.includes('stock')) {
                router.replace('/stock');
                return;
            }
            if (availableChoices.includes('workshop')) {
                router.replace('/workshop');
                return;
            }
            if (availableChoices.includes('cnc')) {
                router.replace('/cnc');
                return;
            }
            if (availableChoices.includes('finance')) {
                router.replace('/finance');
                return;
            }
            router.replace('/');
            return;
        }

        if (availableChoices.length > 1) {
            const choice = getWebDashboardChoice();
            if (choice && availableChoices.includes(choice) && choice !== 'admin') {
                router.replace(applyWebDashboardChoice(choice));
                return;
            }
            if (!choice || !availableChoices.includes(choice)) {
                setUserData(user);
                setState('picker');
                return;
            }
        }

        setState('ready');
    }, [router]);

    const handleDashboardSelect = (choice: WebDashboardChoice) => {
        const path = applyWebDashboardChoice(choice);
        if (choice === 'admin') {
            setState('ready');
        } else {
            router.replace(path);
        }
    };

    if (state === 'loading') {
        return <LoadingScreen label="Loading..." />;
    }

    if (state === 'picker' && userData) {
        const { availableChoices } = getWebDashboardRoles(userData);
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center p-4">
                <WebDashboardRolePicker
                    userName={userData.telegram_user_name}
                    availableChoices={availableChoices}
                    onSelect={handleDashboardSelect}
                />
            </div>
        );
    }

    return <AdminDashBoard />;
}
