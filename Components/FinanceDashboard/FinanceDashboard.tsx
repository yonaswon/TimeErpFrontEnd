'use client';
import React, { useState } from 'react';
import { Menu, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FinanceSidebar from './FinanceSidebar';
import AttendanceDashboard from '../AdminDashBoard/Attendance/AttendanceDashboard';
// Reuse the same CSS as AdminDashBoard for identical look & feel
import '../AdminDashBoard/AdminDashBoard.css';
import { clearWebDashboardChoice } from '@/lib/webDashboardAuth';

interface FinanceDashboardProps {
    userName: string;
}

const sectionTitles: Record<string, string> = {
    attendance: 'Attendance & Payroll',
};

export default function FinanceDashboard({ userName }: FinanceDashboardProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeSection, setActiveSection] = useState('attendance');
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        clearWebDashboardChoice();
        router.push('/finance/login');
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'attendance':
                return <AttendanceDashboard />;
            default:
                return <AttendanceDashboard />;
        }
    };

    return (
        <div className="admin-dashboard">
            <FinanceSidebar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />
            <main className={`admin-content ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
                <div className="admin-content-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            className="admin-hamburger-btn"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            <Menu size={24} />
                        </button>
                        <h1>{sectionTitles[activeSection]}</h1>
                    </div>
                    {/* User info + logout */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 13, color: 'var(--admin-text-secondary)' }}>
                            <User size={15} />
                            <span>@{userName}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="admin-hamburger-btn"
                            title="Logout"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 13 }}
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>
                {renderContent()}
            </main>
        </div>
    );
}
