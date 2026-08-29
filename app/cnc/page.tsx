'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CncDashboard from '@/Components/CncDashboard/CncDashboard';
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

export default function CncPage() {
    const router = useRouter();
    const [state, setState] = useState<PageState>('loading');
    const [userData, setUserData] = useState<WebUserData | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const user = parseUserData();

        if (!token || !user) {
            router.replace('/cnc/login');
            return;
        }

        const { isCnc, availableChoices } = getWebDashboardRoles(user);

        if (!isCnc) {
            if (availableChoices.includes('admin')) {
                router.replace('/admin');
                return;
            }
            if (availableChoices.includes('finance')) {
                router.replace('/finance');
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
            router.replace('/cnc/login');
            return;
        }

        if (availableChoices.length > 1) {
            const choice = getWebDashboardChoice();
            if (choice && availableChoices.includes(choice) && choice !== 'cnc') {
                router.replace(applyWebDashboardChoice(choice));
                return;
            }
            if (!choice || !availableChoices.includes(choice)) {
                setUserData(user);
                setState('picker');
                return;
            }
        }

        setUserData(user);
        setState('ready');
    }, [router]);

    const handleDashboardSelect = (choice: WebDashboardChoice) => {
        const path = applyWebDashboardChoice(choice);
        if (choice === 'cnc') {
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
            <div
                className="min-h-screen flex items-center justify-center p-4"
                style={{ background: 'linear-gradient(135deg, #E8EEF5, #DDE5F0, #E4E0EC)' }}
            >
                <WebDashboardRolePicker
                    userName={userData.telegram_user_name}
                    availableChoices={availableChoices}
                    onSelect={handleDashboardSelect}
                />
            </div>
        );
    }

    return (
        <CncDashboard
            userName={userData?.telegram_user_name ?? 'user'}
            userId={userData?.id}
            roles={userData?.role ?? []}
        />
    );
}
