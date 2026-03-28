"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Clock3, Search, Sparkles, Bot, Link2, MapPin } from "lucide-react";
import axios from "axios";
import LiveFeedCard from "../../components/LiveFeedCard";
import HistoryChart, { type HistoryPoint } from "../../components/HistoryChart";
import FintellectPredictor from "../../components/FintellectPredictor";
import ReminderToast from "../../components/ReminderToast";

type Prices = {
  amazon: string;
  myntra: string;
  croma: string;
  flipkart: string;
};

type RealtimePricesResponse = {
  prices?: Partial<Record<keyof Prices, number | string | null>>;
};

type HistoryApiItem = {
  store: string;
  captured_at: string;
  price: number;
};

type ReminderHit = {
  query: string;
  targetPrice: number;
  currentPrices: { [store: string]: number | null };
  lowestStore: string;
  lowestPrice: number;
};

const showcasePresets = [
  { label: "Electronics", query: "Sony WH-1000XM5" },
  { label: "Fashion", query: "Nike running shoes men" },
  { label: "Food (Showcase)", query: "pizza combo" },
  { label: "Travel (Showcase)", query: "weekend trip to araku valley" },
  { label: "Groceries (Showcase)", query: "basmati rice 5kg" },
  { label: "Skincare", query: "cetaphil cleanser" },
];

const foodKeywords = [
  "pizza",
  "burger",
  "biryani",
  "dosa",
  "meal",
  "combo",
  "restaurant",
  "food",
  "grocery",
  "vegetable",
  "rice",
  "zomato",
  "swiggy",
];

const travelKeywords = [
  "travel",
  "trip",
  "flight",
  "train",
  "bus",
  "hotel",
  "itinerary",
  "vacation",
  "tour",
  "ticket",
  "stay",
];

const foodShowcasePrices = {
  swiggy: "319",
  zomato: "335",
  instamart: "298",
  zepto: "305",
};

const foodShowcaseHistory: HistoryPoint[] = [
  { date: "Apr 24", price: 349, timestamp: "2024-04-01T00:00:00.000Z" },
  { date: "Jun 24", price: 338, timestamp: "2024-06-01T00:00:00.000Z" },
  { date: "Aug 24", price: 344, timestamp: "2024-08-01T00:00:00.000Z" },
  { date: "Oct 24", price: 332, timestamp: "2024-10-01T00:00:00.000Z" },
  { date: "Dec 24", price: 326, timestamp: "2024-12-01T00:00:00.000Z" },
  { date: "Feb 25", price: 323, timestamp: "2025-02-01T00:00:00.000Z" },
  { date: "Apr 25", price: 317, timestamp: "2025-04-01T00:00:00.000Z" },
  { date: "Jun 25", price: 312, timestamp: "2025-06-01T00:00:00.000Z" },
  { date: "Aug 25", price: 308, timestamp: "2025-08-01T00:00:00.000Z" },
  { date: "Oct 25", price: 304, timestamp: "2025-10-01T00:00:00.000Z" },
  { date: "Dec 25", price: 301, timestamp: "2025-12-01T00:00:00.000Z" },
  { date: "Mar 26", price: 299, timestamp: "2026-03-01T00:00:00.000Z" },
];

const travelShowcasePrices = {
  flights: "8499",
  trains: "1780",
  buses: "1290",
  stays: "3999",
};

const travelShowcaseHistory: HistoryPoint[] = [
  { date: "Apr 24", price: 11980, timestamp: "2024-04-01T00:00:00.000Z" },
  { date: "Jun 24", price: 11120, timestamp: "2024-06-01T00:00:00.000Z" },
  { date: "Aug 24", price: 10840, timestamp: "2024-08-01T00:00:00.000Z" },
  { date: "Oct 24", price: 10590, timestamp: "2024-10-01T00:00:00.000Z" },
  { date: "Dec 24", price: 11520, timestamp: "2024-12-01T00:00:00.000Z" },
  { date: "Feb 25", price: 10320, timestamp: "2025-02-01T00:00:00.000Z" },
  { date: "Apr 25", price: 10080, timestamp: "2025-04-01T00:00:00.000Z" },
  { date: "Jun 25", price: 9920, timestamp: "2025-06-01T00:00:00.000Z" },
  { date: "Aug 25", price: 10040, timestamp: "2025-08-01T00:00:00.000Z" },
  { date: "Oct 25", price: 9780, timestamp: "2025-10-01T00:00:00.000Z" },
  { date: "Dec 25", price: 10250, timestamp: "2025-12-01T00:00:00.000Z" },
  { date: "Mar 26", price: 9640, timestamp: "2026-03-01T00:00:00.000Z" },
];

export default function DashboardPage() {
  const [query, setQuery] = useState("Sony WH-1000XM5");
  const [isSearching, setIsSearching] = useState(false);
  const [historyPoints, setHistoryPoints] = useState<HistoryPoint[]>([]);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [agentStatus, setAgentStatus] = useState("Agent ready. I will personalize as you search.");
  const [isFoodMode, setIsFoodMode] = useState(false);
  const [isTravelMode, setIsTravelMode] = useState(false);
  const [connectedApps, setConnectedApps] = useState<{ swiggy: boolean; zomato: boolean }>({
    swiggy: false,
    zomato: false,
  });
  const [prices, setPrices] = useState<Prices>({
    amazon: "N/A",
    myntra: "N/A",
    croma: "N/A",
    flipkart: "N/A",
  });

  type Reminder = { id: string; query: string; targetPrice: number; createdAt: number };
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderTargetPrice, setReminderTargetPrice] = useState<string>("");
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [reminderHit, setReminderHit] = useState<ReminderHit | null>(null);
  const [lastReminderHitKey, setLastReminderHitKey] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const parsePrice = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    const parsed = Number(String(value).replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const formatPriceForCard = (value: string | number | null | undefined): string => {
    const parsed = parsePrice(value);
    return parsed === null ? "N/A" : String(Math.round(parsed));
  };

  const toHistoryPointFromCards = (sourcePrices: Prices): HistoryPoint | null => {
    const amazon = parsePrice(sourcePrices.amazon) ?? undefined;
    const flipkart = parsePrice(sourcePrices.flipkart) ?? undefined;
    const myntra = parsePrice(sourcePrices.myntra) ?? undefined;
    const croma = parsePrice(sourcePrices.croma) ?? undefined;

    const values = [amazon, flipkart, myntra, croma].filter((n): n is number => n !== undefined);
    if (!values.length) return null;

    const now = new Date();
    return {
      date: now.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      timestamp: now.toISOString(),
      price: Math.min(...values),
      amazon,
      flipkart,
      myntra,
      croma,
      event: "Live scan",
    };
  };

  const isFoodQuery = (value: string) => {
    const lower = value.toLowerCase();
    return foodKeywords.some((keyword) => lower.includes(keyword));
  };

  const isTravelQuery = (value: string) => {
    const lower = value.toLowerCase();
    return travelKeywords.some((keyword) => lower.includes(keyword));
  };

  const connectFoodApp = (app: "swiggy" | "zomato") => {
    setConnectedApps((prev) => {
      const next = { ...prev, [app]: !prev[app] };
      localStorage.setItem("buylo_connected_food_apps", JSON.stringify(next));
      return next;
    });
    setAgentStatus(`Agent update: ${app} personalization channel ${connectedApps[app] ? "disconnected" : "connected"}.`);
  };

  const saveReminders = (rems: Reminder[]) => {
    localStorage.setItem("buylo_reminders", JSON.stringify(rems));
  };

  const addReminder = () => {
    const targetPrice = Number(reminderTargetPrice);
    if (!query.trim() || !Number.isFinite(targetPrice) || targetPrice <= 0) {
      setAgentStatus("Agent note: Enter a valid target price to set a reminder.");
      return;
    }
    const newReminder: Reminder = {
      id: `${Date.now()}`,
      query: query.trim(),
      targetPrice,
      createdAt: Date.now(),
    };
    const updated = [...reminders, newReminder];
    setReminders(updated);
    saveReminders(updated);
    setReminderTargetPrice("");
    setAgentStatus(`Agent: Reminder set for "${query}" at ₹${targetPrice}.`);
  };

  const removeReminder = (id: string) => {
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    saveReminders(updated);
  };

  const currentBestStore = useMemo(() => {
    const parsed = Object.entries(prices)
      .map(([store, price]) => ({ store, value: Number(price) }))
      .filter((item) => Number.isFinite(item.value) && item.value > 0)
      .sort((a, b) => a.value - b.value);
    return parsed.length ? parsed[0].store : "amazon";
  }, [prices]);

  const fetchHistory = async (activeQuery: string, livePrices?: Prices) => {
    try {
      const response = await axios.get(`${apiBase}/api/history`, {
        params: {
          store: "all",
          query: activeQuery,
          limit: 2000,
        },
      });

      const items: HistoryApiItem[] = response?.data?.items ?? [];

      // Group by date and store to get per-store series
      const byDateAndStore = new Map<string, Map<string, number>>();
      for (const item of items) {
        const when = new Date(item.captured_at);
        const dayKey = when.toISOString().slice(0, 10);
        const store = item.store.toLowerCase();
        const price = Number(item.price);

        if (!byDateAndStore.has(dayKey)) {
          byDateAndStore.set(dayKey, new Map());
        }
        const storeMap = byDateAndStore.get(dayKey)!;
        
        // Use last recorded price for store on this day, or minimum if multiple
        if (!storeMap.has(store) || price < storeMap.get(store)!) {
          storeMap.set(store, price);
        }
      }

      let mapped: HistoryPoint[] = Array.from(byDateAndStore.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dayKey, storeMap]) => {
          const when = new Date(dayKey + "T00:00:00.000Z");
          const point: HistoryPoint = {
            date: when.toLocaleDateString("en-IN", {
              month: "short",
              year: "2-digit",
            }),
            timestamp: `${dayKey}T00:00:00.000Z`,
            price: Math.min(...Array.from(storeMap.values())), // fallback for chart
            amazon: storeMap.get("amazon"),
            flipkart: storeMap.get("flipkart"),
            myntra: storeMap.get("myntra"),
            croma: storeMap.get("croma"),
          };
          return point;
        });

      // Keep chart in sync with visible cards by appending today's latest live point.
      if (livePrices) {
        const livePoint = toHistoryPointFromCards(livePrices);
        if (livePoint) {
          const todayKey = livePoint.timestamp?.slice(0, 10);
          mapped = mapped.filter((point) => point.timestamp?.slice(0, 10) !== todayKey);
          mapped.push(livePoint);
        }
      }

      setHistoryPoints(mapped);
    } catch (error) {
      console.warn("History fetch failed, using chart fallback.", error);
    }
  };

  const rememberQuery = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    const next = [normalized, ...recentQueries.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 8);
    setRecentQueries(next);
    localStorage.setItem("buylo_recent_queries", JSON.stringify(next));
  };

  const runSearch = async (targetQuery: string) => {
    if (!targetQuery.trim()) return;
    setIsSearching(true);
    setAgentStatus("Agent scanning market signals and your personalization memory...");

    if (isFoodQuery(targetQuery)) {
      setIsFoodMode(true);
      setIsTravelMode(false);
      const mappedFoodPrices: Prices = {
        amazon: foodShowcasePrices.swiggy,
        myntra: foodShowcasePrices.zomato,
        croma: foodShowcasePrices.instamart,
        flipkart: foodShowcasePrices.zepto,
      };
      setPrices(mappedFoodPrices);
      const livePoint = toHistoryPointFromCards(mappedFoodPrices);
      setHistoryPoints(livePoint ? [...foodShowcaseHistory, livePoint] : foodShowcaseHistory);
      rememberQuery(targetQuery);
      setAgentStatus(
        "Food mode is in testing phase. Showing realistic SRM University AP pricing simulation while account connections improve personalization."
      );
      setIsSearching(false);
      return;
    }

    if (isTravelQuery(targetQuery)) {
      setIsTravelMode(true);
      setIsFoodMode(false);
      const mappedTravelPrices: Prices = {
        amazon: travelShowcasePrices.flights,
        myntra: travelShowcasePrices.stays,
        croma: travelShowcasePrices.trains,
        flipkart: travelShowcasePrices.buses,
      };
      setPrices(mappedTravelPrices);
      const travelPoint = toHistoryPointFromCards(mappedTravelPrices);
      setHistoryPoints(travelPoint ? [...travelShowcaseHistory, travelPoint] : travelShowcaseHistory);
      rememberQuery(targetQuery);
      setAgentStatus(
        "Travel planner mode active: building cost-effective trip baseline with transport and stay optimization around SRM University AP."
      );
      setIsSearching(false);
      return;
    }

    setIsFoodMode(false);
    setIsTravelMode(false);

    try {
      const response = await axios.get(`${apiBase}/api/scrape-matrix`, {
        params: { query: targetQuery },
      });

      if (response?.data?.exists === false) {
        // One extra live attempt before marking as not found.
        try {
          const fallback = await axios.get(`${apiBase}/api/real-time-prices`, {
            params: { query: targetQuery },
          });
          const fallbackPrices = (fallback.data as RealtimePricesResponse)?.prices;
          if (fallbackPrices) {
            const normalizedFallback: Prices = {
              amazon: formatPriceForCard(fallbackPrices.amazon),
              myntra: formatPriceForCard(fallbackPrices.myntra),
              croma: formatPriceForCard(fallbackPrices.croma),
              flipkart: formatPriceForCard(fallbackPrices.flipkart),
            };
            const validCount = Object.values(normalizedFallback).filter((value) => parsePrice(value) !== null).length;
            if (validCount > 0) {
              setPrices(normalizedFallback);
              await fetchHistory(targetQuery, normalizedFallback);
              rememberQuery(targetQuery);
              setAgentStatus("Agent recovered live prices from secondary feed.");
              return;
            }
          }
        } catch (fallbackError) {
          console.warn("Secondary live price attempt failed", fallbackError);
        }

        setPrices({
          amazon: "N/A",
          myntra: "N/A",
          croma: "N/A",
          flipkart: "N/A",
        });
        setHistoryPoints([]);
        rememberQuery(targetQuery);
        setAgentStatus(`Agent: "${targetQuery}" not found in tracked stores right now.`);
        return;
      }

      const matrixPrices = response?.data?.prices;
      if (matrixPrices) {
        let normalizedPrices: Prices = {
          amazon: formatPriceForCard(matrixPrices.amazon),
          myntra: formatPriceForCard(matrixPrices.myntra),
          croma: formatPriceForCard(matrixPrices.croma),
          flipkart: formatPriceForCard(matrixPrices.flipkart),
        };

        // Fill any missing stores from real-time endpoint to keep cards populated.
        const missingStores = (Object.entries(normalizedPrices) as Array<[keyof Prices, string]>).filter(
          ([_, value]) => parsePrice(value) === null
        );

        if (missingStores.length > 0) {
          try {
            const fallback = await axios.get(`${apiBase}/api/real-time-prices`, {
              params: { query: targetQuery },
            });
            const fallbackPrices = (fallback.data as RealtimePricesResponse)?.prices;
            if (fallbackPrices) {
              normalizedPrices = {
                amazon: parsePrice(normalizedPrices.amazon) !== null ? normalizedPrices.amazon : formatPriceForCard(fallbackPrices.amazon),
                myntra: parsePrice(normalizedPrices.myntra) !== null ? normalizedPrices.myntra : formatPriceForCard(fallbackPrices.myntra),
                croma: parsePrice(normalizedPrices.croma) !== null ? normalizedPrices.croma : formatPriceForCard(fallbackPrices.croma),
                flipkart: parsePrice(normalizedPrices.flipkart) !== null ? normalizedPrices.flipkart : formatPriceForCard(fallbackPrices.flipkart),
              };
            }
          } catch (fallbackError) {
            console.warn("Store fill fallback failed", fallbackError);
          }
        }

        setPrices((prev) => ({
          ...prev,
          ...normalizedPrices,
        }));
        await fetchHistory(targetQuery, normalizedPrices);
      } else {
        await fetchHistory(targetQuery);
      }

      rememberQuery(targetQuery);
      setAgentStatus("Agent synced live prices and refreshed your long-term trend profile.");
    } catch (error) {
      console.error("Scraper connection failed. Trying real-time fallback.", error);
      try {
        const fallback = await axios.get(`${apiBase}/api/real-time-prices`, {
          params: { query: targetQuery },
        });
        const fallbackPrices = (fallback.data as RealtimePricesResponse)?.prices;
        if (fallbackPrices) {
          const normalizedFallback: Prices = {
            amazon: formatPriceForCard(fallbackPrices.amazon),
            myntra: formatPriceForCard(fallbackPrices.myntra),
            croma: formatPriceForCard(fallbackPrices.croma),
            flipkart: formatPriceForCard(fallbackPrices.flipkart),
          };
          setPrices((prev) => ({
            ...prev,
            ...normalizedFallback,
          }));
          await fetchHistory(targetQuery, normalizedFallback);
          rememberQuery(targetQuery);
          setAgentStatus("Agent recovered live prices from real-time fallback.");
          return;
        }
      } catch (fallbackError) {
        console.error("Real-time fallback failed.", fallbackError);
      }

      setAgentStatus("Agent warning: some live sources failed. Fallback pricing is active to keep tracking continuous.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    const trimmed = query.trim();
    
    // Detect if input looks like a URL (supported ecommerce platforms)
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.includes("amazon.") || trimmed.includes("flipkart.") || trimmed.includes("myntra.") || trimmed.includes("croma.")) {
      setIsSearching(true);
      setAgentStatus("Agent parsing product link...");
      try {
        const response = await axios.get(`${apiBase}/api/extract-query-from-url`, {
          params: { url: trimmed },
        });
        if (response.data?.success && response.data?.query) {
          const extractedQuery = response.data.query;
          setQuery(extractedQuery);
          setAgentStatus(`Agent extracted: "${extractedQuery}". Now scanning market...`);
          await runSearch(extractedQuery);
        } else {
          setAgentStatus("Agent: Could not parse link. Treating as search text.");
          setIsSearching(false);
          await runSearch(trimmed);
        }
      } catch (error) {
        console.error("Link parsing failed:", error);
        setAgentStatus("Agent: Link parsing error. Treating as search text.");
        setIsSearching(false);
        await runSearch(trimmed);
      }
    } else {
      await runSearch(trimmed);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("buylo_recent_queries");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        setRecentQueries(Array.isArray(parsed) ? parsed : []);
      } catch {
        setRecentQueries([]);
      }
    }

    const savedApps = localStorage.getItem("buylo_connected_food_apps");
    if (savedApps) {
      try {
        const parsed = JSON.parse(savedApps) as { swiggy: boolean; zomato: boolean };
        setConnectedApps({
          swiggy: Boolean(parsed.swiggy),
          zomato: Boolean(parsed.zomato),
        });
      } catch {
        setConnectedApps({ swiggy: false, zomato: false });
      }
    }

    const savedReminders = localStorage.getItem("buylo_reminders");
    if (savedReminders) {
      try {
        const parsed = JSON.parse(savedReminders) as Reminder[];
        setReminders(Array.isArray(parsed) ? parsed : []);
      } catch {
        setReminders([]);
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get("q")?.trim();
    if (initialQuery) {
      setQuery(initialQuery);
      void runSearch(initialQuery);
    } else {
      void fetchHistory(query);
    }
    // Intentional single-run hydration behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autoRefreshEnabled || !query.trim()) return;
    const timer = setInterval(() => {
      void runSearch(query);
    }, 45000);
    return () => clearInterval(timer);
  }, [autoRefreshEnabled, query]);

  useEffect(() => {
    if (!reminders.length) return;
    const parsedPrices = {
      amazon: parsePrice(prices.amazon),
      flipkart: parsePrice(prices.flipkart),
      myntra: parsePrice(prices.myntra),
      croma: parsePrice(prices.croma),
    };

    const pricedStores = Object.entries(parsedPrices).filter(
      ([_, value]) => value !== null
    ) as Array<[string, number]>;

    if (!pricedStores.length) return;

    const [lowestStore, lowestPrice] = pricedStores.reduce((best, current) =>
      current[1] < best[1] ? current : best
    );

    const hit = reminders.find(
      (reminder) =>
        reminder.query.toLowerCase() === query.toLowerCase() &&
        Number.isFinite(lowestPrice) &&
        lowestPrice <= reminder.targetPrice
    );

    if (hit) {
      const hitKey = `${hit.id}:${Math.round(lowestPrice)}`;
      if (hitKey !== lastReminderHitKey) {
        setReminderHit({
          query: hit.query,
          targetPrice: hit.targetPrice,
          currentPrices: parsedPrices,
          lowestStore,
          lowestPrice,
        });
        setLastReminderHitKey(hitKey);
      }
      setAgentStatus(
        `Agent alert: Reminder hit for "${hit.query}". Lowest visible price is ₹${Math.round(lowestPrice)} (target ₹${hit.targetPrice}).`
      );
    }
  }, [prices, reminders, query, lastReminderHitKey]);

  const numericPrices = useMemo(() => {
    const pairs = [
      { store: "amazon", value: Number(prices.amazon) },
      { store: "flipkart", value: Number(prices.flipkart) },
      { store: "myntra", value: Number(prices.myntra) },
      { store: "croma", value: Number(prices.croma) },
    ].filter((item) => Number.isFinite(item.value) && item.value > 0);
    return pairs;
  }, [prices]);

  const spreadInsight = useMemo(() => {
    if (!numericPrices.length) {
      return { lowest: null as null | { store: string; value: number }, highest: null as null | { store: string; value: number }, spread: 0 };
    }
    const sorted = [...numericPrices].sort((a, b) => a.value - b.value);
    const lowest = sorted[0];
    const highest = sorted[sorted.length - 1];
    return {
      lowest,
      highest,
      spread: Math.max(0, Math.round(highest.value - lowest.value)),
    };
  }, [numericPrices]);

  const storeLabels = useMemo(() => {
    if (isTravelMode) {
      return {
        amazon: "Flights",
        myntra: "Hotels",
        croma: "Trains",
        flipkart: "Buses",
      };
    }
    if (isFoodMode) {
      return {
        amazon: "Swiggy",
        myntra: "Zomato",
        croma: "Instamart",
        flipkart: "Zepto",
      };
    }
    return {
      amazon: "Amazon",
      myntra: "Myntra",
      croma: "Croma",
      flipkart: "Flipkart",
    };
  }, [isFoodMode, isTravelMode]);

  const offlineLocalStores = useMemo(() => {
    if (isTravelMode) {
      return [
        "APSRTC Mangalagiri Bus Depot",
        "Vijayawada Junction IRCTC Counter",
        "Gannavaram Airport Shuttle Desk",
        "Neerukonda Local Cabs Union",
      ];
    }
    if (isFoodMode) {
      return [
        "Vijetha Supermarket, Mangalagiri",
        "More Daily, Neerukonda",
        "D-Mart Ready, Tadepalli",
        "Namburu Farmers Market",
      ];
    }
    return [
      "Reliance Digital, Benz Circle Vijayawada",
      "Croma, MG Road Vijayawada",
      "Brodipet Electronics Market, Guntur",
      "Mangalagiri Mobile Plaza",
    ];
  }, [isFoodMode, isTravelMode]);

  return (
    <main className="min-h-screen p-5 md:p-8 max-w-7xl mx-auto selection:bg-matrixGreen selection:text-black">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-5 mb-10"
      >
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-borderline bg-[#111111] px-4 py-3 text-sm text-gray-300 flex items-start gap-3"
        >
          <Bot size={16} className="text-matrixGreen mt-0.5" />
          <div>
            <div className="text-matrixGreen text-xs uppercase tracking-wider mb-1">Personalization Agent</div>
            <div>{agentStatus}</div>
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-2 text-white">
            <Activity className="text-matrixGreen" />
            Buylo
          </h1>
          <div className="text-xs text-gray-400 border border-borderline rounded-full px-3 py-1 w-fit">
            Tracks markets + learns your query history over time
          </div>
        </div>

        <div className="flex w-full items-center bg-panel border border-borderline rounded-full px-4 py-2 focus-within:border-matrixGreen transition-colors shadow-lg">
          <Search size={20} className="text-gray-500 mr-2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
            className="bg-transparent border-none outline-none w-full text-white placeholder-gray-600 font-mono text-sm"
            placeholder="Search products, groceries, food items, gadgets..."
          />
          <button
            onClick={() => void handleSearch()}
            className="ml-4 bg-matrixGreen text-black px-4 py-1.5 rounded-full text-sm font-bold hover:bg-white transition-colors"
          >
            {isSearching ? "Scanning..." : "Execute"}
          </button>
          <button
            onClick={() => void runSearch(query.trim())}
            className="ml-2 bg-white/10 text-white px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-white/20 transition-colors"
          >
            Test Again
          </button>
        </div>

        {isSearching && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-matrixGreen/40 bg-black/80 px-4 py-3 overflow-hidden"
          >
            <div className="text-xs text-matrixGreen uppercase tracking-wider mb-2">Agent Motion Scan</div>
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4 items-center">
              <div className="relative h-20 w-[170px] rounded-xl border border-matrixGreen/20 bg-[#061006]">
                <motion.div
                  className="absolute inset-2 rounded-full border border-matrixGreen/20"
                  animate={{ scale: [0.95, 1.03, 0.95], opacity: [0.4, 0.9, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute inset-4 rounded-full border border-matrixGreen/30"
                  animate={{ scale: [1, 0.92, 1], opacity: [0.8, 0.35, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute left-1/2 top-1/2 h-[2px] w-16 origin-left bg-gradient-to-r from-matrixGreen to-transparent"
                  style={{ transformOrigin: "0% 50%" }}
                  animate={{ rotate: [0, 360] }}
                  transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }}
                />
                <motion.div
                  className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-matrixGreen shadow-[0_0_15px_rgba(163,230,53,0.8)]"
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ repeat: Infinity, duration: 1.1 }}
                />
              </div>

              <div className="space-y-2">
                <motion.div
                  className="h-2 rounded-full bg-matrixGreen/20 overflow-hidden"
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                >
                  <motion.div
                    className="h-full w-1/3 bg-matrixGreen"
                    animate={{ x: ["-20%", "240%"] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                  />
                </motion.div>
                <div className="text-xs text-gray-300">Searching patterns, ranking sources, and updating your matrix...</div>
                <div className="text-[11px] text-gray-500">Route scan: Amazon · Flipkart · Myntra · Croma</div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAutoRefreshEnabled((prev) => !prev)}
            className="text-xs px-3 py-1 rounded-full border border-borderline hover:border-matrixGreen text-gray-300 hover:text-white"
          >
            {autoRefreshEnabled ? "Auto Refresh: ON (45s)" : "Auto Refresh: OFF"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsFoodMode(true);
              setIsTravelMode(false);
              setQuery("pizza combo");
              void runSearch("pizza combo");
            }}
            className="text-xs px-3 py-1 rounded-full border border-borderline hover:border-matrixGreen text-gray-300 hover:text-white"
          >
            Reactivate Food Mode
          </button>
          <button
            type="button"
            onClick={() => {
              setIsFoodMode(false);
              setIsTravelMode(true);
              setQuery("weekend trip to araku valley");
              void runSearch("weekend trip to araku valley");
            }}
            className="text-xs px-3 py-1 rounded-full border border-borderline hover:border-matrixGreen text-gray-300 hover:text-white"
          >
            Reactivate Travel Mode
          </button>
          <button
            type="button"
            onClick={() => {
              setIsFoodMode(false);
              setIsTravelMode(false);
              setQuery("Sony WH-1000XM5");
              void runSearch("Sony WH-1000XM5");
            }}
            className="text-xs px-3 py-1 rounded-full border border-borderline hover:border-matrixGreen text-gray-300 hover:text-white"
          >
            Reactivate Product Mode
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {showcasePresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setQuery(preset.query);
                void runSearch(preset.query);
              }}
              className="text-xs border border-borderline hover:border-matrixGreen text-gray-300 hover:text-white rounded-full px-3 py-1 transition"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {recentQueries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs text-gray-500 flex items-center gap-1 mr-2">
              <Clock3 size={12} />
              Recent
            </div>
            {recentQueries.map((recent) => (
              <button
                key={recent}
                type="button"
                onClick={() => {
                  setQuery(recent);
                  void runSearch(recent);
                }}
                className="text-xs bg-[#181818] text-gray-300 rounded-full px-3 py-1 hover:text-white"
              >
                {recent}
              </button>
            ))}
          </div>
        )}

        {isFoodMode && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-amber-600/40 bg-amber-500/10 rounded-xl p-4"
          >
            <div className="text-amber-300 text-sm font-semibold mb-1">Food/Grocery Showcase Mode (Testing Phase)</div>
            <div className="text-xs text-gray-300 flex items-center gap-1 mb-3">
              <MapPin size={12} />
              Static realistic sample values tuned for SRM University AP region while integration hardening is in progress.
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => connectFoodApp("swiggy")}
                className="text-xs px-3 py-1.5 rounded-full border border-borderline hover:border-matrixGreen"
              >
                <Link2 size={12} className="inline mr-1" />
                {connectedApps.swiggy ? "Swiggy Connected" : "Connect Swiggy Account"}
              </button>
              <button
                type="button"
                onClick={() => connectFoodApp("zomato")}
                className="text-xs px-3 py-1.5 rounded-full border border-borderline hover:border-matrixGreen"
              >
                <Link2 size={12} className="inline mr-1" />
                {connectedApps.zomato ? "Zomato Connected" : "Connect Zomato Account"}
              </button>
            </div>
          </motion.div>
        )}

        {isTravelMode && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-sky-500/40 bg-sky-500/10 rounded-xl p-4"
          >
            <div className="text-sky-300 text-sm font-semibold mb-1">Travel Planner Mode (Cost-Effective Static Simulation)</div>
            <div className="text-xs text-gray-300 flex items-center gap-1 mb-2">
              <MapPin size={12} />
              SRM University-AP location baseline: Neerukonda, Mangalagiri Mandal, Guntur District, Andhra Pradesh 522240, India.
            </div>
            <div className="text-xs text-gray-300">
              Multi-leg budget estimation is active: transport + stay combined for more cost-effective plan options.
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LiveFeedCard store={storeLabels.amazon} price={prices.amazon} isLowest={currentBestStore === "amazon"} time="Just now" delay={0.1} />
            <LiveFeedCard store={storeLabels.myntra} price={prices.myntra} isLowest={currentBestStore === "myntra"} time="2 mins ago" delay={0.2} />
            <LiveFeedCard store={storeLabels.croma} price={prices.croma} isLowest={currentBestStore === "croma"} time="5 mins ago" delay={0.3} />
            <LiveFeedCard store={storeLabels.flipkart} price={prices.flipkart} isLowest={currentBestStore === "flipkart"} time="1 hr ago" delay={0.4} />
          </div>

          <div className="bg-panel border border-borderline rounded-2xl p-4 h-[360px]">
            <HistoryChart data={historyPoints.length ? historyPoints : undefined} />
          </div>

          <div className="bg-panel border border-borderline rounded-2xl p-4 text-xs text-gray-300 flex flex-wrap gap-4">
            <div>
              <span className="text-gray-500">Lowest:</span>{" "}
              {spreadInsight.lowest ? `${storeLabels[spreadInsight.lowest.store as keyof typeof storeLabels]} ₹${Math.round(spreadInsight.lowest.value)}` : "N/A"}
            </div>
            <div>
              <span className="text-gray-500">Highest:</span>{" "}
              {spreadInsight.highest ? `${storeLabels[spreadInsight.highest.store as keyof typeof storeLabels]} ₹${Math.round(spreadInsight.highest.value)}` : "N/A"}
            </div>
            <div>
              <span className="text-gray-500">Spread:</span> ₹{spreadInsight.spread}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="md:col-span-4 bg-panel border border-borderline rounded-2xl p-6 flex flex-col justify-between"
        >
          <FintellectPredictor query={query} apiBase={apiBase} />
          <div className="mt-4 text-xs text-gray-500 border-t border-borderline pt-3 flex items-center gap-2">
            <Sparkles size={12} className="text-matrixGreen" />
            Personalization improves as you run more searches for your own categories.
          </div>
        </motion.div>
      </div>

      {/* Reminders and Offline Estimate Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Reminders Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-panel border border-borderline rounded-2xl p-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Clock3 size={18} className="text-matrixGreen" />
            Price Reminders
          </h3>
          
          <div className="space-y-3 mb-4">
            {reminders.length === 0 ? (
              <p className="text-xs text-gray-500">No reminders set. Create one below to track price drops.</p>
            ) : (
              reminders.map((reminder) => {
                const currentBest = Math.min(
                  Number(prices.amazon) || Infinity,
                  Number(prices.flipkart) || Infinity,
                  Number(prices.myntra) || Infinity,
                  Number(prices.croma) || Infinity
                );
                const hitTarget = Number.isFinite(currentBest) && currentBest <= reminder.targetPrice;
                return (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg border text-xs ${
                      hitTarget
                        ? "border-matrixGreen bg-matrixGreenDim"
                        : "border-borderline bg-[#181818]"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-white">{reminder.query}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery(reminder.query);
                          void runSearch(reminder.query);
                        }}
                        className="text-[10px] text-matrixGreen hover:text-white transition"
                      >
                        Test
                      </button>
                      <button
                        type="button"
                        onClick={() => removeReminder(reminder.id)}
                        className="text-gray-500 hover:text-red-400 text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-gray-400">
                      Target: ₹{reminder.targetPrice}
                      {hitTarget && <span className="ml-2 text-matrixGreen font-bold">✓ HIT!</span>}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              value={reminderTargetPrice}
              onChange={(e) => setReminderTargetPrice(e.target.value)}
              placeholder="Target price (₹)"
              className="flex-1 bg-[#181818] border border-borderline rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-matrixGreen outline-none"
              min="0"
            />
            <button
              type="button"
              onClick={() => void addReminder()}
              className="bg-matrixGreen text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-white transition"
            >
              Set
            </button>
          </div>
        </motion.div>

        {/* Offline Nearby Estimate Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-panel border border-borderline rounded-2xl p-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-matrixGreen" />
            Offline Market Heuristic
          </h3>
          
          <div className="space-y-2 text-xs">
            <p className="text-gray-400 mb-1">Deterministic regional estimate based on category behavior and local market variance.</p>
            <p className="text-[11px] text-matrixGreen mb-3">
              Location fixed for now: SRM University-AP, Neerukonda, Mangalagiri Mandal, Guntur District, Andhra Pradesh 522240, India.
            </p>
            {(() => {
              // Generate deterministic heuristic estimates for offline viewing
              const seed = query.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
              const baseCurrentBest = Math.min(
                Number(prices.amazon) || 5000,
                Number(prices.flipkart) || 5000,
                Number(prices.myntra) || 5000,
                Number(prices.croma) || 5000
              );
              
              const regionVariance = ((seed % 100) - 50) / 1000; // ±5%
              const estimates = offlineLocalStores.map((store, idx) => {
                const multiplier = 1 + regionVariance + (idx - 1.5) * 0.012;
                return {
                  store,
                  est: Math.round(baseCurrentBest * multiplier),
                };
              });

              return (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {estimates.map(({ store, est }) => (
                      <div key={store} className="bg-[#181818] rounded p-2 border border-borderline">
                        <div className="text-gray-500 text-[11px] leading-tight">{store}</div>
                        <div className="text-matrixGreen font-mono">₹{est}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-600 mt-3 text-xs italic">
                    ⓘ Heuristic estimates only (offline, no live data). Based on category patterns and regional variance. Actual may differ.
                  </p>
                </>
              );
            })()}
          </div>
        </motion.div>
      </div>

      <ReminderToast
        hit={reminderHit}
        onDismiss={() => {
          setReminderHit(null);
        }}
      />
    </main>
  );
}
