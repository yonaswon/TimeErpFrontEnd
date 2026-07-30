'use client';

import MaterialMultiSelect from './MaterialMultiSelect';
import type { FilterOptions, OrderFiltersState } from './orderTypes';

interface Props {
    open: boolean;
    draft: OrderFiltersState;
    options: FilterOptions | null;
    onChange: (next: OrderFiltersState) => void;
    onApply: () => void;
    onClear: () => void;
    onClose: () => void;
}

function toggleInList(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function toggleId(list: number[], id: number): number[] {
    return list.includes(id) ? list.filter((v) => v !== id) : [...list, id];
}

export default function OrdersFilters({
    open,
    draft,
    options,
    onChange,
    onApply,
    onClear,
    onClose,
}: Props) {
    if (!open) return null;

    const set = (partial: Partial<OrderFiltersState>) => onChange({ ...draft, ...partial });

    return (
        <div className="stock-order-filters">
            <div className="stock-order-filters-head">
                <h3>Filters</h3>
                <button type="button" className="stock-back-btn" onClick={onClose}>
                    Close
                </button>
            </div>

            <div className="stock-order-filters-grid">
                <MaterialMultiSelect
                    label="With materials"
                    options={options?.materials || []}
                    value={draft.withMaterials}
                    onChange={(withMaterials) => set({ withMaterials })}
                />
                <MaterialMultiSelect
                    label="Without materials"
                    options={options?.materials || []}
                    value={draft.withoutMaterials}
                    onChange={(withoutMaterials) => set({ withoutMaterials })}
                />

                <div className="stock-order-filter-block">
                    <div className="stock-order-filter-label">Assembly team</div>
                    <div className="stock-order-pill-row">
                        {(options?.assembly_team || []).map((u) => {
                            const active = draft.assemblyTeam.includes(u.id);
                            return (
                                <button
                                    key={u.id}
                                    type="button"
                                    className={`stock-order-pill ${active ? 'active' : ''}`}
                                    onClick={() =>
                                        set({ assemblyTeam: toggleId(draft.assemblyTeam, u.id) })
                                    }
                                >
                                    @{String(u.username || u.id).replace(/^@/, '')}
                                </button>
                            );
                        })}
                        {!options?.assembly_team?.length && (
                            <span className="stock-detail-meta">No team members found</span>
                        )}
                    </div>
                </div>

                <div className="stock-order-filter-block">
                    <div className="stock-order-filter-label">Assembly status</div>
                    <div className="stock-order-pill-row">
                        {(options?.assembly_statuses || []).map((s) => {
                            const active = draft.assemblyStatus.includes(s.value);
                            return (
                                <button
                                    key={s.value}
                                    type="button"
                                    className={`stock-order-pill ${active ? 'active' : ''}`}
                                    onClick={() =>
                                        set({
                                            assemblyStatus: toggleInList(
                                                draft.assemblyStatus,
                                                s.value
                                            ),
                                        })
                                    }
                                >
                                    {s.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="stock-order-filter-block">
                    <div className="stock-order-filter-label">Order status</div>
                    <div className="stock-order-pill-row wrap">
                        {(options?.order_statuses || []).map((s) => {
                            const active = draft.orderStatus.includes(s.value);
                            return (
                                <button
                                    key={s.value}
                                    type="button"
                                    className={`stock-order-pill ${active ? 'active' : ''}`}
                                    onClick={() =>
                                        set({
                                            orderStatus: toggleInList(draft.orderStatus, s.value),
                                        })
                                    }
                                >
                                    {s.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="stock-order-filter-block">
                    <div className="stock-order-filter-label">Date</div>
                    <div className="stock-order-pill-row">
                        {(
                            [
                                ['none', 'Any'],
                                ['single', 'Specific day'],
                                ['range', 'Range'],
                            ] as const
                        ).map(([mode, label]) => (
                            <button
                                key={mode}
                                type="button"
                                className={`stock-order-pill ${draft.dateMode === mode ? 'active' : ''}`}
                                onClick={() => set({ dateMode: mode })}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {draft.dateMode === 'single' && (
                        <input
                            type="date"
                            className="stock-search"
                            style={{ marginTop: 8 }}
                            value={draft.date}
                            onChange={(e) => set({ date: e.target.value })}
                        />
                    )}
                    {draft.dateMode === 'range' && (
                        <div className="stock-order-date-range">
                            <input
                                type="date"
                                className="stock-search"
                                value={draft.dateFrom}
                                onChange={(e) => set({ dateFrom: e.target.value })}
                            />
                            <span>to</span>
                            <input
                                type="date"
                                className="stock-search"
                                value={draft.dateTo}
                                onChange={(e) => set({ dateTo: e.target.value })}
                            />
                        </div>
                    )}
                </div>

                <div className="stock-order-filter-block">
                    <div className="stock-order-filter-label">Special</div>
                    <div className="stock-order-pill-row">
                        {(options?.special_options || []).map((s) => (
                            <button
                                key={s.value}
                                type="button"
                                className={`stock-order-pill ${draft.special === s.value ? 'active' : ''}`}
                                onClick={() =>
                                    set({
                                        special: s.value as OrderFiltersState['special'],
                                    })
                                }
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="stock-order-filters-actions">
                <button type="button" className="stock-load-more" onClick={onClear}>
                    Clear
                </button>
                <button type="button" className="stock-order-apply" onClick={onApply}>
                    Apply filters
                </button>
            </div>
        </div>
    );
}
