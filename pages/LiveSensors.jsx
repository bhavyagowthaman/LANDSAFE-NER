import React, { useEffect, useState } from 'react'
import { CloudRain, Sprout, Ruler, Radio, ThermometerSun, BatteryMedium, MapPin, Clock } from 'lucide-react'
import Layout from '../components/Layout'
import RiskBadge from '../components/RiskBadge'
import { api } from '../services/api'

function timeAgo(ts) {
  if (!ts) return '—'
  const s = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

export default function LiveSensors() {
  const [sensors, setSensors] = useState([])

  const load = async () => {
    try { setSensors(await api.getSensors()) } catch (e) { console.error(e) }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 6000)
    return () => clearInterval(id)
  }, [])

  return (
    <Layout title="Live Sensors" subtitle="Real-time telemetry from all field monitoring stations">
      <div className="grid-2">
        {sensors.map(s => {
          const r = s.latest_reading
          const level = s.latest_prediction?.risk_level
          return (
            <div key={s.sensor_id} className="card interactive">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{s.location}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{s.sensor_id} · {s.type}</div>
                </div>
                <RiskBadge level={s.status} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
                <SensorMetric icon={CloudRain} label="Rainfall" value={r ? `${r.rainfall} mm` : '—'} sub={rainIntensity(r?.rainfall)} />
                <SensorMetric icon={Sprout} label="Soil Moisture" value={r ? `${r.soil_moisture}%` : '—'} sub={trendLabel(r?.soil_moisture, 40)} />
                <SensorMetric icon={Ruler} label="Tilt" value={r ? `${r.tilt}°` : '—'} sub="vs baseline 0°" />
                <SensorMetric icon={Radio} label="Ground Movement" value={r ? `${r.ground_movement} mm` : '—'} sub={trendLabel(r?.ground_movement, 1)} />
                <SensorMetric icon={ThermometerSun} label="Temp / Humidity" value={r ? `${r.temperature}°C / ${r.humidity}%` : '—'} sub="ambient" />
                <SensorMetric icon={BatteryMedium} label="Battery" value={`${s.battery}%`} sub={s.battery < 30 ? 'Low' : 'Healthy'} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-dim)', borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                <span><MapPin size={12} style={{ verticalAlign: -2 }} /> {s.latitude.toFixed(3)}, {s.longitude.toFixed(3)}</span>
                <span><Clock size={12} style={{ verticalAlign: -2 }} /> {timeAgo(r?.timestamp)}</span>
                {level && <RiskBadge level={level} />}
              </div>
            </div>
          )
        })}
      </div>
    </Layout>
  )
}

function rainIntensity(mm) {
  if (mm == null) return '—'
  if (mm < 10) return 'Light'
  if (mm < 30) return 'Moderate'
  if (mm < 50) return 'Heavy'
  return 'Extreme'
}
function trendLabel(val, threshold) {
  if (val == null) return '—'
  return val > threshold ? 'Rising ↑' : 'Stable →'
}

function SensorMetric({ icon: Icon, label, value, sub }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        <Icon size={12} /> {label}
      </div>
      <div className="mono" style={{ fontSize: 15, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>{sub}</div>
    </div>
  )
}
