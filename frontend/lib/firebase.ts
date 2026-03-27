import { useEffect, useState, useCallback } from "react";
import axios from "axios";

// Firebase initialization would go here - for now using API calls to backend
// which will handle Firebase operations

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Hook: Fetch real-time prices
export function useRealTimePrices(query: string) {
  const [prices, setPrices] = useState<{ [key: string]: number | null }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE}/api/real-time-prices`, {
        params: { query },
      });

      setPrices(response.data.prices);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch prices");
      console.error("Price fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return { prices, loading, error, fetchPrices };
}

// Hook: Get wait vs buy recommendation
export function useWaitVsBuy(query: string, priceHistory: any[]) {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPrediction = useCallback(async () => {
    if (!query.trim() || priceHistory.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/api/wait-vs-buy`, {
        query,
        priceHistory,
      });

      setPrediction(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get prediction");
      console.error("Prediction error:", err);
    } finally {
      setLoading(false);
    }
  }, [query, priceHistory]);

  return { prediction, loading, error, getPrediction };
}

// Hook: Watchlist management
export function useWatchlist(userId: string) {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchWatchlist = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE}/api/watchlist`, {
          params: { user_id: userId },
        });
        setWatchlist(response.data.items);
      } catch (err) {
        console.error("Watchlist fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchWatchlist, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  const addToWatchlist = async (
    productName: string,
    url: string,
    targetPrice: number
  ) => {
    try {
      const response = await axios.post(`${API_BASE}/api/watchlist`, null, {
        params: {
          user_id: userId,
          product_name: productName,
          url,
          target_price: targetPrice,
        },
      });
      setWatchlist([...watchlist, response.data]);
    } catch (err) {
      console.error("Add to watchlist error:", err);
    }
  };

  const removeFromWatchlist = async (watchlistId: string) => {
    try {
      await axios.delete(`${API_BASE}/api/watchlist/${watchlistId}`);
      setWatchlist(watchlist.filter((w) => w.id !== watchlistId));
    } catch (err) {
      console.error("Remove from watchlist error:", err);
    }
  };

  return {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
  };
}

// Hook: Reminders
export function useReminders(userId: string) {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchReminders = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE}/api/reminders`, {
          params: { user_id: userId },
        });
        setReminders(response.data.items);
      } catch (err) {
        console.error("Reminders fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReminders();
  }, [userId]);

  const createReminder = async (query: string, targetPrice: number) => {
    try {
      const response = await axios.post(`${API_BASE}/api/reminders`, null, {
        params: {
          user_id: userId,
          query,
          target_price: targetPrice,
        },
      });
      setReminders([...reminders, response.data]);
      return response.data;
    } catch (err) {
      console.error("Create reminder error:", err);
    }
  };

  const deleteReminder = async (reminderId: string) => {
    try {
      await axios.delete(`${API_BASE}/api/reminders/${reminderId}`);
      setReminders(reminders.filter((r) => r.id !== reminderId));
    } catch (err) {
      console.error("Delete reminder error:", err);
    }
  };

  return {
    reminders,
    loading,
    createReminder,
    deleteReminder,
  };
}

// Hook: Price history
export function usePriceHistory(query: string, days: number = 30) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${API_BASE}/api/price-history`, {
          params: { query, days },
        });
        setHistory(response.data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch history");
        console.error("History fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    // Refresh every 6 hours
    const interval = setInterval(fetchHistory, 6 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [query, days]);

  return { history, loading, error };
}

// Hook: Category trends
export function useCategoryTrends(category: string) {
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!category) return;

    const fetchTrends = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE}/api/category-trends`, {
          params: { category },
        });
        setTrends(response.data);
      } catch (err) {
        console.error("Category trends error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [category]);

  return { trends, loading };
}

// Hook: Food prices
export function useFoodPrices(query: string) {
  const [prices, setPrices] = useState<{ [key: string]: number | null }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFoodPrices = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE}/api/food-prices`, {
        params: { query },
      });

      setPrices(response.data.prices);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch prices");
      console.error("Food price fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return { prices, loading, error, fetchFoodPrices };
}

// Utility: Calculate savings
export function calculateSavings(
  targetPrice: number,
  actualPrice: number
): number {
  return Math.max(0, targetPrice - actualPrice);
}

// Utility: Find lowest price store
export function findLowestStore(prices: {
  [key: string]: number | null;
}): { store: string; price: number } | null {
  let lowest = null;
  let lowestPrice = Infinity;

  for (const [store, price] of Object.entries(prices)) {
    if (price !== null && price > 0 && price < lowestPrice) {
      lowest = store;
      lowestPrice = price;
    }
  }

  return lowest ? { store: lowest, price: lowestPrice } : null;
}

// Utility: Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}
