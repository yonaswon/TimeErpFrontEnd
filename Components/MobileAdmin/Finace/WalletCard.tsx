import { Wallet } from '@/types/finance'
import { Wallet as WalletIcon, TrendingUp } from 'lucide-react'

interface WalletCardProps {
  index: number
  wallets: Wallet[]
  loading: boolean
}

export const WalletCard = ({ index, wallets, loading }: WalletCardProps) => {
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance)
    if (num >= 1000000) {
      return `Birr ${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `Birr ${(num / 1000).toFixed(1)}K`
    }
    return `Birr ${num.toFixed(0)}`
  }

  // Calculate total across all wallets
  const getTotalBalance = () => {
    if (!wallets.length) return '0'
    const total = wallets.reduce((sum, wallet) => {
      return sum + parseFloat(wallet.invoice_balance) + parseFloat(wallet.non_invoice_balance)
    }, 0)
    return total.toString()
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-gray-200 dark:border-zinc-700 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 dark:bg-zinc-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-2/3"></div>
      </div>
    )
  }

  // Total Balance Card (3rd card)
  if (index === 2) {
    const totalBalance = getTotalBalance()
    return (
      <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
        {/* Wallet Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Total Assets</h3>
            <p className="text-blue-100 text-sm">Combined Balance</p>
          </div>
        </div>

        {/* Total Balance */}
        <div className="mb-4">
          <div className="text-3xl font-bold">
            {formatBalance(totalBalance)}
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex gap-4 text-sm">
          <div>
            <div className="text-blue-100">Across {wallets.length} Wallets</div>
            <div className="font-semibold text-white">
              All Funds
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Individual Wallet Cards (1st and 2nd)
  const wallet = wallets[index]
  if (!wallet) return null

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-gray-200 dark:border-zinc-700 shadow-sm">
      {/* Wallet Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl ${
          wallet.name.includes('Admin') 
            ? 'bg-purple-100 dark:bg-purple-900/30' 
            : 'bg-blue-100 dark:bg-blue-900/30'
        }`}>
          <WalletIcon className={`w-5 h-5 ${
            wallet.name.includes('Admin')
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-blue-600 dark:text-blue-400'
          }`} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {wallet.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Balance
          </p>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-3">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatBalance(
            (parseFloat(wallet.invoice_balance) + parseFloat(wallet.non_invoice_balance)).toString()
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="flex gap-4 text-sm">
        <div>
          <div className="text-gray-500 dark:text-gray-400">Invoice</div>
          <div className="font-semibold text-green-600 dark:text-green-400">
            {formatBalance(wallet.invoice_balance)}
          </div>
        </div>
        <div>
          <div className="text-gray-500 dark:text-gray-400">Non-Invoice</div>
          <div className="font-semibold text-blue-600 dark:text-blue-400">
            {formatBalance(wallet.non_invoice_balance)}
          </div>
        </div>
      </div>
    </div>
  )
}