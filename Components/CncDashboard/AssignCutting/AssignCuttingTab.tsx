'use client';

import { AssignCuttingOverlay } from '@/Components/WorkShopSuperVisorApp/Tasks/AssignCutting/AssignCuttingOverlay';

export default function AssignCuttingTab() {
    return (
        <div className="cnc-desktop-wrap">
            <AssignCuttingOverlay embedded />
        </div>
    );
}
