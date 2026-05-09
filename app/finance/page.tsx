'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FinanceDashboard from '@/Components/FinanceDashboard/FinanceDashboard';

interface UserRole { id: number; Name: string; }
interface UserData { telegram_user_name?: string; role?: UserRole[]; }

export default function FinancePage() {
    const router = useRouter();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const raw = localStorage.getItem('user_data');

        if (!token || !raw) {
            router.replace('/finance/login');
            return;
        }

        try {
            const user: UserData = JSON.parse(raw);
            const roles = user.role ?? [];
            const isAdmin = roles.some((r) => r.Name === 'Admin');
            const isFinance = roles.some((r) => r.Name === 'Finance&Accounting');

            if (isAdmin) {
                // Admins use the full admin dashboard
                router.replace('/admin');
                return;
            }

            if (!isFinance) {
                // No valid role — back to login
                router.replace('/finance/login');
                return;
            }

            setUserData(user);
        } catch {
            router.replace('/finance/login');
            return;
        }

        setChecking(false);
    }, [router]);

    if (checking || !userData) {
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

    return (
        <FinanceDashboard
            userName={userData.telegram_user_name ?? 'user'}
        />
    );
}
