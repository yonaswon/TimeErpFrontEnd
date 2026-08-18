import {
    CNC_OPERATOR_ROLE,
    GRAPHIC_DESIGNER_ROLE,
    WORKSHOP_ROLE,
    type UserRole,
} from '@/lib/webDashboardAuth';

export type CncSection =
    | 'overview'
    | 'tasks'
    | 'manufacturing'
    | 'areal'
    | 'assign-cutting'
    | 'cutting-assigns';

export const CNC_SECTION_META: Record<
    CncSection,
    { label: string; subtitle: string }
> = {
    overview: {
        label: 'Overview',
        subtitle: "Here's what's happening on your CNC line today",
    },
    tasks: {
        label: 'Tasks',
        subtitle: 'Assigned, started, and completed cutting tasks',
    },
    manufacturing: {
        label: 'Manufacturing',
        subtitle: 'Cutting files, Search & Fit, and DXF orders',
    },
    areal: {
        label: 'Areal',
        subtitle: 'Areal materials, sheets, and cutting timelines',
    },
    'assign-cutting': {
        label: 'Assign Cutting',
        subtitle: 'Assign unassigned cutting files to CNC operators',
    },
    'cutting-assigns': {
        label: 'Cutting Assigns',
        subtitle: 'Latest cutting assignments and edits',
    },
};

const SECTION_ORDER: CncSection[] = [
    'overview',
    'tasks',
    'manufacturing',
    'areal',
    'assign-cutting',
    'cutting-assigns',
];

export function getCncSections(roles: UserRole[]): CncSection[] {
    const names = new Set(roles.map((r) => r.Name));
    const allowed = new Set<CncSection>();

    if (names.has(CNC_OPERATOR_ROLE)) {
        allowed.add('overview');
        allowed.add('tasks');
    }
    if (names.has(GRAPHIC_DESIGNER_ROLE)) {
        allowed.add('manufacturing');
        allowed.add('areal');
    }
    if (names.has(WORKSHOP_ROLE)) {
        allowed.add('assign-cutting');
        allowed.add('cutting-assigns');
    }

    return SECTION_ORDER.filter((s) => allowed.has(s));
}

export function getDefaultCncSection(roles: UserRole[]): CncSection | null {
    const sections = getCncSections(roles);
    return sections[0] ?? null;
}
