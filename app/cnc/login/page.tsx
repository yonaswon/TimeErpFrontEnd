'use client';

import { OtpLogin } from '@/Components/AuthComponents/OtpLogin';

export default function CncLoginPage() {
    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ background: 'linear-gradient(135deg, #E8EEF5, #DDE5F0, #E4E0EC)' }}
        >
            <OtpLogin client="cnc" />
        </div>
    );
}
