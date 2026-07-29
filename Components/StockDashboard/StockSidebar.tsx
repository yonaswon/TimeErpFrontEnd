'use client';

import { Package, Warehouse, LogOut, Menu } from 'lucide-react';

export type StockSection = 'materials' | 'inventories';

interface StockSidebarProps {
    active: StockSection;
    onChange: (section: StockSection) => void;
    collapsed: boolean;
    open: boolean;
    onToggleCollapse: () => void;
}

const items: Array<{ id: StockSection; label: string; Icon: typeof Package }> = [
    { id: 'materials', label: 'Materials', Icon: Package },
    { id: 'inventories', label: 'Inventories', Icon: Warehouse },
];

export default function StockSidebar({
    active,
    onChange,
    collapsed,
    open,
    onToggleCollapse,
}: StockSidebarProps) {
    return (
        <aside className={`stock-sidebar ${collapsed ? 'collapsed' : ''} ${open ? 'open' : ''}`}>
            <h2 className="stock-brand" onClick={onToggleCollapse} title="Toggle sidebar">
                <span>S</span>
                {!collapsed && 'Time Stock'}
            </h2>
            <nav>
                {items.map(({ id, label, Icon }) => {
                    const isActive = active === id;
                    return (
                        <button
                            key={id}
                            type="button"
                            className={`stock-nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => onChange(id)}
                            title={collapsed ? label : undefined}
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

export function StockHamburger({ onClick }: { onClick: () => void }) {
    return (
        <button type="button" className="stock-hamburger" onClick={onClick} aria-label="Open menu">
            <Menu size={20} />
        </button>
    );
}

export function StockLogoutButton({ onClick }: { onClick: () => void }) {
    return (
        <button type="button" className="stock-icon-btn" onClick={onClick} title="Logout">
            <LogOut size={15} />
            Logout
        </button>
    );
}
