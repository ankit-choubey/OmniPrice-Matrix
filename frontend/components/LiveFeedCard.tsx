"use client";
import { motion } from "framer-motion";
import { ShoppingCart, Zap } from "lucide-react";

interface FeedCardProps {
  store: string;
  price: string;
  isLowest?: boolean;
  time: string;
  delay: number;
}

export default function LiveFeedCard({ store, price, isLowest, time, delay }: FeedCardProps) {
  const numericPrice = Number(price);
  const hasValidPrice = Number.isFinite(numericPrice) && numericPrice > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: "spring", stiffness: 100 }}
      className={`relative p-6 rounded-2xl border backdrop-blur-sm transition-all hover:scale-[1.02] ${
        isLowest ? 'border-matrixGreen bg-matrixGreenDim' : 'border-borderline bg-panel'
      }`}
    >
      {isLowest && (
        <div className="absolute -top-3 right-4 bg-matrixGreen text-black text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_10px_rgba(163,230,53,0.5)] animate-pulse">
          LOWEST
        </div>
      )}
      <div className="flex items-center gap-2 text-gray-400 mb-2">
        <ShoppingCart size={16} />
        <span className="font-semibold uppercase tracking-wider text-sm text-white">{store}</span>
      </div>
      <div className="text-3xl font-bold tracking-tight mb-4 text-white">
        {!hasValidPrice ? <span className="text-amber-400 text-xl">Not available</span> : `₹${price}`}
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500 font-mono">
        <Zap size={12} className={isLowest ? "text-matrixGreen" : "text-gray-500"} />
        Synced: {time}
      </div>
    </motion.div>
  );
}