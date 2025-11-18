import React from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { TransferState } from '../types';
import { useTransfer } from '../hooks/useTransfer';

interface ConfirmationStepProps {
  transferState: TransferState;
  onSubmit: () => void;
  onBack: () => void;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  transferState,
  onSubmit,
  onBack
}) => {
  const { loading, error, createArealTransfer, createLandPTransfer } = useTransfer();
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { fromInventory, toInventory, selectedMaterials, selectedArealMaterials, amount } = transferState;
      
      if (selectedMaterials[0].type === 'A') {
        await createArealTransfer(
          fromInventory!.id,
          toInventory!.id,
          selectedArealMaterials.map(m => m.id)
        );
      } else {
        await createLandPTransfer(
          fromInventory!.id,
          toInventory!.id,
          selectedMaterials[0].id,
          parseFloat(amount)
        );
      }
      
      onSubmit();
    } catch (err) {
      // Error handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMaterial = transferState.selectedMaterials[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          disabled={submitting}
          className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Confirm Transfer
          </h3>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500 dark:text-gray-400">From</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {transferState.fromInventory?.name}
            </div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">To</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {transferState.toInventory?.name}
            </div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">Material</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {selectedMaterial.name}
            </div>
          </div>
        </div>

        {selectedMaterial.type === 'A' ? (
          <div>
            <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">
              {transferState.selectedArealMaterials.length} pieces
            </div>
          </div>
        ) : (
          <div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">Amount</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {transferState.amount} {selectedMaterial.type === 'L' ? 'meters' : 'pieces'}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center space-x-2"
      >
        {submitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Transferring...</span>
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            <span>Confirm Transfer</span>
          </>
        )}
      </button>
    </div>
  );
};