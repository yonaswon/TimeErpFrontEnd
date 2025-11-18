import React from 'react';
import { Material, Inventory } from '../types';

interface MaterialCardProps {
  material: Material;
  fromInventory: Inventory;
  isSelected: boolean;
  onSelect: (material: Material) => void;
  getAvailableInInventory: (material: Material, inventoryName: string) => number;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  fromInventory,
  isSelected,
  onSelect,
  getAvailableInInventory
}) => {
  const available = getAvailableInInventory(material, fromInventory.name);

  const getTypeDisplay = (type: string) => {
    const types = {
      'L': 'Length',
      'A': 'Areal', 
      'P': 'Piece'
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <div
      onClick={() => onSelect(material)}
      className={`
        p-4 bg-white dark:bg-zinc-800 border rounded-lg cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600'
        }
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {material.name}
            </h3>
            {material.code_name && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                {material.code_name}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>{getTypeDisplay(material.type)}</span>
            <span>•</span>
            <span className={available > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {available} available
            </span>
            {material.type === 'A' && material.width && material.height && (
              <>
                <span>•</span>
                <span>{material.width}×{material.height}</span>
              </>
            )}
          </div>

          {/* Inventory Distribution */}
          {material.stats.inventory_distribution && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {Array.isArray(material.stats.inventory_distribution) ? (
                <span>
                  📦 {material.stats.inventory_distribution.length} location{material.stats.inventory_distribution.length !== 1 ? 's' : ''}
                </span>
              ) : (
                <span>
                  📍 {Object.keys(material.stats.inventory_distribution).length} location{Object.keys(material.stats.inventory_distribution).length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ml-4 ${
          isSelected 
            ? 'bg-blue-500 border-blue-500' 
            : 'border-gray-300 dark:border-zinc-600'
        }`}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};