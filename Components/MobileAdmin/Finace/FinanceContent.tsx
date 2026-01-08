"use client";

import { useState, useEffect } from "react";
import api from "@/api";
import { Wallet, TabType } from "@/types/finance";
import { WalletCarousel } from "./WalletCarousel";
import { FinanceNavigation } from "./FinanceNavigation";
import { TabContent } from "./TabContent";
import { AlertCircle } from "lucide-react";

const FinanceContent = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("payments");

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/finance/wallet/");
      // Handle both array and paginated response formats
      const walletsData = response.data.results || response.data || [];
      setWallets(walletsData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch wallet data");
      console.error("Error fetching wallets:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-4">
      {/* Wallet Cards Carousel */}
      <WalletCarousel wallets={wallets} loading={loading} />

      {/* Error State */}
      {error && !loading && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300">
                Failed to load wallets
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={fetchWallets}
                className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Wallets State */}
      {!loading && !error && wallets.length === 0 && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl p-4 text-center">
          <p className="text-yellow-800 dark:text-yellow-300">
            No wallets found
          </p>
        </div>
      )}

      {/* Bottom Navigation Tabs */}
      <FinanceNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <TabContent activeTab={activeTab} />
    </div>
  );
};

export default FinanceContent;
