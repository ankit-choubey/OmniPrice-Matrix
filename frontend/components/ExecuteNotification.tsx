"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle } from "lucide-react";

type Phase = "searching" | "extracting" | "analyzing" | "complete";

interface ExecuteNotificationProps {
  isVisible: boolean;
  phase: Phase;
  message: string;
  storeCount?: number;
}

export default function ExecuteNotification({
  isVisible,
  phase,
  message,
  storeCount = 0,
}: ExecuteNotificationProps) {
  const phaseConfig = {
    searching: {
      icon: "🔍",
      label: "Scanning Stores",
      color: "text-blue-400",
    },
    extracting: {
      icon: "🧠",
      label: "Extracting Prices",
      color: "text-yellow-400",
    },
    analyzing: {
      icon: "📊",
      label: "Analyzing Trends",
      color: "text-purple-400",
    },
    complete: {
      icon: "✓",
      label: "Complete",
      color: "text-matrixGreen",
    },
  };

  const config = phaseConfig[phase];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 20, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 20, y: -20 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="fixed top-4 right-4 bg-[#1a1a1a] border border-matrixGreen/30 rounded-lg px-4 py-3 flex items-center gap-3 text-sm z-50 shadow-lg"
        >
          <motion.div
            animate={phase !== "complete" ? { rotate: 360 } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-lg"
          >
            {config.icon}
          </motion.div>

          <div className="flex flex-col">
            <div className={`${config.color} font-semibold text-xs`}>
              {config.label}
            </div>
            <div className="text-gray-400 text-xs">{message}</div>
            {storeCount > 0 && (
              <div className="text-matrixGreen text-xs mt-1">
                {storeCount} stores found
              </div>
            )}
          </div>

          {phase === "complete" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="ml-2"
            >
              <CheckCircle className="text-matrixGreen w-4 h-4" />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
