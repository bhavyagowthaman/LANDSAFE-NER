import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Radio, Siren, MapPinned, Clock, Gauge, CloudRain, Waves, Skull, RotateCcw } from 'lucide-react'
import Layout from '../components/Layout'
import RiskBadge from '../components/RiskBadge'
import { api } from '../services/api'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

const LEVEL_CLASS = { LOW: 'safe', MEDIUM: 'warn', HIGH: 'high', CRITICAL: 'crit' }

export default function Dashboard() {
  const [risk, setRisk] = useState(null)
  const [trend, setTrend] = useState([])
  const [simLoading, setSimLoading] = useState(null)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    try {
      const r = await api.getOverallRisk()
      setRisk(r)
      const a = await api.getAnalytics('6h')
      setTrend(a.risk_score.map(p => ({ t: new Date(p.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), score: p.v })))
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 8000)
    return () => clearInterval(id)
  }, [load])

  const runScenario = async (scenario) => {
    setSimLoading(scenario)
    try {
      await api.simulateScenario(scenario)
      await load()
    } finally {
      setSimLoading(null)
    }
  }

  const runReset = async () => {
    setSimLoading('reset')
    try {
      await api.resetSimulation()
      await load()
    } finally {
      setSimLoading(null)
    }
  }

  if (!risk) return <Layout title="Dashboard" subtitle="Loading live monitoring data..."><div className="muted">Loading...</div></Layout>

  const levelCls = LEVEL_CLASS[risk.overall_status] || 'safe'

  return (
    <Layout title="Dashboard" subtitle="Real-time landslide risk overview across NER monitoring zones">
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Overall Risk</div>
          <div className={`stat-value ${levelCls}`}>{risk.overall_risk_score}<span style={{ fontSize: 14, color: 'var(--text-dim)' }}>/100</span></div>
          <div className="stat-sub">Worst zone: {risk.worst_location || 'N/A'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Current Status</div>
          <div style={{ marginTop: 4 }}><RiskBadge level={risk.overall_status} /></div>
          <div className="stat-sub">System-wide assessment</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Alerts</div>
          <div className={`stat-value ${risk.active_alerts > 0 ? 'high' : 'safe'}`}>{String(risk.active_alerts).padStart(2, '0')}</div>
          <div className="stat-sub">Requiring attention</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Online Sensors</div>
          <div className="stat-value safe">{risk.online_sensors}/{risk.total_sensors}</div>
          <div className="stat-sub">Field telemetry units</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">High-Risk Zones</div>
          <div className={`stat-value ${risk.high_risk_zones > 0 ? 'high' : 'safe'}`}>{String(risk.high_risk_zones).padStart(2, '0')}</div>
          <div className="stat-sub">HIGH or CRITICAL level</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Est. Critical Window</div>
          <div className="stat-value warn" style={{ fontSize: 19 }}>{risk.estimated_critical_window}</div>
          <div className="stat-sub">Based on model confidence</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card interactive">
          <div className="section-title"><Activity size={16} /> Risk Score Trend (last 6 hours)</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="t" stroke="#7d94ab" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="#7d94ab" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#0f2138', border: '1px solid rgba(148,178,209,0.2)', borderRadius: 10, fontSize: 12 }} />
              <Line type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card interactive">
          <div className="section-title"><Siren size={16} /> Sensor Simulation Mode</div>
          <p className="muted" style={{ fontSize: 12.5, marginBottom: 14 }}>
            No physical sensors connected — trigger realistic scenarios to test the AI pipeline end-to-end.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button className="btn btn-outline" disabled={!!simLoading} onClick={() => runScenario('normal')}>
              <Gauge size={15} /> {simLoading === 'normal' ? 'Applying...' : 'Normal Conditions'}
            </button>
            <button className="btn btn-outline" disabled={!!simLoading} onClick={() => runScenario('heavy_rainfall')}>
              <CloudRain size={15} /> {simLoading === 'heavy_rainfall' ? 'Applying...' : 'Heavy Rainfall'}
            </button>
            <button className="btn btn-outline" disabled={!!simLoading} onClick={() => runScenario('high_soil_moisture')}>
              <Waves size={15} /> {simLoading === 'high_soil_moisture' ? 'Applying...' : 'High Soil Moisture'}
            </button>
            <button className="btn btn-outline" disabled={!!simLoading} onClick={() => runScenario('ground_movement')}>
              <Activity size={15} /> {simLoading === 'ground_movement' ? 'Applying...' : 'Ground Movement'}
            </button>
          </div>
          <button className="btn btn-danger btn-block" style={{ marginTop: 10 }} disabled={!!simLoading} onClick={() => runScenario('critical')}>
            <Skull size={15} /> {simLoading === 'critical' ? 'Simulating Critical Scenario...' : 'CRITICAL LANDSLIDE SCENARIO'}
          </button>
          <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} disabled={!!simLoading} onClick={runReset}>
            <RotateCcw size={15} /> {simLoading === 'reset' ? 'Resetting...' : 'RESET SIMULATION'}
          </button>
        </div>
      </div>

      <div className="card interactive" style={{ marginTop: 18 }}>
        <div className="section-title"><MapPinned size={16} /> Monitored Zones — Live Risk Snapshot</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Location</th><th>Risk Score</th><th>Level</th><th>Est. Window</th><th></th></tr>
            </thead>
            <tbody>
              {risk.sensors.sort((a, b) => b.risk_score - a.risk_score).map(s => (
                <tr key={s.sensor_id}>
                  <td>{s.location}</td>
                  <td className="mono">{s.risk_score}/100</td>
                  <td><RiskBadge level={s.risk_level} /></td>
                  <td>{s.estimated_window}</td>
                  <td><button className="btn btn-sm btn-ghost" onClick={() => navigate('/risk-map')}>View on Map</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
