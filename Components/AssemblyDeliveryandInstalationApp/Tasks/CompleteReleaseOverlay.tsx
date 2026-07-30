'use client';

import { useState } from 'react';
import { AlertCircle, Package, X } from 'lucide-react';
import api from '@/api';

export interface UnreleasedBomRow {
  id: number;
  material_name: string;
  material_code_name?: string | null;
  type: string;
  amount: number;
  width?: number | null;
  height?: number | null;
  order_code: number;
}

interface CompleteReleaseOverlayProps {
  assemblyId: number;
  unreleasedBoms: UnreleasedBomRow[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function CompleteReleaseOverlay({
  assemblyId,
  unreleasedBoms,
  onClose,
  onSuccess,
}: CompleteReleaseOverlayProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post(`/api/assembly-assign/${assemblyId}/complete/`, {
        confirm_release: true,
      });
      if (res.data?.release_prompt_needed) {
        setError('Release is still required. Please try again.');
        return;
      }
      onSuccess();
    } catch (err: any) {
      const data = err.response?.data;
      setError(data?.error || data?.detail || 'Failed to complete assembly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-[#1E293B] w-full sm:max-w-md sm:rounded-xl rounded-t-xl max-h-[90vh] overflow-y-auto border border-[#E5E7EB] dark:border-[#334155]">
        <div className="sticky top-0 flex items-center justify-between gap-3 p-4 border-b border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20">
              <Package className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#111827] dark:text-[#F1F5F9]">
                Release required
              </h2>
              <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
                Confirm to deduct from your personal stock and complete
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#6B7280] dark:text-[#94A3B8]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-base text-[#111827] dark:text-[#F1F5F9]">
            You must release the following materials before completing:
          </p>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5 text-[#DC2626] dark:text-[#EF4444] shrink-0 mt-0.5" />
              <p className="text-base text-[#DC2626] dark:text-[#EF4444]">{error}</p>
            </div>
          )}

          <ul className="border border-[#E5E7EB] dark:border-[#334155] rounded-xl divide-y divide-[#E5E7EB] dark:divide-[#334155]">
            {unreleasedBoms.map((bom) => {
              const unit = bom.type === 'L' ? 'm' : bom.type === 'P' ? 'pcs' : '';
              return (
                <li key={bom.id} className="px-3 py-3">
                  <p className="text-base font-medium text-[#111827] dark:text-[#F1F5F9]">
                    {bom.material_name}
                    {bom.material_code_name ? (
                      <span className="ml-1 text-[#6B7280] dark:text-[#94A3B8] font-normal">
                        ({bom.material_code_name})
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">
                    ORD-{bom.order_code} · {bom.amount} {unit} · Not released
                  </p>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="sticky bottom-0 flex gap-3 p-4 border-t border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 min-h-[44px] rounded-lg bg-[#E5E7EB] dark:bg-[#334155] text-base font-medium text-[#111827] dark:text-[#F1F5F9]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 min-h-[44px] rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-base font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Releasing…' : 'Confirm & complete'}
          </button>
        </div>
      </div>
    </div>
  );
}
