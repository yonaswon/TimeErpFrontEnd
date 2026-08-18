export const ADMIN_ROLE = 'Admin';
export const FINANCE_ROLE = 'Finance&Accounting';
export const STOCK_ROLE = 'Stock Manager';
export const WORKSHOP_ROLE = 'WorkshopSupervisor';
export const CNC_OPERATOR_ROLE = 'CNC_OPEREATOR';
export const GRAPHIC_DESIGNER_ROLE = 'Graphic Designer';
export const WEB_DASHBOARD_ROLE_KEY = 'web_dashboard_role';

export type WebDashboardChoice = 'admin' | 'finance' | 'stock' | 'workshop' | 'cnc';

export type WebDashboardPath = '/admin' | '/finance' | '/stock' | '/workshop' | '/cnc';

export interface UserRole {
    id: number;
    Name: string;
}

export interface WebUserData {
    telegram_user_name?: string;
    role?: UserRole[];
    id?: number;
}

export interface WebDashboardRoles {
    isAdmin: boolean;
    isFinance: boolean;
    isStock: boolean;
    isWorkshop: boolean;
    isCnc: boolean;
    /** Admin + Finance (finance desktop also requires admin on the backend) */
    isDualAdminFinance: boolean;
    availableChoices: WebDashboardChoice[];
}

export function getWebDashboardRoles(user: WebUserData | null): WebDashboardRoles {
    const roles = user?.role ?? [];
    const isAdmin = roles.some((r) => r.Name === ADMIN_ROLE);
    const isFinance = roles.some((r) => r.Name === FINANCE_ROLE);
    const isStock = roles.some((r) => r.Name === STOCK_ROLE);
    const isWorkshop = roles.some((r) => r.Name === WORKSHOP_ROLE);
    const isCnc = roles.some(
        (r) =>
            r.Name === CNC_OPERATOR_ROLE ||
            r.Name === GRAPHIC_DESIGNER_ROLE ||
            r.Name === WORKSHOP_ROLE
    );

    const availableChoices: WebDashboardChoice[] = [];
    if (isAdmin) availableChoices.push('admin');
    // Finance desktop requires Admin + Finance&Accounting
    if (isAdmin && isFinance) availableChoices.push('finance');
    if (isStock) availableChoices.push('stock');
    if (isWorkshop) availableChoices.push('workshop');
    if (isCnc) availableChoices.push('cnc');

    return {
        isAdmin,
        isFinance,
        isStock,
        isWorkshop,
        isCnc,
        isDualAdminFinance: isAdmin && isFinance,
        availableChoices,
    };
}

export function parseUserData(): WebUserData | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('user_data');
    if (!raw) return null;
    try {
        return JSON.parse(raw) as WebUserData;
    } catch {
        return null;
    }
}

export function getWebDashboardChoice(): WebDashboardChoice | null {
    if (typeof window === 'undefined') return null;
    const value = localStorage.getItem(WEB_DASHBOARD_ROLE_KEY);
    if (
        value === 'admin' ||
        value === 'finance' ||
        value === 'stock' ||
        value === 'workshop' ||
        value === 'cnc'
    ) {
        return value;
    }
    return null;
}

export function setWebDashboardChoice(choice: WebDashboardChoice): void {
    localStorage.setItem(WEB_DASHBOARD_ROLE_KEY, choice);
}

export function clearWebDashboardChoice(): void {
    localStorage.removeItem(WEB_DASHBOARD_ROLE_KEY);
}

export function resolveWebDashboardPath(choice: WebDashboardChoice): WebDashboardPath {
    if (choice === 'admin') return '/admin';
    if (choice === 'finance') return '/finance';
    if (choice === 'workshop') return '/workshop';
    if (choice === 'cnc') return '/cnc';
    return '/stock';
}

/**
 * Route a user after OTP or when resolving which dashboard they may access.
 * Returns 'picker' when more than one desktop dashboard is available.
 */
export function resolvePostLoginRoute(
    user: WebUserData
): WebDashboardPath | 'picker' | 'denied' {
    const { availableChoices } = getWebDashboardRoles(user);
    if (availableChoices.length === 0) return 'denied';
    if (availableChoices.length > 1) return 'picker';
    return resolveWebDashboardPath(availableChoices[0]);
}

export function applyWebDashboardChoice(choice: WebDashboardChoice): WebDashboardPath {
    setWebDashboardChoice(choice);
    return resolveWebDashboardPath(choice);
}

/** Map a path returned by resolvePostLoginRoute to a dashboard choice. */
export function pathToWebDashboardChoice(path: WebDashboardPath): WebDashboardChoice {
    if (path === '/admin') return 'admin';
    if (path === '/finance') return 'finance';
    if (path === '/workshop') return 'workshop';
    if (path === '/cnc') return 'cnc';
    return 'stock';
}
