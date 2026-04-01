export interface City {
  name: string;
  lat: number;
  lon: number;
  province: string;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  time: string;
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitation: number;
}

export interface WeatherData {
  current: CurrentWeather;
  daily: DailyForecast[];
}

export const CITIES: City[] = [
  {
    name: "Pérez",
    lat: -32.9986,
    lon: -60.7667,
    province: "Santa Fe",
  },
  {
    name: "Rosario",
    lat: -32.9468,
    lon: -60.6393,
    province: "Santa Fe",
  },
];
