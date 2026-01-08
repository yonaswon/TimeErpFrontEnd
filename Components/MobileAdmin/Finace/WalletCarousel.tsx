"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Wallet } from "@/types/finance";
import { WalletCard } from "./WalletCard";

interface WalletCarouselProps {
  wallets: Wallet[];
  loading: boolean;
}

export const WalletCarousel = ({ wallets, loading }: WalletCarouselProps) => {
  const [activeCard, setActiveCard] = useState(0);

  // Total cards = wallets + 1 for total
  const totalCards = wallets.length + 1;

  const nextCard = () => {
    setActiveCard((prev) => (prev + 1) % totalCards);
  };

  const prevCard = () => {
    setActiveCard((prev) => (prev - 1 + totalCards) % totalCards);
  };

  return (
    <div className="mb-6">
      <div className="relative">
        {/* Cards Container */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${activeCard * 100}%)` }}
          >
            {/* Render all wallets */}
            {wallets.map((wallet, index) => (
              <div key={wallet.id} className="shrink-0 w-full pr-4">
                <WalletCard
                  index={index}
                  wallet={wallet}
                  isTotalCard={false}
                  loading={loading}
                  wallets={wallets}
                />
              </div>
            ))}

            {/* Total card */}
            <div key="total" className="shrink-0 w-full pr-4">
              <WalletCard
                index={wallets.length}
                wallet={null}
                isTotalCard={true}
                loading={loading}
                wallets={wallets}
              />
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {!loading && wallets.length > 0 && totalCards > 1 && (
          <>
            <button
              onClick={prevCard}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 transition-colors z-10"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextCard}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 transition-colors z-10"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator - Dynamic based on number of wallets + total */}
      {!loading && wallets.length > 0 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {Array.from({ length: totalCards }).map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveCard(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === activeCard
                  ? "bg-blue-500 w-6"
                  : "bg-gray-300 dark:bg-zinc-600 hover:bg-gray-400 dark:hover:bg-zinc-500"
              }`}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
