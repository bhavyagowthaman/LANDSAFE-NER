import React, { useEffect, useState } from 'react'
import { MapPin, Radio } from 'lucide-react'
import Layout from '../components/Layout'
import RiskBadge from '../components/RiskBadge'
import { api } from '../services/api'

const FILTERS = ['All', 'Low', 'Medium', 'High', 'Critical']

export default function Locations() {
  const [sensors, setSensors] = useState([])
  const [filter, setFilter] = useState('All')

  const load = async () => {
    try { setSensors(await api.getSensors()) } catch (e) { console.error(e) }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 8000)
    return () => clearInterval(id)
  }, [])

  const filtered = sensors.filter(s => {
    if (filter === 'All') return true
    const level = s.latest_prediction?.risk_level
    return level === filter.toUpperCase()
  })

  return (
    <Layout title="Locations" subtitle="Monitored districts and zones across the North Eastern Region">
      <div className="pill-row" style={{ marginBottom: 18 }}>
        {FILTERS.map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>State</th><th>District / Zone</th><th>GPS Coordinates</th><th>Risk Level</th>
              <th>Sensors</th><th>Current Risk Score</th><th>Last Update</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.sensor_id}>
                <td>{s.state || '—'}</td>
                <td><MapPin size={13} style={{ verticalAlign: -2, marginRight: 4, color: 'var(--text-dim)' }} />{s.location}</td>
                <td className="mono">{s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}</td>
                <td><RiskBadge level={s.latest_prediction?.risk_level || 'LOW'} /></td>
                <td><Radio size={13} style={{ verticalAlign: -2, marginRight: 4, color: 'var(--text-dim)' }} />1 station</td>
                <td className="mono">{s.latest_prediction?.risk_score ?? '—'}/100</td>
                <td>{s.latest_reading ? new Date(s.latest_reading.timestamp).toLocaleString() : '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 24 }}>No zones match this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
