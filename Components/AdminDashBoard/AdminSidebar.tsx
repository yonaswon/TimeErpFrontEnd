'use client';
import React from 'react';
import {
    LayoutDashboard,
    ShoppingCart,
    Factory,
    TrendingUp,
    DollarSign,
    Package
} from 'lucide-react';

interface AdminSidebarProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
}

const sections = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'sales', label: 'Sales & Leads', icon: TrendingUp },
    { id: 'production', label: 'Production', icon: Factory },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'stock', label: 'Stock', icon: Package },
];

export default function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
    return (
        <aside className="admin-sidebar">
            <div className="admin-sidebar-logo">
                <h2>
                    <span>T</span>
                    Time Admin
                </h2>
            </div>
            <nav className="admin-sidebar-nav">
                {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <button
                            key={section.id}
                            className={`admin-sidebar-item ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => onSectionChange(section.id)}
                        >
                            <Icon />
                            {section.label}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
