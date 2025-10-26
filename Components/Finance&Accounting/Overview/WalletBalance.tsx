import { Wallet } from '@/types/finance'
import { DollarSign, Receipt, Zap } from 'lucide-react'

interface WalletBalanceProps {
  wallet: Wallet
  loading?: boolean
}

export const WalletBalance = ({ wallet, loading }: WalletBalanceProps) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-zinc-800/50">
        <div className="animate-pulse space-y-4">
          <div className="h-7 bg-gray-200 dark:bg-zinc-800 rounded w-32"></div>
          <div className="flex gap-4">
            <div className="flex-1 h-12 bg-gray-200 dark:bg-zinc-800 rounded-xl"></div>
            <div className="flex-1 h-12 bg-gray-200 dark:bg-zinc-800 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance)
    if (isNaN(num)) return '0 Birr'
    return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Birr`
  }

  const totalBalance = parseFloat(wallet.invoice_balance) + parseFloat(wallet.non_invoice_balance)

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-zinc-800/50">
      {/* Total Balance Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <DollarSign className="w-5 h-5" />
          <span className="text-sm font-semibold">Total Balance</span>
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatBalance(totalBalance.toString())}
        </div>
      </div>

      {/* Balance Breakdown */}
      <div className="flex gap-4">
        <div className="flex-1 text-center p-3 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-800/50">
          <Receipt className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto mb-2" />
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Invoice</div>
          <div className="text-base font-semibold text-gray-900 dark:text-white">
            {formatBalance(wallet.invoice_balance)}
          </div>
        </div>
        
        <div className="flex-1 text-center p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
          <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Non-Invoice</div>
          <div className="text-base font-semibold text-gray-900 dark:text-white">
            {formatBalance(wallet.non_invoice_balance)}
          </div>
        </div>
      </div>
    </div>
  )
}