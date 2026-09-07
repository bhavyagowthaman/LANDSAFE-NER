"""
Lightweight dataclasses documenting the shape of core entities.
The app uses sqlite3.Row dicts directly for simplicity/performance; these
dataclasses exist for reference, IDE auto-complete, and potential future ORM migration.
"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class User:
    id: int
    name: str
    email: str
    password_hash: str
    created_at: str


@dataclass
class Sensor:
    id: int
    sensor_id: str
    type: str
    latitude: float
    longitude: float
    location: str
    state: Optional[str]
    status: str  # online | warning | offline
    battery: int
    slope: float
    elevation: float
    historical_susceptibility: float
    active: bool
    created_at: str


@dataclass
class SensorReading:
    id: int
    sensor_id: str
    rainfall: float
    soil_moisture: float
    tilt: float
    ground_movement: float
    temperature: float
    humidity: float
    timestamp: str


@dataclass
class RiskPrediction:
    id: int
    sensor_id: str
    risk_score: float
    risk_level: str  # LOW | MEDIUM | HIGH | CRITICAL
    confidence: float
    estimated_window: str
    explanation: str
    timestamp: str


@dataclass
class Alert:
    id: int
    location: str
    sensor_id: Optional[str]
    risk_level: str
    message: str
    status: str  # active | acknowledged | resolved
    channel: str
    timestamp: str


@dataclass
class EmergencyAction:
    id: int
    alert_id: Optional[int]
    action: str
    status: str
    details: str
    timestamp: str
