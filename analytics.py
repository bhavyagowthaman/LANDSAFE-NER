from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from database import get_db
from auth_utils import login_required

analytics_bp = Blueprint("analytics", __name__)

RANGE_HOURS = {"1h": 1, "6h": 6, "24h": 24, "7d": 24 * 7}


@analytics_bp.route("/analytics", methods=["GET"])
@login_required
def analytics():
    range_key = request.args.get("range", "24h")
    sensor_id = request.args.get("sensor_id")
    hours = RANGE_HOURS.get(range_key, 24)
    since = (datetime.utcnow() - timedelta(hours=hours)).isoformat()

    conn = get_db()
    if sensor_id:
        readings = conn.execute(
            "SELECT * FROM sensor_readings WHERE sensor_id=? AND timestamp>=? ORDER BY timestamp ASC",
            (sensor_id, since)
        ).fetchall()
        predictions = conn.execute(
            "SELECT * FROM risk_predictions WHERE sensor_id=? AND timestamp>=? ORDER BY timestamp ASC",
            (sensor_id, since)
        ).fetchall()
    else:
        readings = conn.execute(
            "SELECT * FROM sensor_readings WHERE timestamp>=? ORDER BY timestamp ASC", (since,)
        ).fetchall()
        predictions = conn.execute(
            "SELECT * FROM risk_predictions WHERE timestamp>=? ORDER BY timestamp ASC", (since,)
        ).fetchall()
    conn.close()

    # Downsample to at most ~60 points for chart friendliness
    def downsample(rows):
        if len(rows) <= 60:
            return rows
        step = len(rows) // 60
        return rows[::step]

    readings = downsample(readings)
    predictions = downsample(predictions)

    return jsonify({
        "range": range_key,
        "rainfall": [{"t": r["timestamp"], "v": r["rainfall"]} for r in readings],
        "soil_moisture": [{"t": r["timestamp"], "v": r["soil_moisture"]} for r in readings],
        "tilt": [{"t": r["timestamp"], "v": r["tilt"]} for r in readings],
        "ground_movement": [{"t": r["timestamp"], "v": r["ground_movement"]} for r in readings],
        "risk_score": [{"t": p["timestamp"], "v": p["risk_score"]} for p in predictions],
    }), 200
