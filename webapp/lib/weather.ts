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
      bg: "from-orange-500 via-amber-600 to-orange-800",
      textColor: "text-amber-200",
      gradientFrom: "#f97316",
      gradientTo: "#92400e",
    };
  }
  if (code <= 2) {
    return {
      label: "Parcialmente nublado",
      emoji: "⛅",
      bg: "from-sky-500 via-blue-600 to-slate-700",
      textColor: "text-sky-200",
      gradientFrom: "#0ea5e9",
      gradientTo: "#334155",
    };
  }
  if (code === 3) {
    return {
      label: "Nublado",
      emoji: "☁️",
      bg: "from-slate-500 via-slate-600 to-slate-800",
      textColor: "text-slate-200",
      gradientFrom: "#64748b",
      gradientTo: "#1e293b",
    };
  }
  if (code <= 48) {
    return {
      label: "Neblina",
      emoji: "🌫️",
      bg: "from-gray-500 via-gray-600 to-slate-800",
      textColor: "text-gray-200",
      gradientFrom: "#6b7280",
      gradientTo: "#1e293b",
    };
  }
  if (code <= 55) {
    return {
      label: "Llovizna",
      emoji: "🌦️",
      bg: "from-blue-500 via-blue-600 to-blue-800",
      textColor: "text-blue-200",
      gradientFrom: "#3b82f6",
      gradientTo: "#1e3a8a",
    };
  }
  if (code <= 67) {
    return {
      label: "Lluvia",
      emoji: "🌧️",
      bg: "from-blue-600 via-indigo-700 to-indigo-900",
      textColor: "text-blue-200",
      gradientFrom: "#2563eb",
      gradientTo: "#312e81",
    };
  }
  if (code <= 77) {
    return {
      label: "Nieve",
      emoji: "❄️",
      bg: "from-sky-500 via-blue-600 to-blue-800",
      textColor: "text-sky-200",
      gradientFrom: "#0ea5e9",
      gradientTo: "#1e3a8a",
    };
  }
  if (code <= 82) {
    return {
      label: "Chubascos",
      emoji: "🌦️",
      bg: "from-blue-500 via-blue-700 to-blue-900",
      textColor: "text-blue-200",
      gradientFrom: "#3b82f6",
      gradientTo: "#1e3a8a",
    };
  }
  if (code <= 99) {
    return {
      label: "Tormenta",
      emoji: "⛈️",
      bg: "from-gray-700 via-gray-800 to-gray-900",
      textColor: "text-gray-200",
      gradientFrom: "#374151",
      gradientTo: "#111827",
    };
  }
  return {
    label: "Desconocido",
    emoji: "🌡️",
    bg: "from-slate-500 via-slate-700 to-slate-900",
    textColor: "text-slate-200",
    gradientFrom: "#64748b",
    gradientTo: "#0f172a",
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
