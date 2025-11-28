'use client'
import { useState, useEffect } from 'react'
import { X, Search, Loader2, Package, ChevronDown, User, Phone } from 'lucide-react'
import api from '@/api'
import { Order, OrdersResponse } from './maintenance'

interface Lead {
  id: number;
  name: string;
  status: string;
  customer_name: string;
  customer_phonenumber: string;
  customer_telegram: string;
  note: string | null;
  created_at: string;
  converted_at: string | null;
  mark_cold_at: string | null;
  sales: number;
}

interface OrderSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (order: Order, clientInfo: { name: string; contact: string }) => void;
}

export const OrderSearchOverlay: React.FC<OrderSearchOverlayProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [loadingLeads, setLoadingLeads] = useState<{ [key: number]: boolean }>({});
  const [leadData, setLeadData] = useState<{ [key: number]: Lead }>({});

  // Fetch lead information
  const fetchLeadInfo = async (leadId: number, orderCode: number) => {
    setLoadingLeads(prev => ({ ...prev, [orderCode]: true }));
    
    try {
      const response = await api.get<Lead>(`/lead/leads/${leadId}/`);
      setLeadData(prev => ({ ...prev, [orderCode]: response.data }));
    } catch (err) {
      console.error(`Error fetching lead ${leadId}:`, err);
      // Don't set error here to avoid blocking the UI
    } finally {
      setLoadingLeads(prev => ({ ...prev, [orderCode]: false }));
    }
  };

  // Get lead ID from order
  const getLeadIdFromOrder = (order: Order): number | null => {
    if (order.mockup?.lead) {
      return order.mockup.lead;
    }
    if (order.mockup_modification?.lead) {
      return order.mockup_modification.lead;
    }
    return null;
  };

  // Get mockup name from order
  const getMockupName = (order: Order): string => {
    if (order.mockup?.name) {
      return order.mockup.name;
    }
    if (order.mockup_modification?.name) {
      return order.mockup_modification.name;
    }
    return 'No mockup name';
  };

  // Search orders
  const searchOrders = async (query: string, loadMore = false) => {
    if (!loadMore) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const url = loadMore ? nextPage : `/api/orders/?search=${encodeURIComponent(query)}`;
      const response = await api.get<OrdersResponse>(url!);
      
      const newOrders = loadMore ? [...orders, ...response.data.results] : response.data.results;
      setOrders(newOrders);
      setNextPage(response.data.next);

      // Fetch lead information for new orders
      newOrders.forEach(order => {
        const leadId = getLeadIdFromOrder(order);
        if (leadId && !leadData[order.order_code]) {
          fetchLeadInfo(leadId, order.order_code);
        }
      });
    } catch (err: any) {
      console.error('Error searching orders:', err);
      setError(err.response?.data?.message || 'Failed to search orders');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      searchOrders(searchTerm.trim());
    }
  };

  const handleLoadMore = () => {
    if (nextPage && !loadingMore) {
      searchOrders(searchTerm, true);
    }
  };

  const handleSelectOrder = (order: Order) => {
    const leadId = getLeadIdFromOrder(order);
    const lead = leadId ? leadData[order.order_code] : null;
    
    const clientInfo = {
      name: lead?.customer_name || order.client_name || '',
      contact: lead?.customer_phonenumber || order.client_contact || ''
    };

    onSelect(order, clientInfo);
    onClose();
  };

  // Get display info for order
  const getOrderDisplayInfo = (order: Order) => {
    const leadId = getLeadIdFromOrder(order);
    const lead = leadId ? leadData[order.order_code] : null;
    const isLoadingLead = loadingLeads[order.order_code];

    return {
      clientName: lead?.customer_name || order.client_name || 'No client name',
      clientContact: lead?.customer_phonenumber || order.client_contact || 'No contact',
      mockupName: getMockupName(order),
      isLoadingLead
    };
  };

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setOrders([]);
      setError(null);
      setNextPage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Search Orders</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Find and select an order</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Form */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by order code, client name, mockup name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchTerm.trim()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-96">
          {error && (
            <div className="p-4 text-center">
              <p className="text-red-500 dark:text-red-400">{error}</p>
            </div>
          )}

          {!loading && orders.length === 0 && searchTerm && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No orders found</p>
            </div>
          )}

          {orders.map((order) => {
            const { clientName, clientContact, mockupName, isLoadingLead } = getOrderDisplayInfo(order);
            
            return (
              <div
                key={order.order_code}
                onClick={() => handleSelectOrder(order)}
                className="p-4 border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Order #{order.order_code}
                      </h3>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                        {order.order_status}
                      </span>
                    </div>
                    
                    {/* Mockup Name */}
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {mockupName}
                    </p>

                    {/* Client Information */}
                    <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <User className="w-3 h-3" />
                        <span>{clientName}</span>
                        {isLoadingLead && (
                          <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3 h-3" />
                        <span>{clientContact}</span>
                      </div>
                    </div>

                    {/* Order Date */}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      Created: {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <ChevronDown className="w-5 h-5 text-gray-400 transform -rotate-90 shrink-0 ml-4" />
                </div>
              </div>
            );
          })}

          {loadingMore && (
            <div className="p-4 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
            </div>
          )}

          {nextPage && !loadingMore && (
            <div className="p-4">
              <button
                onClick={handleLoadMore}
                className="w-full py-2 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-gray-600 dark:text-gray-400"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};