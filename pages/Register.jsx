import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mountain, Mail, Lock, User, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required.'
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!EMAIL_RE.test(form.email)) e.email = 'Enter a valid email address.'
    if (!form.password) e.password = 'Password is required.'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters.'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    if (!validate()) return
    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <svg className="mountain-svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMax slice">
          <defs>
            <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a1a2c" />
              <stop offset="100%" stopColor="#123349" />
            </linearGradient>
          </defs>
          <rect width="800" height="600" fill="url(#sky2)" />
          <polygon points="0,440 180,260 320,400 480,220 620,380 800,300 800,600 0,600" fill="#0e2d40" />
          <polygon points="0,500 140,400 340,480 500,340 680,460 800,380 800,600 0,600" fill="#153c53" />
        </svg>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div className="brand-mark"><Mountain size={20} color="#04211d" /></div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>LANDSAFE NER</div>
          </div>
          <h2 style={{ fontSize: 30, maxWidth: 460, lineHeight: 1.25 }}>
            Join the disaster monitoring operations team.
          </h2>
          <p className="muted" style={{ marginTop: 12, maxWidth: 420, fontSize: 14 }}>
            Create an account to access live sensor feeds, AI risk scoring, and emergency
            response tools for landslide-prone zones across the North Eastern Region.
          </p>
        </div>
      </div>

      <div className="auth-form-col">
        <div className="auth-card">
          <h2 style={{ fontSize: 24, marginBottom: 6 }}>Create your account</h2>
          <p className="muted" style={{ fontSize: 13.5, marginBottom: 26 }}>
            Get access to the LANDSAFE NER monitoring console.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-dim)' }} />
                <input className={`input ${errors.name ? 'error' : ''}`} style={{ paddingLeft: 36 }}
                  placeholder="Jane Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              {errors.name && <div className="error-text">{errors.name}</div>}
            </div>

            <div className="field">
              <label>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-dim)' }} />
                <input className={`input ${errors.email ? 'error' : ''}`} style={{ paddingLeft: 36 }}
                  type="email" placeholder="you@agency.gov.in" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              {errors.email && <div className="error-text">{errors.email}</div>}
            </div>

            <div className="field">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-dim)' }} />
                <input className={`input ${errors.password ? 'error' : ''}`} style={{ paddingLeft: 36 }}
                  type="password" placeholder="Min. 8 characters" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
              {errors.password && <div className="error-text">{errors.password}</div>}
            </div>

            <div className="field">
              <label>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-dim)' }} />
                <input className={`input ${errors.confirmPassword ? 'error' : ''}`} style={{ paddingLeft: 36 }}
                  type="password" placeholder="Re-enter password" value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
              </div>
              {errors.confirmPassword && <div className="error-text">{errors.confirmPassword}</div>}
            </div>

            {apiError && <div className="error-text" style={{ marginBottom: 14 }}>{apiError}</div>}

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              <UserPlus size={16} /> {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
              <Link to="/login" style={{ color: 'var(--text-mid)' }}>
                Already have an account? <span style={{ color: 'var(--teal)' }}>Login</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
