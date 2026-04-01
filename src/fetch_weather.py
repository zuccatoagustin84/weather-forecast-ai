"""
fetch_weather.py
----------------
Descarga datos históricos del clima desde Open-Meteo (gratuito, sin API key).
Guarda el resultado en data/raw/weather_data.csv.

Uso:
    python src/fetch_weather.py
    python src/fetch_weather.py --city london --days 180
"""

import argparse
import requests
import pandas as pd
from pathlib import Path
from datetime import date, timedelta

# ---------------------------------------------------------------------------
# Coordenadas de algunas ciudades de ejemplo
# ---------------------------------------------------------------------------
CITIES = {
    "madrid":     {"latitude": 40.4168, "longitude": -3.7038},
    "barcelona":  {"latitude": 41.3888, "longitude":  2.1590},
    "london":     {"latitude": 51.5085, "longitude": -0.1257},
    "new_york":   {"latitude": 40.7143, "longitude": -74.0060},
    "tokyo":      {"latitude": 35.6895, "longitude": 139.6917},
    "buenos_aires": {"latitude": -34.6131, "longitude": -58.3772},
}

# Variables que vamos a descargar
WEATHER_VARIABLES = [
    "temperature_2m_max",       # Temperatura máxima del día (°C)
    "temperature_2m_min",       # Temperatura mínima del día (°C)
    "temperature_2m_mean",      # Temperatura media del día (°C)
    "precipitation_sum",        # Precipitación total (mm)
    "windspeed_10m_max",        # Velocidad máxima del viento (km/h)
    "shortwave_radiation_sum",  # Radiación solar (MJ/m²)
]


def fetch_weather(city: str = "madrid", days: int = 90) -> pd.DataFrame:
    """
    Descarga datos meteorológicos históricos diarios de Open-Meteo.

    Parámetros
    ----------
    city : str
        Nombre de la ciudad (debe estar en CITIES).
    days : int
        Número de días hacia atrás desde hoy.

    Retorna
    -------
    pd.DataFrame con columnas: date + una por cada variable meteorológica.
    """
    if city not in CITIES:
        raise ValueError(f"Ciudad '{city}' no disponible. Opciones: {list(CITIES.keys())}")

    coords = CITIES[city]
    end_date = date.today() - timedelta(days=1)  # ayer (hoy puede no estar completo)
    start_date = end_date - timedelta(days=days - 1)

    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": coords["latitude"],
        "longitude": coords["longitude"],
        "start_date": str(start_date),
        "end_date": str(end_date),
        "daily": ",".join(WEATHER_VARIABLES),
        "timezone": "auto",
    }

    print(f"Descargando datos de {city.capitalize()} ({start_date} → {end_date})...")
    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()

    data = response.json()

    # Construir DataFrame
    df = pd.DataFrame(data["daily"])
    df["date"] = pd.to_datetime(df["time"])
    df = df.drop(columns=["time"])
    df = df.set_index("date").sort_index()

    print(f"  {len(df)} filas descargadas, {df.shape[1]} variables.")
    print(f"  Rango: {df.index.min().date()} → {df.index.max().date()}")
    print(f"  Valores nulos: {df.isnull().sum().sum()}")

    return df


def save_data(df: pd.DataFrame, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path)
    print(f"Datos guardados en: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Descarga datos del clima de Open-Meteo")
    parser.add_argument("--city", default="madrid", choices=list(CITIES.keys()),
                        help="Ciudad a descargar (default: madrid)")
    parser.add_argument("--days", type=int, default=90,
                        help="Número de días históricos a descargar (default: 90)")
    args = parser.parse_args()

    # Ruta de salida relativa a la raíz del proyecto
    project_root = Path(__file__).parent.parent
    output_path = project_root / "data" / "raw" / "weather_data.csv"

    df = fetch_weather(city=args.city, days=args.days)
    save_data(df, output_path)

    # Vista previa
    print("\nPrimeras filas:")
    print(df.head())
    print("\nEstadísticas básicas:")
    print(df.describe().round(2))


if __name__ == "__main__":
    main()
