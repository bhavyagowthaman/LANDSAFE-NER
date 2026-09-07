"""
LANDSAFE NER - AI Risk Model
Trains a RandomForestRegressor on synthetically-generated but domain-informed
landslide conditioning data, and exposes predict_risk() with explainability.

Features used:
  rainfall (mm, last interval), soil_moisture (%), tilt (degrees),
  ground_movement (mm/interval), slope (degrees), elevation (m),
  historical_susceptibility (0-1)
"""
import os
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "landslide_model.joblib")

FEATURE_NAMES = [
    "rainfall", "soil_moisture", "tilt", "ground_movement", "slope", "elevation", "historical_susceptibility"
]

FEATURE_LABELS = {
    "rainfall": "Heavy Rainfall",
    "soil_moisture": "Soil Moisture",
    "tilt": "Slope Tilt",
    "ground_movement": "Ground Movement",
    "slope": "Terrain Slope",
    "elevation": "Elevation",
    "historical_susceptibility": "Historical Susceptibility",
}

FEATURE_ICONS = {
    "rainfall": "🌧️",
    "soil_moisture": "🌱",
    "tilt": "📐",
    "ground_movement": "📡",
    "slope": "⛰️",
    "elevation": "🗻",
    "historical_susceptibility": "🗺️",
}


def _synthetic_dataset(n=6000, seed=42):
    """Generates a physically-motivated synthetic dataset for training.
    This substitutes for a real historical landslide-inventory dataset,
    which is not available in this hackathon environment."""
    rng = np.random.RandomState(seed)
    rainfall = rng.gamma(2.0, 12.0, n)                     # mm, skewed towards low values with a heavy tail
    soil_moisture = rng.uniform(5, 100, n)                 # %
    tilt = rng.gamma(1.5, 1.0, n)                          # degrees
    ground_movement = rng.gamma(1.2, 0.8, n)               # mm
    slope = rng.uniform(5, 60, n)                          # degrees
    elevation = rng.uniform(200, 2200, n)                  # m
    historical = rng.beta(2, 2, n)                         # 0-1

    # Weighted physical model of landslide susceptibility (0-100), plus noise
    score = (
        0.30 * np.clip(rainfall / 60.0, 0, 1) +
        0.20 * np.clip(soil_moisture / 100.0, 0, 1) +
        0.15 * np.clip(tilt / 8.0, 0, 1) +
        0.15 * np.clip(ground_movement / 5.0, 0, 1) +
        0.10 * np.clip(slope / 60.0, 0, 1) +
        0.05 * (1 - np.clip((elevation - 200) / 2000.0, 0, 1) * 0.3) +
        0.05 * historical
    ) * 100

    # interaction effect: heavy rain + high soil moisture compounds risk
    interaction = np.clip((rainfall / 60.0) * (soil_moisture / 100.0), 0, 1) * 15
    score = score + interaction + rng.normal(0, 4, n)
    score = np.clip(score, 0, 100)

    X = np.column_stack([rainfall, soil_moisture, tilt, ground_movement, slope, elevation, historical])
    y = score
    return X, y


def train_and_save():
    X, y = _synthetic_dataset()
    model = RandomForestRegressor(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)
    return model


def load_model():
    if not os.path.exists(MODEL_PATH):
        return train_and_save()
    try:
        return joblib.load(MODEL_PATH)
    except Exception:
        return train_and_save()


_MODEL = None


def get_model():
    global _MODEL
    if _MODEL is None:
        _MODEL = load_model()
    return _MODEL


def classify(score):
    if score <= 30:
        return "LOW"
    elif score <= 60:
        return "MEDIUM"
    elif score <= 80:
        return "HIGH"
    else:
        return "CRITICAL"


def estimate_window(score, level):
    """Human-readable, appropriately-hedged early warning window."""
    if level == "CRITICAL":
        return "1-3 Hours"
    elif level == "HIGH":
        return "3-8 Hours"
    elif level == "MEDIUM":
        return "12-24 Hours"
    else:
        return "No immediate window"


def predict_risk(features: dict):
    """features: dict with keys in FEATURE_NAMES (missing keys default sensibly)."""
    model = get_model()
    x = np.array([[float(features.get(f, 0)) for f in FEATURE_NAMES]])
    score = float(model.predict(x)[0])
    score = round(max(0, min(100, score)), 1)
    level = classify(score)

    # Confidence: based on agreement across the forest's trees (lower variance -> higher confidence)
    tree_preds = np.array([t.predict(x)[0] for t in model.estimators_])
    std = float(np.std(tree_preds))
    confidence = round(max(55, min(97, 97 - std * 3)), 1)

    window = estimate_window(score, level)

    # Explainability: combine global feature importances with this instance's normalized feature values
    importances = model.feature_importances_
    contributions = []
    max_norms = {"rainfall": 60.0, "soil_moisture": 100.0, "tilt": 8.0, "ground_movement": 5.0,
                 "slope": 60.0, "elevation": 2200.0, "historical_susceptibility": 1.0}
    for i, f in enumerate(FEATURE_NAMES):
        norm_val = min(1.0, float(features.get(f, 0)) / max_norms[f]) if max_norms[f] else 0
        contribution = importances[i] * norm_val
        contributions.append({
            "feature": f,
            "label": FEATURE_LABELS[f],
            "icon": FEATURE_ICONS[f],
            "importance": round(float(importances[i]) * 100, 1),
            "contribution": round(float(contribution) * 100, 1),
        })
    contributions.sort(key=lambda c: c["contribution"], reverse=True)
    total_contrib = sum(c["contribution"] for c in contributions) or 1
    for c in contributions:
        pct = (c["contribution"] / total_contrib) * 100
        c["impact"] = "HIGH IMPACT" if pct >= 25 else ("MODERATE IMPACT" if pct >= 12 else "LOW IMPACT")

    return {
        "risk_score": score,
        "risk_level": level,
        "confidence": confidence,
        "estimated_window": window,
        "explanation": contributions,
    }
