"""
LANDSAFE NER - Database Layer
SQLite database connection, schema creation, and seed data.
"""
import sqlite3
import os
import random
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "landsafe.db")

# NER (North Eastern Region) monitoring stations - realistic landslide-prone locations
SEED_SENSORS = [
    {"sensor_id": "NER-SEN-01", "type": "Multi-Sensor Station", "location": "Sohra (Cherrapunji), Meghalaya",
     "state": "Meghalaya", "lat": 25.2841, "lon": 91.7273, "slope": 42, "elevation": 1484, "historical": 0.82},
    {"sensor_id": "NER-SEN-02", "type": "Multi-Sensor Station", "location": "Mawsynram, Meghalaya",
     "state": "Meghalaya", "lat": 25.2967, "lon": 91.5822, "slope": 38, "elevation": 1401, "historical": 0.78},
    {"sensor_id": "NER-SEN-03", "type": "Multi-Sensor Station", "location": "Gangtok Outskirts, Sikkim",
     "state": "Sikkim", "lat": 27.3389, "lon": 88.6065, "slope": 51, "elevation": 1650, "historical": 0.88},
    {"sensor_id": "NER-SEN-04", "type": "Multi-Sensor Station", "location": "Kalimpong Hills, West Bengal",
     "state": "West Bengal", "lat": 27.0669, "lon": 88.4718, "slope": 47, "elevation": 1247, "historical": 0.85},
    {"sensor_id": "NER-SEN-05", "type": "Multi-Sensor Station", "location": "Aizawl Ridge, Mizoram",
     "state": "Mizoram", "lat": 23.7271, "lon": 92.7176, "slope": 35, "elevation": 1132, "historical": 0.7},
    {"sensor_id": "NER-SEN-06", "type": "Multi-Sensor Station", "location": "Kohima Hills, Nagaland",
     "state": "Nagaland", "lat": 25.6751, "lon": 94.1086, "slope": 40, "elevation": 1444, "historical": 0.74},
    {"sensor_id": "NER-SEN-07", "type": "Multi-Sensor Station", "location": "Itanagar Hills, Arunachal Pradesh",
     "state": "Arunachal Pradesh", "lat": 27.0844, "lon": 93.6053, "slope": 44, "elevation": 780, "historical": 0.76},
    {"sensor_id": "NER-SEN-08", "type": "Multi-Sensor Station", "location": "Haflong, Assam",
     "state": "Assam", "lat": 25.1667, "lon": 93.0167, "slope": 33, "elevation": 680, "historical": 0.65},
]


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    notif_sms INTEGER DEFAULT 1,
    notif_email INTEGER DEFAULT 1,
    notif_push INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sensors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    location TEXT NOT NULL,
    state TEXT,
    status TEXT DEFAULT 'online',
    battery INTEGER DEFAULT 100,
    slope REAL DEFAULT 30,
    elevation REAL DEFAULT 800,
    historical_susceptibility REAL DEFAULT 0.5,
    active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id TEXT NOT NULL,
    rainfall REAL,
    soil_moisture REAL,
    tilt REAL,
    ground_movement REAL,
    temperature REAL,
    humidity REAL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS risk_predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id TEXT NOT NULL,
    risk_score REAL,
    risk_level TEXT,
    confidence REAL,
    estimated_window TEXT,
    explanation TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location TEXT NOT NULL,
    sensor_id TEXT,
    risk_level TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    channel TEXT DEFAULT 'system',
    timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS emergency_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id INTEGER,
    action TEXT NOT NULL,
    status TEXT DEFAULT 'completed',
    details TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE SET NULL
);
"""


def init_db():
    fresh = not os.path.exists(DB_PATH)
    conn = get_db()
    conn.executescript(SCHEMA)
    conn.commit()

    cur = conn.execute("SELECT COUNT(*) as c FROM sensors")
    if cur.fetchone()["c"] == 0:
        seed_sensors(conn)
        seed_demo_user(conn)
        backfill_history(conn)
    conn.close()
    return fresh


def seed_sensors(conn):
    now = datetime.utcnow().isoformat()
    for s in SEED_SENSORS:
        conn.execute(
            """INSERT INTO sensors (sensor_id, type, latitude, longitude, location, state,
               status, battery, slope, elevation, historical_susceptibility, active, created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (s["sensor_id"], s["type"], s["lat"], s["lon"], s["location"], s["state"],
             "online", random.randint(70, 100), s["slope"], s["elevation"], s["historical"], 1, now)
        )
    # simulate 2 sensors with warning/offline health for realism
    conn.execute("UPDATE sensors SET status='warning', battery=34 WHERE sensor_id='NER-SEN-06'")
    conn.execute("UPDATE sensors SET status='offline', battery=5 WHERE sensor_id='NER-SEN-08'")
    conn.commit()


def seed_demo_user(conn):
    now = datetime.utcnow().isoformat()
    conn.execute(
        "INSERT INTO users (name, email, password_hash, created_at) VALUES (?,?,?,?)",
        ("Demo Operator", "demo@landsafe.ner", generate_password_hash("Demo@123"), now)
    )
    conn.commit()


def backfill_history(conn, hours=24):
    """Create a plausible history of sensor readings for the analytics/chart pages."""
    now = datetime.utcnow()
    sensors = conn.execute("SELECT sensor_id, historical_susceptibility FROM sensors").fetchall()
    for s in sensors:
        base_rain = random.uniform(5, 20)
        base_soil = random.uniform(25, 45)
        base_tilt = random.uniform(0.2, 1.5)
        base_move = random.uniform(0.1, 1.0)
        for i in range(hours * 4, 0, -1):  # every 15 minutes
            ts = (now - timedelta(minutes=15 * i)).isoformat()
            drift = (hours * 4 - i) / (hours * 4)
            rainfall = max(0, base_rain + random.uniform(-3, 6) * drift)
            soil = min(100, max(5, base_soil + random.uniform(-5, 10) * drift))
            tilt = max(0, base_tilt + random.uniform(-0.2, 0.5) * drift)
            move = max(0, base_move + random.uniform(-0.1, 0.4) * drift)
            temp = random.uniform(14, 26)
            hum = random.uniform(55, 95)
            conn.execute(
                """INSERT INTO sensor_readings
                   (sensor_id, rainfall, soil_moisture, tilt, ground_movement, temperature, humidity, timestamp)
                   VALUES (?,?,?,?,?,?,?,?)""",
                (s["sensor_id"], round(rainfall, 2), round(soil, 2), round(tilt, 2),
                 round(move, 2), round(temp, 1), round(hum, 1), ts)
            )
    conn.commit()
