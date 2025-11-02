'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Wallet } from '@/types/finance'
import { WalletCard } from './WalletCard'

interface WalletCarouselProps {
  wallets: Wallet[]
  loading: boolean
}

export const WalletCarousel = ({ wallets, loading }: WalletCarouselProps) => {
  const [activeCard, setActiveCard] = useState(0)

  const nextCard = () => {
    setActiveCard((prev) => (prev + 1) % 3) // 3 cards total
  }

  const prevCard = () => {
    setActiveCard((prev) => (prev - 1 + 3) % 3) // 3 cards total
  }

  return (
    <div className="mb-6">
      <div className="relative">
        {/* Cards Container */}
        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${activeCard * 100}%)` }}
          >
            {/* Render 3 cards: 2 wallets + 1 total */}
            {[0, 1, 2].map((index) => (
              <div key={index} className="shrink-0 w-full pr-4">
                <WalletCard 
                  index={index}
                  wallets={wallets}
                  loading={loading}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        {!loading && wallets.length > 0 && (
          <>
            <button
              onClick={prevCard}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-zinc-800/80 rounded-full shadow-lg border border-gray-200 dark:border-zinc-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextCard}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-zinc-800/80 rounded-full shadow-lg border border-gray-200 dark:border-zinc-700"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator - Always show 3 dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            onClick={() => setActiveCard(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === activeCard
                ? 'bg-blue-500 w-6'
                : 'bg-gray-300 dark:bg-zinc-600'
            }`}
          />
        ))}
      </div>
    </div>
  )
}