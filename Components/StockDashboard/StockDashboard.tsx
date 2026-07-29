'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import StockSidebar, { StockHamburger, StockLogoutButton, type StockSection } from './StockSidebar';
import MaterialsTab from './Materials/MaterialsTab';
import InventoriesTab from './Inventories/InventoriesTab';
import { clearWebDashboardChoice } from '@/lib/webDashboardAuth';
import './StockDashboard.css';

interface StockDashboardProps {
    userName: string;
}

export default function StockDashboard({ userName }: StockDashboardProps) {
    const [section, setSection] = useState<StockSection>('materials');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        clearWebDashboardChoice();
        router.push('/stock/login');
    };

    const handleSectionChange = (s: StockSection) => {
        setSection(s);
        setMobileOpen(false);
    };

    return (
        <div className="stock-dashboard">
            <div className="stock-shell">
                <StockSidebar
                    active={section}
                    onChange={handleSectionChange}
                    collapsed={sidebarCollapsed}
                    open={mobileOpen}
                    onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
                />
                <main className="stock-main">
                    <header className="stock-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <StockHamburger onClick={() => setMobileOpen((o) => !o)} />
                            <div className="stock-greeting">
                                <h1>Welcome, @{userName.replace(/^@/, '')}</h1>
                            </div>
                        </div>
                        <div className="stock-utility">
                            <StockLogoutButton onClick={handleLogout} />
                        </div>
                    </header>

                    {section === 'materials' ? <MaterialsTab /> : <InventoriesTab />}
                </main>
            </div>
            {mobileOpen && (
                <div
                    role="presentation"
                    onClick={() => setMobileOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.25)',
                        zIndex: 30,
                    }}
                />
            )}
        </div>
    );
}
