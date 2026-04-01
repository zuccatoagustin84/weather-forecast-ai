# Weather Forecast AI

Proyecto de aprendizaje para predecir el clima usando Python y Machine Learning.

## Objetivo

Aprender los fundamentos del ML aplicados a series temporales de datos meteorológicos:
- Obtener datos reales de una API gratuita (Open-Meteo)
- Explorar y visualizar los datos
- Entrenar modelos de predicción básicos
- Evaluar y comparar resultados

## Estructura del proyecto

```
weather-forecast-ai/
├── data/
│   ├── raw/          # Datos descargados directamente de la API
│   └── processed/    # Datos limpios y transformados
├── models/           # Modelos entrenados guardados (.pkl)
├── notebooks/        # Jupyter notebooks para exploración
│   └── 01_data_exploration.ipynb
├── src/
│   ├── fetch_weather.py   # Descarga datos de Open-Meteo
│   └── train_model.py     # Entrena y evalúa modelos
├── requirements.txt
└── README.md
```

## Instalación

```bash
# Crear entorno virtual (recomendado)
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

# Instalar dependencias
pip install -r requirements.txt
```

## Uso rápido

### 1. Descargar datos históricos

```bash
python src/fetch_weather.py
```

Descarga los últimos 90 días de temperatura, precipitación y viento para Madrid.
Los datos se guardan en `data/raw/weather_data.csv`.

### 2. Explorar los datos

Abre el notebook en Jupyter:

```bash
jupyter notebook notebooks/01_data_exploration.ipynb
```

### 3. Entrenar un modelo

```bash
python src/train_model.py
```

Entrena un modelo de Random Forest para predecir la temperatura máxima del día siguiente.

## API utilizada

[Open-Meteo](https://open-meteo.com/) — API meteorológica gratuita, sin necesidad de registro ni API key.

## Conceptos que se practican

- Peticiones HTTP con `requests`
- Manipulación de datos con `pandas`
- Visualización con `matplotlib` y `seaborn`
- Feature engineering para series temporales (lag features)
- Modelos de regresión con `scikit-learn`
- Guardado y carga de modelos con `joblib`

## Ideas para seguir aprendiendo

- [ ] Probar con otras ciudades o variables (humedad, viento)
- [ ] Comparar Random Forest vs Gradient Boosting vs Redes Neuronales
- [ ] Añadir más features (día de la semana, mes, estación)
- [ ] Hacer un dashboard interactivo con Streamlit
- [ ] Predecir más de un día hacia adelante (multi-step forecasting)
