"""
LANDSAFE NER - Backend Entry Point
AI-Based Early Warning and Landslide Risk Monitoring System in NER
"""
import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from database import init_db
from routes.auth import auth_bp
from routes.sensors import sensors_bp
from routes.risk import risk_bp
from routes.alerts import alerts_bp
from routes.analytics import analytics_bp
from routes.emergency import emergency_bp

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY", "landsafe-ner-dev-secret")

CORS_ORIGIN = os.environ.get("CORS_ORIGIN", "http://localhost:5173")
CORS(app, resources={r"/api/*": {"origins": CORS_ORIGIN}}, supports_credentials=True)

app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(sensors_bp, url_prefix="/api")
app.register_blueprint(risk_bp, url_prefix="/api")
app.register_blueprint(alerts_bp, url_prefix="/api")
app.register_blueprint(analytics_bp, url_prefix="/api")
app.register_blueprint(emergency_bp, url_prefix="/api")


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "LANDSAFE NER API"}), 200


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found."}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error."}), 500


if __name__ == "__main__":
    fresh = init_db()
    if fresh:
        print("Database initialized with seed sensors, demo user, and 24h of history.")
        print("Demo login -> email: demo@landsafe.ner | password: Demo@123")
    print("LANDSAFE NER backend running on http://localhost:5000")
    app.run(debug=True, port=5000)
