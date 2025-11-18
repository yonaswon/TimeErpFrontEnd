import React from 'react';
import { EachArealMaterial } from '../types';

interface ArealMaterialCardProps {
  material: EachArealMaterial;
  isSelected: boolean;
  onSelect: (material: EachArealMaterial) => void;
}

export const ArealMaterialCard: React.FC<ArealMaterialCardProps> = ({
  material,
  isSelected,
  onSelect
}) => {
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
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {material.material_name} - #{material.code}
            </h3>
          </div>
          
          <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Size: {material.current_width}×{material.current_height}</span>
            <span>•</span>
            <span className={!material.started ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
              {material.started ? 'Started' : 'Unstarted'}
            </span>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Added: {new Date(material.date).toLocaleDateString()}
          </div>
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