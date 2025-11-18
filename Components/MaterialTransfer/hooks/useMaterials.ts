import { useState, useEffect } from 'react';
import { Material, PaginatedResponse } from '../types';
import api from '@/api';

export const useMaterials = (inventoryId?: number) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);

  const fetchMaterials = async (url?: string) => {
    try {
      if (!url) setLoading(true);
      setError(null);
      
      const response = await api.get<PaginatedResponse<Material>>(
        url || '/materials/'
      );
      
      if (url) {
        // Append for load more
        setMaterials(prev => [...prev, ...response.data.results]);
      } else {
        // Replace for initial load
        setMaterials(response.data.results);
      }
      
      setNextPage(response.data.next);
    } catch (err) {
      setError('Failed to fetch materials');
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (nextPage) {
      fetchMaterials(nextPage);
    }
  };

  useEffect(() => {
    if (inventoryId) {
      fetchMaterials();
    }
  }, [inventoryId]);

  // Filter materials that are available in the from inventory
  const getAvailableInInventory = (material: Material, inventoryName: string) => {
    const distribution = material.stats.inventory_distribution;
    
    if (Array.isArray(distribution)) {
      // Areal material
      const inv = distribution.find((d: any) => d.inventory__name === inventoryName);
      return inv ? inv.unstarted : 0;
    } else if (typeof distribution === 'object') {
      // Length material
      return distribution[inventoryName] || 0;
    }
    
    return 0;
  };

  return {
    materials,
    loading,
    error,
    nextPage,
    fetchMaterials,
    loadMore,
    getAvailableInInventory
  };
};