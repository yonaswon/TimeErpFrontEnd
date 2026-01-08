import { Wallet } from "@/types/finance";
import { Wallet as WalletIcon, TrendingUp, AlertTriangle } from "lucide-react";

interface WalletCardProps {
  index: number;
  wallet: Wallet | null;
  isTotalCard: boolean;
  wallets: Wallet[];
  loading: boolean;
}

export const WalletCard = ({
  index,
  wallet,
  isTotalCard,
  wallets,
  loading,
}: WalletCardProps) => {
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);

    // Check if balance is negative
    const isNegative = num < 0;
    const absNum = Math.abs(num);

    let formatted;
    if (absNum >= 1000000) {
      formatted = `Birr ${(absNum / 1000000).toFixed(1)}M`;
    } else if (absNum >= 1000) {
      formatted = `Birr ${(absNum / 1000).toFixed(1)}K`;
    } else {
      formatted = `Birr ${absNum.toFixed(0)}`;
    }

    return isNegative ? `-${formatted}` : formatted;
  };

  // Calculate total across all wallets
  const getTotalBalance = () => {
    if (!wallets.length) return "0";
    const total = wallets.reduce((sum, wallet) => {
      return (
        sum +
        parseFloat(wallet.invoice_balance) +
        parseFloat(wallet.non_invoice_balance)
      );
    }, 0);
    return total.toString();
  };

  // Get card styling based on wallet type
  const getCardStyles = () => {
    if (isTotalCard) {
      return "bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg";
    }

    if (!wallet) return "bg-white dark:bg-zinc-800";

    // Check if it's Pity Wallet
    const isPityWallet = wallet.name.toLowerCase().includes("pity");
    const isAdminWallet = wallet.name.toLowerCase().includes("admin");

    if (isPityWallet) {
      // Check if pity wallet has negative balance
      const totalBalance =
        parseFloat(wallet.invoice_balance) +
        parseFloat(wallet.non_invoice_balance);
      const hasNegativeBalance = totalBalance < 0;

      return hasNegativeBalance
        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50"
        : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50";
    }

    if (isAdminWallet) {
      return "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50";
    }

    return "bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700";
  };

  // Get icon styling based on wallet type
  const getIconStyles = () => {
    if (isTotalCard) {
      return "bg-white/20 text-white";
    }

    if (!wallet) return "";

    const isPityWallet = wallet.name.toLowerCase().includes("pity");
    const isAdminWallet = wallet.name.toLowerCase().includes("admin");

    if (isPityWallet) {
      const totalBalance =
        parseFloat(wallet.invoice_balance) +
        parseFloat(wallet.non_invoice_balance);
      const hasNegativeBalance = totalBalance < 0;

      return hasNegativeBalance
        ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400";
    }

    if (isAdminWallet) {
      return "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400";
    }

    return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";
  };

  // Get text color based on balance
  const getBalanceColor = (balance: string) => {
    const num = parseFloat(balance);
    if (num < 0) return "text-red-600 dark:text-red-400";
    if (num > 0) return "text-green-600 dark:text-green-400";
    return "text-gray-900 dark:text-white";
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-gray-200 dark:border-zinc-700 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 dark:bg-zinc-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-2/3"></div>
      </div>
    );
  }

  // Total Balance Card
  if (isTotalCard) {
    const totalBalance = getTotalBalance();
    const totalBalanceNum = parseFloat(totalBalance);

    return (
      <div className={`rounded-2xl p-5 shadow-lg ${getCardStyles()}`}>
        {/* Wallet Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Total Assets</h3>
            <p className="text-blue-100 text-sm opacity-90">Combined Balance</p>
          </div>
        </div>

        {/* Total Balance */}
        <div className="mb-4">
          <div
            className={`text-3xl font-bold ${
              totalBalanceNum < 0 ? "text-red-200" : ""
            }`}
          >
            {formatBalance(totalBalance)}
          </div>
          <p
            className={`text-sm mt-1 ${
              totalBalanceNum < 0 ? "text-red-200" : "text-blue-100 opacity-90"
            }`}
          >
            Across {wallets.length} wallets
          </p>
        </div>

        {/* Breakdown */}
        <div className="text-sm">
          {totalBalanceNum < 0 && (
            <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Overall negative balance detected</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Individual Wallet Cards
  if (!wallet) return null;

  const totalBalance = (
    parseFloat(wallet.invoice_balance) + parseFloat(wallet.non_invoice_balance)
  ).toString();
  const totalBalanceNum = parseFloat(totalBalance);
  const isPityWallet = wallet.name.toLowerCase().includes("pity");
  const isNegativeBalance = totalBalanceNum < 0;

  return (
    <div className={`rounded-2xl p-5 border shadow-sm ${getCardStyles()}`}>
      {/* Wallet Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl ${getIconStyles()}`}>
          {isPityWallet ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <WalletIcon className="w-5 h-5" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {wallet.name}
            {isPityWallet && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-400">
                Pity
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Balance
          </p>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-3">
        <div className={`text-2xl font-bold ${getBalanceColor(totalBalance)}`}>
          {formatBalance(totalBalance)}
        </div>
        {isNegativeBalance && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Negative balance
          </p>
        )}
      </div>

      {/* Breakdown */}
      <div className="flex gap-4 text-sm">
        <div>
          <div className="text-gray-500 dark:text-gray-400">Invoice</div>
          <div
            className={`font-semibold ${getBalanceColor(
              wallet.invoice_balance
            )}`}
          >
            {formatBalance(wallet.invoice_balance)}
          </div>
        </div>
        <div>
          <div className="text-gray-500 dark:text-gray-400">Non-Invoice</div>
          <div
            className={`font-semibold ${getBalanceColor(
              wallet.non_invoice_balance
            )}`}
          >
            {formatBalance(wallet.non_invoice_balance)}
          </div>
        </div>
      </div>
    </div>
  );
};
