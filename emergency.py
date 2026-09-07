from datetime import datetime
from flask import Blueprint, request, jsonify
from database import get_db
from auth_utils import login_required

emergency_bp = Blueprint("emergency", __name__)

VALID_ACTIONS = {"road_closure", "evacuation", "emergency_alert", "acknowledge_emergency"}

ACTION_LABELS = {
    "road_closure": "Road Closure Simulated",
    "evacuation": "Evacuation Simulated",
    "emergency_alert": "Emergency Alert Sent",
    "acknowledge_emergency": "Emergency Acknowledged",
}


@emergency_bp.route("/emergency-action", methods=["POST"])
@login_required
def emergency_action():
    data = request.get_json(silent=True) or {}
    action = data.get("action")
    alert_id = data.get("alert_id")
    details = data.get("details", "")

    if action not in VALID_ACTIONS:
        return jsonify({"error": "Invalid action type."}), 400

    now = datetime.utcnow().isoformat()
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO emergency_actions (alert_id, action, status, details, timestamp) VALUES (?,?,?,?,?)",
        (alert_id, action, "completed", details or ACTION_LABELS.get(action, action), now)
    )
    conn.commit()

    if action == "acknowledge_emergency" and alert_id:
        conn.execute("UPDATE alerts SET status='acknowledged' WHERE id=?", (alert_id,))
        conn.commit()

    action_id = cur.lastrowid
    conn.close()
    return jsonify({
        "message": ACTION_LABELS.get(action, "Action recorded."),
        "action_id": action_id
    }), 201


@emergency_bp.route("/emergency-action", methods=["GET"])
@login_required
def list_emergency_actions():
    conn = get_db()
    rows = conn.execute("SELECT * FROM emergency_actions ORDER BY timestamp DESC LIMIT 100").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows]), 200


@emergency_bp.route("/emergency-status", methods=["GET"])
@login_required
def emergency_status():
    """Returns whether emergency mode is active (any CRITICAL alert active) plus context."""
    conn = get_db()
    critical_alert = conn.execute(
        "SELECT * FROM alerts WHERE risk_level='CRITICAL' AND status='active' ORDER BY timestamp DESC LIMIT 1"
    ).fetchone()
    result = {"emergency_active": bool(critical_alert)}
    if critical_alert:
        sensor = conn.execute("SELECT * FROM sensors WHERE sensor_id=?", (critical_alert["sensor_id"],)).fetchone()
        prediction = conn.execute(
            "SELECT * FROM risk_predictions WHERE sensor_id=? ORDER BY timestamp DESC LIMIT 1",
            (critical_alert["sensor_id"],)
        ).fetchone()
        reading = conn.execute(
            "SELECT * FROM sensor_readings WHERE sensor_id=? ORDER BY timestamp DESC LIMIT 1",
            (critical_alert["sensor_id"],)
        ).fetchone()
        result.update({
            "alert": dict(critical_alert),
            "sensor": dict(sensor) if sensor else None,
            "prediction": dict(prediction) if prediction else None,
            "reading": dict(reading) if reading else None,
        })
    conn.close()
    return jsonify(result), 200
