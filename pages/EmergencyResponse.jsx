import React, { useEffect, useState } from 'react'
import { AlertOctagon, Construction, Users, Send, CheckCircle2, CloudRain, Radio } from 'lucide-react'
import Layout from '../components/Layout'
import RiskBadge from '../components/RiskBadge'
import { api } from '../services/api'

export default function EmergencyResponse() {
  const [status, setStatus] = useState(null)
  const [actions, setActions] = useState([])
  const [busy, setBusy] = useState(null)
  const [toast, setToast] = useState('')

  const load = async () => {
    try {
      const s = await api.getEmergencyStatus()
      setStatus(s)
      const a = await api.getEmergencyActions()
      setActions(a)
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 7000)
    return () => clearInterval(id)
  }, [])

  const runAction = async (action) => {
    setBusy(action)
    try {
      const res = await api.emergencyAction({ action, alert_id: status?.alert?.id })
      setToast(res.message)
      setTimeout(() => setToast(''), 3500)
      await load()
    } finally {
      setBusy(null)
    }
  }

  const active = status?.emergency_active

  return (
    <Layout title="Emergency Response" subtitle="Coordinated response actions for critical landslide risk events">
      {active ? (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'linear-gradient(160deg, rgba(239,68,68,0.08), rgba(255,255,255,0.01))', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <AlertOctagon size={22} color="var(--crit)" />
            <h2 style={{ fontSize: 19, color: 'var(--crit)' }}>🚨 EMERGENCY MODE ACTIVE</h2>
          </div>
          <div className="grid-3">
            <InfoBlock label="Affected Location" value={status.sensor?.location} />
            <InfoBlock label="Risk Score" value={`${status.prediction?.risk_score}/100`} mono />
            <InfoBlock label="Estimated Window" value={`Next ${status.prediction?.estimated_window}`} />
            <InfoBlock label="Active Sensors" icon={Radio} value={status.sensor?.sensor_id} />
            <InfoBlock label="Current Rainfall" icon={CloudRain} value={`${status.reading?.rainfall ?? '—'} mm`} />
            <InfoBlock label="Ground Movement" value={`${status.reading?.ground_movement ?? '—'} mm`} />
          </div>

          <div style={{ marginTop: 18 }}>
            <div className="section-title">Recommended Actions</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-mid)', fontSize: 13.5, lineHeight: 1.8 }}>
              <li>Restrict access to the affected slope and surrounding 500m radius.</li>
              <li>Notify local district disaster management authority immediately.</li>
              <li>Prepare nearby communities for possible evacuation.</li>
              <li>Continue monitoring rainfall and ground movement trends closely.</li>
            </ul>
          </div>

          <div className="pill-row" style={{ marginTop: 20 }}>
            <button className="btn btn-warn" disabled={!!busy} onClick={() => runAction('road_closure')}>
              <Construction size={15} /> {busy === 'road_closure' ? 'Closing...' : 'Simulate Road Closure'}
            </button>
            <button className="btn btn-danger" disabled={!!busy} onClick={() => runAction('evacuation')}>
              <Users size={15} /> {busy === 'evacuation' ? 'Evacuating...' : 'Simulate Evacuation'}
            </button>
            <button className="btn btn-outline" disabled={!!busy} onClick={() => runAction('emergency_alert')}>
              <Send size={15} /> {busy === 'emergency_alert' ? 'Sending...' : 'Send Emergency Alert'}
            </button>
            <button className="btn btn-primary" disabled={!!busy} onClick={() => runAction('acknowledge_emergency')}>
              <CheckCircle2 size={15} /> {busy === 'acknowledge_emergency' ? 'Acknowledging...' : 'Acknowledge Emergency'}
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <CheckCircle2 size={36} color="var(--safe)" style={{ marginBottom: 10 }} />
          <h3>No active emergencies</h3>
          <p className="muted" style={{ fontSize: 13.5 }}>
            All monitored zones are currently within acceptable risk thresholds. Trigger the
            "Critical Landslide Scenario" from the Dashboard to test the emergency response workflow.
          </p>
        </div>
      )}

      <div className="card interactive" style={{ marginTop: 20 }}>
        <div className="section-title">Emergency Action Log</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Action</th><th>Status</th><th>Details</th><th>Time</th></tr></thead>
            <tbody>
              {actions.map(a => (
                <tr key={a.id}>
                  <td>{a.action.replace('_', ' ')}</td>
                  <td><RiskBadge level="resolved" /></td>
                  <td>{a.details}</td>
                  <td>{new Date(a.timestamp).toLocaleString()}</td>
                </tr>
              ))}
              {actions.length === 0 && <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 20 }}>No emergency actions recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div className="toast-stack">
          <div className="toast critical">{toast}</div>
        </div>
      )}
    </Layout>
  )
}

function InfoBlock({ label, value, mono, icon: Icon }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, border: '1px solid var(--line)' }}>
      <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
        {Icon && <Icon size={12} />} {label}
      </div>
      <div className={mono ? 'mono' : ''} style={{ fontSize: 15, marginTop: 4 }}>{value ?? '—'}</div>
    </div>
  )
}
