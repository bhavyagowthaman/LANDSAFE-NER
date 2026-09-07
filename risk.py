from flask import Blueprint, request, jsonify
from database import get_db
from auth_utils import login_required
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ai_model.risk_model import predict_risk, FEATURE_NAMES

risk_bp = Blueprint("risk", __name__)


@risk_bp.route("/predict-risk", methods=["POST"])
@login_required
def predict_risk_route():
    """Manual/ad-hoc prediction endpoint - accepts raw feature values directly."""
    data = request.get_json(silent=True) or {}
    features = {f: data.get(f, 0) for f in FEATURE_NAMES}
    result = predict_risk(features)
    return jsonify(result), 200


@risk_bp.route("/risk", methods=["GET"])
@login_required
def overall_risk():
    """Dashboard-level aggregate: overall risk score, status, counts."""
    conn = get_db()
    sensors = conn.execute("SELECT * FROM sensors").fetchall()

    predictions = []
    for s in sensors:
        p = conn.execute(
            "SELECT * FROM risk_predictions WHERE sensor_id=? ORDER BY timestamp DESC LIMIT 1",
            (s["sensor_id"],)
        ).fetchone()
        if p:
            predictions.append({"sensor": dict(s), "prediction": dict(p)})

    conn.close()

    if not predictions:
        return jsonify({
            "overall_risk_score": 0, "overall_status": "LOW", "active_alerts": 0,
            "online_sensors": 0, "total_sensors": len(sensors), "high_risk_zones": 0,
            "estimated_critical_window": "N/A", "sensors": []
        }), 200

    scores = [p["prediction"]["risk_score"] for p in predictions]
    overall_score = round(max(scores), 1)  # worst-case governs overall status (conservative early warning)
    level_rank = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
    worst = max(predictions, key=lambda p: level_rank.get(p["prediction"]["risk_level"], 0))

    online = sum(1 for s in sensors if s["status"] == "online")
    high_risk_zones = sum(1 for p in predictions if p["prediction"]["risk_level"] in ("HIGH", "CRITICAL"))

    conn2 = get_db()
    active_alerts = conn2.execute("SELECT COUNT(*) c FROM alerts WHERE status='active'").fetchone()["c"]
    conn2.close()

    return jsonify({
        "overall_risk_score": overall_score,
        "overall_status": worst["prediction"]["risk_level"],
        "active_alerts": active_alerts,
        "online_sensors": online,
        "total_sensors": len(sensors),
        "high_risk_zones": high_risk_zones,
        "estimated_critical_window": worst["prediction"]["estimated_window"],
        "worst_sensor": worst["sensor"]["sensor_id"],
        "worst_location": worst["sensor"]["location"],
        "sensors": [{"sensor_id": p["sensor"]["sensor_id"], "location": p["sensor"]["location"],
                      "latitude": p["sensor"]["latitude"], "longitude": p["sensor"]["longitude"],
                      **p["prediction"]} for p in predictions]
    }), 200
