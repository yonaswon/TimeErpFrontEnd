'use client';
import { OtpLogin } from '@/Components/AuthComponents/OtpLogin';

export default function WorkshopLoginPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#E8EEF5] via-[#DDE5F0] to-[#E4E0EC] flex items-center justify-center p-4">
            <OtpLogin client="workshop" />
        </div>
    );
}
