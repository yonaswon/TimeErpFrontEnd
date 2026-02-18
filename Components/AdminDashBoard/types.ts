export interface DashboardData {
    orders: {
        total_containers: number;
        total_orders: number;
        status_distribution: Record<string, number>;
        orders_per_day: Array<{ day: string; count: number }>;
        difficulty_distribution: Record<string, number>;
        financials: {
            total_revenue: number;
            total_advance: number;
            total_remaining: number;
            avg_order_value: number;
        };
    };
    sales: {
        total_leads: number;
        lead_status_counts: Record<string, number>;
        conversion_rate: number;
        leads_per_salesperson: Array<any>;
        total_mockups: number;
        mockup_status_counts: Record<string, number>;
        mockups_per_designer: Array<any>;
        total_modifications: number;
    };
    production: {
        cnc: Record<string, number>;
        assembly: Record<string, number>;
        delivery: Record<string, number>;
        maintenance: {
            status_counts: Record<string, number>;
            warranty: number;
            non_warranty: number;
        };
    };
    finance: {
        payment_by_reason: Array<{ reason: string; count: number; total: number }>;
        payment_by_status: Array<{ status: string; count: number; total: number }>;
        total_confirmed: number;
        total_pending: number;
        purchases: {
            total: number;
            in_progress: number;
            done: number;
            cancelled: number;
            total_amount: number;
            recent_list: Array<{
                id: number;
                total_amount: number;
                status: string;
                date: string;
                created_by__username: string;
            }>;
        };
        pity_costs: {
            total: number;
            by_category: Array<{ category__name: string; count: number; total: number }>;
        };
        wallets: Array<{ id: number; name: string; invoice_balance: number; non_invoice_balance: number }>;
    };
    releases: {
        by_reason: Array<{ reason: string; count: number; total_amount: number }>;
    };
    stock: {
        total_materials: number;
        materials_by_type: Record<string, number>;
        materials_by_label: Record<string, number>;
        low_stock_count: number;
        low_stock_materials: Array<{
            id: number; name: string; type: string; lable: string;
            available: number; min_threshold: number;
        }>;
        inventories: Array<any>;
        bom: {
            total: number; released: number; unreleased: number;
            total_estimated_cost: number; total_actual_cost: number;
        };
    };
    team: {
        total_users: number;
        roles: Array<{ id: number; Name: string; user_count: number }>;
    };
    design_types: Array<{ id: number; name: string; order_count: number }>;
}

export interface Filters {
    date_from: string;
    date_to: string;
    posted_by: string;
    order_difficulty: string;
    order_status: string;
    design_type: string;
}
