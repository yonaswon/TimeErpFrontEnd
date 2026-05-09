'use client';
import { OtpLogin } from '@/Components/AuthComponents/OtpLogin';

export default function FinanceLoginPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 transition-colors duration-300 flex items-center justify-center p-4">
            <OtpLogin client="finance" />
        </div>
    );
}
