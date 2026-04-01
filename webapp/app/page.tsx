"use client";

import { useState, useEffect, useCallback } from "react";
import { City, WeatherData, CITIES } from "@/types/weather";
import { getWeatherInfo } from "@/lib/weather";
import CitySelector from "@/components/CitySelector";
import CurrentWeatherCard from "@/components/CurrentWeather";
import TemperatureChart from "@/components/TemperatureChart";
import WeekForecast from "@/components/WeekForecast";
import LoadingState from "@/components/LoadingState";
import { RefreshCw, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<City>(CITIES[0]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWeather = useCallback(async (city: City) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/weather?lat=${city.lat}&lon=${city.lon}`
      );
      if (!res.ok) throw new Error("No se pudo obtener el clima");
      const data: WeatherData = await res.json();
      setWeatherData(data);
      setLastUpdated(new Date());
    } catch {
      setError("No se pudo conectar con el servicio de clima. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(selectedCity);
  }, [selectedCity, fetchWeather]);

  const handleCityChange = (city: City) => {
    setSelectedCity(city);
    setWeatherData(null);
  };

  const bgGradient =
    weatherData && !loading
      ? getWeatherInfo(weatherData.current.weatherCode).bg
      : "from-slate-700 to-slate-900";

  return (
    <main
      className={`min-h-screen bg-gradient-to-br ${bgGradient} transition-all duration-700`}
    >
      {/* Animated background circles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-white/5 blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-white/5 blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/3 blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">
              Clima
            </h1>
            <p className="text-white/50 text-sm">
              Santa Fe, Argentina
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CitySelector
              cities={CITIES}
              selected={selectedCity}
              onChange={handleCityChange}
            />
            <motion.button
              onClick={() => fetchWeather(selectedCity)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, rotate: 180 }}
              disabled={loading}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors disabled:opacity-40"
              title="Actualizar"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </motion.button>
          </div>
        </div>

        {/* Last updated */}
        {lastUpdated && !loading && (
          <p className="text-white/50 text-xs mb-4 text-right">
            Actualizado: {lastUpdated.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingState />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-3xl bg-red-500/20 border border-red-500/30 p-8 text-center"
            >
              <AlertCircle className="mx-auto mb-3 text-red-300" size={32} />
              <p className="text-white font-medium mb-1">Oops, algo salió mal</p>
              <p className="text-white/60 text-sm mb-4">{error}</p>
              <button
                onClick={() => fetchWeather(selectedCity)}
                className="bg-white/20 hover:bg-white/30 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors"
              >
                Reintentar
              </button>
            </motion.div>
          ) : weatherData ? (
            <motion.div
              key={selectedCity.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <CurrentWeatherCard
                data={weatherData.current}
                cityName={selectedCity.name}
              />
              <TemperatureChart daily={weatherData.daily} />
              <WeekForecast daily={weatherData.daily} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Footer */}
        <p className="text-center text-white/40 text-xs mt-8">
          Datos provistos por{" "}
          <span className="text-white/60">Open-Meteo</span>
        </p>
      </div>
    </main>
  );
}
