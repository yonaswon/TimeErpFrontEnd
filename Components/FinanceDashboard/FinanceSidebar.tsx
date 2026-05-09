'use client';
import React from 'react';
import { CalendarCheck } from 'lucide-react';

interface FinanceSidebarProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

const sections = [
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    // More tabs can be added here later
];

export default function FinanceSidebar({
    activeSection, onSectionChange, isOpen, setIsOpen,
}: FinanceSidebarProps) {
    return (
        <aside className={`admin-sidebar ${!isOpen ? 'collapsed' : ''}`}>
            <div className="admin-sidebar-logo">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    {!isOpen ? (
                        <h2
                            onClick={() => setIsOpen(true)}
                            style={{ paddingLeft: '4px', cursor: 'pointer', margin: 0 }}
                        >
                            <span>F</span>
                        </h2>
                    ) : (
                        <h2
                            onClick={() => setIsOpen(false)}
                            style={{ cursor: 'pointer', margin: 0 }}
                        >
                            <span>F</span> Finance
                        </h2>
                    )}
                    {isOpen && (
                        <button
                            className="admin-mobile-close-btn"
                            onClick={() => setIsOpen(false)}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
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
