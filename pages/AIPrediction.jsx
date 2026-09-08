import React, { useEffect, useState } from 'react'
import { BrainCircuit, Clock3, RefreshCw } from 'lucide-react'
import Layout from '../components/Layout'
import RiskBadge from '../components/RiskBadge'
import { api } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'

const LEVEL_COLOR = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#fb7a3c', CRITICAL: '#ef4444' }

export default function AIPrediction() {
  const [sensors, setSensors] = useState([])
  const [selected, setSelected] = useState('')
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.getSensors().then(data => {
      setSensors(data)
      if (data.length) setSelected(data[0].sensor_id)
    })
  }, [])

  const loadDetail = async (sensorId) => {
    if (!sensorId) return
    setLoading(true)
    try {
      const d = await api.getSensor(sensorId)
      setDetail(d)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (selected) loadDetail(selected) }, [selected])

  const prediction = detail?.latest_prediction
  let explanation = []
  try { explanation = prediction?.explanation ? JSON.parse(prediction.explanation) : [] } catch (e) { explanation = [] }

  const level = prediction?.risk_level
  const color = LEVEL_COLOR[level] || '#7d94ab'

  return (
    <Layout title="AI Risk Prediction" subtitle="Scikit-learn ensemble model scoring landslide susceptibility per zone">
      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <BrainCircuit size={18} color="var(--teal)" />
          <select className="input" style={{ maxWidth: 340 }} value={selected} onChange={e => setSelected(e.target.value)}>
            {sensors.map(s => <option key={s.sensor_id} value={s.sensor_id}>{s.location} ({s.sensor_id})</option>)}
          </select>
          <button className="btn btn-outline btn-sm" onClick={() => loadDetail(selected)} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {prediction ? (
        <>
          <div className="grid-2" style={{ marginBottom: 18 }}>
            <div className="card interactive" style={{ textAlign: 'center', padding: 28 }}>
              <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Score</div>
              <div className="mono" style={{ fontSize: 56, fontWeight: 700, color, lineHeight: 1.1, margin: '10px 0' }}>
                {prediction.risk_score}<span style={{ fontSize: 20, color: 'var(--text-dim)' }}>/100</span>
              </div>
              <RiskBadge level={level} />
              <div className="progress-bar" style={{ marginTop: 18 }}>
                <div className="progress-fill" style={{ width: `${prediction.risk_score}%`, background: color }} />
              </div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>Model confidence: {prediction.confidence}%</div>
            </div>

            <div className="card interactive" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="section-title"><Clock3 size={16} /> Estimated Critical Window</div>
              <div style={{ fontSize: 30, fontWeight: 700, fontFamily: 'var(--font-display)', color: level === 'CRITICAL' ? 'var(--crit)' : 'var(--warn)' }}>
                Next {prediction.estimated_window}
              </div>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 12, lineHeight: 1.6 }}>
                Based on current sensor trends and model confidence, this is the estimated critical
                risk window for {detail.location}. This is a probabilistic early-warning estimate —
                it does not claim a landslide will occur at an exact time. Always follow guidance from
                local disaster management authorities.
              </p>
            </div>
          </div>

          <div className="card interactive">
            <div className="section-title">🧠 Why is this area at risk? — Explainable AI</div>
            <p className="muted" style={{ fontSize: 12.5, marginBottom: 16 }}>
              Contribution of each factor to the current risk score, derived from the model's
              feature importances combined with live sensor readings.
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={explanation} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" domain={[0, 'dataMax']} stroke="#7d94ab" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="label" stroke="#b9cadc" fontSize={12} width={150} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#0f2138', border: '1px solid rgba(148,178,209,0.2)', borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="contribution" fill="#14b8a6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {explanation.map(e => (
                <div key={e.feature} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                  <span>{e.icon} {e.label}</span>
                  <span className={`badge ${e.impact === 'HIGH IMPACT' ? 'badge-critical' : e.impact === 'MODERATE IMPACT' ? 'badge-medium' : 'badge-safe'}`}>{e.impact}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="card muted">No prediction available yet for this sensor. Try running a simulation from the Dashboard.</div>
      )}
    </Layout>
  )
}
