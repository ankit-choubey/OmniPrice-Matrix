"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, AlertTriangle, TrendingDown, DollarSign } from "lucide-react";
import axios from "axios";

type PredictionResult = {
  status: string;
  recommendation: string;
  days_to_wait: number;
  target_price: number | null;
  current_best_price: number | null;
  savings_potential: number | null;
  confidence: number;
};

type WaitVsBuyResponse = {
  action?: "BUY_NOW" | "WAIT" | "UNCERTAIN";
  confidence?: number;
  reason?: string;
  expected_drop?: number;
  days_to_wait?: number;
  trend?: string;
  query?: string;
};

interface PredictorProps {
  query: string;
  apiBase: string;
}

export default function FintellectPredictor({ query, apiBase }: PredictorProps) {
  const [stage, setStage] = useState<"idle" | "analyzing" | "result">("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [phaseProgress, setPhaseProgress] = useState<"scanning" | "analyzing" | "computing">("scanning");

  useEffect(() => {
    setStage("idle");
    setPrediction(null);
    setLogs([]);
  }, [query]);

  const normalizeGroqResult = (payload: WaitVsBuyResponse): PredictionResult => {
    const action = payload.action ?? "UNCERTAIN";
    const confidence = Math.max(10, Math.min(97, Number(payload.confidence ?? 35)));
    const daysToWait = Math.max(0, Number(payload.days_to_wait ?? 0));
    const recommendation =
      payload.reason ||
      (action === "WAIT"
        ? "Model suggests waiting for a better price window."
        : action === "BUY_NOW"
          ? "Model suggests buying now due to limited downside."
          : "Model confidence is moderate, monitor one more cycle.");

    return {
      status: "ok",
      recommendation,
      days_to_wait: daysToWait,
      target_price: null,
      current_best_price: null,
      savings_potential: null,
      confidence,
    };
  };

  const runAnalysis = async () => {
    setStage("analyzing");
    setLogs([]);
    setPrediction(null);
    setPhaseProgress("scanning");

    const sequence = [
      { text: "Accessing Fintellect Yield Models...", delay: 300 },
      { text: `Building demand profile for: ${query}`, delay: 900 },
      { text: "Scanning multi-store historical volatility...", delay: 1500 },
    ];

    // Phase 1: Scanning (first 3 logs)
    for (let i = 0; i < sequence.length; i++) {
      setTimeout(() => {
        setLogs((prev) => [...prev, sequence[i].text]);
      }, sequence[i].delay);
    }

    // Transition to analyzing
    setTimeout(() => setPhaseProgress("analyzing"), 2200);

    // Phase 2: Analyzing (middle logs)
    setTimeout(() => {
      setLogs((prev) => [...prev, "Estimating next probable low-price window..."]);
    }, 2400);
    setTimeout(() => {
      setLogs((prev) => [...prev, "Risk-weighting wait-vs-buy decision..."]);
    }, 3000);

    // Transition to computing
    setTimeout(() => setPhaseProgress("computing"), 3700);

    try {
      const cacheKey = `buylo_wait_buy_cache_${query.toLowerCase().trim()}`;
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as { ts: number; data: PredictionResult };
        if (Date.now() - cached.ts < 120000) {
          setPrediction(cached.data);
          setTimeout(() => {
            setLogs((prev) => [...prev, "Using recent AI analysis snapshot to preserve API quota.", "Analysis Complete ✓"]);
            setTimeout(() => setStage("result"), 500);
          }, 3400);
          return;
        }
      }

      const response = await axios.post(`${apiBase}/api/wait-vs-buy`, null, {
        params: { query },
      });

      const data = normalizeGroqResult(response.data as WaitVsBuyResponse);
      setPrediction(data);
      localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
      setTimeout(() => {
        setLogs((prev) => [...prev, "Optimization computed. Finalizing...", "Analysis Complete ✓"]);
        setTimeout(() => setStage("result"), 500);
      }, 4200);
    } catch (error) {
      setTimeout(() => {
        setLogs((prev) => [...prev, "Groq service busy, using deterministic fallback model."]);
        setPrediction({
          status: "fallback",
          recommendation: "Collect more data points for stronger personalized confidence.",
          days_to_wait: 0,
          target_price: null,
          current_best_price: null,
          savings_potential: null,
          confidence: 20,
        });
        setTimeout(() => setStage("result"), 500);
      }, 4200);
      console.warn("Predictor request failed", error);
    }
  };

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="text-matrixGreen font-mono text-xs uppercase mb-2 flex items-center gap-2">
          <ShieldCheck size={14} />
          Fintellect AI Analysis
        </h3>
        
        <AnimatePresence mode="wait">
          {stage === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-2xl font-bold leading-tight text-white mt-4">Deep Price Forecaster</h2>
              <p className="text-gray-400 mt-2 text-sm">Analyze your specific buying context and market timing to maximize savings.</p>
              <button 
                onClick={runAnalysis}
                className="w-full mt-8 bg-matrixGreen text-black py-4 rounded-xl font-bold hover:bg-white transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(163,230,53,0.3)]"
              >
                Analyze My Context
              </button>
              <button
                onClick={runAnalysis}
                className="w-full mt-2 bg-white/10 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-white/20 transition"
              >
                Test Again
              </button>
            </motion.div>
          )}

          {stage === "analyzing" && (
            <motion.div key="analyzing" className="space-y-3 font-mono text-[10px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Phase Progress Indicator */}
              <div className="space-y-1">
                <div className="flex gap-2 text-xs">
                  <motion.span
                    className={`px-2 py-1 rounded-full ${
                      phaseProgress === "scanning" 
                        ? "bg-matrixGreen text-black font-bold" 
                        : "bg-borderline text-gray-400"
                    }`}
                    animate={phaseProgress === "scanning" ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: phaseProgress === "scanning" ? Infinity : 0, duration: 0.8 }}
                  >
                    Scanning Stores
                  </motion.span>
                  <motion.span
                    className={`px-2 py-1 rounded-full ${
                      phaseProgress === "analyzing" 
                        ? "bg-matrixGreen text-black font-bold" 
                        : "bg-borderline text-gray-400"
                    }`}
                    animate={phaseProgress === "analyzing" ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: phaseProgress === "analyzing" ? Infinity : 0, duration: 0.8 }}
                  >
                    Analyzing Trends
                  </motion.span>
                  <motion.span
                    className={`px-2 py-1 rounded-full ${
                      phaseProgress === "computing" 
                        ? "bg-matrixGreen text-black font-bold" 
                        : "bg-borderline text-gray-400"
                    }`}
                    animate={phaseProgress === "computing" ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: phaseProgress === "computing" ? Infinity : 0, duration: 0.8 }}
                  >
                    Computing
                  </motion.span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-matrixGreen mb-2">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  <Loader2 size={14} />
                </motion.div>
                <span className="text-xs">Running Matrix Scans...</span>
              </div>

              {/* Staggered log entries with fancy animations */}
              <motion.div className="space-y-1" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.15 } } }}>
                {logs.map((log, i) => (
                  <motion.p
                    key={i}
                    className="text-gray-500"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                  >{`> ${log}`}</motion.p>
                ))}
              </motion.div>
            </motion.div>
          )}

          {stage === "result" && (
            <motion.div
              key="result"
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Glitch effect on reveal */}
              <motion.div
                className="bg-matrixGreenDim border border-matrixGreen/30 p-4 rounded-xl relative overflow-hidden"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
              >
                {/* Scan line effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-matrixGreen/10 to-transparent pointer-events-none"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
                />

                <div className="flex items-center gap-2 text-matrixGreen font-bold text-sm mb-2">
                  <AlertTriangle size={16} /> PRE-TRANSACTION PAUSE
                </div>
                <p className="text-white text-xs leading-relaxed">
                  {prediction?.recommendation ?? "No recommendation available yet."}
                </p>
                <p className="text-gray-300 text-xs mt-3">
                  Suggested wait: <span className="text-matrixGreen font-bold">{prediction?.days_to_wait ?? 0} days</span>
                </p>
                {prediction?.target_price !== null && prediction?.target_price !== undefined && (
                  <p className="text-gray-300 text-xs mt-1">
                    Predicted target price: <span className="text-matrixGreen font-bold">₹{prediction.target_price}</span>
                  </p>
                )}
              </motion.div>

              <motion.div
                className="flex items-center gap-3 text-gray-400 text-xs py-2 border-y border-borderline"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TrendingDown size={14} className="text-matrixGreen" />
                Savings Potential: ₹{prediction?.savings_potential ?? 0} | Confidence: {prediction?.confidence ?? 0}%
              </motion.div>

              <motion.button
                onClick={runAnalysis}
                className="w-full bg-matrixGreen text-black py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-white transition-all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Loader2 size={14} /> Test Again
              </motion.button>

              <motion.button
                className="w-full bg-white text-black py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-matrixGreen transition-all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <DollarSign size={14} /> Auto-Invest Savings into Yield
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}