'use client';

import React from 'react';

export interface AssemblyBomMaterial {
  id?: number;
  name?: string;
  type?: string;
  code_name?: string | null;
}

export interface AssemblyBomRow {
  id: number;
  amount?: string | number | null;
  width?: string | number | null;
  height?: string | number | null;
  released?: boolean;
  material: number | AssemblyBomMaterial;
}

interface AssemblyBomListProps {
  boms?: AssemblyBomRow[] | null;
  className?: string;
}

function materialOf(bom: AssemblyBomRow): AssemblyBomMaterial | null {
  if (bom.material && typeof bom.material === 'object') {
    return bom.material;
  }
  return null;
}

/** Compact L/P BOM list for assembly cards (areal excluded). */
export default function AssemblyBomList({ boms, className = '' }: AssemblyBomListProps) {
  const rows = (boms || []).filter((bom) => {
    const mat = materialOf(bom);
    return mat?.type === 'L' || mat?.type === 'P';
  });

  if (rows.length === 0) return null;

  return (
    <div className={`mt-3 ${className}`}>
      <h4 className="text-sm font-medium text-[#111827] dark:text-[#F1F5F9] mb-2">
        Materials (L / P)
      </h4>
      <ul className="border border-[#E5E7EB] dark:border-[#334155] rounded-xl divide-y divide-[#E5E7EB] dark:divide-[#334155] overflow-hidden">
        {rows.map((bom) => {
          const mat = materialOf(bom)!;
          const unit = mat.type === 'L' ? 'm' : 'pcs';
          const released = !!bom.released;
          return (
            <li
              key={bom.id}
              className="flex items-start justify-between gap-3 px-3 py-2 bg-white dark:bg-[#1E293B]"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#111827] dark:text-[#F1F5F9] truncate">
                  {mat.name || `Material #${mat.id}`}
                  {mat.code_name ? (
                    <span className="ml-1 text-[#6B7280] dark:text-[#94A3B8] font-normal">
                      ({mat.code_name})
                    </span>
                  ) : null}
                </p>
                <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
                  {bom.amount ?? 0} {unit}
                  <span className="ml-2 text-xs uppercase tracking-wide">{mat.type}</span>
                </p>
              </div>
              <span
                className={`shrink-0 text-xs font-medium px-2 py-1 rounded-lg ${
                  released
                    ? 'bg-green-100 dark:bg-green-900/30 text-[#16A34A] dark:text-[#22C55E]'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-[#F59E0B]'
                }`}
              >
                {released ? 'Released' : 'Not released'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
