export type MaterialPick = {
    id: number;
    name: string;
    type: string;
    bom: boolean;
    released: boolean;
};

export type OrderFiltersState = {
    withMaterials: MaterialPick[];
    withoutMaterials: MaterialPick[];
    assemblyTeam: number[];
    assemblyStatus: string[];
    orderStatus: string[];
    dateMode: 'none' | 'single' | 'range';
    date: string;
    dateFrom: string;
    dateTo: string;
    special: 'all' | 'unreleased_bom_assembly_done';
};

export const emptyOrderFilters = (): OrderFiltersState => ({
    withMaterials: [],
    withoutMaterials: [],
    assemblyTeam: [],
    assemblyStatus: [],
    orderStatus: [],
    dateMode: 'none',
    date: '',
    dateFrom: '',
    dateTo: '',
    special: 'all',
});

export function countActiveFilters(f: OrderFiltersState): number {
    let n = 0;
    if (f.withMaterials.length) n += 1;
    if (f.withoutMaterials.length) n += 1;
    if (f.assemblyTeam.length) n += 1;
    if (f.assemblyStatus.length) n += 1;
    if (f.orderStatus.length) n += 1;
    if (f.dateMode === 'single' && f.date) n += 1;
    if (f.dateMode === 'range' && (f.dateFrom || f.dateTo)) n += 1;
    if (f.special !== 'all') n += 1;
    return n;
}

export function filtersToParams(f: OrderFiltersState): Record<string, string> {
    const params: Record<string, string> = {};
    if (f.withMaterials.length) {
        params.with_materials = JSON.stringify(
            f.withMaterials.map((m) => ({
                id: m.id,
                bom: m.bom,
                released: m.released,
            }))
        );
    }
    if (f.withoutMaterials.length) {
        params.without_materials = JSON.stringify(
            f.withoutMaterials.map((m) => ({
                id: m.id,
                bom: m.bom,
                released: m.released,
            }))
        );
    }
    if (f.assemblyTeam.length) params.assembly_team = f.assemblyTeam.join(',');
    if (f.assemblyStatus.length) params.assembly_status = f.assemblyStatus.join(',');
    if (f.orderStatus.length) params.order_status = f.orderStatus.join(',');
    if (f.dateMode === 'single' && f.date) params.date = f.date;
    if (f.dateMode === 'range') {
        if (f.dateFrom) params.date_from = f.dateFrom;
        if (f.dateTo) params.date_to = f.dateTo;
    }
    if (f.special !== 'all') params.special = f.special;
    return params;
}

export type OrderRow = {
    order_code: number;
    order_name: string | null;
    order_status: string;
    order_status_display: string;
    assembly_status: 'not_started' | 'started' | 'completed';
    created_at: string | null;
    status_date: string | null;
    assembly_team: Array<{ id: number; username: string | null }>;
    bom_count: number;
    released_bom_count: number;
    unreleased_bom_count: number;
    has_unreleased_bom: boolean;
    client: string | null;
    location: string | null;
};

export type FilterOptions = {
    materials: Array<{ id: number; name: string; type: string; type_display: string }>;
    assembly_team: Array<{ id: number; username: string | null }>;
    order_statuses: Array<{ value: string; label: string }>;
    assembly_statuses: Array<{ value: string; label: string }>;
    special_options: Array<{ value: string; label: string }>;
};
