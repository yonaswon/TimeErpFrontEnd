'use client';

import { LatestAssigned } from '@/Components/WorkShopSuperVisorApp/Tasks/LatestAssigned';

export default function CuttingAssignsTab() {
    return (
        <div className="cnc-desktop-wrap">
            <LatestAssigned cuttingOnly />
        </div>
    );
}
