"""
predict_rain.py
---------------
Predice la probabilidad de lluvia para el dia siguiente y clasifica
su intensidad (sin lluvia / lluvia leve / lluvia pesada).

Usa un RandomForestClassifier con probabilidades calibradas.

Uso:
    python src/predict_rain.py
    python src/predict_rain.py --city london --days 365

Requiere haber ejecutado antes:
    python src/fetch_weather.py
"""

import argparse
import joblib
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    brier_score_loss,
    roc_auc_score,
)
from sklearn.calibration import calibration_curve

# ---------------------------------------------------------------------------
# Rutas del proyecto
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "raw" / "weather_data.csv"
MODEL_PATH = PROJECT_ROOT / "models" / "rain_classifier.pkl"

# ---------------------------------------------------------------------------
# Umbrales de precipitacion (mm/dia)
# ---------------------------------------------------------------------------
RAIN_THRESHOLD = 1.0       # >= 1 mm se considera lluvia
HEAVY_THRESHOLD = 10.0     # >= 10 mm se considera lluvia pesada


# ---------------------------------------------------------------------------
# 1. Cargar datos
# ---------------------------------------------------------------------------
def load_data(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(
            f"No se encontro {path}.\n"
            "Ejecuta primero: python src/fetch_weather.py"
        )
    df = pd.read_csv(path, index_col="date", parse_dates=True)
    print(f"Datos cargados: {df.shape[0]} filas, {df.shape[1]} columnas.")
    return df


# ---------------------------------------------------------------------------
# 2. Crear target y features
# ---------------------------------------------------------------------------
def build_rain_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Crea las variables objetivo y features para prediccion de lluvia.

    Target binario:  rain_tomorrow  (0 = no llueve, 1 = llueve)
    Target 3 clases: rain_intensity (0 = seco, 1 = leve, 2 = pesado)
    """
    precip = df["precipitation_sum"]

    # --- Targets (dia siguiente) ---
    next_precip = precip.shift(-1)
    df["rain_tomorrow"] = (next_precip >= RAIN_THRESHOLD).astype(int)
    df["rain_intensity"] = pd.cut(
        next_precip,
        bins=[-np.inf, RAIN_THRESHOLD, HEAVY_THRESHOLD, np.inf],
        labels=[0, 1, 2],
    ).astype(int)

    # --- Features basadas en precipitacion ---
    df["precip_lag1"] = precip.shift(1)
    df["precip_lag2"] = precip.shift(2)
    df["precip_lag3"] = precip.shift(3)
    df["precip_rolling3"] = precip.shift(1).rolling(3).mean()
    df["precip_rolling7"] = precip.shift(1).rolling(7).mean()
    df["days_since_rain"] = _days_since_rain(precip)

    # --- Features de temperatura ---
    df["temp_range"] = df["temperature_2m_max"] - df["temperature_2m_min"]
    df["temp_mean_lag1"] = df["temperature_2m_mean"].shift(1)
    df["temp_drop"] = df["temperature_2m_mean"].diff()

    # --- Viento y radiacion ---
    df["wind_lag1"] = df["windspeed_10m_max"].shift(1)
    df["radiation_lag1"] = df["shortwave_radiation_sum"].shift(1)
    df["radiation_drop"] = df["shortwave_radiation_sum"].diff()

    # --- Estacionalidad ---
    df["month"] = df.index.month
    df["day_of_year"] = df.index.day_of_year

    # Eliminar filas con NaN
    df = df.dropna()

    return df


def _days_since_rain(precip: pd.Series) -> pd.Series:
    """Calcula cuantos dias pasaron desde la ultima lluvia."""
    is_rain = precip >= RAIN_THRESHOLD
    groups = is_rain.cumsum()
    days = groups.groupby(groups).cumcount()
    days[is_rain] = 0
    return days


# ---------------------------------------------------------------------------
# 3. Preparar X e y
# ---------------------------------------------------------------------------
FEATURE_COLS = [
    "precip_lag1", "precip_lag2", "precip_lag3",
    "precip_rolling3", "precip_rolling7",
    "days_since_rain",
    "temp_range", "temp_mean_lag1", "temp_drop",
    "wind_lag1", "radiation_lag1", "radiation_drop",
    "month", "day_of_year",
]


def prepare_xy(df: pd.DataFrame, target: str = "rain_tomorrow"):
    feature_cols = [c for c in FEATURE_COLS if c in df.columns]
    X = df[feature_cols]
    y = df[target]
    return X, y, feature_cols


# ---------------------------------------------------------------------------
# 4. Entrenar y evaluar
# ---------------------------------------------------------------------------
def train_binary(X, y, feature_cols):
    """Entrena clasificadores para llueve / no llueve."""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )
    print(f"\nTrain: {len(X_train)} | Test: {len(X_test)}")
    print(f"Distribucion en test: {y_test.value_counts().to_dict()}")

    results = {}

    # --- Random Forest ---
    rf = RandomForestClassifier(
        n_estimators=200, random_state=42, n_jobs=-1, class_weight="balanced"
    )
    rf.fit(X_train, y_train)
    rf_probs = rf.predict_proba(X_test)[:, 1]
    results["Random Forest"] = _eval_binary(y_test, rf.predict(X_test), rf_probs)

    # --- Gradient Boosting ---
    gb = GradientBoostingClassifier(
        n_estimators=200, random_state=42, max_depth=4, learning_rate=0.1
    )
    gb.fit(X_train, y_train)
    gb_probs = gb.predict_proba(X_test)[:, 1]
    results["Gradient Boosting"] = _eval_binary(y_test, gb.predict(X_test), gb_probs)

    # Elegir el mejor por AUC
    best_name = max(results, key=lambda k: results[k]["auc"])
    best_model = rf if best_name == "Random Forest" else gb
    best_probs = rf_probs if best_name == "Random Forest" else gb_probs
    print(f"\nMejor modelo: {best_name} (AUC={results[best_name]['auc']:.3f})")

    return best_model, best_name, X_test, y_test, best_probs, feature_cols


def _eval_binary(y_true, y_pred, y_probs) -> dict:
    auc = roc_auc_score(y_true, y_probs)
    brier = brier_score_loss(y_true, y_probs)
    print(f"\n  AUC={auc:.3f}  Brier={brier:.3f}")
    print(classification_report(y_true, y_pred, target_names=["No llueve", "Llueve"]))
    return {"auc": auc, "brier": brier}


# ---------------------------------------------------------------------------
# 5. Clasificacion de intensidad
# ---------------------------------------------------------------------------
def train_intensity(X, y, feature_cols):
    """Entrena un clasificador de 3 clases: seco / leve / pesado."""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )

    rf = RandomForestClassifier(
        n_estimators=200, random_state=42, n_jobs=-1, class_weight="balanced"
    )
    rf.fit(X_train, y_train)
    y_pred = rf.predict(X_test)

    print("\n--- Clasificacion de intensidad ---")
    print(f"Train: {len(X_train)} | Test: {len(X_test)}")
    labels = ["Seco", "Lluvia leve", "Lluvia pesada"]
    print(classification_report(y_test, y_pred, target_names=labels, zero_division=0))

    # Probabilidades por clase
    probs = rf.predict_proba(X_test)
    print("Ejemplo de probabilidades (ultimos 5 dias):")
    prob_df = pd.DataFrame(probs[-5:], columns=labels, index=X_test.index[-5:])
    print(prob_df.round(3))

    return rf


# ---------------------------------------------------------------------------
# 6. Visualizaciones
# ---------------------------------------------------------------------------
def plot_results(model, X_test, y_test, probs, feature_cols):
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    # 1. Curva de calibracion
    fraction_pos, mean_predicted = calibration_curve(y_test, probs, n_bins=8)
    axes[0, 0].plot(mean_predicted, fraction_pos, "s-", color="steelblue", label="Modelo")
    axes[0, 0].plot([0, 1], [0, 1], "--", color="gray", label="Perfecta")
    axes[0, 0].set_xlabel("Probabilidad predicha")
    axes[0, 0].set_ylabel("Fraccion real de lluvia")
    axes[0, 0].set_title("Curva de calibracion")
    axes[0, 0].legend()
    axes[0, 0].grid(alpha=0.3)

    # 2. Distribucion de probabilidades
    axes[0, 1].hist(probs[y_test == 0], bins=20, alpha=0.6, label="No llueve",
                     color="steelblue", density=True)
    axes[0, 1].hist(probs[y_test == 1], bins=20, alpha=0.6, label="Llueve",
                     color="tomato", density=True)
    axes[0, 1].set_xlabel("Probabilidad predicha de lluvia")
    axes[0, 1].set_ylabel("Densidad")
    axes[0, 1].set_title("Distribucion de probabilidades")
    axes[0, 1].legend()
    axes[0, 1].grid(alpha=0.3)

    # 3. Importancia de features
    importances = pd.Series(
        model.feature_importances_, index=feature_cols
    ).sort_values()
    importances.plot(kind="barh", ax=axes[1, 0], color="steelblue")
    axes[1, 0].set_title("Importancia de variables")
    axes[1, 0].set_xlabel("Importancia")
    axes[1, 0].grid(alpha=0.3, axis="x")

    # 4. Probabilidad de lluvia en el tiempo
    dates = X_test.index
    axes[1, 1].fill_between(dates, probs, alpha=0.3, color="steelblue")
    axes[1, 1].plot(dates, probs, color="steelblue", linewidth=1)
    rain_days = y_test == 1
    axes[1, 1].scatter(dates[rain_days], probs[rain_days],
                        color="tomato", s=20, zorder=3, label="Dias de lluvia real")
    axes[1, 1].axhline(0.5, color="gray", linestyle="--", alpha=0.5)
    axes[1, 1].set_xlabel("Fecha")
    axes[1, 1].set_ylabel("P(lluvia)")
    axes[1, 1].set_title("Probabilidad de lluvia en el tiempo")
    axes[1, 1].legend()
    axes[1, 1].grid(alpha=0.3)

    plt.tight_layout()
    output_path = PROJECT_ROOT / "models" / "rain_probability.png"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=120)
    print(f"\nGrafica guardada en: {output_path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Prediccion probabilistica de lluvia")
    parser.add_argument("--city", default="madrid",
                        help="Ciudad (debe coincidir con los datos descargados)")
    parser.add_argument("--days", type=int, default=365,
                        help="Dias de datos a usar (default: 365)")
    args = parser.parse_args()

    print("=" * 55)
    print("  Weather Forecast — Probabilidad de lluvia")
    print("=" * 55)

    df = load_data(DATA_PATH)
    df = build_rain_features(df)

    # --- Modelo binario: llueve / no llueve ---
    X_bin, y_bin, feature_cols = prepare_xy(df, target="rain_tomorrow")
    print(f"\nFeatures ({len(feature_cols)}): {feature_cols}")
    model, model_name, X_test, y_test, probs, feature_cols = train_binary(
        X_bin, y_bin, feature_cols
    )

    # --- Modelo de intensidad: seco / leve / pesado ---
    X_int, y_int, _ = prepare_xy(df, target="rain_intensity")
    intensity_model = train_intensity(X_int, y_int, feature_cols)

    # --- Guardar modelos ---
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {"binary": model, "intensity": intensity_model, "features": feature_cols},
        MODEL_PATH,
    )
    print(f"\nModelos guardados en: {MODEL_PATH}")

    # --- Visualizar ---
    plot_results(model, X_test, y_test, probs, feature_cols)

    # --- Prediccion para manana ---
    print("\n" + "=" * 55)
    print("  Prediccion para manana")
    print("=" * 55)
    last_row = X_bin.iloc[[-1]]
    prob_rain = model.predict_proba(last_row)[0, 1]
    intensity_probs = intensity_model.predict_proba(last_row)[0]
    labels = ["Seco", "Lluvia leve", "Lluvia pesada"]

    print(f"\n  Probabilidad de lluvia: {prob_rain:.1%}")
    print(f"  Veredicto: {'Llueve' if prob_rain >= 0.5 else 'No llueve'}")
    print("\n  Desglose por intensidad:")
    for label, p in zip(labels, intensity_probs):
        bar = "#" * int(p * 30)
        print(f"    {label:16s} {p:6.1%}  {bar}")


if __name__ == "__main__":
    main()
