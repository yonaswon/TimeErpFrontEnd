import React, { useState } from 'react';
import { Package, Clock, ArrowLeftRight } from 'lucide-react';
import { ReleaseRequests } from './ReleaseRequests';
import { ReleaseHistory } from './ReleaseHistory';
import { TransfersList } from './TransfersList';

export const ReleaseManager = () => {
    const [activeTab, setActiveTab] = useState<'requests' | 'history' | 'transfers'>('requests');

    const tabs = [
        { key: 'requests' as const, label: 'Pending Requests', icon: Package },
        { key: 'history' as const, label: 'Release History', icon: Clock },
        { key: 'transfers' as const, label: 'Transfers', icon: ArrowLeftRight },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-zinc-900 w-full mb-20 md:mb-0">
            {/* Top Navigation Bar / Tabs */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-700">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex space-x-4 overflow-x-auto no-scrollbar">
                        {tabs.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === key
                                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 w-full max-w-6xl mx-auto pt-6">
                {activeTab === 'requests' && <ReleaseRequests />}
                {activeTab === 'history' && <ReleaseHistory />}
                {activeTab === 'transfers' && <TransfersList />}
            </div>
        </div>
    );
};
