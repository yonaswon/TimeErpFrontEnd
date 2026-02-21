'use client';
import React, { useState } from 'react';
import { Package, Layers, Grid3X3, Box } from 'lucide-react';
import MaterialsList from './MaterialsTab/MaterialsList';
import LandPRecordsList from './LandPRecordsTab/LandPRecordsList';
import ArealRecordsList from './ArealTab/ArealRecordsList';
import EachArealMaterialsList from './ArealTab/EachArealMaterialsList';

type TabId = 'materials' | 'landp' | 'areal' | 'each-areal';

const tabs = [
    { id: 'materials' as TabId, label: 'Materials', icon: Package },
    { id: 'landp' as TabId, label: 'L&P Records', icon: Layers },
    { id: 'areal' as TabId, label: 'Areal Records', icon: Grid3X3 },
    { id: 'each-areal' as TabId, label: 'Each Areal', icon: Box },
];

export default function StockRecord() {
    const [activeTab, setActiveTab] = useState<TabId>('materials');

    const renderContent = () => {
        switch (activeTab) {
            case 'materials':
                return <MaterialsList />;
            case 'landp':
                return <LandPRecordsList />;
            case 'areal':
                return <ArealRecordsList />;
            case 'each-areal':
                return <EachArealMaterialsList />;
            default:
                return <MaterialsList />;
        }
    };

    return (
        <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${isActive
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                                    : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {renderContent()}
        </div>
    );
}
