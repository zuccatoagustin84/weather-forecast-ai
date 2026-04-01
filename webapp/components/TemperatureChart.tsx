"use client";

import { DailyForecast } from "@/types/weather";
import { formatDay } from "@/lib/weather";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

interface TemperatureChartProps {
  daily: DailyForecast[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-white/60 text-xs mb-1">{label}</p>
        <p className="text-white font-semibold text-sm">
          <span className="text-orange-400">{payload[0]?.value}°</span>
          {" / "}
          <span className="text-blue-400">{payload[1]?.value}°</span>
        </p>
      </div>
    );
  }
  return null;
}

export default function TemperatureChart({ daily }: TemperatureChartProps) {
  const chartData = daily.map((d) => ({
    day: formatDay(d.date),
    max: d.tempMax,
    min: d.tempMin,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-6"
    >
      <h2 className="text-white font-semibold mb-1">Temperaturas — 7 días</h2>
      <p className="text-white/50 text-xs mb-5">
        <span className="text-orange-400 font-medium">■</span> Máx &nbsp;
        <span className="text-blue-400 font-medium">■</span> Mín
      </p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fb923c" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
            <XAxis
              dataKey="day"
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              unit="°"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="max"
              stroke="#fb923c"
              strokeWidth={2}
              fill="url(#colorMax)"
              dot={{ fill: "#fb923c", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: "#fb923c" }}
            />
            <Area
              type="monotone"
              dataKey="min"
              stroke="#60a5fa"
              strokeWidth={2}
              fill="url(#colorMin)"
              dot={{ fill: "#60a5fa", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: "#60a5fa" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
