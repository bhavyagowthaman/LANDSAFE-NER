from datetime import datetime
from flask import Blueprint, request, jsonify
from database import get_db
from auth_utils import login_required

alerts_bp = Blueprint("alerts", __name__)


@alerts_bp.route("/alerts", methods=["GET"])
@login_required
def list_alerts():
    status_filter = request.args.get("status")
    conn = get_db()
    if status_filter and status_filter != "all":
        rows = conn.execute("SELECT * FROM alerts WHERE status=? ORDER BY timestamp DESC", (status_filter,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM alerts ORDER BY timestamp DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows]), 200


@alerts_bp.route("/alerts", methods=["POST"])
@login_required
def create_alert():
    data = request.get_json(silent=True) or {}
    location = data.get("location")
    risk_level = data.get("risk_level", "WARNING")
    message = data.get("message")
    if not location or not message:
        return jsonify({"error": "location and message are required."}), 400

    now = datetime.utcnow().isoformat()
    conn = get_db()
    cur = conn.execute(
        """INSERT INTO alerts (location, sensor_id, risk_level, message, status, channel, timestamp)
           VALUES (?,?,?,?,?,?,?)""",
        (location, data.get("sensor_id"), risk_level, message, "active",
         data.get("channel", "system,sms,push"), now)
    )
    conn.commit()
    alert_id = cur.lastrowid
    conn.close()
    return jsonify({"message": "Emergency alert sent.", "alert_id": alert_id}), 201


@alerts_bp.route("/alerts/<int:alert_id>", methods=["PUT"])
@login_required
def update_alert(alert_id):
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    if new_status not in ("active", "acknowledged", "resolved"):
        return jsonify({"error": "status must be one of active, acknowledged, resolved."}), 400
    conn = get_db()
    row = conn.execute("SELECT * FROM alerts WHERE id=?", (alert_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Alert not found."}), 404
    conn.execute("UPDATE alerts SET status=? WHERE id=?", (new_status, alert_id))
    conn.commit()
    conn.close()
    return jsonify({"message": f"Alert marked as {new_status}."}), 200
