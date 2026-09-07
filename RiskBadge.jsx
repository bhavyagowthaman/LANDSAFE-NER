import React from 'react'

const MAP = {
  LOW: { cls: 'badge-safe', label: 'LOW' },
  MEDIUM: { cls: 'badge-medium', label: 'MEDIUM' },
  HIGH: { cls: 'badge-high', label: 'HIGH' },
  CRITICAL: { cls: 'badge-critical', label: 'CRITICAL' },
  active: { cls: 'badge-high', label: 'ACTIVE' },
  acknowledged: { cls: 'badge-medium', label: 'ACKNOWLEDGED' },
  resolved: { cls: 'badge-safe', label: 'RESOLVED' },
  online: { cls: 'badge-safe', label: 'ONLINE' },
  warning: { cls: 'badge-medium', label: 'WARNING' },
  offline: { cls: 'badge-critical', label: 'OFFLINE' },
}

export default function RiskBadge({ level }) {
  const conf = MAP[level] || { cls: 'badge-neutral', label: level || 'UNKNOWN' }
  return (
    <span className={`badge ${conf.cls}`}>
      <span className="badge-dot" />
      {conf.label}
    </span>
  )
}
