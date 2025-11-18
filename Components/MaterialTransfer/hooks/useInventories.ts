import { useState, useEffect } from 'react';
import { Inventory } from '../types';
import api from '@/api';

export const useInventories = () => {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Inventory[]>('/inventories/');
      setInventories(response.data);
    } catch (err) {
      setError('Failed to fetch inventories');
      console.error('Error fetching inventories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventories();
  }, []);

  return {
    inventories,
    loading,
    error,
    refetch: fetchInventories
  };
};