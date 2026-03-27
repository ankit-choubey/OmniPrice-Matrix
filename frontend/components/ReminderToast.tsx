"use client";
import { motion } from "framer-motion";
import { AlertCircle, ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ReminderHit {
  query: string;
  targetPrice: number;
  currentPrices: { [store: string]: number | null };
  lowestStore: string;
  lowestPrice: number;
}

interface ReminderToastProps {
  hit: ReminderHit | null;
  onDismiss?: () => void;
}

export default function ReminderToast({ hit, onDismiss }: ReminderToastProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (hit) {
      setDismissed(false);
    }
  }, [hit]);

  if (!hit || dismissed) return null;

  const storeLinks = {
    amazon: `https://www.amazon.in/s?k=${encodeURIComponent(hit.query)}`,
    flipkart: `https://www.flipkart.com/search?q=${encodeURIComponent(hit.query)}`,
    myntra: `https://www.myntra.com/search/${encodeURIComponent(hit.query)}`,
    croma: `https://www.croma.com/search/?q=${encodeURIComponent(hit.query)}`,
    swiggy: `https://www.swiggy.com/search?query=${encodeURIComponent(hit.query)}`,
    zomato: `https://www.zomato.com/search?q=${encodeURIComponent(hit.query)}`,
    instamart: `https://instamart.swiggy.com/search?query=${encodeURIComponent(hit.query)}`,
    zepto: `https://www.zepto.com/search?query=${encodeURIComponent(hit.query)}`,
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Filter valid prices
  const validPrices = Object.entries(hit.currentPrices).filter(
    ([_, price]) => price !== null && price > 0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="fixed bottom-4 left-4 bg-gradient-to-br from-matrixGreen/10 to-matrixGreen/5 border border-matrixGreen rounded-xl p-4 max-w-md z-50 shadow-lg"
    >
      {/* Close Button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-500 hover:text-white transition"
      >
        <X size={18} />
      </button>

      {/* Content */}
      <div className="flex gap-3 pr-8">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex-shrink-0 text-2xl"
        >
          🎯
        </motion.div>

        <div className="flex-1">
          <h4 className="font-bold text-white text-sm mb-1">
            🎉 Price Target Hit!
          </h4>
          <p className="text-gray-300 text-xs mb-3">
            <span className="font-mono text-matrixGreen">{hit.query}</span> is
            now ₹{hit.lowestPrice.toLocaleString("en-IN")}
          </p>

          {/* Price List */}
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-2">Available at:</p>
            <div className="flex flex-wrap gap-2">
              {validPrices.map(([store, price]) => (
                <a
                  key={store}
                  href={
                    storeLinks[store as keyof typeof storeLinks] ||
                    "javascript:void(0)"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs px-2 py-1 rounded font-semibold transition flex items-center gap-1 ${
                    store === hit.lowestStore
                      ? "bg-matrixGreen text-black hover:bg-white"
                      : "bg-matrixGreen/30 text-matrixGreen hover:bg-matrixGreen/50"
                  }`}
                >
                  <span className="capitalize">{store}</span>
                  <span className="font-bold">₹{price?.toLocaleString("en-IN")}</span>
                  <ExternalLink size={11} />
                </a>
              ))}
            </div>
          </div>

          {/* Savings Info */}
          {hit.lowestPrice < hit.targetPrice && (
            <div className="bg-matrixGreen/20 border border-matrixGreen rounded px-2 py-1">
              <p className="text-xs text-matrixGreen font-semibold">
                ✨ Saved ₹
                {(hit.targetPrice - hit.lowestPrice).toLocaleString("en-IN")}
                from your target!
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
