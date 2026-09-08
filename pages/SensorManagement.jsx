import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Eye, Power } from 'lucide-react'
import Layout from '../components/Layout'
import RiskBadge from '../components/RiskBadge'
import { api } from '../services/api'

const EMPTY_FORM = {
  sensor_id: '', type: 'Multi-Sensor Station', location: '', state: '',
  latitude: '', longitude: '', slope: 30, elevation: 800, historical_susceptibility: 0.5,
}

export default function SensorManagement() {
  const [sensors, setSensors] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [viewSensor, setViewSensor] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    try { setSensors(await api.getSensors()) } catch (e) { console.error(e) }
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setModalOpen(true) }
  const openEdit = (s) => {
    setEditing(s)
    setForm({
      sensor_id: s.sensor_id, type: s.type, location: s.location, state: s.state || '',
      latitude: s.latitude, longitude: s.longitude, slope: s.slope, elevation: s.elevation,
      historical_susceptibility: s.historical_susceptibility, status: s.status, battery: s.battery,
    })
    setError('')
    setModalOpen(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        await api.updateSensor(editing.sensor_id, form)
      } else {
        await api.createSensor(form)
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (sensorId) => {
    if (!confirm(`Delete sensor ${sensorId}? This cannot be undone.`)) return
    await api.deleteSensor(sensorId)
    load()
  }

  const toggleActive = async (s) => {
    await api.updateSensor(s.sensor_id, { active: s.active ? 0 : 1, status: s.active ? 'offline' : 'online' })
    load()
  }

  return (
    <Layout title="Sensor Management" subtitle="Add, edit, and manage all field monitoring devices">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> Add Sensor</button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Sensor ID</th><th>Type</th><th>Location</th><th>Status</th><th>Battery</th><th>Risk</th><th style={{ minWidth: 200 }}>Actions</th></tr>
          </thead>
          <tbody>
            {sensors.map(s => (
              <tr key={s.sensor_id}>
                <td className="mono">{s.sensor_id}</td>
                <td>{s.type}</td>
                <td>{s.location}</td>
                <td><RiskBadge level={s.status} /></td>
                <td className="mono">{s.battery}%</td>
                <td><RiskBadge level={s.latest_prediction?.risk_level || 'LOW'} /></td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => setViewSensor(s)}><Eye size={13} /></button>
                    <button className="btn btn-sm btn-ghost" onClick={() => openEdit(s)}><Pencil size={13} /></button>
                    <button className="btn btn-sm btn-ghost" onClick={() => toggleActive(s)}><Power size={13} /></button>
                    <button className="btn btn-sm btn-ghost" style={{ color: 'var(--crit)' }} onClick={() => remove(s.sensor_id)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>{editing ? `Edit ${editing.sensor_id}` : 'Add New Sensor'}</h3>
            <form onSubmit={submit}>
              {!editing && (
                <div className="field">
                  <label>Sensor ID</label>
                  <input className="input" value={form.sensor_id} onChange={e => setForm({ ...form, sensor_id: e.target.value })} placeholder="NER-SEN-09" required />
                </div>
              )}
              <div className="field">
                <label>Type</label>
                <input className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required />
              </div>
              <div className="field">
                <label>Location</label>
                <input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required />
              </div>
              <div className="field">
                <label>State</label>
                <input className="input" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label>Latitude</label>
                  <input className="input" type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Longitude</label>
                  <input className="input" type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label>Slope (°)</label>
                  <input className="input" type="number" value={form.slope} onChange={e => setForm({ ...form, slope: e.target.value })} />
                </div>
                <div className="field">
                  <label>Elevation (m)</label>
                  <input className="input" type="number" value={form.elevation} onChange={e => setForm({ ...form, elevation: e.target.value })} />
                </div>
              </div>
              {error && <div className="error-text" style={{ marginBottom: 10 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Create Sensor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewSensor && (
        <div className="modal-overlay" onClick={() => setViewSensor(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 14 }}>{viewSensor.sensor_id}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5 }}>
              <Row label="Location" value={viewSensor.location} />
              <Row label="Type" value={viewSensor.type} />
              <Row label="Status" value={<RiskBadge level={viewSensor.status} />} />
              <Row label="Battery" value={`${viewSensor.battery}%`} />
              <Row label="Coordinates" value={`${viewSensor.latitude}, ${viewSensor.longitude}`} />
              <Row label="Slope" value={`${viewSensor.slope}°`} />
              <Row label="Elevation" value={`${viewSensor.elevation} m`} />
              <Row label="Latest Risk" value={<RiskBadge level={viewSensor.latest_prediction?.risk_level || 'LOW'} />} />
            </div>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 16 }} onClick={() => setViewSensor(null)}>Close</button>
          </div>
        </div>
      )}
    </Layout>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
      <span className="muted">{label}</span><span>{value}</span>
    </div>
  )
}
