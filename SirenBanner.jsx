import React, { useEffect, useRef, useState } from 'react'
import { Siren, VolumeX } from 'lucide-react'
import { api } from '../services/api'

// Simulates a physical buzzer/siren using the Web Audio API.
function useSirenAudio() {
  const ctxRef = useRef(null)
  const oscRef = useRef(null)
  const gainRef = useRef(null)
  const intervalRef = useRef(null)

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (oscRef.current) {
      try { oscRef.current.stop() } catch (e) {}
      oscRef.current.disconnect()
      oscRef.current = null
    }
  }

  const start = () => {
    if (oscRef.current) return
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    if (!ctxRef.current) ctxRef.current = new Ctx()
    const ctx = ctxRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    gain.gain.value = 0.06
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    oscRef.current = osc
    gainRef.current = gain

    let up = true
    intervalRef.current = setInterval(() => {
      if (!oscRef.current) return
      osc.frequency.setValueAtTime(up ? 880 : 660, ctx.currentTime)
      up = !up
    }, 420)
  }

  useEffect(() => stop, [])
  return { start, stop }
}

export default function SirenBanner() {
  const [status, setStatus] = useState(null)
  const [muted, setMuted] = useState(false)
  const { start, stop } = useSirenAudio()

  useEffect(() => {
    let mounted = true
    const poll = async () => {
      try {
        const res = await api.getEmergencyStatus()
        if (mounted) setStatus(res)
      } catch (e) { /* not logged in yet or network issue */ }
    }
    poll()
    const id = setInterval(poll, 6000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  useEffect(() => {
    if (status?.emergency_active && !muted) start()
    else stop()
  }, [status, muted])

  if (!status?.emergency_active) return null

  return (
    <div className="siren-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Siren size={18} className="spin" style={{ animationDuration: '2s' }} />
        <div>
          <strong>🔊 LOCAL SIREN ACTIVATED</strong> — CRITICAL landslide risk at{' '}
          {status.sensor?.location || 'a monitored zone'}. Risk score{' '}
          {status.prediction?.risk_score}/100. Estimated critical window: next{' '}
          {status.prediction?.estimated_window}.
        </div>
      </div>
      <button className="btn btn-sm btn-ghost" style={{ color: '#fff', background: 'rgba(255,255,255,0.15)' }}
        onClick={() => setMuted(m => !m)}>
        <VolumeX size={14} /> {muted ? 'Unmute Siren' : 'Mute Siren'}
      </button>
    </div>
  )
}
