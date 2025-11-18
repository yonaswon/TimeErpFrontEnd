// components/OrderContainersList.tsx
import { useState, useEffect } from 'react';
import { OrderContainerCard } from './OrderContainerCard';
import { Search, Filter, Loader } from 'lucide-react';
import api from '@/api';

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: any[];
}

export const OrderContainersList = () => {
  const [containers, setContainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrderContainers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ApiResponse>('/api/order-container/');
      setContainers(response.data.results);
    } catch (err: any) {
      console.error('Error fetching order containers:', err);
      setError(err.response?.data?.error || 'Failed to load order containers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderContainers();
  }, []);

  const filteredContainers = containers.filter(container =>
    container.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    container.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    container.contact.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading order containers...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Containers</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage and track all order containers
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {containers.length} Containers
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by client, location, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-red-700 dark:text-red-300">{error}</span>
              <button
                onClick={fetchOrderContainers}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Order Containers Grid */}
        {filteredContainers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Search className="w-16 h-16 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No order containers found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search terms' : 'No order containers available'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredContainers.map((container) => (
              <OrderContainerCard key={container.id} container={container} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};