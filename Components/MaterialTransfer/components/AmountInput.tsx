import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Material, Inventory } from '../types';

interface AmountInputProps {
  material: Material;
  fromInventory: Inventory;
  onConfirm: (amount: string) => void;
  onBack: () => void;
}
export const AmountInput: React.FC<AmountInputProps> = ({
  material,
  fromInventory,
  onConfirm,
  onBack
}) => {
  // Add this check at the start
  if (!fromInventory) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 dark:text-red-400 mb-4">Source inventory not found</div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }
  const [amount, setAmount] = React.useState('');
  const [error, setError] = React.useState('');

  // Get available amount in the from inventory
  const getAvailableInInventory = (material: Material, inventoryName: string) => {
    const distribution = material.stats.inventory_distribution;
    
    if (Array.isArray(distribution)) {
      const inv = distribution.find((d: any) => d.inventory__name === inventoryName);
      return inv ? inv.unstarted : 0;
    } else if (typeof distribution === 'object') {
      return distribution[inventoryName] || 0;
    }
    
    return 0;
  };

  const available = getAvailableInInventory(material, fromInventory.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > available) {
      setError(`Amount cannot exceed available ${available}`);
      return;
    }

    onConfirm(amount);
  };

  const getUnit = () => {
    switch (material.type) {
      case 'L': return 'meters';
      case 'P': return 'pieces';
      default: return 'units';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Enter Amount
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            How much {material.name} to transfer?
          </p>
        </div>
      </div>

      {/* Material Info */}
      <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500 dark:text-gray-400">Material</div>
            <div className="font-medium text-gray-900 dark:text-white">{material.name}</div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">Available</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {available} {getUnit()}
            </div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">Type</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {material.type === 'L' ? 'Length' : material.type === 'P' ? 'Piece' : 'Areal'}
            </div>
          </div>
          {material.code_name && (
            <div>
              <div className="text-gray-500 dark:text-gray-400">Code</div>
              <div className="font-medium text-gray-900 dark:text-white">{material.code_name}</div>
            </div>
          )}
        </div>
      </div>

      {/* Amount Input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount to Transfer ({getUnit()})
          </label>
          <input
            id="amount"
            type="number"
            step="0.001"
            min="0"
            max={available}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError('');
            }}
            placeholder={`Enter amount (max ${available})`}
            className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Quick Select Buttons */}
        {available > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">Quick select:</div>
            <div className="flex flex-wrap gap-2">
              {[available * 0.25, available * 0.5, available * 0.75, available].map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => {
                    const roundedAmount = Math.floor(quickAmount * 1000) / 1000; // Round to 3 decimal places
                    setAmount(roundedAmount.toString());
                    setError('');
                  }}
                  className="px-3 py-2 text-sm bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
                >
                  {Math.floor(quickAmount * 1000) / 1000}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > available}
          className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Transfer {amount || 0} {getUnit()}
        </button>
      </form>
    </div>
  );
};