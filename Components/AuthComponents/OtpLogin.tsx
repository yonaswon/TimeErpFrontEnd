'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/api'

type OtpClient = 'web' | 'finance'

interface OtpLoginProps {
    client?: OtpClient
}

export const OtpLogin = ({ client = 'web' }: OtpLoginProps) => {
    const [step, setStep] = useState<1 | 2>(1)
    const [username, setUsername] = useState('')
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const isFinance = client === 'finance'
    const title = isFinance ? 'Finance & Accounting' : 'Admin'

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!username.startsWith('@')) {
            setError('Username must start with @')
            return
        }
        setLoading(true)
        setError(null)
        try {
            await api.post('/core/request-otp/', { username, client })
            setStep(2)
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to request OTP')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!otp) {
            setError('OTP is required')
            return
        }
        setLoading(true)
        setError(null)
        try {
            const response = await api.post('/core/verify-otp/', { username, otp, client })
            if (response.data.access && response.data.user) {
                localStorage.setItem('access_token', response.data.access)
                localStorage.setItem('user_data', JSON.stringify(response.data.user))
                // Route based on client
                if (isFinance) {
                    router.push('/finance')
                } else {
                    router.push('/admin')
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to verify OTP')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md p-4 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-center gap-3 mb-6">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                    style={{ background: isFinance ? '#7C3AED' : '#2563EB' }}
                >
                    {isFinance ? 'F' : 'A'}
                </div>
                <div>
                    <h2 className="text-[18px] font-bold text-gray-900 dark:text-gray-100">
                        {title} Login
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {step === 1 ? 'Enter your Telegram username' : 'Check Telegram for your code'}
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm text-center">
                    {error}
                </div>
            )}

            {step === 1 ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Telegram Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="@username"
                            className="w-full h-[44px] px-4 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-[#0F172A] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
                            style={{ '--tw-ring-color': isFinance ? '#7C3AED' : '#2563EB' } as React.CSSProperties}
                            disabled={loading}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-[44px] disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                        style={{ background: isFinance ? '#7C3AED' : '#2563EB' }}
                    >
                        {loading ? 'Sending...' : 'Request OTP'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            6-Digit Code
                        </label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter code"
                            className="w-full h-[44px] px-4 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-[#0F172A] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 text-center tracking-widest text-lg"
                            disabled={loading}
                            maxLength={6}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-[44px] disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                        style={{ background: isFinance ? '#7C3AED' : '#2563EB' }}
                    >
                        {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        disabled={loading}
                        className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                        Back
                    </button>
                </form>
            )}
        </div>
    )
}
