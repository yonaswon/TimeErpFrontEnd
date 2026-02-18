'use client';
import React, { useState, useEffect } from 'react';
import api from '../../api';
import './AdminDashBoard.css';
import AdminSidebar from './AdminSidebar';
import FilterBar from './FilterBar';
import DashboardOverview from './DashboardOverview';
import OrderTimeline from './OrderTimeline';
import SalesLeadsStats from './SalesLeadsStats';
import ProductionStats from './ProductionStats';
import FinanceStats from './FinanceStats';
import StockOverview from './StockOverview';
import OrderDetailOverlay from './OrderDetailOverlay';
import MaterialDetailOverlay from './MaterialDetailOverlay';
import PurchaseDetailOverlay from './PurchaseDetailOverlay';
import { DashboardData, Filters } from './types';



export default function AdminDashBoard() {
    const [activeSection, setActiveSection] = useState('overview');
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<Filters>({
        date_from: '', date_to: '', posted_by: '',
        order_difficulty: '', order_status: '', design_type: ''
    });
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
    const [selectedPurchase, setSelectedPurchase] = useState<number | null>(null);

    const fetchDashboardData = async (currentFilters: Filters) => {
        try {
            setLoading(true);
            setError('');
            const params: Record<string, string> = {};
            Object.entries(currentFilters).forEach(([key, value]) => {
                if (value) params[key] = value;
            });
            const response = await api.get('/api/admin-dashboard/', { params });
            setData(response.data);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData(filters);
    }, []);

    const handleApplyFilters = (newFilters: Filters) => {
        setFilters(newFilters);
        fetchDashboardData(newFilters);
    };

    const handleResetFilters = () => {
        const emptyFilters: Filters = {
            date_from: '', date_to: '', posted_by: '',
            order_difficulty: '', order_status: '', design_type: ''
        };
        setFilters(emptyFilters);
        fetchDashboardData(emptyFilters);
    };

    const sectionTitles: Record<string, string> = {
        overview: 'Dashboard Overview',
        orders: 'Orders',
        sales: 'Sales & Leads',
        production: 'Production',
        finance: 'Finance',
        stock: 'Stock Management',
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="admin-loading">
                    <div className="admin-spinner" />
                    Loading dashboard data...
                </div>
            );
        }
        if (error) {
            return (
                <div className="admin-loading" style={{ color: 'var(--admin-danger)' }}>
                    {error}
                </div>
            );
        }
        if (!data) return null;

        switch (activeSection) {
            case 'overview':
                return <DashboardOverview data={data} />;
            case 'orders':
                return <OrderTimeline data={data} onSelectOrder={setSelectedOrder} />;
            case 'sales':
                return <SalesLeadsStats data={data} />;
            case 'production':
                return <ProductionStats data={data} />;
            case 'finance':
                return <FinanceStats data={data} onPurchaseClick={setSelectedPurchase} />;
            case 'stock':
                return <StockOverview data={data} onMaterialClick={setSelectedMaterial} />;
            default:
                return <DashboardOverview data={data} />;
        }
    };

    return (
        <div className="admin-dashboard">
            <AdminSidebar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
            />
            <main className="admin-content">
                <div className="admin-content-header">
                    <h1>{sectionTitles[activeSection]}</h1>
                </div>
                <FilterBar
                    filters={filters}
                    onApply={handleApplyFilters}
                    onReset={handleResetFilters}
                    designTypes={data?.design_types || []}
                />
                {renderContent()}
            </main>
            <OrderDetailOverlay
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
            />
            <MaterialDetailOverlay
                materialId={selectedMaterial}
                onClose={() => setSelectedMaterial(null)}
            />
            <PurchaseDetailOverlay
                purchaseId={selectedPurchase}
                onClose={() => setSelectedPurchase(null)}
            />
        </div>
    );
}
