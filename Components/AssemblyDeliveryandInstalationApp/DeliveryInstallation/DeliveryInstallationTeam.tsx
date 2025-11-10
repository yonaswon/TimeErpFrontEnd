// Tasks/DeliveryInstallationTeam.tsx
import { useState } from 'react';
import { Truck, Package, CheckCircle } from 'lucide-react';
import { DeliveryAssignedToYou } from './DeliveryAssignedToYou';
import { DeliveryStartedTasks } from './DeliveryStartedTasks';
type TaskFilter = 'assigned' | 'started' | 'completed';

export const DeliveryInstallationTeam = () => {
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('assigned');

  const filters: { id: TaskFilter; label: string }[] = [
    { id: 'assigned', label: 'Assigned to you' },
    { id: 'started', label: 'Started' },
    { id: 'completed', label: 'Completed' },
  ];

  const renderContent = () => {
    switch (activeFilter) {
      case 'assigned':
        return <DeliveryAssignedToYou />;
      case 'started':
        return <DeliveryStartedTasks/>;
      case 'completed':
        return <CompletedTasks />;
      default:
        return <DeliveryAssignedToYou/>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Horizontal Navigation */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-1">
        <div className="flex space-x-1">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeFilter === filter.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

// Completed Tasks Component
const CompletedTasks = () => {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Completed Tasks
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Your completed delivery and installation tasks will appear here.
        </p>
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Features coming soon:
        </div>
        <ul className="text-sm text-gray-500 dark:text-gray-400 mt-2 space-y-1">
          <li>• View delivery history</li>
          <li>• Check completion details</li>
          <li>• Review installation photos</li>
          <li>• Performance analytics</li>
        </ul>
      </div>
    </div>
  );
};