'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CncSidebar, { CncHamburger, CncLogoutButton } from './CncSidebar';
import {
    CNC_SECTION_META,
    getCncSections,
    getDefaultCncSection,
    type CncSection,
} from './cncSections';
import type { UserRole } from '@/lib/webDashboardAuth';
import { clearWebDashboardChoice } from '@/lib/webDashboardAuth';
import OverviewTab from './Overview/OverviewTab';
import TasksTab from './Tasks/TasksTab';
import ManufacturingTab from './Manufacturing/ManufacturingTab';
import ArealTab from './Areal/ArealTab';
import AssignCuttingTab from './AssignCutting/AssignCuttingTab';
import CuttingAssignsTab from './CuttingAssigns/CuttingAssignsTab';
import '../StockDashboard/StockDashboard.css';
import './CncDashboard.css';

interface CncDashboardProps {
    userName: string;
    userId?: number;
    roles: UserRole[];
}

export default function CncDashboard({ userName, roles }: CncDashboardProps) {
    const sections = useMemo(() => getCncSections(roles), [roles]);
    const defaultSection = useMemo(() => getDefaultCncSection(roles), [roles]);
    const [section, setSection] = useState<CncSection>(defaultSection ?? 'overview');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const router = useRouter();

    const activeSection = sections.includes(section)
        ? section
        : (defaultSection ?? sections[0]);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        clearWebDashboardChoice();
        router.push('/cnc/login');
    };

    const handleSectionChange = (s: CncSection) => {
        if (!sections.includes(s)) return;
        setSection(s);
        setMobileOpen(false);
    };

    if (sections.length === 0) {
        return (
            <div className="stock-dashboard">
                <div className="stock-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <div className="cnc-empty">
                        <strong>No CNC sections available</strong>
                        Your account does not have CNC Operator, Graphic Designer, or Workshop Supervisor access.
                        <div style={{ marginTop: 16 }}>
                            <CncLogoutButton onClick={handleLogout} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const meta = CNC_SECTION_META[activeSection];

    return (
        <div className="stock-dashboard cnc-show-subtitle">
            <div className="stock-shell">
                <CncSidebar
                    sections={sections}
                    active={activeSection}
                    onChange={handleSectionChange}
                    collapsed={sidebarCollapsed}
                    open={mobileOpen}
                    onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
                />
                <main className="stock-main">
                    <header className="stock-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <CncHamburger onClick={() => setMobileOpen((o) => !o)} />
                            <div className="stock-greeting">
                                <h1>Welcome, @{userName.replace(/^@/, '')}</h1>
                                <p className="cnc-subtitle">{meta.subtitle}</p>
                            </div>
                        </div>
                        <div className="stock-utility">
                            <CncLogoutButton onClick={handleLogout} />
                        </div>
                    </header>

                    <div className="stock-panel cnc-panel-scroll">
                        <div key={activeSection} className="cnc-panel-inner cnc-embed">
                            {activeSection === 'overview' && <OverviewTab />}
                            {activeSection === 'tasks' && <TasksTab />}
                            {activeSection === 'manufacturing' && <ManufacturingTab />}
                            {activeSection === 'areal' && <ArealTab />}
                            {activeSection === 'assign-cutting' && <AssignCuttingTab />}
                            {activeSection === 'cutting-assigns' && <CuttingAssignsTab />}
                        </div>
                    </div>
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
