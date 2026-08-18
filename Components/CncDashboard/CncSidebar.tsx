'use client';

import {
    ClipboardList,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    Scissors,
    UserPlus,
    Layers,
} from 'lucide-react';
import type { CncSection } from './cncSections';
import { CNC_SECTION_META } from './cncSections';

interface CncSidebarProps {
    sections: CncSection[];
    active: CncSection;
    onChange: (section: CncSection) => void;
    collapsed: boolean;
    open: boolean;
    onToggleCollapse: () => void;
}

const ICONS: Record<CncSection, typeof LayoutDashboard> = {
    overview: LayoutDashboard,
    tasks: ClipboardList,
    manufacturing: Scissors,
    areal: Layers,
    'assign-cutting': UserPlus,
    'cutting-assigns': Package,
};

export default function CncSidebar({
    sections,
    active,
    onChange,
    collapsed,
    open,
    onToggleCollapse,
}: CncSidebarProps) {
    return (
        <aside className={`stock-sidebar ${collapsed ? 'collapsed' : ''} ${open ? 'open' : ''}`}>
            <h2 className="stock-brand" onClick={onToggleCollapse} title="Toggle sidebar">
                <span>C</span>
                {!collapsed && 'Time CNC'}
            </h2>
            <nav>
                {sections.map((id) => {
                    const isActive = active === id;
                    const Icon = ICONS[id];
                    const label = CNC_SECTION_META[id].label;
                    return (
                        <button
                            key={id}
                            type="button"
                            className={`stock-nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => onChange(id)}
                            title={collapsed ? label : undefined}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <Icon size={18} />
                            {!collapsed && <span>{label}</span>}
                        </button>
                    );
                })}
            </nav>
            <div className="stock-sidebar-spacer" />
        </aside>
    );
}

export function CncHamburger({ onClick }: { onClick: () => void }) {
    return (
        <button type="button" className="stock-hamburger" onClick={onClick} aria-label="Open menu">
            <Menu size={20} />
        </button>
    );
}

export function CncLogoutButton({ onClick }: { onClick: () => void }) {
    return (
        <button type="button" className="stock-icon-btn" onClick={onClick} title="Logout">
            <LogOut size={15} />
            Logout
        </button>
    );
}
