import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Calendar, Bell, KeyRound, LogOut, Save } from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

export default function Profile() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name || '')
  const [notif, setNotif] = useState(user?.notifications || { sms: true, email: true, push: true })
  const [editing, setEditing] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [logoutConfirm, setLogoutConfirm] = useState(false)
  const [saved, setSaved] = useState(false)

  const saveProfile = async () => {
    await api.updateUser({ name, notifications: notif })
    await refreshUser()
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setPwError('')
    if (pwForm.newPassword !== pwForm.confirm) { setPwError('New passwords do not match.'); return }
    try {
      await api.changePassword(pwForm)
      setPwOpen(false)
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      setPwError(err.message)
    }
  }

  const doLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <Layout title="Profile" subtitle="Manage your account and notification preferences">
      <div className="grid-2">
        <div className="card interactive">
          <div className="section-title"><User size={16} /> Account Details</div>

          <div className="field">
            <label>Full Name</label>
            <input className="input" value={name} disabled={!editing} onChange={e => setName(e.target.value)} />
          </div>
          <div className="field">
            <label><Mail size={13} style={{ verticalAlign: -2 }} /> Email</label>
            <input className="input" value={user.email} disabled />
          </div>
          <div className="field">
            <label><Calendar size={13} style={{ verticalAlign: -2 }} /> Account Created</label>
            <input className="input" value={new Date(user.created_at).toLocaleDateString()} disabled />
          </div>

          {editing ? (
            <button className="btn btn-primary btn-block" onClick={saveProfile}><Save size={15} /> Save Changes</button>
          ) : (
            <button className="btn btn-outline btn-block" onClick={() => setEditing(true)}>Edit Profile</button>
          )}
          {saved && <div style={{ color: 'var(--safe)', fontSize: 12.5, marginTop: 8, textAlign: 'center' }}>Profile updated successfully.</div>}
        </div>

        <div className="card interactive">
          <div className="section-title"><Bell size={16} /> Notification Preferences</div>
          {['sms', 'email', 'push'].map(key => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ textTransform: 'capitalize' }}>{key} alerts</span>
              <input type="checkbox" checked={notif[key]} disabled={!editing}
                onChange={e => setNotif({ ...notif, [key]: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: 'var(--teal)' }} />
            </div>
          ))}

          <div className="section-title" style={{ marginTop: 24 }}><KeyRound size={16} /> Security</div>
          <button className="btn btn-outline btn-block" onClick={() => setPwOpen(true)}>Change Password</button>
          <button className="btn btn-danger btn-block" style={{ marginTop: 10 }} onClick={() => setLogoutConfirm(true)}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>

      {pwOpen && (
        <div className="modal-overlay" onClick={() => setPwOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>Change Password</h3>
            <form onSubmit={changePassword}>
              <div className="field">
                <label>Current Password</label>
                <input className="input" type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
              </div>
              <div className="field">
                <label>New Password</label>
                <input className="input" type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required />
              </div>
              <div className="field">
                <label>Confirm New Password</label>
                <input className="input" type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required />
              </div>
              {pwError && <div className="error-text" style={{ marginBottom: 10 }}>{pwError}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setPwOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {logoutConfirm && (
        <div className="modal-overlay" onClick={() => setLogoutConfirm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 10 }}>Are you sure you want to logout?</h3>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setLogoutConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={doLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
