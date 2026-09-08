import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mountain, Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) {
      setError('Please enter both email and password.')
      return
    }
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <svg className="mountain-svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMax slice">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a1a2c" />
              <stop offset="100%" stopColor="#123349" />
            </linearGradient>
            <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0e2d40" />
              <stop offset="100%" stopColor="#0a1f2e" />
            </linearGradient>
            <linearGradient id="m2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#153c53" />
              <stop offset="100%" stopColor="#0c2536" />
            </linearGradient>
          </defs>
          <rect width="800" height="600" fill="url(#sky)" />
          <polygon points="0,420 150,240 260,360 400,190 520,340 650,260 800,400 800,600 0,600" fill="url(#m1)" />
          <polygon points="0,480 120,360 300,460 460,320 620,440 800,340 800,600 0,600" fill="url(#m2)" />
          <g stroke="#f59e0b" strokeWidth="2" opacity="0.85">
            <path d="M440 250 L470 300 L430 330 L460 380" fill="none" strokeDasharray="4 5" />
          </g>
          <circle cx="440" cy="250" r="5" fill="#ef4444">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
          </circle>
        </svg>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div className="brand-mark"><Mountain size={20} color="#04211d" /></div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>LANDSAFE NER</div>
          </div>
          <h2 style={{ fontSize: 30, maxWidth: 460, lineHeight: 1.25 }}>
            Early warning for landslide-prone terrain across the North East.
          </h2>
          <p className="muted" style={{ marginTop: 12, maxWidth: 420, fontSize: 14 }}>
            Live rainfall, soil moisture, tilt, and ground-movement telemetry, fused by an
            AI risk model into a single early-warning signal for emergency responders.
          </p>
        </div>
      </div>

      <div className="auth-form-col">
        <div className="auth-card">
          <h2 style={{ fontSize: 24, marginBottom: 6 }}>Welcome back</h2>
          <p className="muted" style={{ fontSize: 13.5, marginBottom: 26 }}>
            Sign in to the disaster monitoring console.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-dim)' }} />
                <input className="input" style={{ paddingLeft: 36 }} type="email" placeholder="you@agency.gov.in"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-dim)' }} />
                <input className="input" style={{ paddingLeft: 36, paddingRight: 36 }}
                  type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <div className="error-text" style={{ marginBottom: 14 }}>{error}</div>}

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              <LogIn size={16} /> {loading ? 'Signing in...' : 'Login'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 13 }}>
              <button type="button" onClick={() => setForgotOpen(true)}
                style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer', padding: 0 }}>
                Forgot Password?
              </button>
              <Link to="/register" style={{ color: 'var(--text-mid)' }}>
                Don't have an account? <span style={{ color: 'var(--teal)' }}>Register</span>
              </Link>
            </div>
          </form>

          <div style={{ marginTop: 22, padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', fontSize: 12, color: 'var(--text-dim)' }}>
            Demo login — email: <span className="mono">demo@landsafe.ner</span> · password: <span className="mono">Demo@123</span>
          </div>
        </div>
      </div>

      {forgotOpen && (
        <div className="modal-overlay" onClick={() => setForgotOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 10 }}>Reset your password</h3>
            <p className="muted" style={{ fontSize: 13.5, marginBottom: 18 }}>
              This is a hackathon prototype, so password reset emails aren't sent yet.
              Please contact your system administrator or use the demo account shown on the login page.
            </p>
            <button className="btn btn-primary btn-block" onClick={() => setForgotOpen(false)}>Got it</button>
          </div>
        </div>
      )}
    </div>
  )
}
