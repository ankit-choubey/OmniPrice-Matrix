"use client";
import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";

export type HistoryPoint = {
  date: string;
  price: number;
  timestamp?: string;
  amazon?: number;
  flipkart?: number;
  myntra?: number;
  croma?: number;
  event?: string;
};

const fallbackData: HistoryPoint[] = [
  { date: "Jun", price: 1499 },
  { date: "Jul", price: 1499 },
  { date: "Aug", price: 450 },
  { date: "Sep", price: 1499 },
  { date: "Oct", price: 1499 },
  { date: "Nov", price: 1499 },
  { date: "Dec 18", price: 89, event: "Winter Sale 2025" },
  { date: "Jan", price: 1050 },
  { date: "Feb", price: 1499 },
  { date: "Mar", price: 1050 },
];

const storeColors: Record<string, string> = {
  amazon: "#FF9900",
  flipkart: "#0066CC",
  myntra: "#EE5A24",
  croma: "#1A1A1A",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-[#e2e8f0] p-3 rounded-lg border-none shadow-xl text-black font-sans">
        <p className="font-bold text-sm mb-1">{label}, 2025 UTC</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} className="text-sm font-semibold">
            {entry.name}: <span style={{ color: entry.color }}>₹{entry.value}</span>
          </p>
        ))}
        {dataPoint.event && (
          <p className="text-xs text-green-700 mt-1 font-bold flex items-center gap-1">
            ▲ {dataPoint.event}
          </p>
        )}
      </div>
    );
  }
  return null;
};

interface HistoryChartProps {
  data?: HistoryPoint[];
}

export default function HistoryChart({ data = fallbackData }: HistoryChartProps) {
  const [range, setRange] = useState<"6m" | "1y" | "2y" | "all">("1y");

  const filteredData = useMemo(() => {
    const withTs = data.filter((point) => point.timestamp);
    if (!withTs.length || range === "all") return data;

    const now = new Date();
    const threshold = new Date(now);
    if (range === "6m") threshold.setMonth(now.getMonth() - 6);
    if (range === "1y") threshold.setFullYear(now.getFullYear() - 1);
    if (range === "2y") threshold.setFullYear(now.getFullYear() - 2);

    const narrowed = data.filter((point) => {
      if (!point.timestamp) return false;
      return new Date(point.timestamp) >= threshold;
    });

    return narrowed.length ? narrowed : data;
  }, [data, range]);

  const maxPrice = useMemo(() => {
    let max = 100;
    filteredData.forEach((point) => {
      if (point.price) max = Math.max(max, point.price);
      if (point.amazon) max = Math.max(max, point.amazon);
      if (point.flipkart) max = Math.max(max, point.flipkart);
      if (point.myntra) max = Math.max(max, point.myntra);
      if (point.croma) max = Math.max(max, point.croma);
    });
    return max;
  }, [filteredData]);

  const chartData = useMemo(() => {
    return filteredData.map((point) => {
      if (!point.timestamp) return point;
      const d = new Date(point.timestamp);
      const label =
        range === "6m"
          ? d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
          : d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      return { ...point, date: label };
    });
  }, [filteredData, range]);

  // Check if we have per-store data
  const hasStoreData = chartData.some((p) => p.amazon || p.flipkart || p.myntra || p.croma);

  const rangeButtonClass = (buttonRange: "6m" | "1y" | "2y" | "all") =>
    `px-3 py-1 rounded-md cursor-pointer transition ${
      range === buttonRange ? "bg-borderline text-white" : "bg-transparent text-gray-500 hover:text-white"
    }`;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-lg font-semibold tracking-tight">Price history (IN)</h3>
        <div className="flex gap-2 text-xs font-mono">
          <button type="button" onClick={() => setRange("6m")} className={rangeButtonClass("6m")}>6m</button>
          <button type="button" onClick={() => setRange("1y")} className={rangeButtonClass("1y")}>1y</button>
          <button type="button" onClick={() => setRange("2y")} className={rangeButtonClass("2y")}>2y</button>
          <button type="button" onClick={() => setRange("all")} className={rangeButtonClass("all")}>All</button>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
            
            <XAxis 
              dataKey="date" 
              stroke="#666" 
              tick={{ fill: '#666', fontSize: 12 }} 
              axisLine={false} 
              tickLine={false} 
            />
            
            <YAxis 
              stroke="#666" 
              tick={{ fill: '#666', fontSize: 12 }} 
              axisLine={false} 
              tickLine={false}
              domain={[0, Math.ceil(maxPrice * 1.2)]}
            />
            
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2A2A2A', strokeWidth: 2 }} />
            
            {hasStoreData && <Legend />}
            
            <ReferenceLine y={0} stroke="#3b82f6" strokeDasharray="3 3" opacity={0.5} />

            {hasStoreData ? (
              <>
                {(chartData.some((p) => p.amazon) || data.some((p) => p.amazon)) && (
                  <Line 
                    type="monotone" 
                    dataKey="amazon" 
                    stroke={storeColors.amazon} 
                    strokeWidth={2} 
                    dot={false}
                    name="Amazon"
                    activeDot={{ r: 5 }} 
                  />
                )}
                {(chartData.some((p) => p.flipkart) || data.some((p) => p.flipkart)) && (
                  <Line 
                    type="monotone" 
                    dataKey="flipkart" 
                    stroke={storeColors.flipkart} 
                    strokeWidth={2} 
                    dot={false}
                    name="Flipkart"
                    activeDot={{ r: 5 }} 
                  />
                )}
                {(chartData.some((p) => p.myntra) || data.some((p) => p.myntra)) && (
                  <Line 
                    type="monotone" 
                    dataKey="myntra" 
                    stroke={storeColors.myntra} 
                    strokeWidth={2} 
                    dot={false}
                    name="Myntra"
                    activeDot={{ r: 5 }} 
                  />
                )}
                {(chartData.some((p) => p.croma) || data.some((p) => p.croma)) && (
                  <Line 
                    type="monotone" 
                    dataKey="croma" 
                    stroke={storeColors.croma} 
                    strokeWidth={2} 
                    dot={false}
                    name="Croma"
                    activeDot={{ r: 5 }} 
                  />
                )}
              </>
            ) : (
              <Line 
                type="stepAfter" 
                dataKey="price" 
                stroke="#A3E635" 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 6, fill: '#A3E635', stroke: '#080808', strokeWidth: 2 }} 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}