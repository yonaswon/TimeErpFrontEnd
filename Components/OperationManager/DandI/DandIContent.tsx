import { useState } from 'react';
import { Truck, Package, Clock, CheckCircle } from 'lucide-react';
import AssignDandIContent from './AssignDandIContent';
import AllTasksContent from './AllTasksContent';

type TabFilter = 'assign' | 'pending' | 'started' | 'completed';

const DandIContent = () => {
    const [activeTab, setActiveTab] = useState<TabFilter>('assign');

    const tabs: { id: TabFilter; label: string; icon: any }[] = [
        { id: 'assign', label: 'Assign', icon: Truck },
        { id: 'pending', label: 'Pending', icon: Package },
        { id: 'started', label: 'Started', icon: Clock },
        { id: 'completed', label: 'Completed', icon: CheckCircle },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'assign':
                return <AssignDandIContent />;
            case 'pending':
                return <AllTasksContent key="pending" filterStatus="ASSIGNED" />;
            case 'started':
                return <AllTasksContent key="started" filterStatus="STARTED" />;
            case 'completed':
                return <AllTasksContent key="completed" filterStatus="COMPLATED" />;
            default:
                return <AssignDandIContent />;
        }
    };

    return (
        <div className="space-y-4 p-4">
            {/* Horizontal Navigation */}
            <div className="bg-white dark:bg-slate-800 rounded-[12px] border border-gray-200 dark:border-slate-700 p-1 hidden-scrollbar overflow-x-auto">
                <div className="flex space-x-1 min-w-max">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-center space-x-2 flex-1 py-2 px-4 rounded-[8px] text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="mt-4">
                {renderContent()}
            </div>
        </div>
    );
};

export default DandIContent;
