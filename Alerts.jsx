import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Send, Eye, Filter } from 'lucide-react'
import Layout from '../components/Layout'
import RiskBadge from '../components/RiskBadge'
import { api } from '../services/api'

const FILTERS = ['all', 'active', 'acknowledged', 'resolved']

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [filter, setFilter] = useState('all')
  const [sendOpen, setSendOpen] = useState(false)
  const [form, setForm] = useState({ location: '', risk_level: 'WARNING', message: '' })
  const navigate = useNavigate()

  const load = async () => {
    try {
      const data = await api.getAlerts(filter === 'all' ? null : filter)
      setAlerts(data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { load() }, [filter])
  useEffect(() => { const id = setInterval(load, 8000); return () => clearInterval(id) }, [filter])

  const act = async (id, status) => {
    await api.updateAlert(id, status)
    load()
  }

  const sendAlert = async (e) => {
    e.preventDefault()
    if (!form.location || !form.message) return
    await api.createAlert(form)
    setSendOpen(false)
    setForm({ location: '', risk_level: 'WARNING', message: '' })
    load()
  }

  return (
    <Layout title="Alerts" subtitle="Manage active landslide warnings across all monitored zones">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div className="pill-row">
          <Filter size={15} style={{ marginRight: 4, color: 'var(--text-dim)' }} />
          {FILTERS.map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn btn-danger" onClick={() => setSendOpen(true)}>
          <Send size={15} /> Send Emergency Alert
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Location</th><th>Risk Level</th><th>Time</th><th>Message</th><th>Status</th><th style={{ minWidth: 220 }}>Actions</th></tr>
          </thead>
          <tbody>
            {alerts.map(a => (
              <tr key={a.id}>
                <td className="mono">#{a.id}</td>
                <td>{a.location}</td>
                <td><RiskBadge level={a.risk_level} /></td>
                <td>{new Date(a.timestamp).toLocaleString()}</td>
                <td style={{ maxWidth: 300 }}>{a.message}</td>
                <td><RiskBadge level={a.status} /></td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {a.status === 'active' && (
                      <button className="btn btn-sm btn-outline" onClick={() => act(a.id, 'acknowledged')}>
                        <CheckCircle2 size={13} /> Acknowledge
                      </button>
                    )}
                    {a.status !== 'resolved' && (
                      <button className="btn btn-sm btn-ghost" onClick={() => act(a.id, 'resolved')}>Resolve</button>
                    )}
                    <button className="btn btn-sm btn-ghost" onClick={() => navigate('/risk-map')}>
                      <Eye size={13} /> View Location
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 24 }}>No alerts in this category.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {sendOpen && (
        <div className="modal-overlay" onClick={() => setSendOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>Send Emergency Alert</h3>
            <form onSubmit={sendAlert}>
              <div className="field">
                <label>Location</label>
                <input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Sohra (Cherrapunji), Meghalaya" />
              </div>
              <div className="field">
                <label>Risk Level</label>
                <select className="input" value={form.risk_level} onChange={e => setForm({ ...form, risk_level: e.target.value })}>
                  <option value="MEDIUM">Warning</option>
                  <option value="HIGH">High Risk</option>
                  <option value="CRITICAL">Critical Emergency</option>
                </select>
              </div>
              <div className="field">
                <label>Message</label>
                <textarea className="input" rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Alert message to broadcast..." />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setSendOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger"><Send size={14} /> Send Alert</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
