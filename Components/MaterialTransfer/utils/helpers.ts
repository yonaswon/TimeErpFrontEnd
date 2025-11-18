import { Material, Inventory } from '../types';

export const getAvailableInInventory = (material: Material, inventoryName: string): number => {
  const distribution = material.stats.inventory_distribution;
  
  if (Array.isArray(distribution)) {
    const inv = distribution.find((d: any) => d.inventory__name === inventoryName);
    return inv ? inv.unstarted : 0;
  } else if (typeof distribution === 'object') {
    return distribution[inventoryName] || 0;
  }
  
  return 0;
};

export const getMaterialUnit = (materialType: string): string => {
  switch (materialType) {
    case 'L': return 'meters';
    case 'P': return 'pieces';
    case 'A': return 'pieces';
    default: return 'units';
  }
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};