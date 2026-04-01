"""
train_model.py
--------------
Entrena un modelo de Random Forest para predecir la temperatura máxima
del día siguiente a partir de los datos históricos.

Uso:
    python src/train_model.py

Requiere haber ejecutado antes:
    python src/fetch_weather.py
"""

import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler

# ---------------------------------------------------------------------------
# Rutas del proyecto
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).parent.parent
DATA_PATH    = PROJECT_ROOT / "data" / "raw" / "weather_data.csv"
MODEL_PATH   = PROJECT_ROOT / "models" / "random_forest.pkl"


# ---------------------------------------------------------------------------
# 1. Cargar datos
# ---------------------------------------------------------------------------
def load_data(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(
            f"No se encontró {path}.\n"
            "Ejecuta primero: python src/fetch_weather.py"
        )
    df = pd.read_csv(path, index_col="date", parse_dates=True)
    print(f"Datos cargados: {df.shape[0]} filas, {df.shape[1]} columnas.")
    return df


# ---------------------------------------------------------------------------
# 2. Feature engineering
# ---------------------------------------------------------------------------
def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Crea características (features) a partir de la serie temporal.

    Lag features: valor de los días anteriores.
    Rolling features: medias móviles para capturar tendencias.
    Temporales: mes y día del año (útiles para estacionalidad).
    """
    target = "temperature_2m_max"

    # Lags: temperatura máxima de los últimos N días
    for lag in [1, 2, 3, 7]:
        df[f"temp_max_lag{lag}"] = df[target].shift(lag)

    # Media móvil de los últimos 7 días
    df["temp_max_rolling7"] = df[target].shift(1).rolling(7).mean()

    # Rango térmico del día anterior
    df["temp_range_lag1"] = (
        df["temperature_2m_max"].shift(1) - df["temperature_2m_min"].shift(1)
    )

    # Precipitación acumulada últimos 3 días
    df["precip_sum3"] = df["precipitation_sum"].shift(1).rolling(3).sum()

    # Componentes temporales (estacionalidad)
    df["month"] = df.index.month
    df["day_of_year"] = df.index.day_of_year

    # Eliminar filas con NaN generados por los lags/rolling
    df = df.dropna()

    return df


# ---------------------------------------------------------------------------
# 3. Preparar X e y
# ---------------------------------------------------------------------------
def prepare_xy(df: pd.DataFrame):
    target = "temperature_2m_max"

    # Features a usar
    feature_cols = [
        "temp_max_lag1", "temp_max_lag2", "temp_max_lag3", "temp_max_lag7",
        "temp_max_rolling7",
        "temp_range_lag1",
        "precip_sum3",
        "temperature_2m_min",
        "windspeed_10m_max",
        "shortwave_radiation_sum",
        "month",
        "day_of_year",
    ]
    # Usar solo las columnas que existen en el DataFrame
    feature_cols = [c for c in feature_cols if c in df.columns]

    X = df[feature_cols]
    y = df[target]

    return X, y, feature_cols


# ---------------------------------------------------------------------------
# 4. Entrenar y evaluar
# ---------------------------------------------------------------------------
def evaluate(name: str, y_true, y_pred) -> dict:
    mae  = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2   = r2_score(y_true, y_pred)
    print(f"  {name:20s}  MAE={mae:.2f}°C  RMSE={rmse:.2f}°C  R²={r2:.3f}")
    return {"model": name, "MAE": mae, "RMSE": rmse, "R2": r2}


def train_and_evaluate(X, y, feature_cols):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False  # sin mezclar, respeta el orden temporal
    )
    print(f"\nTrain: {len(X_train)} muestras | Test: {len(X_test)} muestras\n")

    results = []

    # Modelo 1: Regresión lineal (baseline simple)
    lr = LinearRegression()
    lr.fit(X_train, y_train)
    results.append(evaluate("Linear Regression", y_test, lr.predict(X_test)))

    # Modelo 2: Random Forest
    rf = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    results.append(evaluate("Random Forest", y_test, rf.predict(X_test)))

    return rf, X_test, y_test, feature_cols, results


# ---------------------------------------------------------------------------
# 5. Visualizaciones
# ---------------------------------------------------------------------------
def plot_predictions(rf, X_test, y_test):
    y_pred = rf.predict(X_test)
    dates  = X_test.index

    fig, axes = plt.subplots(2, 1, figsize=(12, 8))

    # Predicción vs real
    axes[0].plot(dates, y_test.values, label="Real", color="steelblue", linewidth=1.5)
    axes[0].plot(dates, y_pred, label="Predicho (RF)", color="tomato",
                 linewidth=1.5, linestyle="--")
    axes[0].set_title("Temperatura máxima: Real vs Predicha")
    axes[0].set_ylabel("Temperatura (°C)")
    axes[0].legend()
    axes[0].grid(alpha=0.3)

    # Importancia de features
    importances = pd.Series(rf.feature_importances_, index=X_test.columns).sort_values()
    importances.plot(kind="barh", ax=axes[1], color="steelblue")
    axes[1].set_title("Importancia de las variables (Random Forest)")
    axes[1].set_xlabel("Importancia")
    axes[1].grid(alpha=0.3, axis="x")

    plt.tight_layout()

    output_path = PROJECT_ROOT / "models" / "predictions_plot.png"
    plt.savefig(output_path, dpi=120)
    print(f"\nGráfica guardada en: {output_path}")
    plt.show()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 50)
    print("  Weather Forecast — Entrenamiento de modelo")
    print("=" * 50)

    df = load_data(DATA_PATH)
    df = build_features(df)

    X, y, feature_cols = prepare_xy(df)

    print(f"Features usadas ({len(feature_cols)}): {feature_cols}")
    print("\nEntrenando modelos...")
    rf, X_test, y_test, feature_cols, results = train_and_evaluate(X, y, feature_cols)

    # Guardar modelo
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(rf, MODEL_PATH)
    print(f"\nModelo guardado en: {MODEL_PATH}")

    # Visualizar
    plot_predictions(rf, X_test, y_test)


if __name__ == "__main__":
    main()
