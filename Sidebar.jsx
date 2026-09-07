import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Map, Radio, BrainCircuit, Siren, BarChart3,
  MapPin, Settings2, LifeBuoy, User, LogOut, Mountain
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/risk-map', label: 'Risk Map', icon: Map },
  { to: '/live-sensors', label: 'Live Sensors', icon: Radio },
  { to: '/ai-prediction', label: 'AI Risk Prediction', icon: BrainCircuit },
  { to: '/alerts', label: 'Alerts', icon: Siren },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/locations', label: 'Locations', icon: MapPin },
  { to: '/sensor-management', label: 'Sensor Management', icon: Settings2 },
  { to: '/emergency-response', label: 'Emergency Response', icon: LifeBuoy },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function Sidebar() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Mountain size={20} color="#04211d" /></div>
        <div className="brand-text">
          <div className="name">LANDSAFE NER</div>
          <div className="tag">Detect Early. Warn Faster.</div>
        </div>
      </div>

      <nav className="nav-group">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="nav-item danger" onClick={() => setConfirmOpen(true)}>
          <LogOut size={17} />
          <span>Logout</span>
        </div>
      </div>

      {confirmOpen && (
        <div className="modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 10 }}>Are you sure you want to logout?</h3>
            <p className="muted" style={{ fontSize: 13.5, marginBottom: 20 }}>
              You'll need to sign in again to access the monitoring dashboard.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
