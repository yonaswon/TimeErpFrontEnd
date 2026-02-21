'use client';
import React from 'react';
import {
    LayoutDashboard,
    ShoppingCart,
    Factory,
    TrendingUp,
    DollarSign,
    Package,
    Bot,
    ClipboardList
} from 'lucide-react';

interface AdminSidebarProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const sections = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'sales', label: 'Sales & Leads', icon: TrendingUp },
    { id: 'production', label: 'Production', icon: Factory },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'stock-records', label: 'Stock Records', icon: ClipboardList },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
];

export default function AdminSidebar({ activeSection, onSectionChange, isOpen, setIsOpen }: AdminSidebarProps) {
    return (
        <aside className={`admin-sidebar ${!isOpen ? 'collapsed' : ''}`}>
            <div className="admin-sidebar-logo">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    {!isOpen ? (
                        <h2 onClick={() => setIsOpen(!isOpen)} style={{ paddingLeft: '4px', cursor: 'pointer', margin: 0 }}><span>T</span></h2>
                    ) : (
                        <h2 onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer', margin: 0 }}><span>T</span> Time Admin</h2>
                    )}
                    {isOpen && (
                        <button className="admin-mobile-close-btn" onClick={() => setIsOpen(false)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    )}
                </div>
            </div>
            <nav className="admin-sidebar-nav">
                {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <button
                            key={section.id}
                            className={`admin-sidebar-item ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => onSectionChange(section.id)}
                            title={!isOpen ? section.label : undefined}
                        >
                            <Icon />
                            {isOpen && section.label}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
