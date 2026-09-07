# LANDSAFE NER

**AI-Based Early Warning and Landslide Risk Monitoring System in NER**

> "Detect Early. Warn Faster. Save Lives."

A full-stack, working prototype for the SIH problem statement on landslide early-warning
in India's North Eastern Region (NER). Real React + Vite frontend, real Flask + SQLite
backend, and a real Scikit-learn risk-scoring model — no hardcoded frontend data.

---

## What's inside

- **Auth**: Register / Login / Logout with hashed passwords and token-based sessions
- **Dashboard**: Live overall risk score, active alerts, online sensors, high-risk zones
- **Live Sensors**: Rainfall, soil moisture, tilt, ground movement, temperature/humidity per station
- **Sensor Simulation**: Normal / Heavy Rainfall / High Soil Moisture / Ground Movement /
  Critical Landslide Scenario buttons that actually write readings to the DB and re-run the AI model
- **AI Risk Prediction**: Scikit-learn RandomForest risk scoring (0–100), LOW/MEDIUM/HIGH/CRITICAL
  classification, explainable-AI factor breakdown, and a hedged 1–3 hour early-warning window
- **GIS Risk Map**: Leaflet + OpenStreetMap, color-coded markers, full popup details
- **Locations**: Filterable table of all monitored districts/zones
- **Alerts**: Acknowledge / Resolve / Send Emergency Alert, all persisted to SQLite
- **Local Siren Simulation**: Web-Audio-based siren that auto-activates on CRITICAL risk, with Mute
- **Emergency Response**: Simulated road closure & evacuation actions, logged to the DB
- **Sensor Management**: Full CRUD for monitoring stations
- **Analytics**: Rainfall / soil moisture / tilt / ground movement / risk-score trends over
  1h / 6h / 24h / 7d, backed by real stored sensor history
- **Profile**: Edit name, notification preferences, change password

---

## Tech Stack

**Frontend:** React 18, Vite, Leaflet + React-Leaflet, Recharts, Lucide icons, plain CSS (no framework)
**Backend:** Python, Flask, Flask-CORS, REST APIs
**Database:** SQLite (file-based, zero setup)
**AI/ML:** Scikit-learn RandomForestRegressor trained on a physically-motivated synthetic dataset
(rainfall, soil moisture, tilt, ground movement, slope, elevation, historical susceptibility →
risk score), with feature-importance-based explainability

---

## Project Structure

```
LANDSAFE-NER/
├── frontend/
│   ├── src/
│   │   ├── components/     Sidebar, Layout, SirenBanner, RiskBadge, ProtectedRoute
│   │   ├── pages/           Login, Register, Dashboard, RiskMap, LiveSensors,
│   │   │                    AIPrediction, Alerts, Analytics, Locations,
│   │   │                    SensorManagement, EmergencyResponse, Profile
│   │   ├── services/api.js  All backend API calls
│   │   └── context/AuthContext.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app.py                Flask entry point, blueprint registration
│   ├── database.py           SQLite schema + seed data (8 NER monitoring stations)
│   ├── auth_utils.py         Token session helpers
│   ├── models/schemas.py     Reference dataclasses for DB rows
│   ├── routes/                auth.py, sensors.py, risk.py, alerts.py, analytics.py, emergency.py
│   ├── ai_model/risk_model.py Scikit-learn model, training, explainability
│   └── requirements.txt
│
├── .env.example
└── README.md   (this file)
```

---

## Running locally in VS Code

### 1. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

The first run creates `backend/landsafe.db`, seeds 8 NER monitoring stations with 24 hours
of realistic sensor history, trains the risk model (`ai_model/landslide_model.joblib`), and
creates a demo account:

```
Email:    demo@landsafe.ner
Password: Demo@123
```

Backend runs on **http://localhost:5000**.

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173** and talks to the backend automatically
(configured via `VITE_API_BASE_URL`, defaulting to `http://localhost:5000/api`).

### 3. Try the demo flow

1. Register a new account (or use the demo login above)
2. Land on the Dashboard — see live risk score, alerts, sensor counts
3. Open **Live Sensors** to see rainfall/soil/tilt/ground-movement per station
4. Open **Risk Map** to see color-coded GIS markers
5. Go back to **Dashboard** → click **CRITICAL LANDSLIDE SCENARIO**
6. Watch: risk score climbs → status goes CRITICAL → map markers turn red →
   a 1–3 hour warning window appears → the siren banner activates with audio →
   an emergency alert is generated
7. Go to **Emergency Response** → Simulate Road Closure → Simulate Evacuation
8. Check **Alerts** to Acknowledge / Resolve the emergency
9. Check **Analytics** for the historical trend charts
10. Click **RESET SIMULATION** on the Dashboard to return to normal conditions
11. Logout from the sidebar

---

## Design notes & scope decisions

- Each monitoring "sensor" in the database represents a **field station** equipped with
  rainfall, soil moisture, tilt, ground-movement, and temperature/humidity sensors — matching
  how the Live Sensors page groups readings by location.
- The AI risk model is trained on a **synthetic, physically-motivated dataset** (weighted
  combination of rainfall, soil moisture, tilt, ground movement, slope, elevation, and
  historical susceptibility, plus noise) since no public real-time NER landslide-inventory
  dataset is available in this environment. Swap `ai_model/risk_model.py`'s
  `_synthetic_dataset()` for a real historical dataset when available — the rest of the
  pipeline (training, serving, explainability) works unchanged.
- The 1–3 hour early-warning window is intentionally phrased as a probabilistic estimate
  ("based on current sensor trends and model confidence"), never as a firm prediction.
- The siren is a **software simulation of a physical buzzer**, built with the Web Audio API,
  clearly labelled as such in the UI.
- Authentication uses bearer tokens stored in `localStorage` rather than cookies, to avoid
  cross-origin cookie complications between `:5173` and `:5000` during local development.

---

## API Reference (all under `/api`)

| Method | Path | Description |
|---|---|---|
| POST | /register | Create account |
| POST | /login | Login, returns token |
| POST | /logout | Invalidate session |
| GET/PUT | /user | Get / update profile |
| POST | /change-password | Change password |
| GET | /sensors | List all sensors + latest reading/prediction |
| GET | /sensors/:id | Sensor detail + history |
| POST | /sensors | Create sensor |
| PUT | /sensors/:id | Update sensor |
| DELETE | /sensors/:id | Delete sensor |
| POST | /sensor-data | Ingest one reading, triggers AI prediction |
| POST | /simulate | Apply a named scenario to sensor(s) |
| POST | /simulate/reset | Reset all sensors to normal |
| POST | /predict-risk | Ad-hoc prediction from raw features |
| GET | /risk | Dashboard-level aggregate risk |
| GET | /alerts | List alerts (optional `?status=`) |
| POST | /alerts | Create/send alert |
| PUT | /alerts/:id | Update alert status |
| GET | /analytics | Time-series data (`?range=1h/6h/24h/7d`) |
| POST | /emergency-action | Log an emergency response action |
| GET | /emergency-action | List logged actions |
| GET | /emergency-status | Whether emergency mode is currently active |

---

## Troubleshooting

- **CORS errors**: confirm the backend is running on port 5000 and `CORS_ORIGIN` in
  `backend/.env` (copy from `.env.example`) matches your frontend URL.
- **`pip install` fails on scikit-learn**: make sure you're using Python 3.10–3.12.
- **Map tiles don't load**: OpenStreetMap tile requests need outbound internet access.
- **Siren doesn't play**: most browsers block audio until a user gesture — click anywhere
  on the page once, then trigger the critical scenario.
