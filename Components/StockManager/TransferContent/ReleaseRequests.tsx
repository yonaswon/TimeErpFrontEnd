// components/ReleaseRequests.tsx
import { useState, useEffect } from 'react';
import { Package, CheckCircle, AlertCircle, Clock, User, Ruler, Box } from 'lucide-react';
import api from '@/api';

interface Bom {
  id: number;
  material: number;
  amount: string;
  width: string | null;
  height: string | null;
  released: boolean;
  release_date: string | null;
}

interface Material {
  id: number;
  name: string;
  type: 'L' | 'A' | 'P';
  code_name: string;
}

interface Release {
  id: number;
  reason: string;
  material: number;
  material_name: string;
  material_type: 'L' | 'P';
  amount: string;
  proof_image: string | null;
  inventory: number;
  inventory_name: string;
  released_by: number;
  released_by_name: string;
  confirmed: boolean;
  date: string;
}

interface Order {
  order_code: number;
  boms: Bom[];
  releases: Release[];
  order_status: string;
  price: number;
  created_at: string;
  design_type: number;
  mockup?: any;
  mockup_modification?: any;
  cutting_files?: any[];
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}

export const ReleaseRequests = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [success, setSuccess] = useState<number | null>(null);

  const fetchReleaseRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ApiResponse>('/api/orders/?released_not_confirmed=true');
      setOrders(response.data.results);
    } catch (err: any) {
      console.error('Error fetching release requests:', err);
      setError(err.response?.data?.error || 'Failed to load release requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleaseRequests();
  }, []);

  const handleConfirmRelease = async (orderCode: number) => {
    try {
      setConfirming(orderCode);
      setError(null);
      
      await api.post(`/api/orders/${orderCode}/confirm_release/`);
      
      setSuccess(orderCode);
      // Refresh the list after successful confirmation
      setTimeout(() => {
        setSuccess(null);
        fetchReleaseRequests();
      }, 2000);
      
    } catch (err: any) {
      console.error('Error confirming release:', err);
      setError(err.response?.data?.error || 'Failed to confirm release');
    } finally {
      setConfirming(null);
    }
  };

  const getUnconfirmedReleases = (order: Order) => {
    return order.releases.filter(release => 
      release.reason === 'ADD' && !release.confirmed
    );
  };

  const getMaterialIcon = (type: 'L' | 'P') => {
    return type === 'L' ? <Ruler className="w-4 h-4" /> : <Box className="w-4 h-4" />;
  };

  const getUnit = (type: 'L' | 'P') => {
    return type === 'L' ? 'm' : 'pcs';
  };

  const calculateTotalUnconfirmedLength = (order: Order) => {
    return getUnconfirmedReleases(order)
      .filter(release => release.material_type === 'L')
      .reduce((total, release) => total + parseFloat(release.amount), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading release requests...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-red-300">{error}</span>
            </div>
            <button
              onClick={fetchReleaseRequests}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
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
          <div className="flex items-center space-x-3 mb-2">
            <Package className="w-8 h-8 text-yellow-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Release Requests
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Orders with pending additional release confirmations
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Pending Release Requests
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              All additional releases have been confirmed.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const unconfirmedReleases = getUnconfirmedReleases(order);
              const totalLength = calculateTotalUnconfirmedLength(order);
              
              return (
                <div
                  key={order.order_code}
                  className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-700 overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="p-6 border-b border-gray-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Package className="w-5 h-5 text-yellow-600" />
                          <span className="font-semibold text-gray-900 dark:text-white">
                            ORD-{order.order_code}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-medium">
                          {order.order_status.replace('-', ' ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          ETB {order.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Unconfirmed Releases */}
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <span>Pending Release Confirmations</span>
                      <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full text-xs">
                        {unconfirmedReleases.length} items
                      </span>
                    </h3>

                    <div className="space-y-3">
                      {unconfirmedReleases.map((release) => (
                        <div
                          key={release.id}
                          className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            {getMaterialIcon(release.material_type)}
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {release.material_name}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                <span>Amount: {release.amount} {getUnit(release.material_type)}</span>
                                <span>•</span>
                                <span className="flex items-center space-x-1">
                                  <User className="w-3 h-3" />
                                  <span>{release.released_by_name}</span>
                                </span>
                                <span>•</span>
                                <span>{release.inventory_name}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(release.date).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    {totalLength > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-blue-700 dark:text-blue-300 font-medium">
                            Total Length to Confirm:
                          </span>
                          <span className="font-semibold">
                            {totalLength.toFixed(3)}m
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Confirm Button */}
                    <div className="mt-6 flex justify-end">
                      {success === order.order_code ? (
                        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Confirmed Successfully!</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConfirmRelease(order.order_code)}
                          disabled={confirming === order.order_code}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                        >
                          {confirming === order.order_code ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Confirming...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Confirm All Releases</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};