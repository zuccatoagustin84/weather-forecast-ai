"use client";

import { DailyForecast } from "@/types/weather";
import { formatDay, getWeatherInfo } from "@/lib/weather";
import { Droplets } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";

interface WeekForecastProps {
  daily: DailyForecast[];
}

export default function WeekForecast({ daily }: WeekForecastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-6"
    >
      <h2 className="text-white font-semibold mb-4">Pronóstico 7 días</h2>
      <div className="space-y-2">
        {daily.map((day, i) => {
          const info = getWeatherInfo(day.weatherCode);
          const isToday = i === 0;
          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              className={clsx(
                "flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors",
                isToday ? "bg-white/15" : "hover:bg-white/10"
              )}
            >
              {/* Day */}
              <span
                className={clsx(
                  "w-20 text-sm font-medium capitalize",
                  isToday ? "text-white" : "text-white/70"
                )}
              >
                {formatDay(day.date)}
              </span>

              {/* Emoji */}
              <span className="text-xl w-8 text-center">{info.emoji}</span>

              {/* Condition */}
              <span className="text-white/60 text-xs flex-1 hidden sm:block">
                {info.label}
              </span>

              {/* Precipitation */}
              {day.precipitation > 0 && (
                <span className="flex items-center gap-1 text-blue-300 text-xs">
                  <Droplets size={12} />
                  {day.precipitation.toFixed(1)} mm
                </span>
              )}

              {/* Temps */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-orange-400 font-semibold text-sm w-10 text-right">
                  {day.tempMax}°
                </span>
                <span className="text-white/30 text-xs">/</span>
                <span className="text-blue-300 text-sm w-10">
                  {day.tempMin}°
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
