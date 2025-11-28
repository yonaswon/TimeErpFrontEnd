import React from 'react';
import { Plus } from 'lucide-react';

interface AddMaterialButtonProps {
  onClick: () => void;
  className?: string;
}

export const AddMaterialButton: React.FC<AddMaterialButtonProps> = ({ 
  onClick, 
  className = "" 
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 
        text-white rounded-lg transition-colors focus:outline-none focus:ring-2 
        focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800 
        font-medium ${className}
      `}
    >
      <Plus className="w-4 h-4" />
      Add Material
    </button>
  );
};