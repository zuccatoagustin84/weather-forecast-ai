import { WeatherData } from "@/types/weather";

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
      "weather_code",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
    ].join(","),
    timezone: "America/Argentina/Buenos_Aires",
    forecast_days: "7",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    next: { revalidate: 1800 }, // cache 30 min
  });

  if (!res.ok) {
    throw new Error(`Open-Meteo error: ${res.status}`);
  }

  const data = await res.json();

  return {
    current: {
      temperature: Math.round(data.current.temperature_2m),
      apparentTemperature: Math.round(data.current.apparent_temperature),
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m),
      weatherCode: data.current.weather_code,
      time: data.current.time,
    },
    daily: data.daily.time.map((date: string, i: number) => ({
      date,
      weatherCode: data.daily.weather_code[i],
      tempMax: Math.round(data.daily.temperature_2m_max[i]),
      tempMin: Math.round(data.daily.temperature_2m_min[i]),
      precipitation: data.daily.precipitation_sum[i] ?? 0,
    })),
  };
}

export interface WeatherInfo {
  label: string;
  emoji: string;
  bg: string;
  textColor: string;
  gradientFrom: string;
  gradientTo: string;
}

export function getWeatherInfo(code: number): WeatherInfo {
  if (code === 0) {
    return {
      label: "Despejado",
      emoji: "☀️",
      bg: "from-amber-400 to-orange-500",
      textColor: "text-amber-600",
      gradientFrom: "#fbbf24",
      gradientTo: "#f97316",
    };
  }
  if (code <= 2) {
    return {
      label: "Parcialmente nublado",
      emoji: "⛅",
      bg: "from-blue-300 to-slate-400",
      textColor: "text-blue-500",
      gradientFrom: "#93c5fd",
      gradientTo: "#94a3b8",
    };
  }
  if (code === 3) {
    return {
      label: "Nublado",
      emoji: "☁️",
      bg: "from-slate-400 to-slate-600",
      textColor: "text-slate-500",
      gradientFrom: "#94a3b8",
      gradientTo: "#475569",
    };
  }
  if (code <= 48) {
    return {
      label: "Neblina",
      emoji: "🌫️",
      bg: "from-gray-400 to-gray-600",
      textColor: "text-gray-500",
      gradientFrom: "#9ca3af",
      gradientTo: "#4b5563",
    };
  }
  if (code <= 55) {
    return {
      label: "Llovizna",
      emoji: "🌦️",
      bg: "from-blue-400 to-blue-600",
      textColor: "text-blue-500",
      gradientFrom: "#60a5fa",
      gradientTo: "#2563eb",
    };
  }
  if (code <= 67) {
    return {
      label: "Lluvia",
      emoji: "🌧️",
      bg: "from-blue-500 to-indigo-700",
      textColor: "text-blue-600",
      gradientFrom: "#3b82f6",
      gradientTo: "#4338ca",
    };
  }
  if (code <= 77) {
    return {
      label: "Nieve",
      emoji: "❄️",
      bg: "from-sky-200 to-blue-400",
      textColor: "text-sky-500",
      gradientFrom: "#bae6fd",
      gradientTo: "#60a5fa",
    };
  }
  if (code <= 82) {
    return {
      label: "Chubascos",
      emoji: "🌦️",
      bg: "from-blue-400 to-blue-700",
      textColor: "text-blue-600",
      gradientFrom: "#60a5fa",
      gradientTo: "#1d4ed8",
    };
  }
  if (code <= 99) {
    return {
      label: "Tormenta",
      emoji: "⛈️",
      bg: "from-gray-700 to-gray-900",
      textColor: "text-gray-600",
      gradientFrom: "#374151",
      gradientTo: "#111827",
    };
  }
  return {
    label: "Desconocido",
    emoji: "🌡️",
    bg: "from-gray-400 to-gray-600",
    textColor: "text-gray-500",
    gradientFrom: "#9ca3af",
    gradientTo: "#4b5563",
  };
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatDay(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Hoy";
  if (date.toDateString() === tomorrow.toDateString()) return "Mañana";

  return date.toLocaleDateString("es-AR", { weekday: "long" });
}
