'use client';
import React from 'react';
import { DashboardData } from './types';
import FinanceTablesSection from './FinanceTablesSection';

interface Props {
    data: DashboardData;
    onPurchaseClick: (id: number) => void;
    onSelectContainer?: (id: number) => void;
    onSelectOrder?: (order: any) => void;
}

export default function FinanceStats({ data, onPurchaseClick, onSelectContainer, onSelectOrder }: Props) {
    return (
        <FinanceTablesSection
            data={data}
            onSelectContainer={onSelectContainer}
            onSelectOrder={onSelectOrder}
            onPurchaseClick={onPurchaseClick}
        />
    );
}
