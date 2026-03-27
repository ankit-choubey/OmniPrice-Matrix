"use client";
import { motion } from "framer-motion";
import { AlertTriangle, Clock, TrendingUp } from "lucide-react";

interface WaitVsBuyCardProps {
  action: "BUY_NOW" | "WAIT" | "UNCERTAIN";
  confidence: number;
  reason: string;
  expectedDrop: number;
  daysToWait: number;
  trend: "rising" | "falling" | "stable";
}

export default function WaitVsBuyCard({
  action,
  confidence,
  reason,
  expectedDrop,
  daysToWait,
  trend,
}: WaitVsBuyCardProps) {
  const actionConfig = {
    BUY_NOW: {
      bg: "bg-red-500/10",
      border: "border-red-500",
      icon: AlertTriangle,
      label: "🔴 BUY NOW",
      color: "text-red-400",
      iconColor: "text-red-500",
    },
    WAIT: {
      bg: "bg-green-500/10",
      border: "border-green-500",
      icon: Clock,
      label: "🟢 WAIT",
      color: "text-green-400",
      iconColor: "text-green-500",
    },
    UNCERTAIN: {
      bg: "bg-orange-500/10",
      border: "border-orange-500",
      icon: TrendingUp,
      label: "🟠 MAYBE",
      color: "text-orange-400",
      iconColor: "text-orange-500",
    },
  };

  const cfg = actionConfig[action];
  const Icon = cfg.icon;

  const trendEmoji =
    trend === "rising" ? "📈" : trend === "falling" ? "📉" : "➡️";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${cfg.bg} border ${cfg.border} rounded-xl p-4 backdrop-blur-sm`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`${cfg.iconColor} w-5 h-5`} />
        <span className={`font-bold text-lg ${cfg.color}`}>{cfg.label}</span>
      </div>

      {/* Reason */}
      <p className="text-gray-300 text-sm mb-4">{reason}</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Confidence */}
        <div className="bg-[#111111]/50 rounded-lg p-2 border border-borderline">
          <p className="text-gray-500 text-xs">Confidence</p>
          <p className="text-matrixGreen font-bold text-sm">{confidence}%</p>
        </div>

        {/* Expected Drop */}
        <div className="bg-[#111111]/50 rounded-lg p-2 border border-borderline">
          <p className="text-gray-500 text-xs">Expected Change</p>
          <p
            className={`${expectedDrop < 0 ? "text-green-400" : "text-red-400"} font-bold text-sm`}
          >
            {expectedDrop > 0 ? "+" : ""}
            {expectedDrop}%
          </p>
        </div>

        {/* Trend */}
        <div className="bg-[#111111]/50 rounded-lg p-2 border border-borderline">
          <p className="text-gray-500 text-xs">Trend</p>
          <p className="text-matrixGreen font-bold text-sm">
            {trendEmoji} {trend}
          </p>
        </div>

        {/* Days to Wait */}
        <div className="bg-[#111111]/50 rounded-lg p-2 border border-borderline">
          <p className="text-gray-500 text-xs">Wait Time</p>
          <p className="text-matrixGreen font-bold text-sm">
            {daysToWait} days
          </p>
        </div>
      </div>

      {/* Action Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full py-2 rounded-lg font-semibold text-xs text-white transition ${
          action === "BUY_NOW"
            ? "bg-red-600 hover:bg-red-700"
            : action === "WAIT"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-orange-600 hover:bg-orange-700"
        }`}
      >
        {action === "BUY_NOW"
          ? "🛒 Buy Now from Lowest Store"
          : action === "WAIT"
            ? "⏰ Set Reminder & Wait"
            : "🤔 Get More Data"}
      </motion.button>
    </motion.div>
  );
}
