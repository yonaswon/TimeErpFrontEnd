/** Shared cutting-file material display helper (stock / old / outside). */

export type CuttingMaterialKind = 'stock' | 'old' | 'outside' | 'unknown';

export interface CuttingMaterialSource {
  on?: {
    material_name?: string;
    code?: number | string;
    current_width?: string;
    current_height?: string;
  } | null;
  old_material?: { id?: number; name?: string } | null;
  old_material_number?: string | null;
  is_outside_material?: boolean;
}

export function cuttingFileMaterialLabel(file: CuttingMaterialSource): {
  text: string;
  kind: CuttingMaterialKind;
} {
  if (file.on) {
    const name = file.on.material_name || 'Material';
    const code = file.on.code != null ? String(file.on.code) : '';
    return {
      text: code ? `${name} - ${code}` : name,
      kind: 'stock',
    };
  }

  if (file.is_outside_material && file.old_material) {
    const name = file.old_material.name || 'Material';
    const note = (file.old_material_number || '').trim();
    return {
      text: note ? `${name} (${note})` : name,
      kind: 'outside',
    };
  }

  if (file.old_material) {
    const name = file.old_material.name || 'Material';
    const num = file.old_material_number || 'N/A';
    return {
      text: `${name} - ${num}`,
      kind: 'old',
    };
  }

  return { text: 'Unknown Material', kind: 'unknown' };
}
