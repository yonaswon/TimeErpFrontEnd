'use client';
import React, { useState } from 'react';
import { LayoutDashboard, CreditCard, Wrench, ShoppingBag, AlertTriangle, Package, Calculator } from 'lucide-react';
import PaymentsTableView from './PaymentsTableView';
import MaintenanceTableView from './MaintenanceTableView';
import PurchaseTableView from './PurchaseTableView';
import PityCostTableView from './PityCostTableView';
import FinanceGeneralTab from './FinanceGeneralTab';
import TaxTableView from './TaxTableView';
import { DashboardData } from './types';

interface Props {
    data?: DashboardData;
    onSelectContainer?: (id: number) => void;
    onSelectOrder?: (order: any) => void;
    onPurchaseClick?: (id: number) => void;
}

const TABS = [
    { id: 'general', label: 'General', icon: LayoutDashboard },
    { id: 'tax', label: 'Tax Calculation', icon: Calculator },
    { id: 'all_payments', label: 'All Payments', icon: CreditCard },
    { id: 'order_payments', label: 'Order Payments', icon: Package },
    { id: 'sales_payments', label: 'Sales Payments', icon: ShoppingBag },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'purchases', label: 'Purchases', icon: ShoppingBag },
    { id: 'pity_costs', label: 'Pity Costs', icon: AlertTriangle },
];

export default function FinanceTablesSection({ data, onSelectContainer, onSelectOrder, onPurchaseClick }: Props) {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <div className="ft-section">
            <div className="ft-tabs">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className={`ft-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon size={15} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="ft-content">
                {activeTab === 'general' && data && (
                    <FinanceGeneralTab
                        data={data}
                        onSelectContainer={onSelectContainer}
                        onSelectOrder={onSelectOrder}
                        onPurchaseClick={onPurchaseClick}
                    />
                )}
                {activeTab === 'tax' && (
                    <TaxTableView
                        onSelectContainer={onSelectContainer}
                        onSelectOrder={onSelectOrder}
                        onPurchaseClick={onPurchaseClick}
                    />
                )}
                {activeTab === 'all_payments' && (
                    <PaymentsTableView
                        onSelectContainer={onSelectContainer}
                        onSelectOrder={onSelectOrder}
                    />
                )}
                {activeTab === 'order_payments' && (
                    <PaymentsTableView
                        source="order"
                        onSelectContainer={onSelectContainer}
                        onSelectOrder={onSelectOrder}
                    />
                )}
                {activeTab === 'sales_payments' && (
                    <PaymentsTableView
                        source="sales"
                        onSelectContainer={onSelectContainer}
                        onSelectOrder={onSelectOrder}
                    />
                )}
                {activeTab === 'maintenance' && (
                    <MaintenanceTableView
                        onSelectOrder={onSelectOrder}
                    />
                )}
                {activeTab === 'purchases' && (
                    <PurchaseTableView
                        onPurchaseClick={onPurchaseClick}
                    />
                )}
                {activeTab === 'pity_costs' && (
                    <PityCostTableView
                        onSelectContainer={onSelectContainer}
                        onPurchaseClick={onPurchaseClick}
                    />
                )}
            </div>
        </div>
    );
}
