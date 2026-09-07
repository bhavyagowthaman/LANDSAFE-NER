import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import Layout from '../components/Layout'
import RiskBadge from '../components/RiskBadge'
import { api } from '../services/api'

const LEVEL_COLOR = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#fb7a3c', CRITICAL: '#ef4444' }

export default function RiskMap() {
  const [sensors, setSensors] = useState([])

  const load = async () => {
    try {
      const data = await api.getSensors()
      setSensors(data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 8000)
    return () => clearInterval(id)
  }, [])

  const center = [25.5, 92.5] // roughly central NER

  return (
    <Layout title="Risk Map" subtitle="GIS view of all monitoring stations across the North Eastern Region">
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <MapContainer center={center} zoom={6} style={{ height: '620px', width: '100%' }} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {sensors.map(s => {
            const level = s.latest_prediction?.risk_level || 'LOW'
            const color = LEVEL_COLOR[level]
            return (
              <CircleMarker
                key={s.sensor_id}
                center={[s.latitude, s.longitude]}
                radius={level === 'CRITICAL' ? 16 : level === 'HIGH' ? 13 : 10}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.55, weight: 2 }}
              >
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 220 }}>
                    <strong>{s.sensor_id}</strong> — {s.location}<br />
                    <span style={{ color: '#666' }}>Lat: {s.latitude.toFixed(4)}, Lon: {s.longitude.toFixed(4)}</span>
                    <hr style={{ margin: '8px 0' }} />
                    Risk Score: <strong>{s.latest_prediction?.risk_score ?? '—'}/100</strong><br />
                    Risk Level: <strong style={{ color }}>{level}</strong><br />
                    Rainfall: {s.latest_reading?.rainfall ?? '—'} mm<br />
                    Soil Moisture: {s.latest_reading?.soil_moisture ?? '—'}%<br />
                    Tilt: {s.latest_reading?.tilt ?? '—'}°<br />
                    Ground Movement: {s.latest_reading?.ground_movement ?? '—'} mm<br />
                    Est. Warning Window: {s.latest_prediction?.estimated_window ?? '—'}<br />
                    <span style={{ color: '#666', fontSize: 11 }}>
                      Updated: {s.latest_reading ? new Date(s.latest_reading.timestamp).toLocaleString() : '—'}
                    </span>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>

      <div className="pill-row" style={{ marginTop: 16 }}>
        {Object.entries(LEVEL_COLOR).map(([level, color]) => (
          <div key={level} className="badge badge-neutral" style={{ gap: 8 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {level}
          </div>
        ))}
      </div>

      <div className="grid-3" style={{ marginTop: 18 }}>
        {sensors.map(s => (
          <div key={s.sensor_id} className="card interactive">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 13.5 }}>{s.location}</strong>
              <RiskBadge level={s.latest_prediction?.risk_level || 'LOW'} />
            </div>
            <div className="muted" style={{ fontSize: 12 }}>{s.sensor_id}</div>
            <div className="mono" style={{ fontSize: 22, marginTop: 8 }}>{s.latest_prediction?.risk_score ?? '—'}/100</div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
