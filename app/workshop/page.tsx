'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StockDashboard from '@/Components/StockDashboard/StockDashboard';
import { WebDashboardRolePicker } from '@/Components/AuthComponents/WebDashboardRolePicker';
import {
    applyWebDashboardChoice,
    getWebDashboardChoice,
    getWebDashboardRoles,
    parseUserData,
    type WebDashboardChoice,
    type WebUserData,
} from '@/lib/webDashboardAuth';

type PageState = 'loading' | 'picker' | 'ready';

export default function WorkshopPage() {
    const router = useRouter();
    const [state, setState] = useState<PageState>('loading');
    const [userData, setUserData] = useState<WebUserData | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const user = parseUserData();

        if (!token || !user) {
            router.replace('/workshop/login');
            return;
        }

        const { isWorkshop, availableChoices } = getWebDashboardRoles(user);

        if (!isWorkshop) {
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
            if (availableChoices.includes('cnc')) {
                router.replace('/cnc');
                return;
            }
            router.replace('/workshop/login');
            return;
        }

        if (availableChoices.length > 1) {
            const choice = getWebDashboardChoice();
            if (choice && availableChoices.includes(choice) && choice !== 'workshop') {
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
        if (choice === 'workshop') {
            setState('ready');
        } else {
            router.replace(path);
        }
    };

    if (state === 'loading') {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #E8EEF5, #DDE5F0, #E4E0EC)',
            }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    border: '4px solid #E5E7EB', borderTopColor: '#0D9488',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (state === 'picker' && userData) {
        const { availableChoices } = getWebDashboardRoles(userData);
        return (
            <div className="min-h-screen flex items-center justify-center p-4"
                style={{ background: 'linear-gradient(135deg, #E8EEF5, #DDE5F0, #E4E0EC)' }}>
                <WebDashboardRolePicker
                    userName={userData.telegram_user_name}
                    availableChoices={availableChoices}
                    onSelect={handleDashboardSelect}
                />
            </div>
        );
    }

    return (
        <StockDashboard
            userName={userData?.telegram_user_name ?? 'user'}
            variant="workshop"
        />
    );
}
