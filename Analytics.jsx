import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { api } from '../services/api'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'

const RANGES = [
  { key: '1h', label: '1 Hour' },
  { key: '6h', label: '6 Hours' },
  { key: '24h', label: '24 Hours' },
  { key: '7d', label: '7 Days' },
]

function fmtTime(t, range) {
  const d = new Date(t)
  if (range === '7d') return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function Analytics() {
  const [range, setRange] = useState('24h')
  const [sensors, setSensors] = useState([])
  const [sensorId, setSensorId] = useState('')
  const [data, setData] = useState(null)

  useEffect(() => { api.getSensors().then(setSensors) }, [])

  const load = async () => {
    const d = await api.getAnalytics(range, sensorId || undefined)
    setData(d)
  }

  useEffect(() => { load() }, [range, sensorId])

  const merge = (key) => (data ? data[key].map(p => ({ t: fmtTime(p.t, range), v: p.v })) : [])

  return (
    <Layout title="Analytics" subtitle="Historical sensor trends and AI risk score evolution">
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div className="pill-row">
          {RANGES.map(r => (
            <button key={r.key} className={`btn btn-sm ${range === r.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setRange(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
        <select className="input" style={{ maxWidth: 280 }} value={sensorId} onChange={e => setSensorId(e.target.value)}>
          <option value="">All Zones (combined)</option>
          {sensors.map(s => <option key={s.sensor_id} value={s.sensor_id}>{s.location}</option>)}
        </select>
      </div>

      <div className="grid-2">
        <ChartCard title="🌧️ Rainfall Trend (mm)" data={merge('rainfall')} color="#22d3ee" />
        <ChartCard title="🌱 Soil Moisture Trend (%)" data={merge('soil_moisture')} color="#14b8a6" />
        <ChartCard title="📐 Tilt Trend (°)" data={merge('tilt')} color="#f59e0b" />
        <ChartCard title="📡 Ground Movement Trend (mm)" data={merge('ground_movement')} color="#fb7a3c" />
      </div>

      <div className="card interactive" style={{ marginTop: 18 }}>
        <div className="section-title">📊 AI Risk Score Trend</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={merge('risk_score')}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="t" stroke="#7d94ab" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} stroke="#7d94ab" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#0f2138', border: '1px solid rgba(148,178,209,0.2)', borderRadius: 10, fontSize: 12 }} />
            <Line type="monotone" dataKey="v" name="Risk Score" stroke="#ef4444" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Layout>
  )
}

function ChartCard({ title, data, color }) {
  return (
    <div className="card interactive">
      <div className="section-title">{title}</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="t" stroke="#7d94ab" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#7d94ab" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: '#0f2138', border: '1px solid rgba(148,178,209,0.2)', borderRadius: 10, fontSize: 12 }} />
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2.2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
