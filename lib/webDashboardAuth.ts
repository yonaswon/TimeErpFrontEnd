export const ADMIN_ROLE = 'Admin';
export const FINANCE_ROLE = 'Finance&Accounting';
export const WEB_DASHBOARD_ROLE_KEY = 'web_dashboard_role';

export type WebDashboardChoice = 'admin' | 'finance';

export interface UserRole {
    id: number;
    Name: string;
}

export interface WebUserData {
    telegram_user_name?: string;
    role?: UserRole[];
}

export interface WebDashboardRoles {
    isAdmin: boolean;
    isFinance: boolean;
    isDual: boolean;
}

export function getWebDashboardRoles(user: WebUserData | null): WebDashboardRoles {
    const roles = user?.role ?? [];
    const isAdmin = roles.some((r) => r.Name === ADMIN_ROLE);
    const isFinance = roles.some((r) => r.Name === FINANCE_ROLE);
    return { isAdmin, isFinance, isDual: isAdmin && isFinance };
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
    if (value === 'admin' || value === 'finance') return value;
    return null;
}

export function setWebDashboardChoice(choice: WebDashboardChoice): void {
    localStorage.setItem(WEB_DASHBOARD_ROLE_KEY, choice);
}

export function clearWebDashboardChoice(): void {
    localStorage.removeItem(WEB_DASHBOARD_ROLE_KEY);
}

export function resolveWebDashboardPath(choice: WebDashboardChoice): '/admin' | '/finance' {
    return choice === 'admin' ? '/admin' : '/finance';
}

/** Route a user after OTP or when resolving which dashboard they may access. */
export function resolvePostLoginRoute(user: WebUserData): '/admin' | '/finance' | 'picker' {
    const { isAdmin, isFinance, isDual } = getWebDashboardRoles(user);
    if (isDual) return 'picker';
    if (isAdmin) return '/admin';
    if (isFinance) return '/finance';
    return '/admin';
}

export function applyWebDashboardChoice(choice: WebDashboardChoice): '/admin' | '/finance' {
    setWebDashboardChoice(choice);
    return resolveWebDashboardPath(choice);
}
