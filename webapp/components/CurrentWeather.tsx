"use client";

import { CurrentWeather as ICurrentWeather } from "@/types/weather";
import { getWeatherInfo } from "@/lib/weather";
import { Droplets, Wind, Thermometer } from "lucide-react";
import { motion } from "framer-motion";

interface CurrentWeatherProps {
  data: ICurrentWeather;
  cityName: string;
}

export default function CurrentWeatherCard({ data, cityName }: CurrentWeatherProps) {
  const info = getWeatherInfo(data.weatherCode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-6 sm:p-8"
    >
      {/* Background glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/30 blur-3xl" />
      </div>

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        {/* Left: main temp + condition */}
        <div>
          <p className="text-white/60 text-sm font-medium mb-1 uppercase tracking-widest">
            Ahora en {cityName}
          </p>
          <div className="flex items-end gap-4">
            <motion.span
              key={data.temperature}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-8xl sm:text-9xl font-thin text-white leading-none"
            >
              {data.temperature}°
            </motion.span>
            <div className="pb-3">
              <div className="text-5xl mb-1">{info.emoji}</div>
              <p className="text-white font-semibold text-lg">{info.label}</p>
              <p className="text-white/60 text-sm">
                Sensación {data.apparentTemperature}°C
              </p>
            </div>
          </div>
        </div>

        {/* Right: stats */}
        <div className="flex sm:flex-col gap-4 sm:gap-5 sm:min-w-[160px]">
          <StatItem
            icon={<Droplets size={18} />}
            label="Humedad"
            value={`${data.humidity}%`}
          />
          <StatItem
            icon={<Wind size={18} />}
            label="Viento"
            value={`${data.windSpeed} km/h`}
          />
          <StatItem
            icon={<Thermometer size={18} />}
            label="Sensación"
            value={`${data.apparentTemperature}°C`}
          />
        </div>
      </div>
    </motion.div>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3 flex-1 sm:flex-none">
      <span className="text-white/70">{icon}</span>
      <div>
        <p className="text-white/50 text-xs">{label}</p>
        <p className="text-white font-semibold text-sm">{value}</p>
      </div>
    </div>
  );
}
