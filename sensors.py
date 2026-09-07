import random
import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from database import get_db
from auth_utils import login_required
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ai_model.risk_model import predict_risk

sensors_bp = Blueprint("sensors", __name__)


def _latest_reading(conn, sensor_id):
    return conn.execute(
        "SELECT * FROM sensor_readings WHERE sensor_id=? ORDER BY timestamp DESC LIMIT 1",
        (sensor_id,)
    ).fetchone()


def _latest_prediction(conn, sensor_id):
    return conn.execute(
        "SELECT * FROM risk_predictions WHERE sensor_id=? ORDER BY timestamp DESC LIMIT 1",
        (sensor_id,)
    ).fetchone()


def sensor_to_dict(conn, row):
    reading = _latest_reading(conn, row["sensor_id"])
    prediction = _latest_prediction(conn, row["sensor_id"])
    return {
        "id": row["id"],
        "sensor_id": row["sensor_id"],
        "type": row["type"],
        "location": row["location"],
        "state": row["state"],
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "status": row["status"],
        "battery": row["battery"],
        "active": bool(row["active"]),
        "slope": row["slope"],
        "elevation": row["elevation"],
        "historical_susceptibility": row["historical_susceptibility"],
        "created_at": row["created_at"],
        "latest_reading": dict(reading) if reading else None,
        "latest_prediction": dict(prediction) if prediction else None,
    }


@sensors_bp.route("/sensors", methods=["GET"])
@login_required
def list_sensors():
    conn = get_db()
    rows = conn.execute("SELECT * FROM sensors ORDER BY sensor_id").fetchall()
    result = [sensor_to_dict(conn, r) for r in rows]
    conn.close()
    return jsonify(result), 200


@sensors_bp.route("/sensors/<sensor_id>", methods=["GET"])
@login_required
def get_sensor(sensor_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM sensors WHERE sensor_id=?", (sensor_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Sensor not found."}), 404
    result = sensor_to_dict(conn, row)
    history = conn.execute(
        "SELECT * FROM sensor_readings WHERE sensor_id=? ORDER BY timestamp DESC LIMIT 200",
        (sensor_id,)
    ).fetchall()
    result["history"] = [dict(h) for h in reversed(history)]
    conn.close()
    return jsonify(result), 200


@sensors_bp.route("/sensors", methods=["POST"])
@login_required
def create_sensor():
    data = request.get_json(silent=True) or {}
    required = ["sensor_id", "type", "latitude", "longitude", "location"]
    if not all(data.get(f) not in (None, "") for f in required):
        return jsonify({"error": "sensor_id, type, latitude, longitude, and location are required."}), 400

    conn = get_db()
    existing = conn.execute("SELECT id FROM sensors WHERE sensor_id=?", (data["sensor_id"],)).fetchone()
    if existing:
        conn.close()
        return jsonify({"error": "A sensor with this ID already exists."}), 409

    now = datetime.utcnow().isoformat()
    conn.execute(
        """INSERT INTO sensors (sensor_id, type, latitude, longitude, location, state, status, battery,
           slope, elevation, historical_susceptibility, active, created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (data["sensor_id"], data["type"], float(data["latitude"]), float(data["longitude"]),
         data["location"], data.get("state", ""), data.get("status", "online"),
         int(data.get("battery", 100)), float(data.get("slope", 30)), float(data.get("elevation", 800)),
         float(data.get("historical_susceptibility", 0.5)), 1, now)
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Sensor created successfully."}), 201


@sensors_bp.route("/sensors/<sensor_id>", methods=["PUT"])
@login_required
def update_sensor(sensor_id):
    data = request.get_json(silent=True) or {}
    conn = get_db()
    row = conn.execute("SELECT * FROM sensors WHERE sensor_id=?", (sensor_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Sensor not found."}), 404

    fields = {
        "type": data.get("type", row["type"]),
        "location": data.get("location", row["location"]),
        "state": data.get("state", row["state"]),
        "status": data.get("status", row["status"]),
        "battery": int(data.get("battery", row["battery"])),
        "latitude": float(data.get("latitude", row["latitude"])),
        "longitude": float(data.get("longitude", row["longitude"])),
        "slope": float(data.get("slope", row["slope"])),
        "elevation": float(data.get("elevation", row["elevation"])),
        "historical_susceptibility": float(data.get("historical_susceptibility", row["historical_susceptibility"])),
        "active": int(data.get("active", row["active"])),
    }
    conn.execute(
        """UPDATE sensors SET type=:type, location=:location, state=:state, status=:status,
           battery=:battery, latitude=:latitude, longitude=:longitude, slope=:slope,
           elevation=:elevation, historical_susceptibility=:historical_susceptibility, active=:active
           WHERE sensor_id=:sensor_id""",
        {**fields, "sensor_id": sensor_id}
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Sensor updated successfully."}), 200


@sensors_bp.route("/sensors/<sensor_id>", methods=["DELETE"])
@login_required
def delete_sensor(sensor_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM sensors WHERE sensor_id=?", (sensor_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Sensor not found."}), 404
    conn.execute("DELETE FROM sensors WHERE sensor_id=?", (sensor_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Sensor deleted successfully."}), 200


def _run_prediction_and_alert(conn, sensor_row, reading):
    """Runs the AI model on a reading, stores prediction, and raises an alert if needed."""
    features = {
        "rainfall": reading["rainfall"],
        "soil_moisture": reading["soil_moisture"],
        "tilt": reading["tilt"],
        "ground_movement": reading["ground_movement"],
        "slope": sensor_row["slope"],
        "elevation": sensor_row["elevation"],
        "historical_susceptibility": sensor_row["historical_susceptibility"],
    }
    result = predict_risk(features)
    now = datetime.utcnow().isoformat()
    conn.execute(
        """INSERT INTO risk_predictions (sensor_id, risk_score, risk_level, confidence, estimated_window, explanation, timestamp)
           VALUES (?,?,?,?,?,?,?)""",
        (sensor_row["sensor_id"], result["risk_score"], result["risk_level"], result["confidence"],
         result["estimated_window"], json.dumps(result["explanation"]), now)
    )

    if result["risk_level"] in ("HIGH", "CRITICAL"):
        existing_active = conn.execute(
            "SELECT id FROM alerts WHERE location=? AND status='active' AND risk_level=?",
            (sensor_row["location"], result["risk_level"])
        ).fetchone()
        if not existing_active:
            msg = (f"{result['risk_level']} landslide risk detected at {sensor_row['location']} "
                   f"(Risk Score: {result['risk_score']}/100). "
                   f"Estimated critical window: Next {result['estimated_window']}. "
                   f"Avoid the affected area and follow local authority instructions.")
            conn.execute(
                """INSERT INTO alerts (location, sensor_id, risk_level, message, status, channel, timestamp)
                   VALUES (?,?,?,?,?,?,?)""",
                (sensor_row["location"], sensor_row["sensor_id"], result["risk_level"], msg, "active",
                 "system,sms,push,siren", now)
            )
    conn.commit()
    return result


@sensors_bp.route("/sensor-data", methods=["POST"])
@login_required
def ingest_sensor_data():
    """Accepts a single reading (real or simulated) and runs it through the AI pipeline."""
    data = request.get_json(silent=True) or {}
    sensor_id = data.get("sensor_id")
    if not sensor_id:
        return jsonify({"error": "sensor_id is required."}), 400

    conn = get_db()
    sensor_row = conn.execute("SELECT * FROM sensors WHERE sensor_id=?", (sensor_id,)).fetchone()
    if not sensor_row:
        conn.close()
        return jsonify({"error": "Sensor not found."}), 404

    now = datetime.utcnow().isoformat()
    reading_values = {
        "rainfall": float(data.get("rainfall", 0)),
        "soil_moisture": float(data.get("soil_moisture", 0)),
        "tilt": float(data.get("tilt", 0)),
        "ground_movement": float(data.get("ground_movement", 0)),
        "temperature": float(data.get("temperature", random.uniform(15, 25))),
        "humidity": float(data.get("humidity", random.uniform(50, 90))),
    }
    conn.execute(
        """INSERT INTO sensor_readings (sensor_id, rainfall, soil_moisture, tilt, ground_movement,
           temperature, humidity, timestamp) VALUES (?,?,?,?,?,?,?,?)""",
        (sensor_id, reading_values["rainfall"], reading_values["soil_moisture"], reading_values["tilt"],
         reading_values["ground_movement"], reading_values["temperature"], reading_values["humidity"], now)
    )
    conn.commit()
    reading_values["timestamp"] = now
    result = _run_prediction_and_alert(conn, sensor_row, reading_values)
    conn.close()
    return jsonify({"message": "Reading ingested.", "prediction": result}), 201


SCENARIO_PROFILES = {
    "normal": {"rainfall": (2, 8), "soil_moisture": (15, 35), "tilt": (0.1, 0.6), "ground_movement": (0.0, 0.3)},
    "heavy_rainfall": {"rainfall": (45, 70), "soil_moisture": (35, 55), "tilt": (0.3, 1.0), "ground_movement": (0.1, 0.5)},
    "high_soil_moisture": {"rainfall": (15, 30), "soil_moisture": (70, 95), "tilt": (0.5, 1.5), "ground_movement": (0.2, 0.8)},
    "ground_movement": {"rainfall": (10, 25), "soil_moisture": (40, 60), "tilt": (2.0, 4.0), "ground_movement": (2.5, 5.0)},
    "critical": {"rainfall": (55, 80), "soil_moisture": (80, 98), "tilt": (4.5, 7.5), "ground_movement": (3.5, 6.0)},
}


@sensors_bp.route("/simulate", methods=["POST"])
@login_required
def simulate_scenario():
    """Applies a named scenario profile to one sensor (or all sensors) and runs prediction."""
    data = request.get_json(silent=True) or {}
    scenario = data.get("scenario", "normal")
    sensor_id = data.get("sensor_id")  # if None -> apply to all active sensors

    if scenario not in SCENARIO_PROFILES:
        return jsonify({"error": "Unknown scenario."}), 400

    profile = SCENARIO_PROFILES[scenario]
    conn = get_db()
    if sensor_id:
        sensor_rows = conn.execute("SELECT * FROM sensors WHERE sensor_id=?", (sensor_id,)).fetchall()
    else:
        sensor_rows = conn.execute("SELECT * FROM sensors WHERE active=1").fetchall()

    results = []
    now = datetime.utcnow().isoformat()
    for sensor_row in sensor_rows:
        reading = {
            "rainfall": round(random.uniform(*profile["rainfall"]), 1),
            "soil_moisture": round(random.uniform(*profile["soil_moisture"]), 1),
            "tilt": round(random.uniform(*profile["tilt"]), 2),
            "ground_movement": round(random.uniform(*profile["ground_movement"]), 2),
            "temperature": round(random.uniform(15, 25), 1),
            "humidity": round(random.uniform(50, 95), 1),
        }
        conn.execute(
            """INSERT INTO sensor_readings (sensor_id, rainfall, soil_moisture, tilt, ground_movement,
               temperature, humidity, timestamp) VALUES (?,?,?,?,?,?,?,?)""",
            (sensor_row["sensor_id"], reading["rainfall"], reading["soil_moisture"], reading["tilt"],
             reading["ground_movement"], reading["temperature"], reading["humidity"], now)
        )
        conn.commit()
        reading["timestamp"] = now
        result = _run_prediction_and_alert(conn, sensor_row, reading)
        results.append({"sensor_id": sensor_row["sensor_id"], "reading": reading, "prediction": result})

    conn.close()
    return jsonify({"message": f"Scenario '{scenario}' applied.", "results": results}), 200


@sensors_bp.route("/simulate/reset", methods=["POST"])
@login_required
def reset_simulation():
    conn = get_db()
    conn.execute("UPDATE sensors SET active=1")
    conn.commit()
    sensor_rows = conn.execute("SELECT * FROM sensors").fetchall()
    now = datetime.utcnow().isoformat()
    for sensor_row in sensor_rows:
        reading = {
            "rainfall": round(random.uniform(2, 8), 1),
            "soil_moisture": round(random.uniform(15, 35), 1),
            "tilt": round(random.uniform(0.1, 0.6), 2),
            "ground_movement": round(random.uniform(0.0, 0.3), 2),
            "temperature": round(random.uniform(15, 25), 1),
            "humidity": round(random.uniform(50, 90), 1),
        }
        conn.execute(
            """INSERT INTO sensor_readings (sensor_id, rainfall, soil_moisture, tilt, ground_movement,
               temperature, humidity, timestamp) VALUES (?,?,?,?,?,?,?,?)""",
            (sensor_row["sensor_id"], reading["rainfall"], reading["soil_moisture"], reading["tilt"],
             reading["ground_movement"], reading["temperature"], reading["humidity"], now)
        )
        conn.commit()
        reading["timestamp"] = now
        _run_prediction_and_alert(conn, sensor_row, reading)
    conn.execute("UPDATE alerts SET status='resolved' WHERE status='active'")
    conn.commit()
    conn.close()
    return jsonify({"message": "Simulation reset to normal conditions."}), 200
