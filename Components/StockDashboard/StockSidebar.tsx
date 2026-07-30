'use client';

import { Package, Warehouse, ClipboardList, LogOut, Menu } from 'lucide-react';

export type StockSection = 'materials' | 'inventories' | 'orders';
export type StockDashboardVariant = 'stock' | 'workshop';

interface StockSidebarProps {
    active: StockSection;
    onChange: (section: StockSection) => void;
    collapsed: boolean;
    open: boolean;
    onToggleCollapse: () => void;
    variant?: StockDashboardVariant;
}

const STOCK_ITEMS: Array<{ id: StockSection; label: string; Icon: typeof Package }> = [
    { id: 'materials', label: 'Materials', Icon: Package },
    { id: 'inventories', label: 'Inventories', Icon: Warehouse },
    { id: 'orders', label: 'Orders', Icon: ClipboardList },
];

const WORKSHOP_ITEMS: Array<{ id: StockSection; label: string; Icon: typeof Package }> = [
    { id: 'inventories', label: 'Inventories', Icon: Warehouse },
    { id: 'orders', label: 'Orders', Icon: ClipboardList },
];

export default function StockSidebar({
    active,
    onChange,
    collapsed,
    open,
    onToggleCollapse,
    variant = 'stock',
}: StockSidebarProps) {
    const items = variant === 'workshop' ? WORKSHOP_ITEMS : STOCK_ITEMS;
    const brand = variant === 'workshop' ? 'Time Workshop' : 'Time Stock';
    const letter = variant === 'workshop' ? 'W' : 'S';

    return (
        <aside className={`stock-sidebar ${collapsed ? 'collapsed' : ''} ${open ? 'open' : ''}`}>
            <h2 className="stock-brand" onClick={onToggleCollapse} title="Toggle sidebar">
                <span>{letter}</span>
                {!collapsed && brand}
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
